import { logger } from '../index'
import { NotificationPayload, MarketingDecision } from '../jobs/processors/marketing-automation.processor'

export interface EmailConfig {
  from: string
  to: string[]
  subject: string
  html: string
  priority?: 'low' | 'normal' | 'high'
}

export interface SlackConfig {
  webhook: string
  channel?: string
  username?: string
  iconEmoji?: string
}

export interface WebhookConfig {
  url: string
  method: 'POST' | 'PUT'
  headers?: Record<string, string>
  timeout?: number
}

/**
 * Notification Service for Sophia AI Marketing Automation
 * Handles email, Slack, and webhook notifications for marketing decisions
 */
export class NotificationService {
  
  /**
   * Send marketing automation notification
   */
  async sendMarketingNotification(notification: NotificationPayload): Promise<void> {
    try {
      logger.info(`Sending ${notification.type} notification for ${notification.businessName}`, {
        priority: notification.priority,
        decision: notification.decision.decision
      })
      
      // Generate notification content
      const content = this.generateNotificationContent(notification)
      
      // Send based on notification type and priority
      const promises = []
      
      // Always log high/critical priority notifications
      if (notification.priority === 'high' || notification.priority === 'critical') {
        logger.warn(`🚨 High Priority Marketing Decision: ${content.subject}`, content)
      }
      
      // Send email notification (placeholder)
      if (process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true') {
        promises.push(this.sendEmailNotification(content.email))
      }
      
      // Send Slack notification (placeholder)
      if (process.env.SLACK_NOTIFICATIONS_ENABLED === 'true') {
        promises.push(this.sendSlackNotification(content.slack))
      }
      
      // Send webhook notification (placeholder)
      if (process.env.WEBHOOK_NOTIFICATIONS_ENABLED === 'true' && process.env.NOTIFICATION_WEBHOOK_URL) {
        promises.push(this.sendWebhookNotification(notification, {
          url: process.env.NOTIFICATION_WEBHOOK_URL,
          method: 'POST'
        }))
      }
      
      await Promise.allSettled(promises)
      logger.info(`Notification sent successfully for ${notification.businessName}`)
      
    } catch (error) {
      logger.error('Failed to send marketing notification:', error)
      throw error
    }
  }
  
  /**
   * Send batch notifications for multiple decisions
   */
  async sendBatchNotifications(notifications: NotificationPayload[]): Promise<void> {
    const highPriorityNotifications = notifications.filter(n => 
      n.priority === 'high' || n.priority === 'critical'
    )
    
    if (highPriorityNotifications.length === 0) {
      logger.info('No high-priority notifications to send')
      return
    }
    
    logger.info(`Sending batch notifications for ${highPriorityNotifications.length} high-priority decisions`)
    
    for (const notification of highPriorityNotifications) {
      try {
        await this.sendMarketingNotification(notification)
      } catch (error) {
        logger.error(`Failed to send notification for ${notification.businessName}:`, error)
        // Continue with other notifications
      }
    }
  }
  
  /**
   * Generate notification content based on marketing decision
   */
  private generateNotificationContent(notification: NotificationPayload): {
    subject: string
    email: EmailConfig
    slack: any
  } {
    const decision = notification.decision
    const emoji = this.getDecisionEmoji(decision.decision)
    const subject = `${emoji} Sophia AI: ${decision.decision} decision for ${decision.businessName}`
    
    const emailHtml = this.generateEmailTemplate(notification)
    const slackBlocks = this.generateSlackBlocks(notification)
    
    return {
      subject,
      email: {
        from: process.env.NOTIFICATION_EMAIL_FROM || 'sophia@sophiaai.com',
        to: process.env.NOTIFICATION_EMAIL_TO?.split(',') || ['admin@company.com'],
        subject,
        html: emailHtml,
        priority: notification.priority === 'critical' ? 'high' : 'normal'
      },
      slack: {
        text: subject,
        blocks: slackBlocks,
        username: 'Sophia AI',
        icon_emoji: ':robot_face:'
      }
    }
  }
  
  /**
   * Generate email template for marketing decision
   */
  private generateEmailTemplate(notification: NotificationPayload): string {
    const decision = notification.decision
    const emoji = this.getDecisionEmoji(decision.decision)
    const color = this.getDecisionColor(decision.decision)
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Sophia AI Marketing Decision</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; }
            .content { padding: 24px; }
            .decision-badge { display: inline-block; padding: 8px 16px; border-radius: 24px; font-weight: 600; margin: 12px 0; }
            .metrics { background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0; }
            .metric-item { display: flex; justify-content: space-between; margin: 8px 0; }
            .campaigns { margin: 16px 0; }
            .campaign-item { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 12px; margin: 8px 0; }
            .reasons { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .footer { text-align: center; padding: 16px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${emoji} Sophia AI Marketing Decision</h1>
                <p>Automated marketing analysis and optimization</p>
            </div>
            <div class="content">
                <div class="decision-badge" style="background-color: ${color}; color: white;">
                    ${decision.decision} - ${decision.businessName}
                </div>
                
                <p><strong>Confidence:</strong> ${(decision.confidence * 100).toFixed(1)}%</p>
                <p><strong>Analysis Date:</strong> ${notification.timestamp.toLocaleDateString()}</p>
                
                <div class="reasons">
                    <h3>📊 Decision Reasoning</h3>
                    <ul>
                        ${decision.reasons.map(reason => `<li>${reason}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="campaigns">
                    <h3>📈 Campaign Analysis (${decision.campaigns.length} campaigns)</h3>
                    ${decision.campaigns.map(campaign => `
                        <div class="campaign-item">
                            <h4>${campaign.campaignName} (${campaign.platform})</h4>
                            <p><strong>Action:</strong> ${campaign.action}</p>
                            <div class="metrics">
                                <div class="metric-item">
                                    <span>Performance Score:</span>
                                    <span><strong>${campaign.performanceMetrics.score}/100</strong></span>
                                </div>
                                <div class="metric-item">
                                    <span>ROAS:</span>
                                    <span><strong>${campaign.performanceMetrics.roas.toFixed(2)}</strong></span>
                                </div>
                                <div class="metric-item">
                                    <span>CTR:</span>
                                    <span><strong>${campaign.performanceMetrics.ctr.toFixed(2)}%</strong></span>
                                </div>
                                <div class="metric-item">
                                    <span>Conversions:</span>
                                    <span><strong>${campaign.performanceMetrics.conversions}</strong></span>
                                </div>
                            </div>
                            ${campaign.budgetChange ? `<p><strong>Budget Change:</strong> ${((campaign.budgetChange - 1) * 100).toFixed(0)}%</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                
                <p><strong>Next Evaluation:</strong> ${decision.nextEvaluationDate.toLocaleDateString()}</p>
            </div>
            <div class="footer">
                <p>This is an automated message from Sophia AI Marketing Automation System</p>
                <p>Business ID: ${decision.businessId}</p>
            </div>
        </div>
    </body>
    </html>
    `
  }
  
  /**
   * Generate Slack blocks for marketing decision
   */
  private generateSlackBlocks(notification: NotificationPayload): any[] {
    const decision = notification.decision
    const emoji = this.getDecisionEmoji(decision.decision)
    const color = this.getDecisionColor(decision.decision)
    
    return [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} Sophia AI Marketing Decision`
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Business:*\n${decision.businessName}`
          },
          {
            type: "mrkdwn",
            text: `*Decision:*\n${decision.decision}`
          },
          {
            type: "mrkdwn",
            text: `*Confidence:*\n${(decision.confidence * 100).toFixed(1)}%`
          },
          {
            type: "mrkdwn",
            text: `*Campaigns:*\n${decision.campaigns.length} analyzed`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Reasoning:*\n${decision.reasons.map(r => `• ${r}`).join('\n')}`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Business ID: ${decision.businessId} | ${notification.timestamp.toLocaleString()}`
          }
        ]
      }
    ]
  }
  
  /**
   * Send email notification (placeholder)
   */
  private async sendEmailNotification(config: EmailConfig): Promise<void> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    logger.info(`📧 Email notification would be sent to ${config.to.join(', ')}`, {
      subject: config.subject,
      priority: config.priority
    })
    
    // Placeholder for email integration
    // Example using nodemailer:
    /*
    const transporter = nodemailer.createTransporter({
      // SMTP configuration
    })
    
    await transporter.sendMail({
      from: config.from,
      to: config.to.join(','),
      subject: config.subject,
      html: config.html
    })
    */
  }
  
  /**
   * Send Slack notification (placeholder)
   */
  private async sendSlackNotification(config: any): Promise<void> {
    // TODO: Integrate with Slack API
    logger.info(`💬 Slack notification would be sent`, {
      text: config.text,
      blocks: config.blocks.length
    })
    
    // Placeholder for Slack integration
    // Example using @slack/web-api:
    /*
    const slack = new WebClient(process.env.SLACK_BOT_TOKEN)
    
    await slack.chat.postMessage({
      channel: process.env.SLACK_CHANNEL,
      text: config.text,
      blocks: config.blocks,
      username: config.username,
      icon_emoji: config.icon_emoji
    })
    */
  }
  
  /**
   * Send webhook notification (placeholder)
   */
  private async sendWebhookNotification(notification: NotificationPayload, config: WebhookConfig): Promise<void> {
    // TODO: Integrate with webhook service
    logger.info(`🔗 Webhook notification would be sent to ${config.url}`, {
      business: notification.businessName,
      decision: notification.decision.decision
    })
    
    // Placeholder for webhook integration
    // Example using fetch:
    /*
    const response = await fetch(config.url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify({
        type: notification.type,
        businessId: notification.businessId,
        businessName: notification.businessName,
        decision: notification.decision,
        timestamp: notification.timestamp,
        priority: notification.priority
      })
    })
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
    }
    */
  }
  
  // Helper methods
  
  private getDecisionEmoji(decision: string): string {
    const emojiMap: Record<string, string> = {
      'SCALE': '🚀',
      'PAUSE': '⏸️',
      'OPTIMIZE': '🎯',
      'MAINTAIN': '📊',
      'CLOSE': '🚫'
    }
    return emojiMap[decision] || '🤖'
  }
  
  private getDecisionColor(decision: string): string {
    const colorMap: Record<string, string> = {
      'SCALE': '#28a745',     // green
      'PAUSE': '#ffc107',     // yellow
      'OPTIMIZE': '#17a2b8',  // blue
      'MAINTAIN': '#6c757d',  // gray
      'CLOSE': '#dc3545'      // red
    }
    return colorMap[decision] || '#6f42c1'
  }
}

// Export singleton instance
export const notificationService = new NotificationService()