import { JWTPayload } from '../middlewares';
export declare const generateToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const verifyToken: (token: string) => JWTPayload;
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
export declare const extractTokenFromHeader: (authHeader?: string) => string | null;
export declare const generateSecureString: (length?: number) => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const isStrongPassword: (password: string) => {
    isValid: boolean;
    errors: string[];
};
