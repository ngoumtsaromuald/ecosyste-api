export declare class Contact {
    readonly phone: string | null;
    readonly email: string | null;
    readonly website: string | null;
    constructor(phone: string | null, email: string | null, website: string | null);
    static create(data: {
        phone?: string | null;
        email?: string | null;
        website?: string | null;
    }): Contact;
    hasAnyContact(): boolean;
    validate(): string[];
    private isValidPhone;
    private isValidEmail;
    private isValidWebsite;
    equals(other: Contact): boolean;
}
