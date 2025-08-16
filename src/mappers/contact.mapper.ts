import { Contact } from '../domain/value-objects';
import { ContactDto } from '../dto';

export class ContactMapper {
  static toDto(contact: Contact): ContactDto {
    const dto = new ContactDto();
    dto.phone = contact.phone;
    dto.email = contact.email;
    dto.website = contact.website;
    return dto;
  }

  static toDomain(dto: ContactDto): Contact {
    return Contact.create({
      phone: dto.phone,
      email: dto.email,
      website: dto.website,
    });
  }

  static fromPrisma(data: {
    phone: string | null;
    email: string | null;
    website: string | null;
  }): Contact {
    return Contact.create({
      phone: data.phone,
      email: data.email,
      website: data.website,
    });
  }

  static toPrisma(contact: Contact): {
    phone: string | null;
    email: string | null;
    website: string | null;
  } {
    return {
      phone: contact.phone,
      email: contact.email,
      website: contact.website,
    };
  }
}