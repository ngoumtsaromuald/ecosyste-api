import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';
import { User } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
  ) {
    super({
      usernameField: 'email',
      passReqToCallback: false, // AuthService handles audit logging internally
    });
  }

  async validate(email: string, password: string): Promise<User> {
    // AuthService.validateUser handles all validation logic including:
    // - User existence check
    // - Password validation
    // - Account locking/unlocking logic
    // - Login attempt tracking
    // - Audit logging (success and failure)
    // - Error handling with appropriate messages
    const user = await this.authService.validateUser(email, password);
    
    return user;
  }
}