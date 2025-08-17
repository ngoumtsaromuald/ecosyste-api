export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare class PasswordService {
    private readonly saltRounds;
    hashPassword(password: string): Promise<string>;
    validatePassword(password: string, hash: string): Promise<boolean>;
    validatePasswordStrength(password: string): PasswordValidationResult;
}
