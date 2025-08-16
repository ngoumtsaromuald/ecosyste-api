"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoData = void 0;
class SeoData {
    constructor(metaTitle, metaDescription) {
        this.metaTitle = metaTitle;
        this.metaDescription = metaDescription;
    }
    static create(data) {
        return new SeoData(data.metaTitle || null, data.metaDescription || null);
    }
    isComplete() {
        return !!(this.metaTitle && this.metaDescription);
    }
    validate() {
        const errors = [];
        if (this.metaTitle && this.metaTitle.length > 60) {
            errors.push('Meta title should be less than 60 characters for optimal SEO');
        }
        if (this.metaTitle && this.metaTitle.length < 10) {
            errors.push('Meta title should be at least 10 characters');
        }
        if (this.metaDescription && this.metaDescription.length > 160) {
            errors.push('Meta description should be less than 160 characters for optimal SEO');
        }
        if (this.metaDescription && this.metaDescription.length < 50) {
            errors.push('Meta description should be at least 50 characters');
        }
        return errors;
    }
    generateFromContent(name, description) {
        const title = this.metaTitle || `${name} - ROMAPI`;
        const desc = this.metaDescription ||
            (description ? description.substring(0, 157) + '...' : `Découvrez ${name} sur ROMAPI`);
        return new SeoData(title, desc);
    }
    equals(other) {
        return (this.metaTitle === other.metaTitle &&
            this.metaDescription === other.metaDescription);
    }
}
exports.SeoData = SeoData;
//# sourceMappingURL=seo-data.js.map