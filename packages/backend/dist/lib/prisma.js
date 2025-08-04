"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// PrismaClient is attached to the `global` object in development
// to prevent exhausting your database connection limit.
exports.prisma = globalThis.__prisma || new client_1.PrismaClient({
    log: ['query', 'error', 'warn'],
});
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = exports.prisma;
}
// Graceful shutdown
async function gracefulShutdown() {
    await exports.prisma.$disconnect();
    process.exit(0);
}
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
//# sourceMappingURL=prisma.js.map