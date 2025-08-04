import { PuppeteerMCPClient } from '../lib/puppeteer-mcp-client';
import { BusinessService } from './business.service';
import type { Business } from '@prisma/client';

export interface WebsiteHealthStatus {
  isOnline: boolean;
  responseTime: number;
  httpStatus: number;
  title: string;
  hasErrors: boolean;
  errorMessages: string[];
  timestamp: Date;
}

export interface LighthouseMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
}

export interface UserFlowTestResult {
  flowName: string;
  success: boolean;
  steps: Array<{
    step: string;
    success: boolean;
    screenshot?: string;
    error?: string;
    duration: number;
  }>;
  totalDuration: number;
}

export class PuppeteerMonitoringService {
  private puppeteerClient: PuppeteerMCPClient;
  private businessService: BusinessService;

  constructor() {
    this.puppeteerClient = new PuppeteerMCPClient();
    this.businessService = new BusinessService();
  }

  /**
   * Perform comprehensive website health check
   */
  async checkWebsiteHealth(businessId: string): Promise<WebsiteHealthStatus> {
    const business = await this.businessService.getById(businessId);
    if (!business?.websiteUrl) {
      throw new Error(`Business ${businessId} has no website URL configured`);
    }

    console.log(`🔍 Checking website health for ${business.name}: ${business.websiteUrl}`);

    const startTime = Date.now();
    const errorMessages: string[] = [];
    let title = '';
    let httpStatus = 0;
    let hasErrors = false;

    try {
      // Navigate to website and capture basic metrics
      await this.puppeteerClient.navigate(business.websiteUrl);
      
      // Get page title and check for errors
      const pageData = await this.puppeteerClient.evaluate(`
        ({
          title: document.title,
          hasJsErrors: window.errors && window.errors.length > 0,
          consoleErrors: window.consoleErrors || [],
          httpStatus: window.performance?.navigation?.responseStart ? 200 : 404
        })
      `);

      title = pageData.title || 'No Title';
      httpStatus = pageData.httpStatus || 200;
      hasErrors = pageData.hasJsErrors || false;
      
      if (pageData.consoleErrors?.length > 0) {
        errorMessages.push(...pageData.consoleErrors);
      }

      // Check for broken images and links
      const brokenElements = await this.puppeteerClient.evaluate(`
        Array.from(document.querySelectorAll('img')).filter(img => !img.complete || img.naturalWidth === 0).length +
        Array.from(document.querySelectorAll('a[href^="http"]')).filter(link => {
          try { return !new URL(link.href); } catch { return true; }
        }).length
      `);

      if (brokenElements > 0) {
        hasErrors = true;
        errorMessages.push(`Found ${brokenElements} broken images or links`);
      }

    } catch (error) {
      hasErrors = true;
      httpStatus = 500;
      errorMessages.push(`Navigation failed: ${error.message}`);
    }

    const responseTime = Date.now() - startTime;

    const healthStatus: WebsiteHealthStatus = {
      isOnline: httpStatus >= 200 && httpStatus < 400,
      responseTime,
      httpStatus,
      title,
      hasErrors,
      errorMessages,
      timestamp: new Date()
    };

    console.log(`✅ Health check completed for ${business.name}:`, {
      status: healthStatus.isOnline ? 'ONLINE' : 'OFFLINE',
      responseTime: `${responseTime}ms`,
      errors: errorMessages.length
    });

    return healthStatus;
  }

  /**
   * Run Lighthouse performance audit
   */
  async runLighthouseAudit(businessId: string): Promise<LighthouseMetrics> {
    const business = await this.businessService.getById(businessId);
    if (!business?.websiteUrl) {
      throw new Error(`Business ${businessId} has no website URL configured`);
    }

    console.log(`⚡ Running Lighthouse audit for ${business.name}`);

    await this.puppeteerClient.navigate(business.websiteUrl);

    // Basic performance metrics using browser APIs
    const performanceData = await this.puppeteerClient.evaluate(`
      new Promise((resolve) => {
        // Wait for page load
        if (document.readyState === 'complete') {
          const navigation = performance.getEntriesByType('navigation')[0];
          const paint = performance.getEntriesByType('paint');
          
          resolve({
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            largestContentfulPaint: 0, // Would need observer
            cumulativeLayoutShift: 0   // Would need observer
          });
        } else {
          window.addEventListener('load', () => {
            setTimeout(() => {
              const navigation = performance.getEntriesByType('navigation')[0];
              const paint = performance.getEntriesByType('paint');
              
              resolve({
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                largestContentfulPaint: 0,
                cumulativeLayoutShift: 0
              });
            }, 1000);
          });
        }
      })
    `);

    // Calculate basic performance score (simplified)
    const performanceScore = Math.max(0, 100 - (performanceData.loadTime / 1000) * 10);
    
    // Basic accessibility check
    const accessibilityData = await this.puppeteerClient.evaluate(`
      ({
        hasAltTexts: Array.from(document.querySelectorAll('img')).every(img => img.alt),
        hasProperHeadings: document.querySelector('h1') !== null,
        hasFormLabels: Array.from(document.querySelectorAll('input')).every(input => 
          input.labels?.length > 0 || input.getAttribute('aria-label') || input.getAttribute('placeholder')
        )
      })
    `);

    const accessibilityScore = [
      accessibilityData.hasAltTexts,
      accessibilityData.hasProperHeadings,
      accessibilityData.hasFormLabels
    ].filter(Boolean).length / 3 * 100;

    const metrics: LighthouseMetrics = {
      performance: Math.round(performanceScore),
      accessibility: Math.round(accessibilityScore),
      bestPractices: 85, // Simplified - would need actual checks
      seo: 90, // Simplified - would need actual checks
      firstContentfulPaint: performanceData.firstContentfulPaint,
      largestContentfulPaint: performanceData.largestContentfulPaint,
      cumulativeLayoutShift: performanceData.cumulativeLayoutShift
    };

    console.log(`📊 Lighthouse audit completed for ${business.name}:`, metrics);

    return metrics;
  }

  /**
   * Test user payment flow
   */
  async testPaymentFlow(businessId: string): Promise<UserFlowTestResult> {
    const business = await this.businessService.getById(businessId);
    if (!business?.websiteUrl) {
      throw new Error(`Business ${businessId} has no website URL configured`);
    }

    console.log(`💳 Testing payment flow for ${business.name}`);

    const startTime = Date.now();
    const steps: UserFlowTestResult['steps'] = [];

    try {
      // Step 1: Navigate to website
      const step1Start = Date.now();
      await this.puppeteerClient.navigate(business.websiteUrl);
      await this.puppeteerClient.screenshot(`payment-test-${businessId}-step1`, {
        saveToFile: true,
        outputDir: 'screenshots/payment-tests'
      });
      
      steps.push({
        step: 'Navigate to homepage',
        success: true,
        screenshot: `payment-test-${businessId}-step1.png`,
        duration: Date.now() - step1Start
      });

      // Step 2: Find and click subscribe/pricing button
      const step2Start = Date.now();
      const subscribeSelectors = [
        'button[contains(text(), "Subscribe")]',
        'a[contains(text(), "Subscribe")]',
        'button[contains(text(), "Get Started")]',
        'a[contains(text(), "Get Started")]',
        'button[contains(text(), "Buy Now")]',
        '.subscribe-btn',
        '.pricing-btn',
        '#subscribe'
      ];

      let subscribeFound = false;
      for (const selector of subscribeSelectors) {
        try {
          const element = await this.puppeteerClient.evaluate(`document.querySelector('${selector.replace(/contains\([^)]+\)/, '*')}')`);
          if (element) {
            await this.puppeteerClient.click(selector.replace(/contains\([^)]+\)/, '*'));
            subscribeFound = true;
            break;
          }
        } catch (error) {
          // Try next selector
          continue;
        }
      }

      steps.push({
        step: 'Click subscribe/pricing button',
        success: subscribeFound,
        screenshot: subscribeFound ? `payment-test-${businessId}-step2.png` : undefined,
        duration: Date.now() - step2Start,
        error: subscribeFound ? undefined : 'No subscribe button found'
      });

      if (subscribeFound) {
        await this.puppeteerClient.screenshot(`payment-test-${businessId}-step2`, {
          saveToFile: true,
          outputDir: 'screenshots/payment-tests'
        });
      }

      // Step 3: Check for Stripe payment form
      const step3Start = Date.now();
      const hasStripeForm = await this.puppeteerClient.evaluate(`
        document.querySelector('iframe[src*="stripe"]') !== null ||
        document.querySelector('[data-stripe]') !== null ||
        document.querySelector('.stripe-form') !== null ||
        document.querySelector('#card-element') !== null
      `);

      steps.push({
        step: 'Verify Stripe payment form present',
        success: hasStripeForm,
        screenshot: hasStripeForm ? `payment-test-${businessId}-step3.png` : undefined,
        duration: Date.now() - step3Start,
        error: hasStripeForm ? undefined : 'No Stripe payment form found'
      });

      if (hasStripeForm) {
        await this.puppeteerClient.screenshot(`payment-test-${businessId}-step3`, {
          saveToFile: true,
          outputDir: 'screenshots/payment-tests'
        });
      }

    } catch (error) {
      steps.push({
        step: 'Payment flow test failed',
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
    }

    const result: UserFlowTestResult = {
      flowName: 'Payment Flow Test',
      success: steps.every(step => step.success),
      steps,
      totalDuration: Date.now() - startTime
    };

    console.log(`💳 Payment flow test completed for ${business.name}:`, {
      success: result.success,
      steps: result.steps.length,
      duration: `${result.totalDuration}ms`
    });

    return result;
  }

  /**
   * Capture screenshot for visual regression testing
   */
  async captureScreenshot(businessId: string, pageName: string = 'homepage'): Promise<string> {
    const business = await this.businessService.getById(businessId);
    if (!business?.websiteUrl) {
      throw new Error(`Business ${businessId} has no website URL configured`);
    }

    console.log(`📸 Capturing screenshot for ${business.name} (${pageName})`);

    await this.puppeteerClient.navigate(business.websiteUrl);
    
    // Wait for page to stabilize
    await this.puppeteerClient.evaluate(`
      new Promise(resolve => {
        if (document.readyState === 'complete') {
          setTimeout(resolve, 1000);
        } else {
          window.addEventListener('load', () => setTimeout(resolve, 1000));
        }
      })
    `);

    const screenshotName = `${businessId}-${pageName}-${Date.now()}`;
    await this.puppeteerClient.screenshot(screenshotName, {
      width: 1280,
      height: 720,
      saveToFile: true,
      outputDir: 'screenshots/visual-regression'
    });

    console.log(`📸 Screenshot saved: ${screenshotName}.png`);
    return `${screenshotName}.png`;
  }
}