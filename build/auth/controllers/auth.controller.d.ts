import { AuthService } from '../services/auth.service';
import { JWTService } from '../services/jwt.service';
import { SessionService } from '../services/session.service';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto, TokenResponseDto, ForgotPasswordDto, ResetPasswordDto } from '../dto';
export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        userType: string;
        plan: string;
    };
    token: string;
}
export declare class AuthController {
    private readonly authService;
    private readonly jwtService;
    private readonly sessionService;
    constructor(authService: AuthService, jwtService: JWTService, sessionService: SessionService);
    register(registerDto: RegisterDto, ipAddress: string, userAgent: string): Promise<AuthResponseDto>;
    login(loginDto: LoginDto, ipAddress: string, userAgent: string): Promise<AuthResponseDto>;
    refresh(refreshDto: RefreshTokenDto): Promise<TokenResponseDto>;
    logout(req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
    forgotPassword(forgotDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    getProfile(req: AuthenticatedRequest): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            userType: string;
            plan: string;
        };
    }>;
}
