import request from 'supertest';
import { app } from '../index';
import { BusinessModel } from '../models/business.model';
import { UserModel } from '../models/user.model';
import { stripeService } from '../services/stripe.service';
import jwt from 'jsonwebtoken';

// Mock Stripe service to avoid real API calls in tests
jest.mock('../services/stripe.service', () => ({
  stripeService: {
    createSubscriptionProduct: jest.fn(),
    setupWebhooks: jest.fn(),
    createCheckoutSession: jest.fn(),
    cancelSubscription: jest.fn(),
    getCustomerSubscriptions: jest.fn(),
    constructWebhookEvent: jest.fn(),
  },
}));

const mockStripeService = stripeService as jest.Mocked<typeof stripeService>;

describe('Stripe Integration Tests', () => {
  let authToken: string;
  let testUser: any;
  let testBusiness: any;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create test user
    testUser = await UserModel.create({
      email: 'stripe-test@example.com',
      name: 'Stripe Test User',
      password: 'password123',
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create test business
    testBusiness = await BusinessModel.create({
      name: 'Test Stripe Business',
      description: 'A test business for Stripe integration',
      industry: 'SaaS',
      monthlyPrice: 29.99,
      currency: 'USD',
      ownerId: testUser.id,
    });
  });

  afterEach(async () => {
    // Clean up test data
    if (testBusiness) {
      await BusinessModel.delete(testBusiness.id);
    }
    if (testUser) {
      await UserModel.delete(testUser.id);
    }
  });

  describe('POST /api/stripe/setup-product', () => {
    it('should setup Stripe product successfully', async () => {
      // Mock Stripe responses
      mockStripeService.createSubscriptionProduct.mockResolvedValue({
        id: 'prod_test123',
        name: testBusiness.name,
        description: testBusiness.description,
      } as any);

      mockStripeService.setupWebhooks.mockResolvedValue({
        id: 'we_test123',
        url: `http://localhost:3000/api/webhooks/stripe/${testBusiness.id}`,
      } as any);

      const response = await request(app)
        .post('/api/stripe/setup-product')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId: testBusiness.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.productId).toBe('prod_test123');
      expect(response.body.data.webhookId).toBe('we_test123');

      // Verify service calls
      expect(mockStripeService.createSubscriptionProduct).toHaveBeenCalledWith({
        id: testBusiness.id,
        name: testBusiness.name,
        description: testBusiness.description,
        monthlyPrice: Number(testBusiness.monthlyPrice),
        currency: testBusiness.currency,
      });

      expect(mockStripeService.setupWebhooks).toHaveBeenCalledWith(testBusiness.id);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/stripe/setup-product')
        .send({
          businessId: testBusiness.id,
        });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent business', async () => {
      const response = await request(app)
        .post('/api/stripe/setup-product')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId: 'non-existent-id',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Business not found');
    });

    it('should return 400 if business already has Stripe product', async () => {
      // Update business to have existing Stripe product
      await BusinessModel.updateStripeData(testBusiness.id, {
        productId: 'existing_prod_123',
        priceId: 'existing_price_123',
      });

      const response = await request(app)
        .post('/api/stripe/setup-product')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId: testBusiness.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Business already has Stripe product configured');
    });
  });

  describe('POST /api/stripe/create-checkout-session', () => {
    beforeEach(async () => {
      // Setup business with Stripe data
      await BusinessModel.updateStripeData(testBusiness.id, {
        productId: 'prod_test123',
        priceId: 'price_test123',
      });
    });

    it('should create checkout session successfully', async () => {
      mockStripeService.createCheckoutSession.mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/pay/cs_test123',
      } as any);

      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId: testBusiness.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe('cs_test123');
      expect(response.body.data.url).toBe('https://checkout.stripe.com/pay/cs_test123');

      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        testBusiness.id,
        'price_test123'
      );
    });

    it('should return 400 if business has no Stripe pricing', async () => {
      // Create business without Stripe data
      const businessWithoutStripe = await BusinessModel.create({
        name: 'Business Without Stripe',
        description: 'Test business',
        industry: 'SaaS',
        monthlyPrice: 19.99,
        currency: 'USD',
        ownerId: testUser.id,
      });

      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId: businessWithoutStripe.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        'Business does not have Stripe pricing configured. Setup product first.'
      );

      // Cleanup
      await BusinessModel.delete(businessWithoutStripe.id);
    });
  });

  describe('GET /api/stripe/subscription/:businessId', () => {
    it('should get subscription status successfully', async () => {
      // Update business with subscription data
      await BusinessModel.updateSubscriptionStatus(testBusiness.id, {
        subscriptionId: 'sub_test123',
        customerId: 'cus_test123',
        status: 'active',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
      });

      mockStripeService.getCustomerSubscriptions.mockResolvedValue([
        {
          id: 'sub_test123',
          status: 'active',
          current_period_start: 1704067200, // 2024-01-01
          current_period_end: 1706745600, // 2024-02-01
          cancel_at_period_end: false,
        } as any,
      ]);

      const response = await request(app)
        .get(`/api/stripe/subscription/${testBusiness.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.businessId).toBe(testBusiness.id);
      expect(response.body.data.subscriptionStatus).toBe('active');
      expect(response.body.data.stripeSubscriptionId).toBe('sub_test123');
      expect(response.body.data.subscriptions).toHaveLength(1);
    });

    it('should return subscription status without Stripe customer', async () => {
      const response = await request(app)
        .get(`/api/stripe/subscription/${testBusiness.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptions).toEqual([]);
    });
  });

  describe('DELETE /api/stripe/subscription/:businessId', () => {
    beforeEach(async () => {
      // Setup business with subscription
      await BusinessModel.updateSubscriptionStatus(testBusiness.id, {
        subscriptionId: 'sub_test123',
        customerId: 'cus_test123',
        status: 'active',
      });
    });

    it('should cancel subscription successfully', async () => {
      mockStripeService.cancelSubscription.mockResolvedValue({
        id: 'sub_test123',
        status: 'canceled',
        current_period_start: 1704067200,
        current_period_end: 1706745600,
      } as any);

      const response = await request(app)
        .delete(`/api/stripe/subscription/${testBusiness.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('canceled');

      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith('sub_test123');
    });

    it('should return 400 if no active subscription', async () => {
      // Create business without subscription
      const businessWithoutSub = await BusinessModel.create({
        name: 'Business Without Subscription',
        description: 'Test business',
        industry: 'SaaS',
        monthlyPrice: 19.99,
        currency: 'USD',
        ownerId: testUser.id,
      });

      const response = await request(app)
        .delete(`/api/stripe/subscription/${businessWithoutSub.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No active subscription found');

      // Cleanup
      await BusinessModel.delete(businessWithoutSub.id);
    });
  });

  describe('POST /api/stripe/webhooks/:businessId', () => {
    it('should handle webhook events successfully', async () => {
      const webhookEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            current_period_start: 1704067200,
            current_period_end: 1706745600,
          },
        },
      };

      mockStripeService.constructWebhookEvent.mockResolvedValue(webhookEvent as any);

      const response = await request(app)
        .post(`/api/stripe/webhooks/${testBusiness.id}`)
        .set('stripe-signature', 'test-signature')
        .send('raw-webhook-body');

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);

      expect(mockStripeService.constructWebhookEvent).toHaveBeenCalledWith(
        'raw-webhook-body',
        'test-signature'
      );
    });

    it('should return 400 without signature', async () => {
      const response = await request(app)
        .post(`/api/stripe/webhooks/${testBusiness.id}`)
        .send('raw-webhook-body');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing stripe-signature header');
    });

    it('should handle webhook verification failure', async () => {
      mockStripeService.constructWebhookEvent.mockRejectedValue(
        new Error('Webhook signature verification failed')
      );

      const response = await request(app)
        .post(`/api/stripe/webhooks/${testBusiness.id}`)
        .set('stripe-signature', 'invalid-signature')
        .send('raw-webhook-body');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Webhook processing failed');
    });
  });

  describe('GET /api/stripe/health', () => {
    it('should return health check successfully', async () => {
      const response = await request(app).get('/api/stripe/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Stripe service is healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Validation Tests', () => {
    it('should validate businessId is required for setup-product', async () => {
      const response = await request(app)
        .post('/api/stripe/setup-product')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate businessId for create-checkout-session', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate URL parameters', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId: testBusiness.id,
          successUrl: 'invalid-url',
          cancelUrl: 'also-invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });
});