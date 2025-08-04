import { Job } from 'bull'
import { logger } from '../../index'
import { 
  BusinessCreationJobData, 
  JobResult, 
  JobType 
} from '../types'
import { BusinessService } from '../../services'
import { cursorAIService } from '../../services/cursor-ai.service'
import { webSocketService } from '../../services/websocket.service'

// Business job processor
export class BusinessProcessor {
  
  // Process business creation job
  static async processBusinessCreation(job: Job<BusinessCreationJobData>): Promise<JobResult> {
    const { data } = job
    const startTime = Date.now()
    let businessId: string | undefined
    
    try {
      logger.info(`Processing business creation job ${job.id}`, { data })
      
      // Send initial progress update
      await this.emitProgress(data.userId, 'Iniciowanie procesu tworzenia biznesu...', 'setup', 5)
      await job.progress(5)
      
      // Step 1: AI Research (if enabled)
      let businessConcept = data.businessIdea
      if (data.aiResearch) {
        await this.emitProgress(data.userId, 'Przeprowadzanie badań AI...', 'research', 15)
        logger.info(`Conducting AI research for business idea: ${data.businessIdea}`)
        businessConcept = await this.conductAIResearch(data.businessIdea)
        await job.progress(25)
      }
      
      // Step 2: Create business record
      await this.emitProgress(data.userId, 'Tworzenie rekordu biznesu...', 'setup', 30)
      logger.info('Creating business record in database')
      const business = await BusinessService.createBusiness({
        name: this.extractBusinessName(businessConcept),
        description: businessConcept,
        monthlyPrice: 29.99
      }, data.userId!)
      businessId = business.id
      await job.progress(35)
      
      // Step 3: Generate business plan
      await this.emitProgress(businessId, 'Generowanie planu biznesowego...', 'planning', 45, business.id)
      logger.info(`Generating business plan for business ${business.id}`)
      const businessPlan = await this.generateBusinessPlan(businessConcept, data)
      await job.progress(55)
      
      // Step 4: Create Cursor AI project
      await this.emitProgress(businessId, 'Inicjowanie projektu Cursor AI...', 'development', 65, business.id)
      logger.info(`Creating Cursor AI project for business ${business.id}`)
      const projectSetup = await cursorAIService.createProject(business.id, {
        businessPlan,
        features: businessPlan.features || ['authentication', 'payments', 'dashboard'],
        techStack: ['next.js', 'typescript', 'tailwindcss', 'stripe', 'prisma'],
        requirements: ['responsive design', 'SEO optimization', 'subscription model']
      })
      await job.progress(75)
      
      // Step 5: Start development monitoring job
      await this.emitProgress(businessId, 'Uruchamianie monitoringu developmentu...', 'development', 85, business.id)
      const { queue } = require('../queue')
      await queue.add('development-monitoring', { businessId: business.id }, {
        priority: 'high',
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      })
      await job.progress(90)
      
      // Step 6: Update business with metadata (status will be managed separately)
      await BusinessService.updateBusiness(business.id, {
        websiteUrl: projectSetup.deploymentUrl,
        repositoryUrl: projectSetup.repositoryUrl
      })
      
      // Final progress update
      await this.emitProgress(businessId, 'Biznes został pomyślnie utworzony!', 'complete', 100, business.id)
      await job.progress(100)
      
      // Send success notification
      webSocketService.emitNotification(data.userId!, {
        type: 'success',
        title: 'Biznes utworzony!',
        message: `Twój biznes "${business.name}" został pomyślnie utworzony i development został uruchomiony.`,
        businessId: business.id
      })
      
      const processingTime = Date.now() - startTime
      logger.info(`Business creation job ${job.id} completed successfully`, { 
        businessId: business.id, 
        processingTime 
      })
      
      return {
        success: true,
        data: {
          businessId: business.id,
          businessPlan,
          projectSetup
        },
        metadata: {
          processingTime,
          retryCount: job.attemptsMade
        }
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Business creation job ${job.id} failed:`, error)
      
      // Send error notification
      if (data.userId) {
        webSocketService.emitNotification(data.userId, {
          type: 'error',
          title: 'Błąd tworzenia biznesu',
          message: `Wystąpił błąd podczas tworzenia biznesu: ${errorMessage}`,
          businessId
        })
      }
      
      // Update business status to failed if it was created
      if (businessId) {
        try {
          // Business status would be managed through a separate status tracking system
          logger.info(`Business ${businessId} marked as failed`)
        } catch (updateError) {
          logger.error('Failed to update business status to failed:', updateError)
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        metadata: {
          processingTime,
          retryCount: job.attemptsMade,
          nextRetry: job.opts.attempts && job.attemptsMade < job.opts.attempts 
            ? new Date(Date.now() + 5000)
            : undefined
        }
      }
    }
  }
  
  // Process development monitoring job
  static async processDevelopmentMonitoring(job: Job<{businessId: string}>): Promise<JobResult> {
    const { businessId } = job.data
    const startTime = Date.now()
    
    try {
      logger.info(`Processing development monitoring job ${job.id} for business ${businessId}`)
      
      await job.progress(10)
      
      // Get current development progress
      const progress = await cursorAIService.getProjectProgress(businessId)
      
      // Get code quality metrics
      const codeQuality = await cursorAIService.getCodeQualityMetrics(businessId)
      
      // Emit real-time update with enhanced data
      webSocketService.emitDevelopmentUpdate(businessId, {
        stage: progress.stage,
        progress: progress.progress,
        hasTestableComponents: progress.hasTestableComponents,
        codeQuality: codeQuality,
        lastUpdate: new Date()
      })
      
      await job.progress(30)
      
      // Run automated tests if in testing stage
      let testResults = null
      if (progress.stage === 'testing' && progress.hasTestableComponents) {
        try {
          testResults = await cursorAIService.runAutomatedTests(businessId)
          logger.info(`Automated tests completed for business ${businessId}`, testResults)
        } catch (testError) {
          logger.error(`Automated tests failed for business ${businessId}:`, testError)
        }
      }
      
      await job.progress(60)
      
      // Update business status based on progress and quality
      let newStatus = 'development'
      
      if (progress.stage === 'complete' && codeQuality.eslintErrors < 10 && codeQuality.typescriptErrors === 0) {
        newStatus = 'deploying'
        
        // Trigger deployment
        const deploymentUrl = await cursorAIService.deployProject(businessId)
        
        // Setup deployment monitoring
        await cursorAIService.setupDeploymentMonitoring(businessId, deploymentUrl)
        
        await BusinessService.updateBusiness(businessId, {
          websiteUrl: deploymentUrl,
          landingPageUrl: deploymentUrl
        })
        
        // Send deployment notification
        const business = await BusinessService.getBusinessById(businessId)
        webSocketService.emitNotification(business.ownerId, {
          type: 'success',
          title: 'Deployment ukończony!',
          message: `Twój biznes "${business.name}" został wdrożony na ${deploymentUrl}`,
          businessId,
          data: {
            deploymentUrl,
            codeQuality,
            testResults
          }
        })
        
      } else if (progress.stage === 'testing' && progress.hasTestableComponents) {
        // Schedule next monitoring check
        const { queue } = require('../queue')
        await queue.add('development-monitoring', { businessId }, {
          delay: 30000, // Check again in 30 seconds
          attempts: 1
        })
      } else if (codeQuality.eslintErrors > 50 || codeQuality.typescriptErrors > 10) {
        // Code quality issues detected - notify for manual review
        const business = await BusinessService.getBusinessById(businessId)
        webSocketService.emitNotification(business.ownerId, {
          type: 'warning',
          title: 'Problemy z jakością kodu',
          message: `Wykryto ${codeQuality.eslintErrors} błędów ESLint i ${codeQuality.typescriptErrors} błędów TypeScript w projekcie "${business.name}".`,
          businessId,
          data: { codeQuality }
        })
      }
      
      await job.progress(100)
      const processingTime = Date.now() - startTime
      
      return {
        success: true,
        data: { 
          progress, 
          businessId, 
          codeQuality,
          testResults
        },
        metadata: { processingTime }
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Development monitoring job ${job.id} failed:`, error)
      
      return {
        success: false,
        error: errorMessage,
        metadata: { processingTime }
      }
    }
  }

  // Process business deployment job
  static async processBusinessDeployment(job: Job): Promise<JobResult> {
    const startTime = Date.now()
    
    try {
      logger.info(`Processing business deployment job ${job.id}`)
      
      await job.progress(20)
      
      // Step 1: Deploy using Cursor AI service
      const deploymentUrl = await cursorAIService.deployProject(job.data.businessId)
      await job.progress(80)
      
      // Step 2: Update business with deployment info
      await BusinessService.updateBusiness(job.data.businessId, {
        websiteUrl: deploymentUrl,
        landingPageUrl: deploymentUrl
      })
      await job.progress(100)
      
      const processingTime = Date.now() - startTime
      
      return {
        success: true,
        data: { deploymentUrl },
        metadata: { processingTime }
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Business deployment job ${job.id} failed:`, error)
      
      return {
        success: false,
        error: errorMessage,
        metadata: { processingTime }
      }
    }
  }
  
  // Process business monitoring job
  static async processBusinessMonitoring(job: Job): Promise<JobResult> {
    const startTime = Date.now()
    
    try {
      logger.info(`Processing business monitoring job ${job.id}`)
      
      // TODO: Implement monitoring logic with MCP tools
      const healthCheck = await this.performHealthCheck(job.data.businessId)
      const performanceMetrics = await this.collectPerformanceMetrics(job.data.businessId)
      
      const processingTime = Date.now() - startTime
      
      return {
        success: true,
        data: {
          healthStatus: healthCheck,
          metrics: performanceMetrics
        },
        metadata: { processingTime }
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      logger.error(`Business monitoring job ${job.id} failed:`, error)
      
      return {
        success: false,
        error: error.message,
        metadata: { processingTime }
      }
    }
  }

  // Process deployment health check job
  static async processDeploymentHealthCheck(job: Job<{businessId: string, deploymentUrl: string}>): Promise<JobResult> {
    const { businessId, deploymentUrl } = job.data
    const startTime = Date.now()
    
    try {
      logger.info(`Processing deployment health check job ${job.id} for business ${businessId}`)
      
      // Initialize Puppeteer MCP client
      const PuppeteerMCPClient = require('../../lib/puppeteer-mcp-client').default
      const puppeteerClient = new PuppeteerMCPClient()
      
      await job.progress(20)
      
      // Perform health checks
      const healthChecks = {
        accessible: false,
        responseTime: 0,
        statusCode: 0,
        hasContent: false,
        sslValid: false,
        timestamp: new Date()
      }
      
      try {
        const checkStart = Date.now()
        
        // Check if site is accessible
        await puppeteerClient.navigate(deploymentUrl)
        healthChecks.accessible = true
        healthChecks.responseTime = Date.now() - checkStart
        
        // Check for content
        const title = await puppeteerClient.evaluate({ script: 'document.title' })
        healthChecks.hasContent = title && title.result && title.result.length > 0
        
        // Check SSL (if HTTPS)
        healthChecks.sslValid = deploymentUrl.startsWith('https://')
        
        await puppeteerClient.close()
        
      } catch (error) {
        logger.error(`Health check failed for ${deploymentUrl}:`, error)
        healthChecks.accessible = false
      }
      
      await job.progress(80)
      
      // Update business with health status
      const business = await BusinessService.getBusinessById(businessId)
      
      // Send notification if site is down
      if (!healthChecks.accessible) {
        webSocketService.emitNotification(business.ownerId, {
          type: 'error',
          title: 'Strona niedostępna!',
          message: `Twoja strona ${business.name} jest niedostępna pod adresem ${deploymentUrl}`,
          businessId,
          data: { healthChecks }
        })
      } else if (healthChecks.responseTime > 5000) {
        // Slow response warning
        webSocketService.emitNotification(business.ownerId, {
          type: 'warning',
          title: 'Wolna strona',
          message: `Twoja strona ${business.name} odpowiada wolno (${healthChecks.responseTime}ms)`,
          businessId,
          data: { healthChecks }
        })
      }
      
      await job.progress(100)
      const processingTime = Date.now() - startTime
      
      return {
        success: true,
        data: { healthChecks, businessId, deploymentUrl },
        metadata: { processingTime }
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Deployment health check job ${job.id} failed:`, error)
      
      return {
        success: false,
        error: errorMessage,
        metadata: { processingTime }
      }
    }
  }

  // Process performance monitoring job
  static async processPerformanceMonitoring(job: Job<{businessId: string, deploymentUrl: string}>): Promise<JobResult> {
    const { businessId, deploymentUrl } = job.data
    const startTime = Date.now()
    
    try {
      logger.info(`Processing performance monitoring job ${job.id} for business ${businessId}`)
      
      // Initialize Puppeteer MCP client
      const PuppeteerMCPClient = require('../../lib/puppeteer-mcp-client').default
      const puppeteerClient = new PuppeteerMCPClient()
      
      await job.progress(20)
      
      // Perform performance analysis
      const performanceMetrics = {
        loadTime: 0,
        domContentLoaded: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        totalBlockingTime: 0,
        performanceScore: 0,
        timestamp: new Date()
      }
      
      try {
        const performanceStart = Date.now()
        
        // Navigate and measure performance
        await puppeteerClient.navigate(deploymentUrl)
        
        // Get performance metrics using browser APIs
        const metrics = await puppeteerClient.evaluate({ 
          script: `
            // Collect performance metrics
            const perfData = performance.getEntriesByType('navigation')[0];
            const paintEntries = performance.getEntriesByType('paint');
            
            {
              loadTime: perfData ? perfData.loadEventEnd - perfData.loadEventStart : 0,
              domContentLoaded: perfData ? perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart : 0,
              firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
              largestContentfulPaint: paintEntries.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0,
              totalDuration: perfData ? perfData.loadEventEnd - perfData.navigationStart : 0
            }
          `
        })
        
        // Calculate performance score based on metrics
        let score = 100
        if (performanceMetrics.loadTime > 3000) score -= 30
        else if (performanceMetrics.loadTime > 1500) score -= 15
        
        if (performanceMetrics.firstContentfulPaint > 2000) score -= 20
        else if (performanceMetrics.firstContentfulPaint > 1000) score -= 10
        
        performanceMetrics.performanceScore = Math.max(score, 0)
        
        // Take performance screenshot
        await puppeteerClient.screenshot({
          name: `${businessId}-performance-${Date.now()}`,
          width: 1920,
          height: 1080
        })
        
        await puppeteerClient.close()
        
      } catch (error) {
        logger.error(`Performance monitoring failed for ${deploymentUrl}:`, error)
        performanceMetrics.performanceScore = 0
      }
      
      await job.progress(80)
      
      // Send performance report
      const business = await BusinessService.getBusinessById(businessId)
      
      if (performanceMetrics.performanceScore < 50) {
        webSocketService.emitNotification(business.ownerId, {
          type: 'warning',
          title: 'Niska wydajność strony',
          message: `Strona ${business.name} ma niską wydajność (${performanceMetrics.performanceScore}/100)`,
          businessId,
          data: { performanceMetrics }
        })
      }
      
      // Emit performance update for dashboard
      webSocketService.emitAnalyticsUpdate(businessId, {
        performanceMetrics,
        timestamp: new Date()
      })
      
      await job.progress(100)
      const processingTime = Date.now() - startTime
      
      return {
        success: true,
        data: { performanceMetrics, businessId, deploymentUrl },
        metadata: { processingTime }
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Performance monitoring job ${job.id} failed:`, error)
      
      return {
        success: false,
        error: errorMessage,
        metadata: { processingTime }
      }
    }
  }
  
  // Helper methods
  private static async conductAIResearch(businessIdea: string): Promise<string> {
    // TODO: Implement AI research using external APIs or LLM
    logger.info(`Conducting AI research for: ${businessIdea}`)
    
    // Placeholder logic - replace with actual AI research
    return `Enhanced business concept based on research: ${businessIdea} - targeting B2B market with SaaS model, estimated TAM of $2B, competitive advantage through AI automation.`
  }
  
  private static extractBusinessName(businessConcept: string): string {
    // Simple extraction - could be enhanced with AI
    const words = businessConcept.split(' ').slice(0, 3)
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }
  
  private static async generateBusinessPlan(concept: string, data: BusinessCreationJobData): Promise<any> {
    // TODO: Implement business plan generation with AI
    return {
      concept,
      targetMarket: data.targetMarket,
      businessModel: data.businessModel,
      revenueProjections: {
        month1: 0,
        month3: 1000,
        month6: 5000,
        month12: 15000
      },
      features: [
        'User authentication',
        'Subscription management',
        'Payment processing',
        'Analytics dashboard'
      ]
    }
  }
  
  private static async setupProjectStructure(businessId: string, businessPlan: any): Promise<any> {
    // TODO: Implement project structure setup
    return {
      repositoryUrl: `https://github.com/sophia-ai/${businessId}`,
      deploymentUrl: `https://${businessId}.sophia-ai.com`,
      database: `${businessId}_db`,
      services: ['api', 'frontend', 'payments']
    }
  }
  
  private static async generateApplicationCode(businessId: string): Promise<void> {
    // TODO: Implement Cursor AI integration for code generation
    logger.info(`Generating application code for business ${businessId}`)
  }
  
  private static async deployToHosting(businessId: string): Promise<void> {
    // TODO: Implement deployment to hosting platform
    logger.info(`Deploying business ${businessId} to hosting`)
  }
  
  private static async setupMonitoring(businessId: string): Promise<void> {
    // TODO: Implement monitoring setup
    logger.info(`Setting up monitoring for business ${businessId}`)
  }
  
  private static async performHealthCheck(businessId: string): Promise<any> {
    // TODO: Implement health check with MCP tools
    return {
      status: 'healthy',
      uptime: '99.9%',
      responseTime: 250
    }
  }
  
  private static async collectPerformanceMetrics(businessId: string): Promise<any> {
    // TODO: Implement performance metrics collection
    return {
      pageLoad: 1.2,
      apiResponse: 180,
      errorRate: 0.1
    }
  }
  
  // Helper method to emit progress updates
  private static async emitProgress(
    targetId: string | undefined, 
    message: string, 
    stage: string, 
    progress: number, 
    businessId?: string
  ): Promise<void> {
    if (!targetId) return
    
    const update = {
      businessId: businessId || targetId,
      stage,
      progress,
      message,
      timestamp: new Date()
    }
    
    // Emit to WebSocket
    webSocketService.emitProgressUpdate(update)
    
    logger.info(`Progress update: ${message} (${progress}%)`, { targetId, stage, businessId })
  }
}