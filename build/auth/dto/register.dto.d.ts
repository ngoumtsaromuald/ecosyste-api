import { UserType } from '@prisma/client';
export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    userType?: UserType;
}
