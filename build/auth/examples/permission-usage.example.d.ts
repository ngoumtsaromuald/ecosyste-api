export declare class PermissionExampleController {
    getProfile(): Promise<{
        message: string;
    }>;
    updateProfile(updateData: any): Promise<{
        message: string;
    }>;
    getDashboard(): Promise<{
        message: string;
    }>;
    listAllUsers(): Promise<{
        message: string;
    }>;
    getBusinessAnalytics(): Promise<{
        message: string;
    }>;
    getPremiumFeatures(): Promise<{
        message: string;
    }>;
    getResource(id: string): Promise<{
        message: string;
    }>;
    getPublicData(): Promise<{
        message: string;
    }>;
    receiveWebhook(webhookData: any): Promise<{
        message: string;
    }>;
    deleteResource(id: string): Promise<{
        message: string;
    }>;
    bulkImport(importData: any): Promise<{
        message: string;
    }>;
    getPublicInfo(): Promise<{
        message: string;
    }>;
}
