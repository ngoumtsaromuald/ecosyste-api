"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionEventType = exports.SuggestionType = void 0;
var SuggestionType;
(function (SuggestionType) {
    SuggestionType["QUERY"] = "query";
    SuggestionType["RESOURCE"] = "resource";
    SuggestionType["CATEGORY"] = "category";
    SuggestionType["TAG"] = "tag";
    SuggestionType["LOCATION"] = "location";
})(SuggestionType || (exports.SuggestionType = SuggestionType = {}));
var SuggestionEventType;
(function (SuggestionEventType) {
    SuggestionEventType["REQUESTED"] = "requested";
    SuggestionEventType["DISPLAYED"] = "displayed";
    SuggestionEventType["SELECTED"] = "selected";
    SuggestionEventType["EXECUTED"] = "executed";
    SuggestionEventType["DISMISSED"] = "dismissed";
})(SuggestionEventType || (exports.SuggestionEventType = SuggestionEventType = {}));
//# sourceMappingURL=suggestion.types.js.map