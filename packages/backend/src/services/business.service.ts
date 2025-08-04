import { Business, BusinessStatus, Prisma } from '@prisma/client'
import { BusinessModel, CreateBusinessData, UpdateBusinessData, BusinessWithDetails } from '../models/business.model'
import { BusinessCreateInput, BusinessUpdateInput, PaginationQuery, DateRangeQuery } from '../utils/schemas'
import { logger } from '../index'

export interface BusinessListResponse {
  businesses: Business[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface BusinessStatsResponse {
  total: number
  active: number
  developing: number
  paused: number
  closed: number
}

export class BusinessService {
  /**
   * Create a new business
   */
  static async createBusiness(businessData: BusinessCreateInput, ownerId: string): Promise<Business> {
    try {
      const createData: CreateBusinessData = {
        ...businessData,
        ownerId
      }

      const business = await BusinessModel.create(createData)
      
      logger.info(`Business created successfully: ${business.id}`, {
        businessId: business.id,
        ownerId,
        name: business.name
      })

      return business
    } catch (error) {
      logger.error('Business creation failed:', error)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('Business with this name already exists')
        }
      }
      throw new Error('Failed to create business')
    }
  }

  /**
   * Get business by ID
   */
  static async getBusinessById(id: string, ownerId?: string): Promise<Business | null> {
    try {
      const business = await BusinessModel.findById(id)
      
      if (!business) {
        return null
      }

      // Check ownership if ownerId is provided
      if (ownerId && business.ownerId !== ownerId) {
        throw new Error('Unauthorized access to business')
      }

      return business
    } catch (error) {
      logger.error(`Failed to get business ${id}:`, error)
      throw error
    }
  }

  /**
   * Get business with full details (includes relations)
   */
  static async getBusinessWithDetails(id: string, ownerId?: string): Promise<BusinessWithDetails | null> {
    try {
      const business = await BusinessModel.findByIdWithDetails(id)
      
      if (!business) {
        return null
      }

      // Check ownership if ownerId is provided
      if (ownerId && business.ownerId !== ownerId) {
        throw new Error('Unauthorized access to business')
      }

      return business
    } catch (error) {
      logger.error(`Failed to get business details ${id}:`, error)
      throw error
    }
  }

  /**
   * Get all businesses for an owner with pagination
   */
  static async getBusinessesByOwner(
    ownerId: string, 
    pagination: PaginationQuery
  ): Promise<BusinessListResponse> {
    try {
      const { page, limit } = pagination
      const skip = (page - 1) * limit

      const [businesses, total] = await Promise.all([
        BusinessModel.findByOwnerId(ownerId, skip, limit),
        BusinessModel.countByOwnerId(ownerId)
      ])

      return {
        businesses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      logger.error(`Failed to get businesses for owner ${ownerId}:`, error)
      throw new Error('Failed to retrieve businesses')
    }
  }

  /**
   * Get businesses by status
   */
  static async getBusinessesByStatus(status: BusinessStatus): Promise<Business[]> {
    try {
      return await BusinessModel.findByStatus(status)
    } catch (error) {
      logger.error(`Failed to get businesses by status ${status}:`, error)
      throw new Error('Failed to retrieve businesses by status')
    }
  }

  /**
   * Get active businesses for automation
   */
  static async getActiveBusinesses(): Promise<Business[]> {
    try {
      return await BusinessModel.findActiveBusinesses()
    } catch (error) {
      logger.error('Failed to get active businesses:', error)
      throw new Error('Failed to retrieve active businesses')
    }
  }

  /**
   * Update business
   */
  static async updateBusiness(
    id: string, 
    updateData: BusinessUpdateInput, 
    ownerId?: string
  ): Promise<Business> {
    try {
      // Check if business exists and user has access
      const existingBusiness = await this.getBusinessById(id, ownerId)
      if (!existingBusiness) {
        throw new Error('Business not found')
      }

      const business = await BusinessModel.update(id, updateData)
      
      logger.info(`Business updated successfully: ${id}`, {
        businessId: id,
        ownerId: business.ownerId,
        changes: Object.keys(updateData)
      })

      return business
    } catch (error) {
      logger.error(`Failed to update business ${id}:`, error)
      throw error
    }
  }

  /**
   * Update business status
   */
  static async updateBusinessStatus(
    id: string, 
    status: BusinessStatus, 
    ownerId?: string
  ): Promise<Business> {
    try {
      // Check if business exists and user has access
      const existingBusiness = await this.getBusinessById(id, ownerId)
      if (!existingBusiness) {
        throw new Error('Business not found')
      }

      const business = await BusinessModel.updateStatus(id, status)
      
      logger.info(`Business status updated: ${id} -> ${status}`, {
        businessId: id,
        oldStatus: existingBusiness.status,
        newStatus: status
      })

      return business
    } catch (error) {
      logger.error(`Failed to update business status ${id}:`, error)
      throw error
    }
  }

  /**
   * Update Stripe integration data
   */
  static async updateStripeData(
    id: string, 
    stripeData: { productId: string; priceId: string }, 
    ownerId?: string
  ): Promise<Business> {
    try {
      // Check if business exists and user has access
      const existingBusiness = await this.getBusinessById(id, ownerId)
      if (!existingBusiness) {
        throw new Error('Business not found')
      }

      const business = await BusinessModel.updateStripeData(id, stripeData)
      
      logger.info(`Stripe data updated for business: ${id}`, {
        businessId: id,
        productId: stripeData.productId,
        priceId: stripeData.priceId
      })

      return business
    } catch (error) {
      logger.error(`Failed to update Stripe data for business ${id}:`, error)
      throw error
    }
  }

  /**
   * Delete business
   */
  static async deleteBusiness(id: string, ownerId?: string): Promise<Business> {
    try {
      // Check if business exists and user has access
      const existingBusiness = await this.getBusinessById(id, ownerId)
      if (!existingBusiness) {
        throw new Error('Business not found')
      }

      const business = await BusinessModel.delete(id)
      
      logger.info(`Business deleted successfully: ${id}`, {
        businessId: id,
        ownerId: business.ownerId,
        name: business.name
      })

      return business
    } catch (error) {
      logger.error(`Failed to delete business ${id}:`, error)
      throw error
    }
  }

  /**
   * Search businesses
   */
  static async searchBusinesses(query: string, ownerId?: string): Promise<Business[]> {
    try {
      return await BusinessModel.search(query, ownerId)
    } catch (error) {
      logger.error(`Failed to search businesses with query "${query}":`, error)
      throw new Error('Search failed')
    }
  }

  /**
   * Get business statistics
   */
  static async getBusinessStatistics(ownerId?: string): Promise<BusinessStatsResponse> {
    try {
      return await BusinessModel.getStatistics(ownerId)
    } catch (error) {
      logger.error('Failed to get business statistics:', error)
      throw new Error('Failed to retrieve statistics')
    }
  }

  /**
   * Mark business as failed (used by job queue)
   */
  static async markBusinessAsFailed(id: string, reason?: string): Promise<Business> {
    try {
      const business = await BusinessModel.updateStatus(id, 'CLOSED')
      
      logger.warn(`Business marked as failed: ${id}`, {
        businessId: id,
        reason
      })

      return business
    } catch (error) {
      logger.error(`Failed to mark business as failed ${id}:`, error)
      throw error
    }
  }

  /**
   * Get businesses requiring monitoring (active businesses)
   */
  static async getBusinessesForMonitoring(): Promise<Business[]> {
    try {
      return await BusinessModel.findByStatus('ACTIVE')
    } catch (error) {
      logger.error('Failed to get businesses for monitoring:', error)
      throw new Error('Failed to retrieve businesses for monitoring')
    }
  }

  /**
   * Update Analytics integration data
   */
  static async updateAnalyticsInfo(
    id: string,
    analyticsData: {
      analyticsPropertyId: string;
      analyticsMeasurementId: string;
      analyticsStreamId?: string;
    },
    ownerId?: string
  ): Promise<Business> {
    try {
      // Check if business exists and user has access
      const existingBusiness = await this.getBusinessById(id, ownerId)
      if (!existingBusiness) {
        throw new Error('Business not found')
      }

      const business = await BusinessModel.updateAnalyticsData(id, analyticsData)
      
      logger.info(`Analytics data updated for business: ${id}`, {
        businessId: id,
        propertyId: analyticsData.analyticsPropertyId,
        measurementId: analyticsData.analyticsMeasurementId
      })

      return business
    } catch (error) {
      logger.error(`Failed to update Analytics data for business ${id}:`, error)
      throw error
    }
  }

  /**
   * Log conversion event for business
   */
  static async logConversion(
    businessId: string,
    eventName: string,
    value?: number,
    metadata?: any
  ): Promise<void> {
    try {
      await BusinessModel.createConversionEvent(businessId, {
        eventName,
        value: value ? value : undefined,
        metadata
      })
      
      logger.info(`Conversion logged for business: ${businessId}`, {
        businessId,
        eventName,
        value
      })
    } catch (error) {
      logger.error(`Failed to log conversion for business ${businessId}:`, error)
      throw error
    }
  }

  /**
   * Alias for getBusinessById - used by analytics service
   */
  static async getById(id: string): Promise<Business | null> {
    return this.getBusinessById(id)
  }

  /**
   * Get conversion events for business
   */
  static async getConversionEvents(businessId: string, limit: number = 100): Promise<any[]> {
    try {
      return await BusinessModel.getConversionEvents(businessId, limit)
    } catch (error) {
      logger.error(`Failed to get conversion events for business ${businessId}:`, error)
      throw new Error('Failed to retrieve conversion events')
    }
  }

}

// Export singleton instance for compatibility
export const businessService = new class extends BusinessService {}()