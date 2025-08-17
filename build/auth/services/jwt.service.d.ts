import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from './session.service';
import { AuditService } from './audit.service';
import { UserRepository } from '../../repositories/user.repository';
import { UserType, Plan } from '@prisma/client';
export interface JWTPayload {
    sub: string;
    email: string;
    userType: UserType;
    plan: Plan;
    permissions: string[];
    iat: number;
    exp?: number;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface User {
    id: string;
    email: string;
    userType: UserType;
    plan: Plan;
}
export declare class JWTService {
    private readonly jwtService;
    private readonly configService;
    private readonly sessionService;
    private readonly auditService;
    private readonly userRepository;
    constructor(jwtService: JwtService, configService: ConfigService, sessionService: SessionService, auditService: AuditService, userRepository: UserRepository);
    generateTokens(user: User): Promise<TokenPair>;
    validateToken(token: string): Promise<JWTPayload>;
    refreshTokens(refreshToken: string): Promise<TokenPair>;
    private getUserPermissions;
    private getTokenExpiration;
    private getUserById;
}
