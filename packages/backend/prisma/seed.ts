import { PrismaClient, BusinessStatus, CampaignPlatform, CampaignStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...')
    await prisma.businessMetric.deleteMany()
    await prisma.deployment.deleteMany()
    await prisma.marketingCampaign.deleteMany()
    await prisma.business.deleteMany()
    await prisma.user.deleteMany()
  }

  // Create demo users
  console.log('👤 Creating demo users...')
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@sophia.ai',
      password: hashedPassword,
      name: 'Demo User',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    }
  })

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sophia.ai',
      password: hashedPassword,
      name: 'Admin User',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    }
  })

  // Create demo businesses
  console.log('🏢 Creating demo businesses...')
  
  const businesses = await Promise.all([
    prisma.business.create({
      data: {
        name: 'TaskFlow Pro',
        description: 'AI-powered task management for remote teams',
        industry: 'SaaS',
        status: 'ACTIVE' as BusinessStatus,
        monthlyPrice: 29.99,
        currency: 'USD',
        websiteUrl: 'https://taskflow-pro.vercel.app',
        landingPageUrl: 'https://taskflow-pro.vercel.app',
        analyticsId: 'G-XXXXXXXXXX',
        stripeProductId: 'prod_test_taskflow',
        stripePriceId: 'price_test_taskflow',
        initialBudget: 500,
        targetCPA: 50,
        ownerId: demoUser.id
      }
    }),
    
    prisma.business.create({
      data: {
        name: 'FitTracker AI',
        description: 'Personalized fitness tracking with AI coaching',
        industry: 'Health & Fitness',
        status: 'DEVELOPING' as BusinessStatus,
        monthlyPrice: 19.99,
        currency: 'USD',
        initialBudget: 300,
        targetCPA: 25,
        ownerId: demoUser.id
      }
    }),

    prisma.business.create({
      data: {
        name: 'LearnLab',
        description: 'Interactive online learning platform for kids',
        industry: 'Education',
        status: 'PAUSED' as BusinessStatus,
        monthlyPrice: 14.99,
        currency: 'USD',
        websiteUrl: 'https://learnlab-demo.vercel.app',
        initialBudget: 200,
        targetCPA: 15,
        ownerId: demoUser.id
      }
    }),

    prisma.business.create({
      data: {
        name: 'ShopSync',
        description: 'Multi-channel e-commerce inventory management',
        industry: 'E-commerce',
        status: 'ACTIVE' as BusinessStatus,
        monthlyPrice: 49.99,
        currency: 'USD',
        websiteUrl: 'https://shopsync-demo.vercel.app',
        landingPageUrl: 'https://shopsync-demo.vercel.app',
        analyticsId: 'G-YYYYYYYYYY',
        stripeProductId: 'prod_test_shopsync',
        stripePriceId: 'price_test_shopsync',
        initialBudget: 800,
        targetCPA: 75,
        ownerId: adminUser.id
      }
    })
  ])

  // Create marketing campaigns
  console.log('📢 Creating marketing campaigns...')
  
  const campaigns = []
  
  // TaskFlow Pro campaigns
  campaigns.push(
    await prisma.marketingCampaign.create({
      data: {
        name: 'TaskFlow Pro - Search Campaign',
        platform: 'GOOGLE_ADS' as CampaignPlatform,
        status: 'ACTIVE' as CampaignStatus,
        budget: 200,
        spent: 156.78,
        impressions: 12500,
        clicks: 485,
        conversions: 23,
        startDate: new Date('2024-01-15'),
        targetKeywords: ['task management', 'remote team tools', 'project tracking'],
        businessId: businesses[0].id,
        googleAdsId: 'gads_taskflow_001'
      }
    }),
    
    await prisma.marketingCampaign.create({
      data: {
        name: 'TaskFlow Pro - Facebook Campaign',
        platform: 'FACEBOOK_ADS' as CampaignPlatform,
        status: 'ACTIVE' as CampaignStatus,
        budget: 150,
        spent: 89.45,
        impressions: 8900,
        clicks: 234,
        conversions: 12,
        startDate: new Date('2024-01-20'),
        businessId: businesses[0].id,
        facebookId: 'fb_taskflow_001'
      }
    })
  )

  // ShopSync campaigns
  campaigns.push(
    await prisma.marketingCampaign.create({
      data: {
        name: 'ShopSync - E-commerce Search',
        platform: 'GOOGLE_ADS' as CampaignPlatform,
        status: 'ACTIVE' as CampaignStatus,
        budget: 300,
        spent: 267.32,
        impressions: 18700,
        clicks: 623,
        conversions: 31,
        startDate: new Date('2024-01-10'),
        targetKeywords: ['inventory management', 'e-commerce tools', 'multi-channel selling'],
        businessId: businesses[3].id,
        googleAdsId: 'gads_shopsync_001'
      }
    })
  )

  // Create deployments
  console.log('🚀 Creating deployments...')
  
  await Promise.all([
    prisma.deployment.create({
      data: {
        businessId: businesses[0].id,
        version: 'v1.2.3',
        status: 'COMPLETED',
        url: 'https://taskflow-pro.vercel.app',
        environment: 'production',
        commitHash: 'abc123def456',
        startedAt: new Date('2024-01-25T10:00:00Z'),
        completedAt: new Date('2024-01-25T10:15:00Z')
      }
    }),
    
    prisma.deployment.create({
      data: {
        businessId: businesses[1].id,
        version: 'v0.8.1',
        status: 'IN_PROGRESS',
        environment: 'staging',
        commitHash: 'def456ghi789',
        startedAt: new Date()
      }
    }),

    prisma.deployment.create({
      data: {
        businessId: businesses[3].id,
        version: 'v2.1.0',
        status: 'COMPLETED',
        url: 'https://shopsync-demo.vercel.app',
        environment: 'production',
        commitHash: 'ghi789jkl012',
        startedAt: new Date('2024-01-28T14:30:00Z'),
        completedAt: new Date('2024-01-28T14:45:00Z')
      }
    })
  ])

  // Create business metrics for the last 30 days
  console.log('📊 Creating business metrics...')
  
  const today = new Date()
  const metricsPromises = []

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // TaskFlow Pro metrics (growing business)
    metricsPromises.push(
      prisma.businessMetric.create({
        data: {
          businessId: businesses[0].id,
          date,
          visitors: Math.floor(100 + Math.random() * 50 + i * 2), // Growing trend
          conversions: Math.floor(5 + Math.random() * 8 + i * 0.2),
          revenue: 29.99 * (5 + Math.random() * 8 + i * 0.2),
          bounceRate: 0.3 + Math.random() * 0.2,
          sessionDuration: 180 + Math.random() * 120,
          pageViews: Math.floor(300 + Math.random() * 200),
          totalImpressions: Math.floor(400 + Math.random() * 200),
          totalClicks: Math.floor(15 + Math.random() * 10),
          totalSpent: 8 + Math.random() * 5,
          newSubscriptions: Math.floor(Math.random() * 3 + 1),
          cancelledSubscriptions: Math.floor(Math.random() * 2),
          activeSubscriptions: Math.floor(50 + i * 0.5)
        }
      })
    )

    // ShopSync metrics (stable business)
    metricsPromises.push(
      prisma.businessMetric.create({
        data: {
          businessId: businesses[3].id,
          date,
          visitors: Math.floor(150 + Math.random() * 75),
          conversions: Math.floor(8 + Math.random() * 6),
          revenue: 49.99 * (8 + Math.random() * 6),
          bounceRate: 0.25 + Math.random() * 0.15,
          sessionDuration: 240 + Math.random() * 180,
          pageViews: Math.floor(450 + Math.random() * 300),
          totalImpressions: Math.floor(600 + Math.random() * 300),
          totalClicks: Math.floor(20 + Math.random() * 15),
          totalSpent: 12 + Math.random() * 8,
          newSubscriptions: Math.floor(Math.random() * 4 + 2),
          cancelledSubscriptions: Math.floor(Math.random() * 2),
          activeSubscriptions: Math.floor(75 + i * 0.3)
        }
      })
    )

    // LearnLab metrics (declining/paused business)
    if (i > 15) { // Only data before it was paused
      metricsPromises.push(
        prisma.businessMetric.create({
          data: {
            businessId: businesses[2].id,
            date,
            visitors: Math.floor(80 - (29 - i) * 1.5 + Math.random() * 30),
            conversions: Math.floor(Math.max(1, 6 - (29 - i) * 0.3 + Math.random() * 3)),
            revenue: 14.99 * Math.max(1, 6 - (29 - i) * 0.3 + Math.random() * 3),
            bounceRate: 0.4 + Math.random() * 0.3,
            sessionDuration: 120 + Math.random() * 80,
            pageViews: Math.floor(200 + Math.random() * 150),
            totalImpressions: Math.floor(250 + Math.random() * 150),
            totalClicks: Math.floor(8 + Math.random() * 8),
            totalSpent: 6 + Math.random() * 4,
            newSubscriptions: Math.floor(Math.random() * 2),
            cancelledSubscriptions: Math.floor(Math.random() * 3 + 1),
            activeSubscriptions: Math.floor(Math.max(10, 30 - (29 - i) * 0.8))
          }
        })
      )
    }
  }

  await Promise.all(metricsPromises)

  console.log('✅ Database seed completed successfully!')
  console.log(`
📊 Created:
  - ${2} users
  - ${4} businesses
  - ${3} marketing campaigns
  - ${3} deployments
  - ${90} business metrics (30 days for 3 businesses)

🔐 Demo credentials:
  - demo@sophia.ai / password123
  - admin@sophia.ai / password123
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })