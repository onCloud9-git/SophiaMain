import { PrismaClient } from '@prisma/client'

// Test database setup
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://username:password@localhost:5432/sophia_test_db'
    }
  }
})

// Test data helpers
export const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass123!',
    name: 'Test User'
  }
  
  return { ...defaultUser, ...overrides }
}

export const cleanupTestData = async () => {
  // Clean up test data in reverse order of dependencies
  await testPrisma.conversionEvent.deleteMany()
  await testPrisma.businessMetric.deleteMany()
  await testPrisma.marketingCampaign.deleteMany()
  await testPrisma.deployment.deleteMany()
  await testPrisma.business.deleteMany()
  await testPrisma.user.deleteMany()
}

// Setup and teardown for tests
beforeAll(async () => {
  // Connect to test database
  await testPrisma.$connect()
})

afterAll(async () => {
  // Cleanup and disconnect
  await cleanupTestData()
  await testPrisma.$disconnect()
})

afterEach(async () => {
  // Clean up after each test
  await cleanupTestData()
})