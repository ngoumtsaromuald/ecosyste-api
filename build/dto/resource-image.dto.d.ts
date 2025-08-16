export declare class ResourceImageDto {
    id: string;
    url: string;
    altText?: string;
    isPrimary: boolean;
    orderIndex: number;
    createdAt: Date;
}
export declare class CreateResourceImageDto {
    url: string;
    altText?: string;
    isPrimary?: boolean;
    orderIndex?: number;
}
