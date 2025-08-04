"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserModel {
    /**
     * Create a new user with hashed password
     */
    static async create(data) {
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
        return prisma_1.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            }
        });
    }
    /**
     * Find user by email
     */
    static async findByEmail(email) {
        return prisma_1.prisma.user.findUnique({
            where: { email }
        });
    }
    /**
     * Find user by ID with businesses
     */
    static async findByIdWithBusinesses(id) {
        return prisma_1.prisma.user.findUnique({
            where: { id },
            include: {
                businesses: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }
    /**
     * Update user data
     */
    static async update(id, data) {
        return prisma_1.prisma.user.update({
            where: { id },
            data
        });
    }
    /**
     * Verify user password
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return bcryptjs_1.default.compare(plainPassword, hashedPassword);
    }
    /**
     * Delete user and all related data
     */
    static async delete(id) {
        return prisma_1.prisma.user.delete({
            where: { id }
        });
    }
    /**
     * Check if email exists
     */
    static async emailExists(email) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            select: { id: true }
        });
        return !!user;
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=user.model.js.map