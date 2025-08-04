import { User } from '@prisma/client';
export interface CreateUserData {
    email: string;
    password: string;
    name?: string;
    avatar?: string;
}
export interface UpdateUserData {
    email?: string;
    name?: string;
    avatar?: string;
}
export declare class UserModel {
    /**
     * Create a new user with hashed password
     */
    static create(data: CreateUserData): Promise<User>;
    /**
     * Find user by email
     */
    static findByEmail(email: string): Promise<User | null>;
    /**
     * Find user by ID with businesses
     */
    static findByIdWithBusinesses(id: string): Promise<User & {
        businesses: any[];
    } | null>;
    /**
     * Update user data
     */
    static update(id: string, data: UpdateUserData): Promise<User>;
    /**
     * Verify user password
     */
    static verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
    /**
     * Delete user and all related data
     */
    static delete(id: string): Promise<User>;
    /**
     * Check if email exists
     */
    static emailExists(email: string): Promise<boolean>;
}
