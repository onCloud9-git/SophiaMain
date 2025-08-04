import { google } from 'googleapis';
import { BusinessService } from './business.service';
import { businessService } from './business.service';

export interface AnalyticsData {
  date: string;
  activeUsers: number;
  conversions: number;
  totalRevenue: number;
  bounceRate: number;
  sessionDuration: number;
  pageViews: number;
}

export interface TrackingCode {
  trackingId: string;
  gtmCode: string;
  propertyId: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface AnalyticsIntegration {
  setupTracking(businessId: string, websiteUrl: string): Promise<TrackingCode>;
  getMetrics(propertyId: string, dateRange: DateRange): Promise<AnalyticsData[]>;
  createCustomDashboard(businessId: string): Promise<{ dashboardUrl: string }>;
  aggregateMetrics(businessId: string, days: number): Promise<AnalyticsData>;
}

export class GoogleAnalyticsService implements AnalyticsIntegration {
  private analytics = google.analytics('v3');
  private analyticsAdmin = google.analyticsadmin('v1alpha');
  private analyticsData = google.analyticsdata('v1beta');
  
  constructor() {
    // Initialize Google APIs credentials
    const credentials = {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
    };

    if (credentials.client_email && credentials.private_key) {
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/analytics',
          'https://www.googleapis.com/auth/analytics.edit',
          'https://www.googleapis.com/auth/analytics.manage.users',
          'https://www.googleapis.com/auth/analytics.readonly'
        ]
      });
      
      google.options({ auth });
    }
  }

  /**
   * Setup Google Analytics tracking for a new business
   */
  async setupTracking(businessId: string, websiteUrl: string): Promise<TrackingCode> {
    try {
      const business = await businessService.getById(businessId);
      if (!business) {
        throw new Error(`Business not found: ${businessId}`);
      }

      // Create GA4 property
      const property = await this.analyticsAdmin.properties.create({
        requestBody: {
          displayName: business.name,
          timeZone: 'Europe/Warsaw',
          currencyCode: 'PLN',
          industryCategory: 'TECHNOLOGY'
        }
      });

      const propertyId = property.data.name?.split('/')[1];
      if (!propertyId) {
        throw new Error('Failed to create Analytics property');
      }

      // Create data stream
      const dataStream = await this.analyticsAdmin.properties.dataStreams.create({
        parent: property.data.name!,
        requestBody: {
          type: 'WEB_DATA_STREAM',
          displayName: `${business.name} - Web Stream`,
          webStreamData: {
            defaultUri: websiteUrl,
            measurementId: undefined // Will be auto-generated
          }
        }
      });

      const measurementId = dataStream.data.webStreamData?.measurementId;
      if (!measurementId) {
        throw new Error('Failed to create data stream');
      }

      // Update business with Analytics info
      await businessService.updateAnalyticsInfo(businessId, {
        analyticsPropertyId: propertyId,
        analyticsMeasurementId: measurementId,
        analyticsStreamId: dataStream.data.name?.split('/')[3]
      });

      return {
        trackingId: measurementId,
        gtmCode: this.generateGTMCode(measurementId),
        propertyId: propertyId
      };

    } catch (error) {
      console.error('Error setting up Analytics tracking:', error);
      throw new Error(`Failed to setup Analytics tracking: ${error.message}`);
    }
  }

  /**
   * Get analytics metrics for a specific property and date range
   */
  async getMetrics(propertyId: string, dateRange: DateRange): Promise<AnalyticsData[]> {
    try {
      const response = await this.analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ 
            startDate: dateRange.start, 
            endDate: dateRange.end 
          }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'conversions' },
            { name: 'totalRevenue' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'screenPageViews' }
          ],
          dimensions: [{ name: 'date' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }]
        }
      });

      if (!response.data.rows) {
        return [];
      }

      return response.data.rows.map(row => ({
        date: row.dimensionValues?.[0]?.value || '',
        activeUsers: parseInt(row.metricValues?.[0]?.value || '0'),
        conversions: parseInt(row.metricValues?.[1]?.value || '0'),
        totalRevenue: parseFloat(row.metricValues?.[2]?.value || '0'),
        bounceRate: parseFloat(row.metricValues?.[3]?.value || '0'),
        sessionDuration: parseFloat(row.metricValues?.[4]?.value || '0'),
        pageViews: parseInt(row.metricValues?.[5]?.value || '0')
      }));

    } catch (error) {
      console.error('Error fetching Analytics metrics:', error);
      throw new Error(`Failed to fetch Analytics metrics: ${error.message}`);
    }
  }

  /**
   * Create custom dashboard for business analytics
   */
  async createCustomDashboard(businessId: string): Promise<{ dashboardUrl: string }> {
    try {
      const business = await businessService.getById(businessId);
      if (!business?.analyticsPropertyId) {
        throw new Error('Business does not have Analytics setup');
      }

      // For now, return the standard GA4 dashboard URL
      // In production, you might create custom dashboards using GA4 Dashboard API
      const dashboardUrl = `https://analytics.google.com/analytics/web/#/realtime/rt-overview/a/properties/${business.analyticsPropertyId}`;

      return { dashboardUrl };

    } catch (error) {
      console.error('Error creating custom dashboard:', error);
      throw new Error(`Failed to create custom dashboard: ${error.message}`);
    }
  }

  /**
   * Aggregate metrics for a business over specified number of days
   */
  async aggregateMetrics(businessId: string, days: number = 30): Promise<AnalyticsData> {
    try {
      const business = await businessService.getById(businessId);
      if (!business?.analyticsPropertyId) {
        throw new Error('Business does not have Analytics setup');
      }

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const metrics = await this.getMetrics(business.analyticsPropertyId, {
        start: startDate,
        end: endDate
      });

      // Aggregate the data
      const aggregated = metrics.reduce(
        (acc, metric) => ({
          date: `${startDate}_${endDate}`,
          activeUsers: acc.activeUsers + metric.activeUsers,
          conversions: acc.conversions + metric.conversions,
          totalRevenue: acc.totalRevenue + metric.totalRevenue,
          bounceRate: acc.bounceRate + metric.bounceRate,
          sessionDuration: acc.sessionDuration + metric.sessionDuration,
          pageViews: acc.pageViews + metric.pageViews
        }),
        {
          date: '',
          activeUsers: 0,
          conversions: 0,
          totalRevenue: 0,
          bounceRate: 0,
          sessionDuration: 0,
          pageViews: 0
        }
      );

      // Calculate averages for rate-based metrics
      if (metrics.length > 0) {
        aggregated.bounceRate = aggregated.bounceRate / metrics.length;
        aggregated.sessionDuration = aggregated.sessionDuration / metrics.length;
      }

      return aggregated;

    } catch (error) {
      console.error('Error aggregating metrics:', error);
      throw new Error(`Failed to aggregate metrics: ${error.message}`);
    }
  }

  /**
   * Generate GTM (Google Tag Manager) code snippet
   */
  private generateGTMCode(measurementId: string): string {
    return `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
</script>
    `.trim();
  }

  /**
   * Track custom conversion events
   */
  async trackConversion(businessId: string, eventName: string, value?: number): Promise<void> {
    try {
      // In a real implementation, this would send events to GA4
      // For now, we'll log the conversion for tracking
      console.log(`Conversion tracked for business ${businessId}: ${eventName}`, { value });
      
      // You could also store this in the database for internal tracking
      await businessService.logConversion(businessId, eventName, value);

    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  /**
   * Get real-time analytics data
   */
  async getRealTimeMetrics(propertyId: string): Promise<{ activeUsers: number }> {
    try {
      const response = await this.analyticsData.properties.runRealtimeReport({
        property: `properties/${propertyId}`,
        requestBody: {
          metrics: [{ name: 'activeUsers' }]
        }
      });

      const activeUsers = parseInt(response.data.rows?.[0]?.metricValues?.[0]?.value || '0');
      return { activeUsers };

    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      return { activeUsers: 0 };
    }
  }

  /**
   * Compare metrics between two periods (trend analysis)
   */
  async comparePeriodsAnalysis(
    businessId: string,
    currentPeriod: DateRange,
    previousPeriod: DateRange
  ): Promise<{
    currentPeriod: AnalyticsData;
    previousPeriod: AnalyticsData;
    trends: {
      activeUsersChange: number;
      conversionsChange: number;
      revenueChange: number;
      bounceRateChange: number;
      pageViewsChange: number;
    };
    insights: string[];
  }> {
    try {
      const business = await businessService.getById(businessId);
      if (!business?.analyticsPropertyId) {
        throw new Error('Business does not have Analytics setup');
      }

      // Get metrics for both periods
      const [currentMetrics, previousMetrics] = await Promise.all([
        this.aggregateMetrics(businessId, this.calculateDaysBetween(currentPeriod.start, currentPeriod.end)),
        this.aggregateMetrics(businessId, this.calculateDaysBetween(previousPeriod.start, previousPeriod.end))
      ]);

      // Calculate percentage changes
      const trends = {
        activeUsersChange: this.calculatePercentageChange(
          previousMetrics.activeUsers, 
          currentMetrics.activeUsers
        ),
        conversionsChange: this.calculatePercentageChange(
          previousMetrics.conversions, 
          currentMetrics.conversions
        ),
        revenueChange: this.calculatePercentageChange(
          previousMetrics.totalRevenue, 
          currentMetrics.totalRevenue
        ),
        bounceRateChange: this.calculatePercentageChange(
          previousMetrics.bounceRate, 
          currentMetrics.bounceRate
        ),
        pageViewsChange: this.calculatePercentageChange(
          previousMetrics.pageViews, 
          currentMetrics.pageViews
        )
      };

      // Generate insights based on trends
      const insights = this.generateTrendInsights(trends, currentMetrics, previousMetrics);

      return {
        currentPeriod: currentMetrics,
        previousPeriod: previousMetrics,
        trends,
        insights
      };

    } catch (error) {
      console.error('Error comparing periods:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive business performance insights
   */
  async getBusinessInsights(businessId: string, days: number = 30): Promise<{
    performanceScore: number;
    keyMetrics: {
      metric: string;
      value: number;
      trend: 'up' | 'down' | 'stable';
      benchmark: string;
    }[];
    recommendations: {
      priority: 'high' | 'medium' | 'low';
      category: string;
      title: string;
      description: string;
      expectedImpact: string;
    }[];
    predictions: {
      metric: string;
      predicted30Days: number;
      confidence: number;
    }[];
  }> {
    try {
      const business = await businessService.getById(businessId);
      if (!business?.analyticsPropertyId) {
        throw new Error('Business does not have Analytics setup');
      }

      // Get current and previous period data
      const currentMetrics = await this.aggregateMetrics(businessId, days);
      const previousMetrics = await this.aggregateMetrics(businessId, days * 2); // Double period for comparison

      // Calculate performance score (0-100)
      const performanceScore = this.calculatePerformanceScore(currentMetrics);

      // Analyze key metrics with trends
      const keyMetrics = [
        {
          metric: 'Active Users',
          value: currentMetrics.activeUsers,
          trend: this.determineTrend(currentMetrics.activeUsers, previousMetrics.activeUsers),
          benchmark: this.getBenchmark('activeUsers', currentMetrics.activeUsers)
        },
        {
          metric: 'Conversion Rate',
          value: currentMetrics.activeUsers > 0 
            ? (currentMetrics.conversions / currentMetrics.activeUsers) * 100
            : 0,
          trend: this.determineTrend(
            currentMetrics.conversions / Math.max(currentMetrics.activeUsers, 1),
            previousMetrics.conversions / Math.max(previousMetrics.activeUsers, 1)
          ),
          benchmark: this.getBenchmark('conversionRate', currentMetrics.conversions / Math.max(currentMetrics.activeUsers, 1))
        },
        {
          metric: 'Revenue',
          value: currentMetrics.totalRevenue,
          trend: this.determineTrend(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
          benchmark: this.getBenchmark('revenue', currentMetrics.totalRevenue)
        },
        {
          metric: 'Bounce Rate',
          value: currentMetrics.bounceRate,
          trend: this.determineTrend(previousMetrics.bounceRate, currentMetrics.bounceRate), // Reversed: lower is better
          benchmark: this.getBenchmark('bounceRate', currentMetrics.bounceRate)
        }
      ];

      // Generate recommendations
      const recommendations = this.generateRecommendations(currentMetrics, keyMetrics);

      // Generate predictions
      const predictions = this.generatePredictions(currentMetrics, previousMetrics);

      return {
        performanceScore,
        keyMetrics,
        recommendations,
        predictions
      };

    } catch (error) {
      console.error('Error generating business insights:', error);
      throw error;
    }
  }

  /**
   * Get trend analysis for specific metrics over time
   */
  async getTrendAnalysis(
    businessId: string,
    metric: string,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    strength: number; // 0-1, how strong the trend is
    data: { date: string; value: number }[];
    seasonality: {
      detected: boolean;
      pattern: string;
    };
    forecast: {
      nextPeriod: number;
      confidence: number;
    };
  }> {
    try {
      const business = await businessService.getById(businessId);
      if (!business?.analyticsPropertyId) {
        throw new Error('Business does not have Analytics setup');
      }

      const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      // Get detailed daily metrics
      const metrics = await this.getMetrics(business.analyticsPropertyId, {
        start: startDate,
        end: endDate
      });

      // Extract the specific metric data
      const data = metrics.map(m => ({
        date: m.date,
        value: this.extractMetricValue(m, metric)
      }));

      // Analyze trend
      const trend = this.analyzeTrend(data);
      const seasonality = this.detectSeasonality(data);
      const forecast = this.forecastNextPeriod(data);

      return {
        trend: trend.direction,
        strength: trend.strength,
        data,
        seasonality,
        forecast
      };

    } catch (error) {
      console.error('Error analyzing trend:', error);
      throw error;
    }
  }

  // Helper methods for data analysis

  private calculateDaysBetween(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  private generateTrendInsights(
    trends: any,
    current: AnalyticsData,
    previous: AnalyticsData
  ): string[] {
    const insights: string[] = [];

    if (trends.activeUsersChange > 20) {
      insights.push(`Active users increased by ${trends.activeUsersChange.toFixed(1)}% - strong growth momentum`);
    } else if (trends.activeUsersChange < -20) {
      insights.push(`Active users decreased by ${Math.abs(trends.activeUsersChange).toFixed(1)}% - attention needed`);
    }

    if (trends.conversionsChange > 15) {
      insights.push(`Conversions improved by ${trends.conversionsChange.toFixed(1)}% - effective optimization`);
    }

    if (trends.revenueChange > 25) {
      insights.push(`Revenue grew by ${trends.revenueChange.toFixed(1)}% - excellent financial performance`);
    }

    if (current.bounceRate > 70) {
      insights.push(`High bounce rate (${current.bounceRate.toFixed(1)}%) indicates user experience issues`);
    }

    return insights;
  }

  private calculatePerformanceScore(metrics: AnalyticsData): number {
    let score = 0;

    // Active users score (0-25 points)
    if (metrics.activeUsers > 1000) score += 25;
    else if (metrics.activeUsers > 500) score += 20;
    else if (metrics.activeUsers > 100) score += 15;
    else if (metrics.activeUsers > 50) score += 10;
    else score += 5;

    // Conversion rate score (0-25 points)
    const conversionRate = metrics.activeUsers > 0 ? (metrics.conversions / metrics.activeUsers) * 100 : 0;
    if (conversionRate > 5) score += 25;
    else if (conversionRate > 3) score += 20;
    else if (conversionRate > 2) score += 15;
    else if (conversionRate > 1) score += 10;
    else score += 5;

    // Bounce rate score (0-25 points)
    if (metrics.bounceRate < 30) score += 25;
    else if (metrics.bounceRate < 50) score += 20;
    else if (metrics.bounceRate < 60) score += 15;
    else if (metrics.bounceRate < 70) score += 10;
    else score += 5;

    // Revenue score (0-25 points)
    if (metrics.totalRevenue > 10000) score += 25;
    else if (metrics.totalRevenue > 5000) score += 20;
    else if (metrics.totalRevenue > 1000) score += 15;
    else if (metrics.totalRevenue > 500) score += 10;
    else score += 5;

    return Math.min(score, 100);
  }

  private determineTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    const change = this.calculatePercentageChange(previous, current);
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  private getBenchmark(metric: string, value: number): string {
    const benchmarks = {
      activeUsers: ['Low: <100', 'Average: 100-1000', 'High: >1000'],
      conversionRate: ['Low: <1%', 'Average: 1-3%', 'High: >3%'],
      revenue: ['Low: <$1000', 'Average: $1000-$10000', 'High: >$10000'],
      bounceRate: ['Excellent: <30%', 'Good: 30-50%', 'Poor: >50%']
    };

    // Simple benchmark logic - could be more sophisticated
    const ranges = benchmarks[metric as keyof typeof benchmarks];
    if (!ranges) return 'No benchmark available';

    if (metric === 'bounceRate') {
      return value < 30 ? ranges[0] : value < 50 ? ranges[1] : ranges[2];
    } else if (metric === 'conversionRate') {
      const rate = value * 100;
      return rate < 1 ? ranges[0] : rate < 3 ? ranges[1] : ranges[2];
    } else {
      return value < 100 ? ranges[0] : value < 1000 ? ranges[1] : ranges[2];
    }
  }

  private generateRecommendations(metrics: AnalyticsData, keyMetrics: any[]): any[] {
    const recommendations: any[] = [];

    // High bounce rate recommendation
    if (metrics.bounceRate > 60) {
      recommendations.push({
        priority: 'high' as const,
        category: 'User Experience',
        title: 'Reduce Bounce Rate',
        description: 'Your bounce rate is high. Improve page load speed, content relevance, and user experience.',
        expectedImpact: '+15-25% user engagement'
      });
    }

    // Low conversion rate recommendation
    const conversionRate = metrics.activeUsers > 0 ? (metrics.conversions / metrics.activeUsers) * 100 : 0;
    if (conversionRate < 1) {
      recommendations.push({
        priority: 'high' as const,
        category: 'Conversion Optimization',
        title: 'Improve Conversion Funnel',
        description: 'Low conversion rate detected. Optimize your call-to-action buttons and checkout process.',
        expectedImpact: '+50-100% conversions'
      });
    }

    // Low traffic recommendation
    if (metrics.activeUsers < 100) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'Traffic Growth',
        title: 'Increase Marketing Efforts',
        description: 'Low traffic volume. Consider increasing marketing spend or improving SEO.',
        expectedImpact: '+200-500% traffic'
      });
    }

    return recommendations;
  }

  private generatePredictions(current: AnalyticsData, previous: AnalyticsData): any[] {
    const predictions: any[] = [];

    // Simple linear prediction based on growth rate
    const userGrowthRate = this.calculatePercentageChange(previous.activeUsers, current.activeUsers) / 100;
    const revenueGrowthRate = this.calculatePercentageChange(previous.totalRevenue, current.totalRevenue) / 100;

    predictions.push({
      metric: 'Active Users',
      predicted30Days: Math.round(current.activeUsers * (1 + userGrowthRate)),
      confidence: Math.min(Math.max(0.5, 1 - Math.abs(userGrowthRate)), 0.95)
    });

    predictions.push({
      metric: 'Revenue',
      predicted30Days: Math.round(current.totalRevenue * (1 + revenueGrowthRate)),
      confidence: Math.min(Math.max(0.5, 1 - Math.abs(revenueGrowthRate)), 0.95)
    });

    return predictions;
  }

  private extractMetricValue(metric: AnalyticsData, metricName: string): number {
    switch (metricName) {
      case 'activeUsers': return metric.activeUsers;
      case 'conversions': return metric.conversions;
      case 'revenue': return metric.totalRevenue;
      case 'bounceRate': return metric.bounceRate;
      case 'pageViews': return metric.pageViews;
      default: return 0;
    }
  }

  private analyzeTrend(data: { date: string; value: number }[]): {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    strength: number;
  } {
    if (data.length < 2) return { direction: 'stable', strength: 0 };

    // Simple linear regression
    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, d) => sum + d.value, 0);
    const sumXY = data.reduce((sum, d, i) => sum + i * d.value, 0);
    const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgY = sumY / n;

    // Calculate volatility
    const variance = data.reduce((sum, d) => sum + Math.pow(d.value - avgY, 2), 0) / n;
    const volatility = Math.sqrt(variance) / avgY;

    if (volatility > 0.5) return { direction: 'volatile', strength: volatility };

    const direction = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';
    const strength = Math.min(Math.abs(slope) / avgY, 1);

    return { direction, strength };
  }

  private detectSeasonality(data: { date: string; value: number }[]): {
    detected: boolean;
    pattern: string;
  } {
    // Simple seasonality detection - could be more sophisticated
    if (data.length < 14) return { detected: false, pattern: 'Insufficient data' };

    // Check for weekly patterns (assuming daily data)
    const weeklyPattern = this.checkWeeklyPattern(data);
    
    return {
      detected: weeklyPattern.detected,
      pattern: weeklyPattern.pattern
    };
  }

  private checkWeeklyPattern(data: { date: string; value: number }[]): {
    detected: boolean;
    pattern: string;
  } {
    // Group by day of week and check for patterns
    const dayGroups: { [key: number]: number[] } = {};
    
    data.forEach(d => {
      const dayOfWeek = new Date(d.date).getDay();
      if (!dayGroups[dayOfWeek]) dayGroups[dayOfWeek] = [];
      dayGroups[dayOfWeek].push(d.value);
    });

    // Calculate average for each day
    const dayAverages = Object.keys(dayGroups).map(day => {
      const values = dayGroups[parseInt(day)];
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    });

    // Check if there's significant variation between days
    const maxAvg = Math.max(...dayAverages);
    const minAvg = Math.min(...dayAverages);
    const variation = (maxAvg - minAvg) / minAvg;

    return {
      detected: variation > 0.3,
      pattern: variation > 0.3 ? 'Weekly seasonality detected' : 'No clear weekly pattern'
    };
  }

  private forecastNextPeriod(data: { date: string; value: number }[]): {
    nextPeriod: number;
    confidence: number;
  } {
    if (data.length < 3) return { nextPeriod: 0, confidence: 0 };

    // Simple moving average prediction
    const recent = data.slice(-3);
    const avgRecent = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    
    // Calculate confidence based on stability of recent data
    const variance = recent.reduce((sum, d) => sum + Math.pow(d.value - avgRecent, 2), 0) / recent.length;
    const confidence = Math.max(0.3, 1 - (Math.sqrt(variance) / avgRecent));

    return {
      nextPeriod: Math.round(avgRecent),
      confidence: Math.min(confidence, 0.9)
    };
  }
}

// Create singleton instance
export const analyticsService = new GoogleAnalyticsService();