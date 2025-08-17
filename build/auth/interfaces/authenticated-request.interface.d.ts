import { Request } from 'express';
import { UserType, Plan } from '@prisma/client';
export interface AuthenticatedUser {
    id: string;
    email: string;
    userType: UserType;
    plan: Plan;
    permissions: string[];
}
export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
    token?: string;
}
