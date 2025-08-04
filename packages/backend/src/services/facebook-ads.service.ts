import { Business, MarketingCampaign } from '@prisma/client'
import { logger } from '../index'
import { BusinessModel } from '../models/business.model'
import { MarketingCampaignModel } from '../models/marketing-campaign.model'

/**
 * Facebook Marketing API SDK interface
 * Using Facebook Business SDK for Node.js
 */
export interface FacebookAdsConfig {
  accessToken: string
  appId: string
  appSecret: string
  adAccountId: string
  businessId?: string
}

export interface FacebookCampaignData {
  name: string
  budget: number
  dailyBudget?: number
  objective: 'CONVERSIONS' | 'REACH' | 'TRAFFIC' | 'ENGAGEMENT' | 'APP_INSTALLS'
  businessId: string
  targetAudience?: FacebookAudience
  placement?: ('facebook' | 'instagram' | 'messenger' | 'audience_network')[]
  optimizationGoal?: string
}

export interface FacebookAudience {
  minAge?: number
  maxAge?: number
  genders?: number[] // 1: male, 2: female, 0: all
  countries?: string[]
  regions?: string[]
  cities?: string[]
  interests?: string[]
  behaviors?: string[]
  customAudiences?: string[]
  lookalike?: {
    sourceAudienceId: string
    ratio: number
    country: string
  }
}

export interface FacebookCampaignMetrics {
  campaignId: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  ctr: number
  cpm: number
  cpc: number
  costPerConversion?: number
  reach: number
  frequency: number
  dateRange: {
    start: string
    end: string
  }
}

export interface FacebookCampaignResult {
  campaignId: string
  platform: string
  status: string
  budget: number
  objective: string
  facebookId: string
  adSetId?: string
  adId?: string
  estimatedReach?: number
}

/**
 * Facebook Ads Service for campaign management and optimization
 * Integrates with Facebook Marketing API for automated advertising
 */
export class FacebookAdsService {
  private accessToken: string
  private appId: string
  private appSecret: string
  private apiVersion: string = 'v18.0'
  private baseUrl: string

  constructor() {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN!
    this.appId = process.env.FACEBOOK_APP_ID!
    this.appSecret = process.env.FACEBOOK_APP_SECRET!
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`

    if (!this.accessToken || !this.appId || !this.appSecret) {
      throw new Error('Facebook Ads configuration missing. Check environment variables.')
    }
  }

  /**
   * Create a new Facebook Ads campaign for a business
   */
  async createCampaign(business: Business, campaignData: FacebookCampaignData): Promise<FacebookCampaignResult> {
    try {
      logger.info(`Creating Facebook Ads campaign for business ${business.id}`, { campaignData })

      if (!business.facebookAdAccountId || !business.facebookAccessToken) {
        throw new Error('Business missing Facebook Ads credentials')
      }

      const adAccountId = business.facebookAdAccountId
      const businessAccessToken = business.facebookAccessToken

      // Step 1: Create campaign
      const campaign = await this.createFacebookCampaign(
        adAccountId, 
        campaignData, 
        businessAccessToken
      )
      
      // Step 2: Create ad set with targeting
      const adSet = await this.createAdSet(
        adAccountId,
        campaign.id,
        campaignData,
        businessAccessToken
      )
      
      // Step 3: Create ad creative
      const creative = await this.createAdCreative(
        adAccountId,
        business,
        campaignData,
        businessAccessToken
      )
      
      // Step 4: Create ad
      const ad = await this.createAd(
        adAccountId,
        adSet.id,
        creative.id,
        businessAccessToken
      )

      // Step 5: Store campaign in database
      await MarketingCampaignModel.create({
        name: campaignData.name,
        platform: campaignData.placement?.includes('instagram') ? 'INSTAGRAM_ADS' : 'FACEBOOK_ADS',
        budget: campaignData.budget,
        businessId: campaignData.businessId,
        startDate: new Date(),
        facebookId: campaign.id,
        status: 'ACTIVE',
        audienceData: campaignData.targetAudience ? JSON.stringify(campaignData.targetAudience) : null
      })

      logger.info(`Facebook Ads campaign created successfully`, { 
        campaignId: campaign.id,
        adSetId: adSet.id,
        adId: ad.id
      })

      return {
        campaignId: campaign.id,
        platform: 'facebook_ads',
        status: 'active',
        budget: campaignData.budget,
        objective: campaignData.objective,
        facebookId: campaign.id,
        adSetId: adSet.id,
        adId: ad.id,
        estimatedReach: adSet.estimated_reach
      }

    } catch (error) {
      logger.error(`Failed to create Facebook Ads campaign:`, error)
      throw error
    }
  }

  /**
   * Create Facebook campaign
   */
  private async createFacebookCampaign(
    adAccountId: string, 
    campaignData: FacebookCampaignData,
    accessToken: string
  ) {
    const campaignParams = {
      name: campaignData.name,
      objective: campaignData.objective,
      status: 'ACTIVE',
      access_token: accessToken
    }

    const response = await this.makeAPICall(
      `act_${adAccountId}/campaigns`,
      'POST',
      campaignParams
    )

    return response
  }

  /**
   * Create ad set with targeting and budget
   */
  private async createAdSet(
    adAccountId: string,
    campaignId: string,
    campaignData: FacebookCampaignData,
    accessToken: string
  ) {
    const targeting = this.buildTargeting(campaignData.targetAudience)
    
    const adSetParams = {
      name: `${campaignData.name} - AdSet`,
      campaign_id: campaignId,
      billing_event: 'IMPRESSIONS',
      optimization_goal: campaignData.optimizationGoal || 'CONVERSIONS',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      daily_budget: Math.round((campaignData.dailyBudget || campaignData.budget / 30) * 100), // cents
      targeting,
      status: 'ACTIVE',
      promoted_object: {
        page_id: process.env.FACEBOOK_PAGE_ID // Business page
      },
      access_token: accessToken
    }

    // Add placement if specified
    if (campaignData.placement && campaignData.placement.length > 0) {
      adSetParams.publisher_platforms = campaignData.placement
    }

    const response = await this.makeAPICall(
      `act_${adAccountId}/adsets`,
      'POST',
      adSetParams
    )

    return response
  }

  /**
   * Create ad creative
   */
  private async createAdCreative(
    adAccountId: string,
    business: Business,
    campaignData: FacebookCampaignData,
    accessToken: string
  ) {
    const creativeParams = {
      name: `${campaignData.name} - Creative`,
      object_story_spec: {
        page_id: process.env.FACEBOOK_PAGE_ID,
        link_data: {
          link: business.websiteUrl || business.landingPageUrl,
          message: `Discover ${business.name} - ${business.description.substring(0, 90)}...`,
          name: business.name,
          description: business.description,
          call_to_action: {
            type: 'LEARN_MORE'
          }
        }
      },
      access_token: accessToken
    }

    const response = await this.makeAPICall(
      `act_${adAccountId}/adcreatives`,
      'POST',
      creativeParams
    )

    return response
  }

  /**
   * Create ad
   */
  private async createAd(
    adAccountId: string,
    adSetId: string,
    creativeId: string,
    accessToken: string
  ) {
    const adParams = {
      name: `Ad - ${Date.now()}`,
      adset_id: adSetId,
      creative: { creative_id: creativeId },
      status: 'ACTIVE',
      access_token: accessToken
    }

    const response = await this.makeAPICall(
      `act_${adAccountId}/ads`,
      'POST',
      adParams
    )

    return response
  }

  /**
   * Build targeting object for Facebook Ads
   */
  private buildTargeting(audience?: FacebookAudience) {
    const targeting: any = {
      geo_locations: {
        countries: audience?.countries || ['US', 'CA', 'GB', 'AU']
      }
    }

    if (audience?.minAge || audience?.maxAge) {
      targeting.age_min = audience.minAge || 18
      targeting.age_max = audience.maxAge || 65
    }

    if (audience?.genders && audience.genders.length > 0) {
      targeting.genders = audience.genders
    }

    if (audience?.interests && audience.interests.length > 0) {
      targeting.interests = audience.interests.map(interest => ({ id: interest }))
    }

    if (audience?.behaviors && audience.behaviors.length > 0) {
      targeting.behaviors = audience.behaviors.map(behavior => ({ id: behavior }))
    }

    if (audience?.customAudiences && audience.customAudiences.length > 0) {
      targeting.custom_audiences = audience.customAudiences.map(id => ({ id }))
    }

    return targeting
  }

  /**
   * Get campaign metrics from Facebook Ads
   */
  async getCampaignMetrics(campaignId: string, dateRange: { start: string, end: string }): Promise<FacebookCampaignMetrics> {
    try {
      const fields = [
        'impressions',
        'clicks',
        'spend',
        'ctr',
        'cpm',
        'cpc',
        'reach',
        'frequency',
        'conversions'
      ].join(',')

      const params = {
        fields,
        time_range: `{"since":"${dateRange.start}","until":"${dateRange.end}"}`,
        access_token: this.accessToken
      }

      const response = await this.makeAPICall(
        `${campaignId}/insights`,
        'GET',
        params
      )

      const data = response.data[0] || {}

      return {
        campaignId,
        impressions: parseInt(data.impressions || '0'),
        clicks: parseInt(data.clicks || '0'),
        conversions: parseInt(data.conversions || '0'),
        spend: parseFloat(data.spend || '0'),
        ctr: parseFloat(data.ctr || '0'),
        cpm: parseFloat(data.cpm || '0'),
        cpc: parseFloat(data.cpc || '0'),
        costPerConversion: data.conversions > 0 ? parseFloat(data.spend) / parseInt(data.conversions) : undefined,
        reach: parseInt(data.reach || '0'),
        frequency: parseFloat(data.frequency || '0'),
        dateRange
      }
    } catch (error) {
      logger.error(`Failed to get Facebook campaign metrics:`, error)
      throw error
    }
  }

  /**
   * Update campaign budget
   */
  async updateCampaignBudget(campaignId: string, newBudget: number): Promise<void> {
    try {
      // Note: Budget is updated at the ad set level, not campaign level
      const adSets = await this.makeAPICall(
        `${campaignId}/adsets`,
        'GET',
        { access_token: this.accessToken }
      )

      for (const adSet of adSets.data) {
        await this.makeAPICall(
          adSet.id,
          'POST',
          {
            daily_budget: Math.round((newBudget / 30) * 100), // Convert to daily budget in cents
            access_token: this.accessToken
          }
        )
      }

      logger.info(`Updated Facebook campaign budget`, { campaignId, newBudget })
    } catch (error) {
      logger.error(`Failed to update Facebook campaign budget:`, error)
      throw error
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      await this.makeAPICall(
        campaignId,
        'POST',
        {
          status: 'PAUSED',
          access_token: this.accessToken
        }
      )

      logger.info(`Paused Facebook campaign`, { campaignId })
    } catch (error) {
      logger.error(`Failed to pause Facebook campaign:`, error)
      throw error
    }
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    try {
      await this.makeAPICall(
        campaignId,
        'POST',
        {
          status: 'ACTIVE',
          access_token: this.accessToken
        }
      )

      logger.info(`Resumed Facebook campaign`, { campaignId })
    } catch (error) {
      logger.error(`Failed to resume Facebook campaign:`, error)
      throw error
    }
  }

  /**
   * Create lookalike audience
   */
  async createLookalikeAudience(
    adAccountId: string, 
    sourceAudienceId: string, 
    country: string, 
    ratio: number = 0.01
  ): Promise<any> {
    try {
      const params = {
        name: `Lookalike Audience ${Date.now()}`,
        subtype: 'LOOKALIKE',
        origin_audience_id: sourceAudienceId,
        lookalike_spec: {
          type: 'similarity',
          ratio,
          country
        },
        access_token: this.accessToken
      }

      const response = await this.makeAPICall(
        `act_${adAccountId}/customaudiences`,
        'POST',
        params
      )

      logger.info(`Created lookalike audience`, { audienceId: response.id })
      return response
    } catch (error) {
      logger.error(`Failed to create lookalike audience:`, error)
      throw error
    }
  }

  /**
   * Make API call to Facebook Graph API
   */
  private async makeAPICall(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', params: any = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    if (method === 'GET') {
      const queryParams = new URLSearchParams(params).toString()
      const finalUrl = queryParams ? `${url}?${queryParams}` : url
      options.body = undefined
      
      const response = await fetch(finalUrl, options)
      return await response.json()
    } else {
      options.body = JSON.stringify(params)
      
      const response = await fetch(url, options)
      return await response.json()
    }
  }
}

// Export service instance
export const facebookAdsService = new FacebookAdsService()