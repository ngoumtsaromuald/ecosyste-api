export class Contact {
  constructor(
    public readonly phone: string | null,
    public readonly email: string | null,
    public readonly website: string | null,
  ) {}

  static create(data: {
    phone?: string | null;
    email?: string | null;
    website?: string | null;
  }): Contact {
    return new Contact(
      data.phone || null,
      data.email || null,
      data.website || null,
    );
  }

  hasAnyContact(): boolean {
    return !!(this.phone || this.email || this.website);
  }

  validate(): string[] {
    const errors: string[] = [];

    if (this.phone && !this.isValidPhone(this.phone)) {
      errors.push('Invalid phone number format');
    }

    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Invalid email format');
    }

    if (this.website && !this.isValidWebsite(this.website)) {
      errors.push('Invalid website URL format');
    }

    return errors;
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidWebsite(website: string): boolean {
    try {
      const url = new URL(website);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  equals(other: Contact): boolean {
    return (
      this.phone === other.phone &&
      this.email === other.email &&
      this.website === other.website
    );
  }
}