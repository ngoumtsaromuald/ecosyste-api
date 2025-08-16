import { Decimal } from '@prisma/client/runtime/library';

export class Address {
  constructor(
    public readonly addressLine1: string | null,
    public readonly addressLine2: string | null,
    public readonly city: string | null,
    public readonly region: string | null,
    public readonly postalCode: string | null,
    public readonly country: string,
    public readonly latitude: Decimal | null,
    public readonly longitude: Decimal | null,
  ) {}

  static create(data: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    region?: string | null;
    postalCode?: string | null;
    country?: string;
    latitude?: Decimal | null;
    longitude?: Decimal | null;
  }): Address {
    return new Address(
      data.addressLine1 || null,
      data.addressLine2 || null,
      data.city || null,
      data.region || null,
      data.postalCode || null,
      data.country || 'CM',
      data.latitude || null,
      data.longitude || null,
    );
  }

  isComplete(): boolean {
    return !!(this.addressLine1 && this.city && this.country);
  }

  hasCoordinates(): boolean {
    return !!(this.latitude && this.longitude);
  }

  getFullAddress(): string {
    const parts = [
      this.addressLine1,
      this.addressLine2,
      this.city,
      this.region,
      this.postalCode,
      this.country,
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  validate(): string[] {
    const errors: string[] = [];

    if (this.addressLine1 && this.addressLine1.length > 255) {
      errors.push('Address line 1 must be less than 255 characters');
    }

    if (this.addressLine2 && this.addressLine2.length > 255) {
      errors.push('Address line 2 must be less than 255 characters');
    }

    if (this.city && this.city.length > 100) {
      errors.push('City must be less than 100 characters');
    }

    if (this.region && this.region.length > 100) {
      errors.push('Region must be less than 100 characters');
    }

    if (this.postalCode && this.postalCode.length > 20) {
      errors.push('Postal code must be less than 20 characters');
    }

    if (this.country.length !== 2) {
      errors.push('Country must be a 2-letter ISO code');
    }

    if (this.latitude && (this.latitude.toNumber() < -90 || this.latitude.toNumber() > 90)) {
      errors.push('Latitude must be between -90 and 90');
    }

    if (this.longitude && (this.longitude.toNumber() < -180 || this.longitude.toNumber() > 180)) {
      errors.push('Longitude must be between -180 and 180');
    }

    return errors;
  }

  equals(other: Address): boolean {
    return (
      this.addressLine1 === other.addressLine1 &&
      this.addressLine2 === other.addressLine2 &&
      this.city === other.city &&
      this.region === other.region &&
      this.postalCode === other.postalCode &&
      this.country === other.country &&
      this.latitude?.equals(other.latitude || new Decimal(0)) !== false &&
      this.longitude?.equals(other.longitude || new Decimal(0)) !== false
    );
  }
}