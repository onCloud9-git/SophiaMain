import { Job } from 'bull';
import { PuppeteerMonitoringService } from '../../services/puppeteer-monitoring.service';
import { BusinessService } from '../../services/business.service';
import { AnalyticsService } from '../../services/analytics.service';
import { NotificationService } from '../../services/notification.service';

export interface WebsiteHealthCheckJob {
  businessId: string;
  includePerformanceAudit?: boolean;
  includePaymentTest?: boolean;
  includeVisualRegression?: boolean;
}

export interface VisualRegressionJob {
  businessId: string;
  baselineScreenshot?: string;
  tolerance?: number;
}

export interface UserFlowTestJob {
  businessId: string;
  flowType: 'payment' | 'signup' | 'custom';
  customFlow?: Array<{
    action: 'navigate' | 'click' | 'fill' | 'screenshot';
    selector?: string;
    value?: string;
    url?: string;
  }>;
}

export class WebsiteMonitoringProcessor {
  private puppeteerService: PuppeteerMonitoringService;
  private businessService: BusinessService;
  private analyticsService: AnalyticsService;
  private notificationService: NotificationService;

  constructor() {
    this.puppeteerService = new PuppeteerMonitoringService();
    this.businessService = new BusinessService();
    this.analyticsService = new AnalyticsService();
    this.notificationService = new NotificationService();
  }

  /**
   * Process website health check job
   */
  async processWebsiteHealthCheck(job: Job<WebsiteHealthCheckJob>): Promise<void> {
    const { businessId, includePerformanceAudit, includePaymentTest, includeVisualRegression } = job.data;

    console.log(`🔍 Starting website health check for business ${businessId}`);
    job.progress(10);

    try {
      const business = await this.businessService.getById(businessId);
      if (!business) {
        throw new Error(`Business ${businessId} not found`);
      }

      // 1. Basic health check
      console.log(`📊 Running basic health check...`);
      const healthStatus = await this.puppeteerService.checkWebsiteHealth(businessId);
      job.progress(30);

      // 2. Performance audit (if requested)
      let lighthouseMetrics;
      if (includePerformanceAudit) {
        console.log(`⚡ Running performance audit...`);
        lighthouseMetrics = await this.puppeteerService.runLighthouseAudit(businessId);
        job.progress(50);
      }

      // 3. Payment flow test (if requested)
      let paymentTestResult;
      if (includePaymentTest) {
        console.log(`💳 Testing payment flow...`);
        paymentTestResult = await this.puppeteerService.testPaymentFlow(businessId);
        job.progress(70);
      }

      // 4. Visual regression (if requested)
      let screenshot;
      if (includeVisualRegression) {
        console.log(`📸 Capturing screenshot for visual regression...`);
        screenshot = await this.puppeteerService.captureScreenshot(businessId, 'health-check');
        job.progress(85);
      }

      // 5. Store results and send notifications
      await this.storeHealthCheckResults(businessId, {
        healthStatus,
        lighthouseMetrics,
        paymentTestResult,
        screenshot
      });

      // 6. Send notifications if issues detected
      if (!healthStatus.isOnline || healthStatus.hasErrors) {
        await this.notificationService.notifyHealthIssues(businessId, healthStatus);
      }

      if (paymentTestResult && !paymentTestResult.success) {
        await this.notificationService.notifyPaymentFlowIssues(businessId, paymentTestResult);
      }

      job.progress(100);
      console.log(`✅ Website health check completed for business ${businessId}`);

    } catch (error) {
      console.error(`❌ Website health check failed for business ${businessId}:`, error);
      
      // Store failure result
      await this.storeHealthCheckResults(businessId, {
        healthStatus: {
          isOnline: false,
          responseTime: 0,
          httpStatus: 500,
          title: 'Health Check Failed',
          hasErrors: true,
          errorMessages: [error.message],
          timestamp: new Date()
        }
      });

      throw error;
    }
  }

  /**
   * Process visual regression test job
   */
  async processVisualRegressionTest(job: Job<VisualRegressionJob>): Promise<void> {
    const { businessId, baselineScreenshot, tolerance = 0.1 } = job.data;

    console.log(`🖼️ Starting visual regression test for business ${businessId}`);
    job.progress(20);

    try {
      // Capture current screenshot
      const currentScreenshot = await this.puppeteerService.captureScreenshot(
        businessId, 
        'visual-regression'
      );
      job.progress(60);

      // Compare with baseline (simplified - in real implementation would use image comparison)
      const hasVisualChanges = await this.compareScreenshots(
        baselineScreenshot,
        currentScreenshot,
        tolerance
      );
      job.progress(80);

      // Store results
      await this.storeVisualRegressionResults(businessId, {
        baselineScreenshot,
        currentScreenshot,
        hasChanges: hasVisualChanges,
        tolerance,
        timestamp: new Date()
      });

      // Notify if significant changes detected
      if (hasVisualChanges) {
        await this.notificationService.notifyVisualChanges(businessId, {
          baselineScreenshot,
          currentScreenshot
        });
      }

      job.progress(100);
      console.log(`✅ Visual regression test completed for business ${businessId}`);

    } catch (error) {
      console.error(`❌ Visual regression test failed for business ${businessId}:`, error);
      throw error;
    }
  }

  /**
   * Process user flow test job
   */
  async processUserFlowTest(job: Job<UserFlowTestJob>): Promise<void> {
    const { businessId, flowType, customFlow } = job.data;

    console.log(`👤 Starting user flow test (${flowType}) for business ${businessId}`);
    job.progress(10);

    try {
      let testResult;

      switch (flowType) {
        case 'payment':
          testResult = await this.puppeteerService.testPaymentFlow(businessId);
          break;
        
        case 'signup':
          testResult = await this.testSignupFlow(businessId);
          break;
        
        case 'custom':
          if (!customFlow) {
            throw new Error('Custom flow steps not provided');
          }
          testResult = await this.testCustomFlow(businessId, customFlow);
          break;
        
        default:
          throw new Error(`Unknown flow type: ${flowType}`);
      }

      job.progress(80);

      // Store results
      await this.storeUserFlowResults(businessId, testResult);

      // Send notifications if flow failed
      if (!testResult.success) {
        await this.notificationService.notifyUserFlowFailure(businessId, testResult);
      }

      job.progress(100);
      console.log(`✅ User flow test (${flowType}) completed for business ${businessId}`);

    } catch (error) {
      console.error(`❌ User flow test failed for business ${businessId}:`, error);
      throw error;
    }
  }

  /**
   * Test signup flow
   */
  private async testSignupFlow(businessId: string) {
    // Implementation would test user registration flow
    // This is a simplified placeholder
    return {
      flowName: 'Signup Flow Test',
      success: true,
      steps: [
        { step: 'Navigate to signup', success: true, duration: 1000 },
        { step: 'Fill signup form', success: true, duration: 2000 },
        { step: 'Submit form', success: true, duration: 1500 }
      ],
      totalDuration: 4500
    };
  }

  /**
   * Test custom user flow
   */
  private async testCustomFlow(businessId: string, customFlow: any[]) {
    // Implementation would execute custom flow steps
    // This is a simplified placeholder
    return {
      flowName: 'Custom Flow Test',
      success: true,
      steps: customFlow.map((step, index) => ({
        step: `Custom step ${index + 1}: ${step.action}`,
        success: true,
        duration: 1000
      })),
      totalDuration: customFlow.length * 1000
    };
  }

  /**
   * Compare screenshots (simplified implementation)
   */
  private async compareScreenshots(
    baseline: string,
    current: string,
    tolerance: number
  ): Promise<boolean> {
    // In real implementation, this would use image comparison library
    // For now, return random result for demonstration
    return Math.random() > 0.8; // 20% chance of detecting changes
  }

  /**
   * Store health check results in database
   */
  private async storeHealthCheckResults(businessId: string, results: any): Promise<void> {
    try {
      await this.analyticsService.storeBusinessMetrics(businessId, {
        date: new Date(),
        websiteHealth: results.healthStatus,
        performanceMetrics: results.lighthouseMetrics,
        paymentFlowStatus: results.paymentTestResult?.success,
        screenshot: results.screenshot
      });
    } catch (error) {
      console.error(`Failed to store health check results:`, error);
    }
  }

  /**
   * Store visual regression results
   */
  private async storeVisualRegressionResults(businessId: string, results: any): Promise<void> {
    try {
      await this.analyticsService.storeBusinessMetrics(businessId, {
        date: new Date(),
        visualRegressionTest: results
      });
    } catch (error) {
      console.error(`Failed to store visual regression results:`, error);
    }
  }

  /**
   * Store user flow test results
   */
  private async storeUserFlowResults(businessId: string, results: any): Promise<void> {
    try {
      await this.analyticsService.storeBusinessMetrics(businessId, {
        date: new Date(),
        userFlowTest: results
      });
    } catch (error) {
      console.error(`Failed to store user flow results:`, error);
    }
  }
}

export default WebsiteMonitoringProcessor;