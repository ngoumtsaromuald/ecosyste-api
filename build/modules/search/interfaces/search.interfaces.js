"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SortOrder = exports.SortField = exports.TimePeriod = void 0;
var TimePeriod;
(function (TimePeriod) {
    TimePeriod["HOUR"] = "hour";
    TimePeriod["DAY"] = "day";
    TimePeriod["WEEK"] = "week";
    TimePeriod["MONTH"] = "month";
    TimePeriod["YEAR"] = "year";
})(TimePeriod || (exports.TimePeriod = TimePeriod = {}));
var SortField;
(function (SortField) {
    SortField["RELEVANCE"] = "relevance";
    SortField["NAME"] = "name";
    SortField["CREATED_AT"] = "createdAt";
    SortField["UPDATED_AT"] = "updatedAt";
    SortField["POPULARITY"] = "popularity";
    SortField["RATING"] = "rating";
    SortField["DISTANCE"] = "distance";
})(SortField || (exports.SortField = SortField = {}));
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "asc";
    SortOrder["DESC"] = "desc";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
//# sourceMappingURL=search.interfaces.js.map