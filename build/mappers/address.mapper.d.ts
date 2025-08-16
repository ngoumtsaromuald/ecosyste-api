import { Decimal } from '@prisma/client/runtime/library';
import { Address } from '../domain/value-objects';
import { AddressDto } from '../dto';
export declare class AddressMapper {
    static toDto(address: Address): AddressDto;
    static toDomain(dto: AddressDto): Address;
    static fromPrisma(data: {
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        region: string | null;
        postalCode: string | null;
        country: string;
        latitude: Decimal | null;
        longitude: Decimal | null;
    }): Address;
    static toPrisma(address: Address): {
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        region: string | null;
        postalCode: string | null;
        country: string;
        latitude: Decimal | null;
        longitude: Decimal | null;
    };
}
