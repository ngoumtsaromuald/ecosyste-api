import { UserRepository } from '../../repositories/user.repository';
import { PasswordService } from './password.service';
import { EmailService } from './email.service';
import { AuditService } from './audit.service';
import { RegisterDto } from '../dto/register.dto';
import { UserResponseDto } from '../dto/auth-response.dto';
import { User } from '@prisma/client';
import { PasswordResetRepository } from '../repositories/password-reset.repository';
export declare class AuthService {
    private readonly userRepository;
    private readonly passwordService;
    private readonly emailService;
    private readonly auditService;
    private readonly passwordResetRepository;
    constructor(userRepository: UserRepository, passwordService: PasswordService, emailService: EmailService, auditService: AuditService, passwordResetRepository: PasswordResetRepository);
    register(registerDto: RegisterDto): Promise<User>;
    validateUser(email: string, password: string): Promise<User>;
    requestPasswordReset(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    toUserResponseDto(user: User): UserResponseDto;
}
