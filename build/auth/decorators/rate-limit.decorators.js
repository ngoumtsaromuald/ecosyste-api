"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardIPRateLimit = exports.StrictIPRateLimit = exports.StandardUserRateLimit = exports.ConservativeUserRateLimit = exports.StrictUserRateLimit = exports.GenerousRateLimit = exports.StandardRateLimit = exports.ConservativeRateLimit = exports.StrictRateLimit = exports.RateLimitPresets = exports.SkipRateLimit = exports.IPRateLimit = exports.ApiKeyRateLimit = exports.UserRateLimit = exports.RateLimit = exports.SKIP_RATE_LIMIT_KEY = exports.IP_RATE_LIMIT_KEY = exports.API_KEY_RATE_LIMIT_KEY = exports.USER_RATE_LIMIT_KEY = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.RATE_LIMIT_KEY = 'rate_limit';
exports.USER_RATE_LIMIT_KEY = 'user_rate_limit';
exports.API_KEY_RATE_LIMIT_KEY = 'api_key_rate_limit';
exports.IP_RATE_LIMIT_KEY = 'ip_rate_limit';
exports.SKIP_RATE_LIMIT_KEY = 'skip_rate_limit';
const RateLimit = (options) => (0, common_1.SetMetadata)(exports.RATE_LIMIT_KEY, options);
exports.RateLimit = RateLimit;
const UserRateLimit = (options) => (0, common_1.SetMetadata)(exports.USER_RATE_LIMIT_KEY, options);
exports.UserRateLimit = UserRateLimit;
const ApiKeyRateLimit = (options) => (0, common_1.SetMetadata)(exports.API_KEY_RATE_LIMIT_KEY, options);
exports.ApiKeyRateLimit = ApiKeyRateLimit;
const IPRateLimit = (options) => (0, common_1.SetMetadata)(exports.IP_RATE_LIMIT_KEY, options);
exports.IPRateLimit = IPRateLimit;
const SkipRateLimit = () => (0, common_1.SetMetadata)(exports.SKIP_RATE_LIMIT_KEY, true);
exports.SkipRateLimit = SkipRateLimit;
exports.RateLimitPresets = {
    STRICT: { limit: 5, windowMs: 15 * 60 * 1000 },
    CONSERVATIVE: { limit: 10, windowMs: 15 * 60 * 1000 },
    STANDARD: { limit: 100, windowMs: 15 * 60 * 1000 },
    GENEROUS: { limit: 1000, windowMs: 15 * 60 * 1000 },
    PER_MINUTE_STRICT: { limit: 5, windowMs: 60 * 1000 },
    PER_MINUTE_STANDARD: { limit: 60, windowMs: 60 * 1000 },
    PER_MINUTE_GENEROUS: { limit: 300, windowMs: 60 * 1000 },
    PER_HOUR_STRICT: { limit: 100, windowMs: 60 * 60 * 1000 },
    PER_HOUR_STANDARD: { limit: 1000, windowMs: 60 * 60 * 1000 },
    PER_HOUR_GENEROUS: { limit: 10000, windowMs: 60 * 60 * 1000 },
};
const StrictRateLimit = () => (0, exports.RateLimit)(exports.RateLimitPresets.STRICT);
exports.StrictRateLimit = StrictRateLimit;
const ConservativeRateLimit = () => (0, exports.RateLimit)(exports.RateLimitPresets.CONSERVATIVE);
exports.ConservativeRateLimit = ConservativeRateLimit;
const StandardRateLimit = () => (0, exports.RateLimit)(exports.RateLimitPresets.STANDARD);
exports.StandardRateLimit = StandardRateLimit;
const GenerousRateLimit = () => (0, exports.RateLimit)(exports.RateLimitPresets.GENEROUS);
exports.GenerousRateLimit = GenerousRateLimit;
const StrictUserRateLimit = () => (0, exports.UserRateLimit)(exports.RateLimitPresets.STRICT);
exports.StrictUserRateLimit = StrictUserRateLimit;
const ConservativeUserRateLimit = () => (0, exports.UserRateLimit)(exports.RateLimitPresets.CONSERVATIVE);
exports.ConservativeUserRateLimit = ConservativeUserRateLimit;
const StandardUserRateLimit = () => (0, exports.UserRateLimit)(exports.RateLimitPresets.STANDARD);
exports.StandardUserRateLimit = StandardUserRateLimit;
const StrictIPRateLimit = () => (0, exports.IPRateLimit)(exports.RateLimitPresets.PER_MINUTE_STRICT);
exports.StrictIPRateLimit = StrictIPRateLimit;
const StandardIPRateLimit = () => (0, exports.IPRateLimit)(exports.RateLimitPresets.PER_MINUTE_STANDARD);
exports.StandardIPRateLimit = StandardIPRateLimit;
//# sourceMappingURL=rate-limit.decorators.js.map