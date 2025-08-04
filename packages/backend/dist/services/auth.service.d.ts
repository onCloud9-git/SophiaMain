import { User } from '@prisma/client';
import { UserRegistrationInput, UserLoginInput } from '../utils/schemas';
export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name: string | null;
        createdAt: Date;
    };
    token: string;
}
export declare class AuthService {
    static register(userData: UserRegistrationInput): Promise<AuthResponse>;
    static login(loginData: UserLoginInput): Promise<AuthResponse>;
    static getUserById(userId: string): Promise<User | null>;
    static updateUser(userId: string, updateData: {
        name?: string;
        avatar?: string;
    }): Promise<User>;
    static changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    static deleteUser(userId: string): Promise<void>;
}
