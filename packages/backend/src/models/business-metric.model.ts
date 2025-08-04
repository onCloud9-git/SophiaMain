import { BusinessMetric, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'

export interface CreateMetricData {
  businessId: string
  date: Date
  visitors?: number
  conversions?: number
  revenue?: number
  bounceRate?: number
  sessionDuration?: number
  pageViews?: number
  totalImpressions?: number
  totalClicks?: number
  totalSpent?: number
  newSubscriptions?: number
  cancelledSubscriptions?: number
  activeSubscriptions?: number
}

export interface UpdateMetricData {
  visitors?: number
  conversions?: number
  revenue?: number
  bounceRate?: number
  sessionDuration?: number
  pageViews?: number
  totalImpressions?: number
  totalClicks?: number
  totalSpent?: number
  newSubscriptions?: number
  cancelledSubscriptions?: number
  activeSubscriptions?: number
}

export interface MetricWithBusiness extends BusinessMetric {
  business?: {
    id: string
    name: string
    status: string
  }
}

export interface BusinessMetricSummary {
  totalRevenue: number
  totalVisitors: number
  totalConversions: number
  avgBounceRate: number
  avgSessionDuration: number
  totalSubscriptions: number
  churnRate: number
  avgRevenuePerUser: number
  growthRate: number
}

export class BusinessMetricModel {
  /**
   * Create or update metric for a specific date
   * Uses upsert to handle duplicate date entries
   */
  static async upsert(data: CreateMetricData): Promise<BusinessMetric> {
    return prisma.businessMetric.upsert({
      where: {
        businessId_date: {
          businessId: data.businessId,
          date: data.date
        }
      },
      update: {
        visitors: data.visitors ?? 0,
        conversions: data.conversions ?? 0,
        revenue: data.revenue ? new Prisma.Decimal(data.revenue) : new Prisma.Decimal(0),
        bounceRate: data.bounceRate,
        sessionDuration: data.sessionDuration,
        pageViews: data.pageViews ?? 0,
        totalImpressions: data.totalImpressions ?? 0,
        totalClicks: data.totalClicks ?? 0,
        totalSpent: data.totalSpent ? new Prisma.Decimal(data.totalSpent) : new Prisma.Decimal(0),
        newSubscriptions: data.newSubscriptions ?? 0,
        cancelledSubscriptions: data.cancelledSubscriptions ?? 0,
        activeSubscriptions: data.activeSubscriptions ?? 0
      },
      create: {
        businessId: data.businessId,
        date: data.date,
        visitors: data.visitors ?? 0,
        conversions: data.conversions ?? 0,
        revenue: data.revenue ? new Prisma.Decimal(data.revenue) : new Prisma.Decimal(0),
        bounceRate: data.bounceRate,
        sessionDuration: data.sessionDuration,
        pageViews: data.pageViews ?? 0,
        totalImpressions: data.totalImpressions ?? 0,
        totalClicks: data.totalClicks ?? 0,
        totalSpent: data.totalSpent ? new Prisma.Decimal(data.totalSpent) : new Prisma.Decimal(0),
        newSubscriptions: data.newSubscriptions ?? 0,
        cancelledSubscriptions: data.cancelledSubscriptions ?? 0,
        activeSubscriptions: data.activeSubscriptions ?? 0
      }
    })
  }

  /**
   * Find metric by business ID and date
   */
  static async findByBusinessAndDate(businessId: string, date: Date): Promise<BusinessMetric | null> {
    return prisma.businessMetric.findUnique({
      where: {
        businessId_date: { businessId, date }
      }
    })
  }

  /**
   * Find metrics by business ID with date range
   */
  static async findByBusinessIdAndDateRange(
    businessId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<BusinessMetric[]> {
    return prisma.businessMetric.findMany({
      where: {
        businessId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    })
  }

  /**
   * Find latest metrics for a business (last N days)
   */
  static async findLatestMetrics(businessId: string, days: number = 30): Promise<BusinessMetric[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return this.findByBusinessIdAndDateRange(businessId, startDate, new Date())
  }

  /**
   * Update metric data
   */
  static async update(businessId: string, date: Date, data: UpdateMetricData): Promise<BusinessMetric> {
    const updateData: any = { ...data }
    
    // Convert numbers to Decimal for financial fields
    if (data.revenue !== undefined) {
      updateData.revenue = new Prisma.Decimal(data.revenue)
    }
    if (data.totalSpent !== undefined) {
      updateData.totalSpent = new Prisma.Decimal(data.totalSpent)
    }

    return prisma.businessMetric.update({
      where: {
        businessId_date: { businessId, date }
      },
      data: updateData
    })
  }

  /**
   * Delete metric
   */
  static async delete(businessId: string, date: Date): Promise<BusinessMetric> {
    return prisma.businessMetric.delete({
      where: {
        businessId_date: { businessId, date }
      }
    })
  }

  /**
   * Get business metric summary for date range
   */
  static async getBusinessSummary(
    businessId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<BusinessMetricSummary> {
    const metrics = await this.findByBusinessIdAndDateRange(businessId, startDate, endDate)
    
    if (metrics.length === 0) {
      return {
        totalRevenue: 0,
        totalVisitors: 0,
        totalConversions: 0,
        avgBounceRate: 0,
        avgSessionDuration: 0,
        totalSubscriptions: 0,
        churnRate: 0,
        avgRevenuePerUser: 0,
        growthRate: 0
      }
    }

    const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue.toNumber(), 0)
    const totalVisitors = metrics.reduce((sum, m) => sum + m.visitors, 0)
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0)
    const totalSubscriptions = metrics.reduce((sum, m) => sum + m.newSubscriptions, 0)
    const totalCancelledSubscriptions = metrics.reduce((sum, m) => sum + m.cancelledSubscriptions, 0)
    
    // Calculate averages for metrics that have values
    const bounceRateMetrics = metrics.filter(m => m.bounceRate !== null)
    const avgBounceRate = bounceRateMetrics.length > 0 
      ? bounceRateMetrics.reduce((sum, m) => sum + (m.bounceRate || 0), 0) / bounceRateMetrics.length
      : 0

    const sessionDurationMetrics = metrics.filter(m => m.sessionDuration !== null)
    const avgSessionDuration = sessionDurationMetrics.length > 0
      ? sessionDurationMetrics.reduce((sum, m) => sum + (m.sessionDuration || 0), 0) / sessionDurationMetrics.length
      : 0

    const churnRate = totalSubscriptions > 0 
      ? (totalCancelledSubscriptions / totalSubscriptions) * 100 
      : 0

    const avgRevenuePerUser = totalConversions > 0 
      ? totalRevenue / totalConversions 
      : 0

    // Calculate growth rate (compare first and last period)
    const growthRate = metrics.length >= 2
      ? ((metrics[metrics.length - 1].revenue.toNumber() - metrics[0].revenue.toNumber()) / metrics[0].revenue.toNumber()) * 100
      : 0

    return {
      totalRevenue,
      totalVisitors,
      totalConversions,
      avgBounceRate,
      avgSessionDuration,
      totalSubscriptions,
      churnRate,
      avgRevenuePerUser,
      growthRate
    }
  }

  /**
   * Get metrics for all businesses for a specific date
   */
  static async getAllBusinessMetricsForDate(date: Date): Promise<MetricWithBusiness[]> {
    return prisma.businessMetric.findMany({
      where: { date },
      include: {
        business: {
          select: { id: true, name: true, status: true }
        }
      },
      orderBy: { revenue: 'desc' }
    })
  }

  /**
   * Get top performing businesses by revenue
   */
  static async getTopPerformingBusinesses(
    days: number = 30, 
    limit: number = 10
  ): Promise<Array<{ businessId: string; businessName: string; totalRevenue: number; totalVisitors: number }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const result = await prisma.businessMetric.groupBy({
      by: ['businessId'],
      where: {
        date: {
          gte: startDate
        }
      },
      _sum: {
        revenue: true,
        visitors: true
      },
      orderBy: {
        _sum: {
          revenue: 'desc'
        }
      },
      take: limit
    })

    // Get business names
    const businessData = await Promise.all(
      result.map(async (item) => {
        const business = await prisma.business.findUnique({
          where: { id: item.businessId },
          select: { name: true }
        })
        
        return {
          businessId: item.businessId,
          businessName: business?.name || 'Unknown',
          totalRevenue: item._sum.revenue?.toNumber() || 0,
          totalVisitors: item._sum.visitors || 0
        }
      })
    )

    return businessData
  }

  /**
   * Calculate performance for automated decision making (2-week analysis)
   */
  static async calculatePerformanceScore(businessId: string): Promise<{
    score: number
    metrics: {
      revenueGrowth: number
      conversionRate: number
      visitorGrowth: number
      profitability: number
    }
    recommendation: 'SCALE' | 'PAUSE' | 'CONTINUE'
  }> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 14) // 2 weeks

    const metrics = await this.findByBusinessIdAndDateRange(businessId, startDate, endDate)
    
    if (metrics.length < 7) { // Need at least 1 week of data
      return {
        score: 0,
        metrics: { revenueGrowth: 0, conversionRate: 0, visitorGrowth: 0, profitability: 0 },
        recommendation: 'CONTINUE'
      }
    }

    // Split into two weeks for comparison
    const midPoint = Math.floor(metrics.length / 2)
    const firstWeek = metrics.slice(0, midPoint)
    const secondWeek = metrics.slice(midPoint)

    const firstWeekRevenue = firstWeek.reduce((sum, m) => sum + m.revenue.toNumber(), 0)
    const secondWeekRevenue = secondWeek.reduce((sum, m) => sum + m.revenue.toNumber(), 0)
    const revenueGrowth = firstWeekRevenue > 0 ? ((secondWeekRevenue - firstWeekRevenue) / firstWeekRevenue) * 100 : 0

    const firstWeekVisitors = firstWeek.reduce((sum, m) => sum + m.visitors, 0)
    const secondWeekVisitors = secondWeek.reduce((sum, m) => sum + m.visitors, 0)
    const visitorGrowth = firstWeekVisitors > 0 ? ((secondWeekVisitors - firstWeekVisitors) / firstWeekVisitors) * 100 : 0

    const totalVisitors = metrics.reduce((sum, m) => sum + m.visitors, 0)
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0)
    const totalSpent = metrics.reduce((sum, m) => sum + m.totalSpent.toNumber(), 0)
    const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue.toNumber(), 0)

    const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0
    const profitability = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0

    // Calculate overall score (0-100)
    const score = Math.min(100, Math.max(0, 
      (revenueGrowth * 0.4) + 
      (conversionRate * 0.3) + 
      (visitorGrowth * 0.2) + 
      (profitability * 0.1)
    ))

    let recommendation: 'SCALE' | 'PAUSE' | 'CONTINUE'
    if (score >= 70 && revenueGrowth > 20) {
      recommendation = 'SCALE'
    } else if (score < 30 || (revenueGrowth < -20 && profitability < 0)) {
      recommendation = 'PAUSE'
    } else {
      recommendation = 'CONTINUE'
    }

    return {
      score,
      metrics: { revenueGrowth, conversionRate, visitorGrowth, profitability },
      recommendation
    }
  }
}