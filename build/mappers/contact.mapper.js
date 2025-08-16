"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactMapper = void 0;
const value_objects_1 = require("../domain/value-objects");
const dto_1 = require("../dto");
class ContactMapper {
    static toDto(contact) {
        const dto = new dto_1.ContactDto();
        dto.phone = contact.phone;
        dto.email = contact.email;
        dto.website = contact.website;
        return dto;
    }
    static toDomain(dto) {
        return value_objects_1.Contact.create({
            phone: dto.phone,
            email: dto.email,
            website: dto.website,
        });
    }
    static fromPrisma(data) {
        return value_objects_1.Contact.create({
            phone: data.phone,
            email: data.email,
            website: data.website,
        });
    }
    static toPrisma(contact) {
        return {
            phone: contact.phone,
            email: contact.email,
            website: contact.website,
        };
    }
}
exports.ContactMapper = ContactMapper;
//# sourceMappingURL=contact.mapper.js.map