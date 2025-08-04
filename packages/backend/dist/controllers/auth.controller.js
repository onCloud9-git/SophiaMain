"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const index_1 = require("../index");
class AuthController {
    static async register(req, res) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
        }
        catch (error) {
            index_1.logger.error('Registration controller error:', error);
            const message = error instanceof Error ? error.message : 'Registration failed';
            const statusCode = message.includes('already exists') ? 409 : 400;
            res.status(statusCode).json({
                success: false,
                message
            });
        }
    }
    static async login(req, res) {
        try {
            const result = await auth_service_1.AuthService.login(req.body);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result
            });
        }
        catch (error) {
            index_1.logger.error('Login controller error:', error);
            const message = error instanceof Error ? error.message : 'Login failed';
            const statusCode = message.includes('Invalid credentials') ? 401 : 400;
            res.status(statusCode).json({
                success: false,
                message
            });
        }
    }
    static async getProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const user = await auth_service_1.AuthService.getUserById(req.user.id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: { user }
            });
        }
        catch (error) {
            index_1.logger.error('Get profile controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user profile'
            });
        }
    }
    static async updateProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const user = await auth_service_1.AuthService.updateUser(req.user.id, req.body);
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: { user }
            });
        }
        catch (error) {
            index_1.logger.error('Update profile controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    }
    static async changePassword(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
                return;
            }
            await auth_service_1.AuthService.changePassword(req.user.id, currentPassword, newPassword);
            res.status(200).json({
                success: true,
                message: 'Password changed successfully'
            });
        }
        catch (error) {
            index_1.logger.error('Change password controller error:', error);
            const message = error instanceof Error ? error.message : 'Failed to change password';
            const statusCode = message.includes('incorrect') || message.includes('not found') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message
            });
        }
    }
    static async deleteAccount(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            await auth_service_1.AuthService.deleteUser(req.user.id);
            res.status(200).json({
                success: true,
                message: 'Account deleted successfully'
            });
        }
        catch (error) {
            index_1.logger.error('Delete account controller error:', error);
            const message = error instanceof Error ? error.message : 'Failed to delete account';
            const statusCode = message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message
            });
        }
    }
    static async refreshToken(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            // For refresh, we generate a new token with current user data
            const { generateToken } = await Promise.resolve().then(() => __importStar(require('../utils/auth.util')));
            const token = generateToken({
                userId: req.user.id,
                email: req.user.email
            });
            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    token,
                    user: req.user
                }
            });
        }
        catch (error) {
            index_1.logger.error('Refresh token controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to refresh token'
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map