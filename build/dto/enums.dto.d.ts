export declare enum ResourceType {
    BUSINESS = "BUSINESS",
    SERVICE = "SERVICE",
    DATA = "DATA",
    API = "API"
}
export declare enum ResourceStatus {
    ACTIVE = "ACTIVE",
    PENDING = "PENDING",
    SUSPENDED = "SUSPENDED"
}
export declare enum ResourcePlan {
    FREE = "FREE",
    PREMIUM = "PREMIUM",
    FEATURED = "FEATURED"
}
export declare enum UserType {
    INDIVIDUAL = "INDIVIDUAL",
    BUSINESS = "BUSINESS",
    ADMIN = "ADMIN"
}
export declare enum Plan {
    FREE = "FREE",
    PRO = "PRO",
    PREMIUM = "PREMIUM",
    ENTERPRISE = "ENTERPRISE"
}
export declare enum PricingTier {
    STANDARD = "STANDARD",
    BUSINESS = "BUSINESS",
    ENTERPRISE = "ENTERPRISE"
}
export declare class ResourceTypeDto {
    value: ResourceType;
}
export declare class ResourceStatusDto {
    value: ResourceStatus;
}
export declare class ResourcePlanDto {
    value: ResourcePlan;
}
export declare class UserTypeDto {
    value: UserType;
}
export declare class PlanDto {
    value: Plan;
}
export declare class PricingTierDto {
    value: PricingTier;
}
