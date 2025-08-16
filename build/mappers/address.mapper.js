"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressMapper = void 0;
const library_1 = require("@prisma/client/runtime/library");
const value_objects_1 = require("../domain/value-objects");
const dto_1 = require("../dto");
class AddressMapper {
    static toDto(address) {
        const dto = new dto_1.AddressDto();
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
    static toDomain(dto) {
        return value_objects_1.Address.create({
            addressLine1: dto.addressLine1,
            addressLine2: dto.addressLine2,
            city: dto.city,
            region: dto.region,
            postalCode: dto.postalCode,
            country: dto.country,
            latitude: dto.latitude ? new library_1.Decimal(dto.latitude) : null,
            longitude: dto.longitude ? new library_1.Decimal(dto.longitude) : null,
        });
    }
    static fromPrisma(data) {
        return value_objects_1.Address.create({
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
    static toPrisma(address) {
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
exports.AddressMapper = AddressMapper;
//# sourceMappingURL=address.mapper.js.map