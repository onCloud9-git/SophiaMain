import { PrismaClient } from '@prisma/client';
export declare const testPrisma: PrismaClient<{
    datasources: {
        db: {
            url: string;
        };
    };
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const createTestUser: (overrides?: {}) => Promise<{
    email: string;
    password: string;
    name: string;
}>;
export declare const cleanupTestData: () => Promise<void>;
