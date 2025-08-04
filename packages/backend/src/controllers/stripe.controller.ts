import { Request, Response } from 'express';
import { stripeService } from '../services/stripe.service';
import { BusinessService } from '../services/business.service';
import { z } from 'zod';

const businessService = new BusinessService();

// Validation schemas
const CreateCheckoutSessionSchema = z.object({
  businessId: z.string(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const SetupProductSchema = z.object({
  businessId: z.string(),
});

export class StripeController {
  /**
   * Create Stripe product and price for a business
   */
  async setupProduct(req: Request, res: Response): Promise<void> {
    try {
      const { businessId } = SetupProductSchema.parse(req.body);

      // Get business details
      const business = await businessService.getById(businessId);
      if (!business) {
        res.status(404).json({ error: 'Business not found' });
        return;
      }

      // Check if already has Stripe product
      if (business.stripeProductId) {
        res.status(400).json({ 
          error: 'Business already has Stripe product configured',
          productId: business.stripeProductId,
          priceId: business.stripePriceId
        });
        return;
      }

      // Create Stripe product
      const product = await stripeService.createSubscriptionProduct({
        id: business.id,
        name: business.name,
        description: business.description,
        monthlyPrice: Number(business.monthlyPrice),
        currency: business.currency
      });

      // Setup webhooks
      const webhook = await stripeService.setupWebhooks(businessId);

      res.status(201).json({
        success: true,
        data: {
          productId: product.id,
          webhookId: webhook.id,
          message: 'Stripe integration setup successfully'
        }
      });
    } catch (error) {
      console.error('Setup product error:', error);
      res.status(500).json({ 
        error: 'Failed to setup Stripe product',
        details: error.message 
      });
    }
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    try {
      const { businessId, successUrl, cancelUrl } = CreateCheckoutSessionSchema.parse(req.body);

      // Get business with Stripe data
      const business = await businessService.getById(businessId);
      if (!business) {
        res.status(404).json({ error: 'Business not found' });
        return;
      }

      if (!business.stripePriceId) {
        res.status(400).json({ 
          error: 'Business does not have Stripe pricing configured. Setup product first.' 
        });
        return;
      }

      // Create checkout session
      const session = await stripeService.createCheckoutSession(businessId, business.stripePriceId);

      res.status(201).json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
          message: 'Checkout session created successfully'
        }
      });
    } catch (error) {
      console.error('Create checkout session error:', error);
      res.status(500).json({ 
        error: 'Failed to create checkout session',
        details: error.message 
      });
    }
  }

  /**
   * Get business subscription status
   */
  async getSubscriptionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { businessId } = req.params;

      const business = await businessService.getById(businessId);
      if (!business) {
        res.status(404).json({ error: 'Business not found' });
        return;
      }

      let subscriptions = [];
      if (business.stripeCustomerId) {
        subscriptions = await stripeService.getCustomerSubscriptions(business.stripeCustomerId);
      }

      res.json({
        success: true,
        data: {
          businessId,
          subscriptionStatus: business.subscriptionStatus,
          stripeCustomerId: business.stripeCustomerId,
          stripeSubscriptionId: business.stripeSubscriptionId,
          currentPeriodStart: business.currentPeriodStart,
          currentPeriodEnd: business.currentPeriodEnd,
          subscriptions: subscriptions.map(sub => ({
            id: sub.id,
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end
          }))
        }
      });
    } catch (error) {
      console.error('Get subscription status error:', error);
      res.status(500).json({ 
        error: 'Failed to get subscription status',
        details: error.message 
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { businessId } = req.params;

      const business = await businessService.getById(businessId);
      if (!business) {
        res.status(404).json({ error: 'Business not found' });
        return;
      }

      if (!business.stripeSubscriptionId) {
        res.status(400).json({ error: 'No active subscription found' });
        return;
      }

      // Cancel subscription
      const canceledSubscription = await stripeService.cancelSubscription(business.stripeSubscriptionId);

      // Update business status
      await businessService.updateSubscriptionStatus(businessId, {
        subscriptionId: canceledSubscription.id,
        status: canceledSubscription.status,
        currentPeriodStart: new Date(canceledSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(canceledSubscription.current_period_end * 1000),
      });

      res.json({
        success: true,
        data: {
          subscriptionId: canceledSubscription.id,
          status: canceledSubscription.status,
          message: 'Subscription canceled successfully'
        }
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ 
        error: 'Failed to cancel subscription',
        details: error.message 
      });
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const { businessId } = req.params;

      if (!signature) {
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
      }

      // Construct and verify webhook event
      const event = await stripeService.constructWebhookEvent(req.body, signature);

      console.log(`Received webhook event: ${event.type} for business: ${businessId}`);

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object, businessId);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object, businessId);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object, businessId);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object, businessId);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object, businessId);
          break;

        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object, businessId);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object, businessId);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ 
        error: 'Webhook processing failed',
        details: error.message 
      });
    }
  }

  /**
   * Handle successful checkout session
   */
  private async handleCheckoutSessionCompleted(session: any, businessId: string): Promise<void> {
    try {
      if (session.mode === 'subscription' && session.subscription) {
        // Update business with customer and subscription info
        await businessService.updateSubscriptionStatus(businessId, {
          subscriptionId: session.subscription,
          customerId: session.customer,
          status: 'active'
        });

        console.log(`Subscription created for business ${businessId}: ${session.subscription}`);
      }
    } catch (error) {
      console.error('Error handling checkout session completed:', error);
    }
  }

  /**
   * Handle subscription updates
   */
  private async handleSubscriptionUpdate(subscription: any, businessId: string): Promise<void> {
    try {
      await businessService.updateSubscriptionStatus(businessId, {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });

      console.log(`Subscription updated for business ${businessId}: ${subscription.status}`);
    } catch (error) {
      console.error('Error handling subscription update:', error);
    }
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(subscription: any, businessId: string): Promise<void> {
    try {
      await businessService.updateSubscriptionStatus(businessId, {
        subscriptionId: subscription.id,
        status: 'canceled',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });

      console.log(`Subscription deleted for business ${businessId}: ${subscription.id}`);
    } catch (error) {
      console.error('Error handling subscription deletion:', error);
    }
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaid(invoice: any, businessId: string): Promise<void> {
    try {
      // Log successful payment - could trigger analytics or notification
      console.log(`Invoice paid for business ${businessId}: $${invoice.amount_paid / 100}`);
      
      // Update business metrics if needed
      // await analyticsService.recordRevenue(businessId, invoice.amount_paid / 100);
    } catch (error) {
      console.error('Error handling invoice paid:', error);
    }
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(invoice: any, businessId: string): Promise<void> {
    try {
      console.log(`Invoice payment failed for business ${businessId}: ${invoice.id}`);
      
      // Could trigger notification to user about failed payment
      // await notificationService.notifyPaymentFailed(businessId, invoice);
    } catch (error) {
      console.error('Error handling invoice payment failed:', error);
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentSucceeded(paymentIntent: any, businessId: string): Promise<void> {
    try {
      console.log(`Payment succeeded for business ${businessId}: $${paymentIntent.amount / 100}`);
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
    }
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentFailed(paymentIntent: any, businessId: string): Promise<void> {
    try {
      console.log(`Payment failed for business ${businessId}: ${paymentIntent.last_payment_error?.message}`);
    } catch (error) {
      console.error('Error handling payment failed:', error);
    }
  }
}

export const stripeController = new StripeController();