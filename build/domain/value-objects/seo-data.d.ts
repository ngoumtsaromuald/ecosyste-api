export declare class SeoData {
    readonly metaTitle: string | null;
    readonly metaDescription: string | null;
    constructor(metaTitle: string | null, metaDescription: string | null);
    static create(data: {
        metaTitle?: string | null;
        metaDescription?: string | null;
    }): SeoData;
    isComplete(): boolean;
    validate(): string[];
    generateFromContent(name: string, description?: string): SeoData;
    equals(other: SeoData): boolean;
}
