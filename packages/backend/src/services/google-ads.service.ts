import { GoogleAdsApi, Customer } from 'google-ads-api'
import { Business, MarketingCampaign } from '@prisma/client'
import { logger } from '../index'
import { BusinessModel } from '../models/business.model'
import { MarketingCampaignModel } from '../models/marketing-campaign.model'

export interface GoogleAdsConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  customerId: string
  developerToken: string
}

export interface CampaignData {
  name: string
  budget: number
  targetCPA?: number
  keywords: string[]
  businessId: string
}

export interface CampaignMetrics {
  campaignId: string
  impressions: number
  clicks: number
  conversions: number
  cost: number
  ctr: number
  averageCpc: number
  costPerConversion?: number
}

export interface CampaignResult {
  campaignId: string
  platform: string
  status: string
  budget: number
  keywords: string[]
  googleAdsId: string
}

export class GoogleAdsService {
  private client: GoogleAdsApi

  constructor() {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!
    })
  }

  /**
   * Create a new Google Ads campaign for a business
   */
  async createCampaign(business: Business, campaignData: CampaignData): Promise<CampaignResult> {
    try {
      logger.info(`Creating Google Ads campaign for business ${business.id}`, { campaignData })

      if (!business.googleAdsCustomerId || !business.googleAdsRefreshToken) {
        throw new Error('Business missing Google Ads credentials')
      }

      const customer = this.getCustomer(business.googleAdsCustomerId, business.googleAdsRefreshToken)

      // Step 1: Create campaign budget
      const budget = await this.createCampaignBudget(customer, campaignData.budget)
      
      // Step 2: Create campaign
      const campaign = await this.createSearchCampaign(customer, campaignData, budget.resourceName)
      
      // Step 3: Create ad group
      const adGroup = await this.createAdGroup(customer, campaign.resourceName, campaignData.name)
      
      // Step 4: Add keywords
      await this.addKeywords(customer, adGroup.resourceName, campaignData.keywords)
      
      // Step 5: Create text ads
      await this.createTextAds(customer, adGroup.resourceName, business)

      // Step 6: Update business with Google Ads campaign info
      const googleAdsId = campaign.resourceName.split('/')[3]
      
      await MarketingCampaignModel.create({
        name: campaignData.name,
        platform: 'GOOGLE_ADS',
        budget: campaignData.budget,
        businessId: campaignData.businessId,
        startDate: new Date(),
        targetKeywords: campaignData.keywords,
        googleAdsId: googleAdsId,
        status: 'ACTIVE'
      })

      logger.info(`Google Ads campaign created successfully`, { campaignId: googleAdsId })

      return {
        campaignId: googleAdsId,
        platform: 'google_ads',
        status: 'active',
        budget: campaignData.budget,
        keywords: campaignData.keywords,
        googleAdsId: googleAdsId
      }

    } catch (error) {
      logger.error('Error creating Google Ads campaign:', error)
      throw new Error(`Failed to create Google Ads campaign: ${error.message}`)
    }
  }

  /**
   * Update campaign budget
   */
  async updateBudget(campaignId: string, customerId: string, refreshToken: string, newBudget: number): Promise<void> {
    try {
      logger.info(`Updating budget for campaign ${campaignId} to ${newBudget}`)

      const customer = this.getCustomer(customerId, refreshToken)

      // Get campaign budget resource name
      const query = `
        SELECT campaign.campaign_budget, campaign_budget.amount_micros
        FROM campaign 
        WHERE campaign.id = ${campaignId}
      `
      
      const [campaignData] = await customer.query(query)
      const budgetResourceName = campaignData.campaign.campaign_budget

      // Update budget
      await customer.campaignBudgets.update({
        resource_name: budgetResourceName,
        amount_micros: newBudget * 1000000, // Convert to micros
        delivery_method: 'STANDARD'
      })

      // Update local database
      await MarketingCampaignModel.updateByGoogleAdsId(campaignId, {
        budget: newBudget
      })

      logger.info(`Budget updated successfully for campaign ${campaignId}`)

    } catch (error) {
      logger.error(`Error updating campaign budget:`, error)
      throw new Error(`Failed to update campaign budget: ${error.message}`)
    }
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string, customerId: string, refreshToken: string): Promise<void> {
    try {
      logger.info(`Pausing campaign ${campaignId}`)

      const customer = this.getCustomer(customerId, refreshToken)

      await customer.campaigns.update({
        resource_name: `customers/${customerId}/campaigns/${campaignId}`,
        status: 'PAUSED'
      })

      // Update local database
      await MarketingCampaignModel.updateByGoogleAdsId(campaignId, {
        status: 'PAUSED'
      })

      logger.info(`Campaign ${campaignId} paused successfully`)

    } catch (error) {
      logger.error(`Error pausing campaign:`, error)
      throw new Error(`Failed to pause campaign: ${error.message}`)
    }
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId: string, customerId: string, refreshToken: string): Promise<void> {
    try {
      logger.info(`Resuming campaign ${campaignId}`)

      const customer = this.getCustomer(customerId, refreshToken)

      await customer.campaigns.update({
        resource_name: `customers/${customerId}/campaigns/${campaignId}`,
        status: 'ENABLED'
      })

      // Update local database
      await MarketingCampaignModel.updateByGoogleAdsId(campaignId, {
        status: 'ACTIVE'
      })

      logger.info(`Campaign ${campaignId} resumed successfully`)

    } catch (error) {
      logger.error(`Error resuming campaign:`, error)
      throw new Error(`Failed to resume campaign: ${error.message}`)
    }
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(campaignId: string, customerId: string, refreshToken: string, dateRange: { startDate: string, endDate: string }): Promise<CampaignMetrics> {
    try {
      const customer = this.getCustomer(customerId, refreshToken)

      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.cost_micros,
          metrics.ctr,
          metrics.average_cpc
        FROM campaign 
        WHERE campaign.id = ${campaignId}
        AND segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
      `

      const [data] = await customer.query(query)

      const costPerConversion = data.metrics.conversions > 0 
        ? (data.metrics.cost_micros / 1000000) / data.metrics.conversions 
        : undefined

      return {
        campaignId,
        impressions: data.metrics.impressions || 0,
        clicks: data.metrics.clicks || 0,
        conversions: data.metrics.conversions || 0,
        cost: (data.metrics.cost_micros || 0) / 1000000,
        ctr: data.metrics.ctr || 0,
        averageCpc: (data.metrics.average_cpc || 0) / 1000000,
        costPerConversion
      }

    } catch (error) {
      logger.error(`Error getting campaign metrics:`, error)
      throw new Error(`Failed to get campaign metrics: ${error.message}`)
    }
  }

  /**
   * Scale campaign budget by percentage
   */
  async scaleCampaignBudget(campaignId: string, customerId: string, refreshToken: string, scaleFactor: number): Promise<void> {
    try {
      // Get current budget
      const customer = this.getCustomer(customerId, refreshToken)
      
      const query = `
        SELECT campaign_budget.amount_micros
        FROM campaign 
        WHERE campaign.id = ${campaignId}
      `
      
      const [data] = await customer.query(query)
      const currentBudget = data.campaign_budget.amount_micros / 1000000
      const newBudget = currentBudget * scaleFactor

      await this.updateBudget(campaignId, customerId, refreshToken, newBudget)

      logger.info(`Campaign ${campaignId} budget scaled by ${scaleFactor}x from ${currentBudget} to ${newBudget}`)

    } catch (error) {
      logger.error(`Error scaling campaign budget:`, error)
      throw new Error(`Failed to scale campaign budget: ${error.message}`)
    }
  }

  // Private helper methods

  private getCustomer(customerId: string, refreshToken: string): Customer {
    return this.client.Customer({
      customer_id: customerId,
      refresh_token: refreshToken
    })
  }

  private async createCampaignBudget(customer: Customer, budgetAmount: number) {
    return await customer.campaignBudgets.create({
      name: `Budget_${Date.now()}`,
      amount_micros: budgetAmount * 1000000,
      delivery_method: 'STANDARD'
    })
  }

  private async createSearchCampaign(customer: Customer, campaignData: CampaignData, budgetResourceName: string) {
    return await customer.campaigns.create({
      name: campaignData.name,
      advertising_channel_type: 'SEARCH',
      status: 'ENABLED',
      campaign_budget: budgetResourceName,
      bidding_strategy_type: 'TARGET_CPA',
      target_cpa: {
        target_cpa_micros: (campaignData.targetCPA || 50) * 1000000
      },
      network_settings: {
        target_google_search: true,
        target_search_network: true,
        target_content_network: false,
        target_partner_search_network: false
      }
    })
  }

  private async createAdGroup(customer: Customer, campaignResourceName: string, campaignName: string) {
    return await customer.adGroups.create({
      name: `${campaignName} - Ad Group`,
      campaign: campaignResourceName,
      status: 'ENABLED',
      type: 'SEARCH_STANDARD',
      cpc_bid_micros: 1000000 // $1.00 default bid
    })
  }

  private async addKeywords(customer: Customer, adGroupResourceName: string, keywords: string[]) {
    const keywordOperations = keywords.map(keyword => ({
      ad_group: adGroupResourceName,
      status: 'ENABLED',
      keyword: {
        text: keyword,
        match_type: 'BROAD'
      }
    }))

    return await customer.adGroupCriteria.create(keywordOperations)
  }

  private async createTextAds(customer: Customer, adGroupResourceName: string, business: Business) {
    const headlines = [
      business.name,
      `${business.name} - Premium Solution`,
      `Try ${business.name} Today`
    ]

    const descriptions = [
      business.description,
      `Starting at $${business.monthlyPrice}/month. Sign up now!`
    ]

    return await customer.adGroupAds.create({
      ad_group: adGroupResourceName,
      status: 'ENABLED',
      ad: {
        type: 'RESPONSIVE_SEARCH_AD',
        responsive_search_ad: {
          headlines: headlines.map(text => ({ text })),
          descriptions: descriptions.map(text => ({ text })),
          path1: 'pricing',
          path2: 'signup'
        },
        final_urls: [business.websiteUrl || business.landingPageUrl || 'https://example.com']
      }
    })
  }
}

// Export singleton instance
export const googleAdsService = new GoogleAdsService()