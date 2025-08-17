import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email.service';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';

// Mock nodemailer
jest.mock('nodemailer');
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

// Mock fs
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('EmailService', () => {
    let service: EmailService;
    let configService: ConfigService;
    let mockTransporter: any;

    beforeEach(async () => {
        mockTransporter = {
            verify: jest.fn(),
            sendMail: jest.fn(),
        };

        mockNodemailer.createTransport.mockReturnValue(mockTransporter);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmailService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string, defaultValue?: any) => {
                            const config = {
                                SMTP_HOST: 'smtp.test.com',
                                SMTP_PORT: 587,
                                SMTP_SECURE: false,
                                SMTP_USER: 'test@test.com',
                                SMTP_PASS: 'testpass',
                                EMAIL_FROM: 'noreply@romapi.com',
                                FRONTEND_URL: 'http://localhost:3000',
                            };
                            return config[key] || defaultValue;
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<EmailService>(EmailService);
        configService = module.get<ConfigService>(ConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('initialization', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should initialize transporter with correct config', () => {
            expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
                host: 'smtp.test.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'test@test.com',
                    pass: 'testpass',
                },
            });
        });

        it('should verify transporter connection', () => {
            expect(mockTransporter.verify).toHaveBeenCalled();
        });
    });

    describe('sendVerificationEmail', () => {
        beforeEach(() => {
            mockFs.readFileSync.mockImplementation((path: any) => {
                if (path.includes('.html')) {
                    return '<html>Hello {{name}}, verify: {{verificationUrl}}</html>';
                }
                return 'Hello {{name}}, verify: {{verificationUrl}}';
            });
            mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });
        });

        it('should send verification email successfully', async () => {
            await service.sendVerificationEmail('test@test.com', 'Test User', 'test-token');

            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: 'noreply@romapi.com',
                to: 'test@test.com',
                subject: 'Vérifiez votre adresse email - ROMAPI',
                text: 'Hello Test User, verify: http://localhost:3000/auth/verify-email?token=test-token',
                html: '<html>Hello Test User, verify: http://localhost:3000/auth/verify-email?token=test-token</html>',
            });
        });

        it('should handle missing token gracefully', async () => {
            await service.sendVerificationEmail('test@test.com', 'Test User');

            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining('placeholder-token'),
                    html: expect.stringContaining('placeholder-token'),
                })
            );
        });
    });

    describe('sendPasswordResetEmail', () => {
        beforeEach(() => {
            mockFs.readFileSync.mockImplementation((path: any) => {
                if (path.includes('.html')) {
                    return '<html>Hello {{name}}, reset: {{resetUrl}}</html>';
                }
                return 'Hello {{name}}, reset: {{resetUrl}}';
            });
            mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });
        });

        it('should send password reset email successfully', async () => {
            await service.sendPasswordResetEmail('test@test.com', 'Test User', 'reset-token');

            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: 'noreply@romapi.com',
                to: 'test@test.com',
                subject: 'Réinitialisation de votre mot de passe - ROMAPI',
                text: 'Hello Test User, reset: http://localhost:3000/auth/reset-password?token=reset-token',
                html: '<html>Hello Test User, reset: http://localhost:3000/auth/reset-password?token=reset-token</html>',
            });
        });
    });

    describe('sendLoginNotification', () => {
        beforeEach(() => {
            mockFs.readFileSync.mockImplementation((path: any) => {
                if (path.includes('.html')) {
                    return '<html>Login: {{name}} at {{loginTime}} from {{ipAddress}}</html>';
                }
                return 'Login: {{name}} at {{loginTime}} from {{ipAddress}}';
            });
            mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });
        });

        it('should send login notification successfully', async () => {
            const loginData = {
                name: 'Test User',
                loginTime: '2024-01-01 12:00:00',
                ipAddress: '192.168.1.1',
                location: 'Paris, France',
                device: 'Desktop',
                browser: 'Chrome',
                securityUrl: 'http://localhost:3000/security',
            };

            await service.sendLoginNotification('test@test.com', loginData);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: 'noreply@romapi.com',
                to: 'test@test.com',
                subject: 'Nouvelle connexion détectée - ROMAPI',
                text: 'Login: Test User at 2024-01-01 12:00:00 from 192.168.1.1',
                html: '<html>Login: Test User at 2024-01-01 12:00:00 from 192.168.1.1</html>',
            });
        });
    });

    describe('sendQuotaWarning', () => {
        beforeEach(() => {
            mockFs.readFileSync.mockImplementation((path: any) => {
                if (path.includes('.html')) {
                    return '<html>{{name}} usage: {{usagePercentage}}%</html>';
                }
                return '{{name}} usage: {{usagePercentage}}%';
            });
            mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });
        });

        it('should send quota warning successfully', async () => {
            const quotaData = {
                name: 'Test User',
                usagePercentage: 85,
                usedRequests: 850,
                totalRequests: 1000,
                remainingRequests: 150,
                resetDate: '2024-02-01',
                isNearLimit: true,
                dashboardUrl: 'http://localhost:3000/dashboard',
                upgradeUrl: 'http://localhost:3000/upgrade',
            };

            await service.sendQuotaWarning('test@test.com', quotaData);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: 'noreply@romapi.com',
                to: 'test@test.com',
                subject: 'Avertissement de quota API (85%) - ROMAPI',
                text: 'Test User usage: 85%',
                html: '<html>Test User usage: 85%</html>',
            });
        });
    });

    describe('testEmailConfiguration', () => {
        it('should return true when configuration is valid', async () => {
            mockTransporter.verify.mockResolvedValue(true);

            const result = await service.testEmailConfiguration();

            expect(result).toBe(true);
            expect(mockTransporter.verify).toHaveBeenCalled();
        });

        it('should return false when configuration is invalid', async () => {
            mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

            const result = await service.testEmailConfiguration();

            expect(result).toBe(false);
        });
    });

    describe('error handling', () => {
        beforeEach(() => {
            mockFs.readFileSync.mockImplementation(() => {
                throw new Error('File not found');
            });
        });

        it('should throw error when template loading fails', async () => {
            await expect(
                service.sendVerificationEmail('test@test.com', 'Test User', 'token')
            ).rejects.toThrow('Failed to load email template: email-verification');
        });
    });

    describe('legacy methods', () => {
        beforeEach(() => {
            mockFs.readFileSync.mockImplementation((path: any) => {
                if (path.includes('.html')) {
                    return '<html>{{name}} {{verificationUrl}}</html>';
                }
                return '{{name}} {{verificationUrl}}';
            });
            mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });
        });

        it('should handle sendWelcomeEmail', async () => {
            await service.sendWelcomeEmail('test@test.com', 'Test User');
            expect(mockTransporter.sendMail).toHaveBeenCalled();
        });

        it('should handle sendEmailVerification', async () => {
            await service.sendEmailVerification('test@test.com', 'token');
            expect(mockTransporter.sendMail).toHaveBeenCalled();
        });

        it('should handle sendSecurityAlert', async () => {
            await service.sendSecurityAlert('test@test.com', 'suspicious login');
            expect(mockTransporter.sendMail).toHaveBeenCalled();
        });
    });
});