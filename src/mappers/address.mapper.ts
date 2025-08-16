import { Decimal } from '@prisma/client/runtime/library';
import { Address } from '../domain/value-objects';
import { AddressDto } from '../dto';

export class AddressMapper {
  static toDto(address: Address): AddressDto {
    const dto = new AddressDto();
    dto.addressLine1 = address.addressLine1;
    dto.addressLine2 = address.addressLine2;
    dto.city = address.city;
    dto.region = address.region;
    dto.postalCode = address.postalCode;
    dto.country = address.country;
    dto.latitude = address.latitude?.toNumber();
    dto.longitude = address.longitude?.toNumber();
    return dto;
  }

  static toDomain(dto: AddressDto): Address {
    return Address.create({
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      region: dto.region,
      postalCode: dto.postalCode,
      country: dto.country,
      latitude: dto.latitude ? new Decimal(dto.latitude) : null,
      longitude: dto.longitude ? new Decimal(dto.longitude) : null,
    });
  }

  static fromPrisma(data: {
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    country: string;
    latitude: Decimal | null;
    longitude: Decimal | null;
  }): Address {
    return Address.create({
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      region: data.region,
      postalCode: data.postalCode,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  }

  static toPrisma(address: Address): {
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    country: string;
    latitude: Decimal | null;
    longitude: Decimal | null;
  } {
    return {
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
    };
  }
}