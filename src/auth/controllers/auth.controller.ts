import { Controller, Post, Body, Get, UseGuards, Req, Ip, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { JWTService } from '../services/jwt.service';
import { SessionService } from '../services/session.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { 
  RegisterDto, 
  LoginDto, 
  RefreshTokenDto, 
  AuthResponseDto, 
  TokenResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto 
} from '../dto';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    userType: string;
    plan: string;
  };
  token: string;
}

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JWTService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    // Register user
    const user = await this.authService.register(registerDto);
    
    // Generate tokens
    const tokens = await this.jwtService.generateTokens(user);
    
    // Create session
    await this.sessionService.createSession(
      user.id, 
      tokens.refreshToken, 
      userAgent, 
      ipAddress
    );
    
    return {
      user: this.authService.toUserResponseDto(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AuthResponseDto> {
    // Validate user credentials
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    // Generate tokens
    const tokens = await this.jwtService.generateTokens(user);
    
    // Create session
    await this.sessionService.createSession(
      user.id, 
      tokens.refreshToken, 
      userAgent, 
      ipAddress
    );
    
    return {
      user: this.authService.toUserResponseDto(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshDto: RefreshTokenDto): Promise<TokenResponseDto> {
    const tokens = await this.jwtService.refreshTokens(refreshDto.refreshToken);
    return tokens;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(@Req() req: AuthenticatedRequest): Promise<{ message: string }> {
    await this.sessionService.invalidateSession(req.user.id, req.token);
    return { message: 'Successfully logged out' };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if user exists' })
  async forgotPassword(@Body() forgotDto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(forgotDto.email);
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(resetDto.token, resetDto.newPassword);
    return { message: 'Password successfully reset' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@Req() req: AuthenticatedRequest) {
    return {
      message: 'Profile endpoint - working!',
      user: req.user,
    };
  }
}