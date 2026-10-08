"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiAirPurifier = void 0;
const events_1 = require("events");
const miio = __importStar(require("node-miio"));
const mi_air_purifier_constants_1 = require("./mi-air-purifier-constants");
if (miio.models && !miio.models["zhimi.airpurifier.mc1"]) {
    miio.models["zhimi.airpurifier.mc1"] = miio.models["zhimi.airpurifier.ma2"];
}
class MiAirPurifier extends events_1.EventEmitter {
    constructor(ipAddress, token) {
        super();
        this.ipAddress = ipAddress;
        this.token = token;
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_DEBUG_LOG, "Disconnect from device.");
            if (this.device) {
                yield this.device.destroy();
            }
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_DEBUG_LOG, `Connect to device: ${this.ipAddress}`);
            this.device = yield miio.device({
                address: this.ipAddress,
                token: this.token
            });
            if (this.device.matches("type:air-purifier")) {
                return true;
            }
            else {
                return false;
            }
        });
    }
    subscribeToValues() {
        this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_DEBUG_LOG, "subscribeToValues");
        this.device.on("powerChanged", (isOn) => this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_POWER, isOn));
        this.device.on("modeChanged", (mode) => this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_MODE, mode));
        this.device.on("temperatureChanged", (temp) => this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_TEMPERATURE, temp));
        this.device.on("relativeHumidityChanged", (rh) => this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_HUMIDITY, rh));
        this.device.on("pm2.5Changed", (pm25) => this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_PM25, pm25));
        this.device.on("favoriteLevel", (favoriteLevel) => this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_MANUALLEVEL, favoriteLevel));
    }
    checkValues() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!!this.emit && typeof this.emit === "function") {
                this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_DEBUG_LOG, "checkValues");
                const miioProperties = this.device.miioProperties();
                this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_POWER, miioProperties.power);
                this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_MODE, miioProperties.mode);
                this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_MANUALLEVEL, miioProperties.favoriteLevel);
                this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_TEMPERATURE, miioProperties.temperature);
                this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_HUMIDITY, miioProperties.humidity);
                this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_PM25, miioProperties.aqi);
                this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_BUZZER, miioProperties.buzzer);
                this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_LED, miioProperties.led);
                this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_FILTER_REMAINING, miioProperties.filterLifeRemaining);
                this.emit(mi_air_purifier_constants_1.EVENT_AIR_PURIFIER_FILTER_USED, miioProperties.filterHoursUsed);
            }
        });
    }
    setPower(power) {
        return this.device.power(power);
    }
    setMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (["auto", "silent", "favorite"].some(possibleMode => possibleMode === mode)) {
                const result = yield this.device.setMode(mode);
                return result === mode;
            }
            return false;
        });
    }
    setFavoriteLevel(favoriteLevel) {
        if (favoriteLevel >= 0 && favoriteLevel <= 16) {
            return this.device.setFavoriteLevel(favoriteLevel);
        }
    }
    setBuzzer(buzzer) {
        if (!!this.device.buzzer && typeof this.device.buzzer === "function") {
            return this.device.buzzer(buzzer);
        }
    }
    setLed(led) {
        if (!!this.device.led && typeof this.device.led === "function") {
            return this.device.led(led);
        }
    }
}
exports.MiAirPurifier = MiAirPurifier;
;
