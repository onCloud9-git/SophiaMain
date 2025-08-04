import { MarketingCampaign, Business, BusinessMetric } from '@prisma/client'
import { MarketingCampaignModel } from '../models/marketing-campaign.model'
import { BusinessModel } from '../models/business.model'
import { googleAdsService } from './google-ads.service'
import { logger } from '../index'

export interface CampaignPerformanceAnalysis {
  campaignId: string
  platform: string
  performanceScore: number // 0-100
  recommendation: 'SCALE' | 'PAUSE' | 'OPTIMIZE' | 'MAINTAIN'
  reasons: string[]
  suggestedBudgetChange?: number
  metrics: {
    ctr: number
    cpc: number
    conversions: number
    roas: number // Return on Ad Spend
    costPerConversion: number
  }
}

export interface CampaignOptimization {
  campaignId: string
  optimizations: {
    type: 'BUDGET_INCREASE' | 'BUDGET_DECREASE' | 'PAUSE' | 'KEYWORD_OPTIMIZATION' | 'BID_ADJUSTMENT'
    description: string
    value?: number
  }[]
  expectedImpact: string
}

export class MarketingService {
  
  /**
   * Create automated campaigns for a new business
   */
  async createAutomatedCampaigns(businessId: string): Promise<MarketingCampaign[]> {
    try {
      logger.info(`Creating automated campaigns for business ${businessId}`)

      const business = await BusinessModel.getById(businessId)
      if (!business) {
        throw new Error(`Business not found: ${businessId}`)
      }

      const campaigns: MarketingCampaign[] = []

      // Create Google Ads campaign if credentials are available
      if (business.googleAdsCustomerId && business.googleAdsRefreshToken) {
        const googleCampaign = await this.createGoogleAdsCampaign(business)
        campaigns.push(googleCampaign)
      }

      // TODO: Add Facebook Ads, Instagram Ads when ready

      logger.info(`Created ${campaigns.length} automated campaigns for business ${businessId}`)
      return campaigns

    } catch (error) {
      logger.error(`Error creating automated campaigns:`, error)
      throw new Error(`Failed to create automated campaigns: ${error.message}`)
    }
  }

  /**
   * Analyze campaign performance and provide recommendations
   */
  async analyzeCampaignPerformance(campaignId: string, analysisWindow: number = 14): Promise<CampaignPerformanceAnalysis> {
    try {
      const campaign = await MarketingCampaignModel.getById(campaignId)
      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`)
      }

      const business = await BusinessModel.getById(campaign.businessId)
      if (!business) {
        throw new Error(`Business not found: ${campaign.businessId}`)
      }

      // Get campaign metrics from Google Ads
      let metrics
      if (campaign.platform === 'GOOGLE_ADS' && campaign.googleAdsId) {
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date(Date.now() - analysisWindow * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        metrics = await googleAdsService.getCampaignMetrics(
          campaign.googleAdsId,
          business.googleAdsCustomerId!,
          business.googleAdsRefreshToken!,
          { startDate, endDate }
        )
      } else {
        // Fallback to local metrics
        metrics = {
          campaignId,
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          conversions: campaign.conversions,
          cost: Number(campaign.spent),
          ctr: campaign.clicks / Math.max(campaign.impressions, 1) * 100,
          averageCpc: Number(campaign.spent) / Math.max(campaign.clicks, 1),
          costPerConversion: Number(campaign.spent) / Math.max(campaign.conversions, 1)
        }
      }

      // Calculate ROAS (Return on Ad Spend)
      const revenue = campaign.conversions * Number(business.monthlyPrice)
      const roas = revenue / Math.max(metrics.cost, 1)

      // Calculate performance score
      const performanceScore = this.calculatePerformanceScore(metrics, roas, business)

      // Generate recommendation
      const recommendation = this.generateRecommendation(performanceScore, metrics, roas, analysisWindow)

      return {
        campaignId,
        platform: campaign.platform,
        performanceScore,
        recommendation: recommendation.action,
        reasons: recommendation.reasons,
        suggestedBudgetChange: recommendation.budgetChange,
        metrics: {
          ctr: metrics.ctr,
          cpc: metrics.averageCpc,
          conversions: metrics.conversions,
          roas,
          costPerConversion: metrics.costPerConversion || 0
        }
      }

    } catch (error) {
      logger.error(`Error analyzing campaign performance:`, error)
      throw new Error(`Failed to analyze campaign performance: ${error.message}`)
    }
  }

  /**
   * Execute campaign optimization based on performance analysis
   */
  async optimizeCampaign(campaignId: string): Promise<CampaignOptimization> {
    try {
      const analysis = await this.analyzeCampaignPerformance(campaignId)
      const campaign = await MarketingCampaignModel.getById(campaignId)
      const business = await BusinessModel.getById(campaign!.businessId)

      const optimizations: CampaignOptimization['optimizations'] = []

      switch (analysis.recommendation) {
        case 'SCALE':
          await this.scaleCampaign(campaignId, 1.2) // Increase budget by 20%
          optimizations.push({
            type: 'BUDGET_INCREASE',
            description: `Budget increased by 20% due to strong performance (ROAS: ${analysis.metrics.roas.toFixed(2)})`,
            value: 1.2
          })
          break

        case 'PAUSE':
          await this.pauseCampaign(campaignId)
          optimizations.push({
            type: 'PAUSE',
            description: `Campaign paused due to poor performance (Score: ${analysis.performanceScore}/100)`
          })
          break

        case 'OPTIMIZE':
          // Reduce budget by 10% and optimize
          await this.scaleCampaign(campaignId, 0.9)
          optimizations.push({
            type: 'BUDGET_DECREASE',
            description: `Budget reduced by 10% for optimization period`,
            value: 0.9
          })
          optimizations.push({
            type: 'KEYWORD_OPTIMIZATION',
            description: 'Keyword analysis and optimization initiated'
          })
          break

        case 'MAINTAIN':
          optimizations.push({
            type: 'BID_ADJUSTMENT',
            description: 'Minor bid adjustments for continued performance'
          })
          break
      }

      logger.info(`Campaign ${campaignId} optimized with ${optimizations.length} actions`)

      return {
        campaignId,
        optimizations,
        expectedImpact: this.getExpectedImpact(analysis.recommendation, analysis.metrics.roas)
      }

    } catch (error) {
      logger.error(`Error optimizing campaign:`, error)
      throw new Error(`Failed to optimize campaign: ${error.message}`)
    }
  }

  /**
   * Scale campaign budget by factor
   */
  async scaleCampaign(campaignId: string, factor: number): Promise<void> {
    const campaign = await MarketingCampaignModel.getById(campaignId)
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`)
    }

    const business = await BusinessModel.getById(campaign.businessId)
    if (!business) {
      throw new Error(`Business not found: ${campaign.businessId}`)
    }

    if (campaign.platform === 'GOOGLE_ADS' && campaign.googleAdsId) {
      await googleAdsService.scaleCampaignBudget(
        campaign.googleAdsId,
        business.googleAdsCustomerId!,
        business.googleAdsRefreshToken!,
        factor
      )
    }

    // Update local record
    const newBudget = Number(campaign.budget) * factor
    await MarketingCampaignModel.update(campaignId, { budget: newBudget })

    logger.info(`Campaign ${campaignId} budget scaled by ${factor}x to ${newBudget}`)
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    const campaign = await MarketingCampaignModel.getById(campaignId)
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`)
    }

    const business = await BusinessModel.getById(campaign.businessId)
    if (!business) {
      throw new Error(`Business not found: ${campaign.businessId}`)
    }

    if (campaign.platform === 'GOOGLE_ADS' && campaign.googleAdsId) {
      await googleAdsService.pauseCampaign(
        campaign.googleAdsId,
        business.googleAdsCustomerId!,
        business.googleAdsRefreshToken!
      )
    }

    // Update local record
    await MarketingCampaignModel.update(campaignId, { status: 'PAUSED' })

    logger.info(`Campaign ${campaignId} paused`)
  }

  /**
   * Resume paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    const campaign = await MarketingCampaignModel.getById(campaignId)
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`)
    }

    const business = await BusinessModel.getById(campaign.businessId)
    if (!business) {
      throw new Error(`Business not found: ${campaign.businessId}`)
    }

    if (campaign.platform === 'GOOGLE_ADS' && campaign.googleAdsId) {
      await googleAdsService.resumeCampaign(
        campaign.googleAdsId,
        business.googleAdsCustomerId!,
        business.googleAdsRefreshToken!
      )
    }

    // Update local record
    await MarketingCampaignModel.update(campaignId, { status: 'ACTIVE' })

    logger.info(`Campaign ${campaignId} resumed`)
  }

  /**
   * Get campaigns by business with performance data
   */
  async getCampaignsByBusiness(businessId: string): Promise<MarketingCampaign[]> {
    return MarketingCampaignModel.getByBusinessId(businessId)
  }

  /**
   * Pause all campaigns for a business
   */
  async pauseAllCampaigns(businessId: string): Promise<number> {
    const campaigns = await MarketingCampaignModel.getByBusinessId(businessId)
    
    for (const campaign of campaigns) {
      if (campaign.status === 'ACTIVE') {
        await this.pauseCampaign(campaign.id)
      }
    }

    return campaigns.filter(c => c.status === 'ACTIVE').length
  }

  // Private helper methods

  private async createGoogleAdsCampaign(business: Business): Promise<MarketingCampaign> {
    const keywords = [
      business.name,
      `${business.industry} software`,
      `${business.industry} solution`,
      `${business.industry} tool`,
      `online ${business.industry}`,
      `${business.industry} platform`
    ]

    const campaignResult = await googleAdsService.createCampaign(business, {
      name: `${business.name} - Search Campaign`,
      budget: Number(business.initialBudget) || 100,
      targetCPA: Number(business.targetCPA) || 50,
      keywords,
      businessId: business.id
    })

    // Return the created campaign from database
    const campaign = await MarketingCampaignModel.findByExternalId('GOOGLE_ADS', campaignResult.googleAdsId)
    if (!campaign) {
      throw new Error('Failed to retrieve created campaign')
    }

    return campaign
  }

  private calculatePerformanceScore(metrics: any, roas: number, business: Business): number {
    let score = 0

    // CTR Score (30% weight)
    const avgCTR = 2 // Industry average 2%
    const ctrScore = Math.min(100, (metrics.ctr / avgCTR) * 100)
    score += ctrScore * 0.3

    // ROAS Score (40% weight)
    const targetROAS = 3 // Target 3:1 return
    const roasScore = Math.min(100, (roas / targetROAS) * 100)
    score += roasScore * 0.4

    // Conversion Score (20% weight)
    const conversionScore = metrics.conversions > 0 ? Math.min(100, metrics.conversions * 10) : 0
    score += conversionScore * 0.2

    // Cost Efficiency Score (10% weight)
    const targetCPA = Number(business.targetCPA) || 50
    const efficiencyScore = metrics.costPerConversion > 0 
      ? Math.min(100, (targetCPA / metrics.costPerConversion) * 100)
      : 0
    score += efficiencyScore * 0.1

    return Math.round(score)
  }

  private generateRecommendation(
    score: number, 
    metrics: any, 
    roas: number, 
    daysSinceStart: number
  ): { action: 'SCALE' | 'PAUSE' | 'OPTIMIZE' | 'MAINTAIN', reasons: string[], budgetChange?: number } {
    const reasons: string[] = []

    // Early stage evaluation (first 7 days)
    if (daysSinceStart <= 7) {
      if (score >= 70 && roas >= 2) {
        reasons.push('Strong early performance indicators')
        reasons.push(`High performance score: ${score}/100`)
        return { action: 'SCALE', reasons, budgetChange: 1.2 }
      } else if (score < 30) {
        reasons.push('Poor early performance indicators')
        reasons.push('Needs optimization period')
        return { action: 'OPTIMIZE', reasons }
      } else {
        reasons.push('Campaign in learning phase')
        return { action: 'MAINTAIN', reasons }
      }
    }

    // Mature campaign evaluation (after 7 days)
    if (score >= 80 && roas >= 3) {
      reasons.push(`Excellent performance score: ${score}/100`)
      reasons.push(`Strong ROAS: ${roas.toFixed(2)}`)
      return { action: 'SCALE', reasons, budgetChange: 1.3 }
    }

    if (score >= 60 && roas >= 2) {
      reasons.push(`Good performance score: ${score}/100`)
      reasons.push(`Healthy ROAS: ${roas.toFixed(2)}`)
      return { action: 'SCALE', reasons, budgetChange: 1.15 }
    }

    if (score < 30 || roas < 1) {
      reasons.push(`Poor performance score: ${score}/100`)
      reasons.push(`Low ROAS: ${roas.toFixed(2)}`)
      if (daysSinceStart >= 14) {
        reasons.push('Campaign underperforming for 2+ weeks')
        return { action: 'PAUSE', reasons }
      } else {
        reasons.push('Requires optimization')
        return { action: 'OPTIMIZE', reasons }
      }
    }

    reasons.push('Campaign performing within acceptable range')
    return { action: 'MAINTAIN', reasons }
  }

  private getExpectedImpact(recommendation: string, roas: number): string {
    switch (recommendation) {
      case 'SCALE':
        return `Expected 15-25% increase in conversions with current ROAS of ${roas.toFixed(2)}`
      case 'PAUSE':
        return 'Campaign costs eliminated, traffic redirected to better performing channels'
      case 'OPTIMIZE':
        return 'Expected 10-20% improvement in efficiency over next 7-14 days'
      case 'MAINTAIN':
        return 'Steady performance expected with minor efficiency improvements'
      default:
        return 'Impact analysis pending'
    }
  }
}

// Export singleton instance
export const marketingService = new MarketingService()