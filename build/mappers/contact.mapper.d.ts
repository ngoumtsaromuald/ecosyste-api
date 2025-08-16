import { Contact } from '../domain/value-objects';
import { ContactDto } from '../dto';
export declare class ContactMapper {
    static toDto(contact: Contact): ContactDto;
    static toDomain(dto: ContactDto): Contact;
    static fromPrisma(data: {
        phone: string | null;
        email: string | null;
        website: string | null;
    }): Contact;
    static toPrisma(contact: Contact): {
        phone: string | null;
        email: string | null;
        website: string | null;
    };
}
