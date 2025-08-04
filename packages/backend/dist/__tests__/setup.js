"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTestData = exports.createTestUser = exports.testPrisma = void 0;
const client_1 = require("@prisma/client");
// Test database setup
exports.testPrisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.TEST_DATABASE_URL || 'postgresql://username:password@localhost:5432/sophia_test_db'
        }
    }
});
// Test data helpers
const createTestUser = async (overrides = {}) => {
    const defaultUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Test User'
    };
    return { ...defaultUser, ...overrides };
};
exports.createTestUser = createTestUser;
const cleanupTestData = async () => {
    // Clean up test data in reverse order of dependencies
    await exports.testPrisma.businessMetric.deleteMany();
    await exports.testPrisma.marketingCampaign.deleteMany();
    await exports.testPrisma.deployment.deleteMany();
    await exports.testPrisma.business.deleteMany();
    await exports.testPrisma.user.deleteMany();
};
exports.cleanupTestData = cleanupTestData;
// Setup and teardown for tests
beforeAll(async () => {
    // Connect to test database
    await exports.testPrisma.$connect();
});
afterAll(async () => {
    // Cleanup and disconnect
    await (0, exports.cleanupTestData)();
    await exports.testPrisma.$disconnect();
});
afterEach(async () => {
    // Clean up after each test
    await (0, exports.cleanupTestData)();
});
//# sourceMappingURL=setup.js.map