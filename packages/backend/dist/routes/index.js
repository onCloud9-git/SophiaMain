"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessRoutes = exports.authRoutes = void 0;
var auth_routes_1 = require("./auth.routes");
Object.defineProperty(exports, "authRoutes", { enumerable: true, get: function () { return __importDefault(auth_routes_1).default; } });
var business_routes_1 = require("./business.routes");
Object.defineProperty(exports, "businessRoutes", { enumerable: true, get: function () { return business_routes_1.businessRoutes; } });
//# sourceMappingURL=index.js.map