import { UserType, Plan } from '@prisma/client';
export declare class UserResponseDto {
    id: string;
    email: string;
    name: string;
    userType: UserType;
    plan: Plan;
    emailVerified: boolean;
    createdAt: Date;
}
export declare class TokenResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class AuthResponseDto extends TokenResponseDto {
    user: UserResponseDto;
}
