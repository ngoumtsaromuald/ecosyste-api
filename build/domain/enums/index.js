"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionStatus = exports.ResourcePlan = exports.ResourceStatus = exports.ResourceType = exports.PricingTier = exports.Plan = exports.UserType = void 0;
var UserType;
(function (UserType) {
    UserType["INDIVIDUAL"] = "INDIVIDUAL";
    UserType["BUSINESS"] = "BUSINESS";
    UserType["ADMIN"] = "ADMIN";
})(UserType || (exports.UserType = UserType = {}));
var Plan;
(function (Plan) {
    Plan["FREE"] = "FREE";
    Plan["PRO"] = "PRO";
    Plan["PREMIUM"] = "PREMIUM";
    Plan["ENTERPRISE"] = "ENTERPRISE";
})(Plan || (exports.Plan = Plan = {}));
var PricingTier;
(function (PricingTier) {
    PricingTier["STANDARD"] = "STANDARD";
    PricingTier["BUSINESS"] = "BUSINESS";
    PricingTier["ENTERPRISE"] = "ENTERPRISE";
})(PricingTier || (exports.PricingTier = PricingTier = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType["BUSINESS"] = "BUSINESS";
    ResourceType["SERVICE"] = "SERVICE";
    ResourceType["DATA"] = "DATA";
    ResourceType["API"] = "API";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var ResourceStatus;
(function (ResourceStatus) {
    ResourceStatus["ACTIVE"] = "ACTIVE";
    ResourceStatus["PENDING"] = "PENDING";
    ResourceStatus["SUSPENDED"] = "SUSPENDED";
})(ResourceStatus || (exports.ResourceStatus = ResourceStatus = {}));
var ResourcePlan;
(function (ResourcePlan) {
    ResourcePlan["FREE"] = "FREE";
    ResourcePlan["PREMIUM"] = "PREMIUM";
    ResourcePlan["FEATURED"] = "FEATURED";
})(ResourcePlan || (exports.ResourcePlan = ResourcePlan = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
//# sourceMappingURL=index.js.map