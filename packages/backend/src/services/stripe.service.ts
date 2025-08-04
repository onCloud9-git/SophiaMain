import Stripe from 'stripe';
import { BusinessService } from './business.service';

export interface StripeIntegration {
  createSubscriptionProduct(business: Business): Promise<Stripe.Product>;
  setupWebhooks(businessId: string): Promise<Stripe.WebhookEndpoint>;
  handlePayment(paymentData: PaymentData): Promise<PaymentResult>;
  createCheckoutSession(businessId: string, priceId: string): Promise<Stripe.Checkout.Session>;
  handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void>;
}

export interface PaymentData {
  businessId: string;
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentResult {
  success: boolean;
  sessionId?: string;
  subscriptionId?: string;
  error?: string;
}

export interface Business {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  currency: string;
}

export class StripeService implements StripeIntegration {
  private stripe: Stripe;
  private businessService: BusinessService;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
    
    this.businessService = new BusinessService();
  }

  async createSubscriptionProduct(business: Business): Promise<Stripe.Product> {
    try {
      // Create product
      const product = await this.stripe.products.create({
        name: business.name,
        description: business.description,
        type: 'service',
        metadata: {
          businessId: business.id,
        },
      });

      // Create price
      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(business.monthlyPrice * 100), // Convert to cents
        currency: business.currency.toLowerCase(),
        recurring: { 
          interval: 'month',
          interval_count: 1,
        },
        metadata: {
          businessId: business.id,
        },
      });

      // Update business with Stripe IDs
      await this.businessService.updateStripeData(business.id, {
        productId: product.id,
        priceId: price.id,
      });

      return product;
    } catch (error) {
      console.error('Error creating Stripe product:', error);
      throw new Error(`Failed to create Stripe product: ${error.message}`);
    }
  }

  async setupWebhooks(businessId: string): Promise<Stripe.WebhookEndpoint> {
    try {
      const baseUrl = process.env.API_URL || 'http://localhost:3000';
      
      return await this.stripe.webhookEndpoints.create({
        url: `${baseUrl}/api/webhooks/stripe/${businessId}`,
        enabled_events: [
          'invoice.paid',
          'invoice.payment_failed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'payment_intent.succeeded',
          'payment_intent.payment_failed',
          'checkout.session.completed',
        ],
        metadata: {
          businessId,
        },
      });
    } catch (error) {
      console.error('Error setting up webhooks:', error);
      throw new Error(`Failed to setup webhooks: ${error.message}`);
    }
  }

  async createCheckoutSession(businessId: string, priceId: string): Promise<Stripe.Checkout.Session> {
    try {
      const business = await this.businessService.getById(businessId);
      if (!business) {
        throw new Error('Business not found');
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/business/${businessId}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/business/${businessId}/pricing`,
        metadata: {
          businessId,
        },
        subscription_data: {
          metadata: {
            businessId,
          },
        },
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  async handlePayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      const session = await this.createCheckoutSession(
        paymentData.businessId,
        paymentData.priceId
      );

      return {
        success: true,
        sessionId: session.id,
      };
    } catch (error) {
      console.error('Error handling payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    try {
      const businessId = subscription.metadata.businessId;
      if (!businessId) {
        console.warn('No businessId in subscription metadata');
        return;
      }

      await this.businessService.updateSubscriptionStatus(businessId, {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        customerId: subscription.customer as string,
      });
    } catch (error) {
      console.error('Error handling subscription update:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async updateSubscriptionPrice(subscriptionId: string, newPriceId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      return await this.stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
      });
    } catch (error) {
      console.error('Error updating subscription price:', error);
      throw new Error(`Failed to update subscription price: ${error.message}`);
    }
  }

  async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
      });
      
      return subscriptions.data;
    } catch (error) {
      console.error('Error fetching customer subscriptions:', error);
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }
  }

  async constructWebhookEvent(payload: string | Buffer, signature: string): Promise<Stripe.Event> {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!endpointSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (error) {
      console.error('Error constructing webhook event:', error);
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }
}

export const stripeService = new StripeService();