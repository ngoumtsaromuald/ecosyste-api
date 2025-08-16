import { Decimal } from '@prisma/client/runtime/library';
export declare class Address {
    readonly addressLine1: string | null;
    readonly addressLine2: string | null;
    readonly city: string | null;
    readonly region: string | null;
    readonly postalCode: string | null;
    readonly country: string;
    readonly latitude: Decimal | null;
    readonly longitude: Decimal | null;
    constructor(addressLine1: string | null, addressLine2: string | null, city: string | null, region: string | null, postalCode: string | null, country: string, latitude: Decimal | null, longitude: Decimal | null);
    static create(data: {
        addressLine1?: string | null;
        addressLine2?: string | null;
        city?: string | null;
        region?: string | null;
        postalCode?: string | null;
        country?: string;
        latitude?: Decimal | null;
        longitude?: Decimal | null;
    }): Address;
    isComplete(): boolean;
    hasCoordinates(): boolean;
    getFullAddress(): string;
    validate(): string[];
    equals(other: Address): boolean;
}
