import { PrismaClient } from '@prisma/client'

declare global {
  // Prevents multiple instances in development
  var __prisma: PrismaClient | undefined
}

// PrismaClient is attached to the `global` object in development
// to prevent exhausting your database connection limit.
export const prisma = globalThis.__prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Graceful shutdown
async function gracefulShutdown() {
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)