"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacetEventType = exports.FacetOperator = exports.FacetType = void 0;
var FacetType;
(function (FacetType) {
    FacetType["TERMS"] = "terms";
    FacetType["RANGE"] = "range";
    FacetType["DATE_HISTOGRAM"] = "date_histogram";
    FacetType["HISTOGRAM"] = "histogram";
    FacetType["GEO_DISTANCE"] = "geo_distance";
    FacetType["NESTED"] = "nested";
})(FacetType || (exports.FacetType = FacetType = {}));
var FacetOperator;
(function (FacetOperator) {
    FacetOperator["AND"] = "and";
    FacetOperator["OR"] = "or";
    FacetOperator["NOT"] = "not";
})(FacetOperator || (exports.FacetOperator = FacetOperator = {}));
var FacetEventType;
(function (FacetEventType) {
    FacetEventType["SELECTED"] = "selected";
    FacetEventType["DESELECTED"] = "deselected";
    FacetEventType["EXPANDED"] = "expanded";
    FacetEventType["COLLAPSED"] = "collapsed";
    FacetEventType["CLEARED"] = "cleared";
})(FacetEventType || (exports.FacetEventType = FacetEventType = {}));
//# sourceMappingURL=facet.types.js.map