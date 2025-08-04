"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = exports.io = exports.logger = exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const winston_1 = __importDefault(require("winston"));
// Import routes
const routes_1 = require("./routes");
// Initialize Prisma
exports.prisma = new client_1.PrismaClient({
    log: ['query', 'error', 'warn']
});
// Logger configuration
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
        })
    ]
});
// Create Express app
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
// Initialize Socket.IO
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
        methods: ['GET', 'POST']
    }
});
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});
// Middleware stack
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
    credentials: true
}));
app.use((0, compression_1.default)());
app.use(limiter);
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => exports.logger.info(message.trim())
    }
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// API routes
app.use('/api/auth', routes_1.authRoutes);
app.use('/api/businesses', routes_1.businessRoutes);
// Global error handler
app.use((error, req, res, next) => {
    exports.logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});
// Socket.IO connection handling
exports.io.on('connection', (socket) => {
    exports.logger.info(`Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        exports.logger.info(`Client disconnected: ${socket.id}`);
    });
    // Join user room for personalized notifications
    socket.on('join_user_room', (userId) => {
        socket.join(`user:${userId}`);
        exports.logger.info(`User ${userId} joined their room`);
    });
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    exports.logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        exports.logger.info('HTTP server closed');
    });
    await exports.prisma.$disconnect();
    exports.logger.info('Database connection closed');
    process.exit(0);
});
process.on('SIGINT', async () => {
    exports.logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        exports.logger.info('HTTP server closed');
    });
    await exports.prisma.$disconnect();
    exports.logger.info('Database connection closed');
    process.exit(0);
});
// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    exports.logger.info(`🚀 Sophia AI Backend Server running on port ${PORT}`);
    exports.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
//# sourceMappingURL=index.js.map