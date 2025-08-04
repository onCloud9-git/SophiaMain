"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const index_1 = require("../index");
const auth_util_1 = require("../utils/auth.util");
const index_2 = require("../index");
class AuthService {
    static async register(userData) {
        const { email, password, name } = userData;
        // Validate email format
        if (!(0, auth_util_1.isValidEmail)(email)) {
            throw new Error('Invalid email format');
        }
        // Validate password strength
        const passwordValidation = (0, auth_util_1.isStrongPassword)(password);
        if (!passwordValidation.isValid) {
            throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
        }
        // Check if user already exists
        const existingUser = await index_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        try {
            // Hash password
            const hashedPassword = await (0, auth_util_1.hashPassword)(password);
            // Create user
            const user = await index_1.prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    name: name || null
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true
                }
            });
            // Generate JWT token
            const token = (0, auth_util_1.generateToken)({
                userId: user.id,
                email: user.email
            });
            index_2.logger.info(`New user registered: ${user.email}`);
            return {
                user,
                token
            };
        }
        catch (error) {
            index_2.logger.error('Registration error:', error);
            throw new Error('Failed to create user');
        }
    }
    static async login(loginData) {
        const { email, password } = loginData;
        // Validate email format
        if (!(0, auth_util_1.isValidEmail)(email)) {
            throw new Error('Invalid email format');
        }
        try {
            // Find user
            const user = await index_1.prisma.user.findUnique({
                where: { email: email.toLowerCase() }
            });
            if (!user) {
                throw new Error('Invalid credentials');
            }
            // Verify password
            const isPasswordValid = await (0, auth_util_1.comparePassword)(password, user.password);
            if (!isPasswordValid) {
                throw new Error('Invalid credentials');
            }
            // Generate JWT token
            const token = (0, auth_util_1.generateToken)({
                userId: user.id,
                email: user.email
            });
            index_2.logger.info(`User logged in: ${user.email}`);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    createdAt: user.createdAt
                },
                token
            };
        }
        catch (error) {
            index_2.logger.error('Login error:', error);
            if (error instanceof Error && error.message === 'Invalid credentials') {
                throw error;
            }
            throw new Error('Failed to authenticate user');
        }
    }
    static async getUserById(userId) {
        try {
            return await index_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    avatar: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
        }
        catch (error) {
            index_2.logger.error('Get user error:', error);
            return null;
        }
    }
    static async updateUser(userId, updateData) {
        try {
            const user = await index_1.prisma.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    avatar: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            index_2.logger.info(`User updated: ${user.email}`);
            return user;
        }
        catch (error) {
            index_2.logger.error('Update user error:', error);
            throw new Error('Failed to update user');
        }
    }
    static async changePassword(userId, currentPassword, newPassword) {
        // Validate new password strength
        const passwordValidation = (0, auth_util_1.isStrongPassword)(newPassword);
        if (!passwordValidation.isValid) {
            throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
        }
        try {
            // Get current user
            const user = await index_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new Error('User not found');
            }
            // Verify current password
            const isCurrentPasswordValid = await (0, auth_util_1.comparePassword)(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }
            // Hash new password
            const hashedNewPassword = await (0, auth_util_1.hashPassword)(newPassword);
            // Update password
            await index_1.prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword }
            });
            index_2.logger.info(`Password changed for user: ${user.email}`);
        }
        catch (error) {
            index_2.logger.error('Change password error:', error);
            if (error instanceof Error &&
                (error.message === 'User not found' || error.message === 'Current password is incorrect')) {
                throw error;
            }
            throw new Error('Failed to change password');
        }
    }
    static async deleteUser(userId) {
        try {
            const user = await index_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                throw new Error('User not found');
            }
            // Delete user (this will cascade delete related businesses, campaigns, etc.)
            await index_1.prisma.user.delete({
                where: { id: userId }
            });
            index_2.logger.info(`User deleted: ${user.email}`);
        }
        catch (error) {
            index_2.logger.error('Delete user error:', error);
            if (error instanceof Error && error.message === 'User not found') {
                throw error;
            }
            throw new Error('Failed to delete user');
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map