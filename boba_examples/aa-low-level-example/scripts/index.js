"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var bundler_sdk_1 = require("@bobanetwork/bundler_sdk");
var ethers_1 = require("ethers");
var hardhat_1 = require("hardhat");
var SampleRecipient_json_1 = require("../artifacts/contracts/SampleRecipient.sol/SampleRecipient.json");
var addresses_json_1 = require("@bobanetwork/accountabstraction/deployments/boba_bnb_testnet/addresses.json");
var utils_js_1 = require("@eth-optimism/integration-tests/test/eth-l2/shared/utils.ts");
var request = require("request-promise-native");
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var SimpleAccount__factory, recipient, bundlerAddr, bundlerProvider, cfg, local_provider, aasigner, entryPointAddress, bundlerUrl, SampleRecipient__factory, gasLimit, l2PK, l2Wallet, l2PK_2, l2Wallet_2, useExistingRecipient, recipientAddress, result, _a, _b, config, aaProvider, walletAddress, tx, receipt, returnedlogIndex, log;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                cfg = hardhat_1["default"].network.config;
                local_provider = new ethers_1.providers.JsonRpcProvider(cfg['url']);
                aasigner = local_provider.getSigner();
                entryPointAddress = addresses_json_1["default"].L2_Boba_EntryPoint;
                bundlerUrl = hardhat_1["default"].network.config['bundler_url'];
                gasLimit = 8000000;
                l2PK = hardhat_1["default"].network.config.accounts[0];
                l2Wallet = new ethers_1.Wallet(l2PK, local_provider);
                l2PK_2 = hardhat_1["default"].network.config.accounts[1];
                l2Wallet_2 = new ethers_1.Wallet(l2PK_2, local_provider);
                useExistingRecipient = true // save gas when debugging
                ;
                recipientAddress = '0x78489aC02B2e683e3B7763Ba25AD02d2815f6651';
                if (!(hardhat_1["default"].network.name === 'boba_bnb_testnet')) return [3 /*break*/, 1];
                entryPointAddress = addresses_json_1["default"].L2_Boba_EntryPoint;
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, request.get({
                    uri: 'http://127.0.0.1:8080/aa-addr.json'
                })];
            case 2:
                result = _d.sent();
                entryPointAddress = result.L2_Boba_EntryPoint;
                _d.label = 3;
            case 3:
                SampleRecipient__factory = new ethers_1.ContractFactory(SampleRecipient_json_1["default"].abi, SampleRecipient_json_1["default"].bytecode, l2Wallet);
                if (!useExistingRecipient) return [3 /*break*/, 4];
                recipient = new ethers_1.Contract(recipientAddress, SampleRecipient_json_1["default"].abi, l2Wallet);
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, SampleRecipient__factory.deploy()];
            case 5:
                recipient = _d.sent();
                _d.label = 6;
            case 6:
                console.log('recipient', recipient.address);
                bundlerUrl = hardhat_1["default"].network.config.bundler_url;
                bundlerAddr = hardhat_1["default"].network.config.bundler_addr;
                console.log("Using Bundler: ", bundlerUrl);
                if (!bundlerUrl)
                    throw new Error('Bundler URL not defined in Hardhat config!');
                if (!bundlerAddr)
                    throw new Error('Bundler Address not defined in Hardhat config!');
                _a = bundler_sdk_1.HttpRpcClient.bind;
                _b = [void 0, bundlerUrl,
                    entryPointAddress];
                return [4 /*yield*/, l2Wallet.provider.getNetwork().then(function (net) { return net.chainId; })];
            case 7:
                bundlerProvider = new (_a.apply(bundler_sdk_1.HttpRpcClient, _b.concat([_d.sent()])))();
                _c = {};
                return [4 /*yield*/, local_provider.getNetwork().then(function (net) { return net.chainId; })];
            case 8:
                config = (_c.chainId = _d.sent(),
                    _c.entryPointAddress = entryPointAddress,
                    _c.bundlerUrl = bundlerUrl,
                    _c);
                console.log('config ', config);
                return [4 /*yield*/, (0, bundler_sdk_1.wrapProvider)(local_provider, config, aasigner, addresses_json_1["default"].L2_EntryPointWrapper, l2Wallet_2, hardhat_1["default"].network.name)];
            case 9:
                aaProvider = _d.sent();
                return [4 /*yield*/, aaProvider.getSigner().getAddress()];
            case 10:
                walletAddress = _d.sent();
                return [4 /*yield*/, l2Wallet.sendTransaction({
                        value: ethers_1.utils.parseEther('0.02'),
                        to: walletAddress,
                        gasLimit: gasLimit
                    })];
            case 11:
                _d.sent();
                recipient = recipient.connect(aaProvider.getSigner());
                return [4 /*yield*/, recipient.something('hello')];
            case 12:
                tx = _d.sent();
                return [4 /*yield*/, tx.wait()];
            case 13:
                receipt = _d.sent();
                return [4 /*yield*/, (0, utils_js_1.getFilteredLogIndex)(receipt, SampleRecipient_json_1["default"].abi, recipient.address, 'Sender')];
            case 14:
                returnedlogIndex = _d.sent();
                log = recipient.interface.parseLog(receipt.logs[returnedlogIndex]);
                console.log('log is', log);
                return [2 /*return*/];
        }
    });
}); };
(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, run()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })();
