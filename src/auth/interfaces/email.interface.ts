export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface LoginNotificationData {
  name: string;
  loginTime: string;
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  securityUrl: string;
}

export interface QuotaWarningData {
  name: string;
  usagePercentage: number;
  usedRequests: number;
  totalRequests: number;
  remainingRequests: number;
  resetDate: string;
  isNearLimit: boolean;
  dashboardUrl: string;
  upgradeUrl: string;
}

export interface EmailVerificationData {
  name: string;
  verificationUrl: string;
}

export interface PasswordResetData {
  name: string;
  resetUrl: string;
}