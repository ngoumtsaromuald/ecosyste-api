"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = void 0;
class Contact {
    constructor(phone, email, website) {
        this.phone = phone;
        this.email = email;
        this.website = website;
    }
    static create(data) {
        return new Contact(data.phone || null, data.email || null, data.website || null);
    }
    hasAnyContact() {
        return !!(this.phone || this.email || this.website);
    }
    validate() {
        const errors = [];
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
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    isValidWebsite(website) {
        try {
            const url = new URL(website);
            return ['http:', 'https:'].includes(url.protocol);
        }
        catch {
            return false;
        }
    }
    equals(other) {
        return (this.phone === other.phone &&
            this.email === other.email &&
            this.website === other.website);
    }
}
exports.Contact = Contact;
//# sourceMappingURL=contact.js.map