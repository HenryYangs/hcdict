#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var http = require('http');
var cheerio = require('cheerio');
var ora = require('ora');
var argv = require('yargs').argv;
var _ = argv._.join(' ');
var spinner = ora('Translating...').start();
/**
 * encapsulation request
 */
var AsyncRequest = /** @class */ (function () {
    function AsyncRequest() {
        this.domain = 'http://dict.cn/';
    }
    /**
     * get
     */
    AsyncRequest.prototype.get = function (url) {
        var _this = this;
        var promise = new Promise(function (resolve) {
            http.get(encodeURI("" + _this.domain + url), function (res) {
                var statusCode = res.statusCode;
                if (statusCode !== 200) {
                    spinner.stop();
                    console.error("Error: status code is " + statusCode);
                    res.resume();
                    return;
                }
                var page = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    page += chunk;
                });
                res.on('end', function () {
                    try {
                        resolve(page);
                    }
                    catch (err) {
                        console.error(err);
                    }
                });
            }).on('error', function (err) {
                console.error("Error: " + err.message);
            });
        });
        return promise;
    };
    return AsyncRequest;
}());
/**
 * encapsulation data operations
 */
var Data = /** @class */ (function () {
    function Data(str) {
        this.lang = this.detectLang(str);
    }
    /**
     * analyse data
     * @param str {String} - web page which is requested from AsyncRequest
     */
    Data.prototype.analyse = function (str) {
        var $ = cheerio.load(str);
        var lang = this.lang;
        var $children = lang === 'cn' ? $('.layout.cn').children('ul').children() : $('.dict-basic-ul').children();
        var $length = lang === 'cn' ? $children.length : $children.length - 1;
        var result = [];
        if ($length) {
            for (var i = 0; i < $length; i++) {
                var child = $children[i];
                if (lang === 'cn') {
                    result.push({
                        translation: '- ' + $(child).children('a').text().replace(/\t/g, '').replace(/\n/g, '')
                    });
                }
                else {
                    if ($(child).children('span').length) {
                        result.push({
                            type: $(child).children('span').text(),
                            translation: $(child).children('strong').text().replace(/\t/g, '')
                        });
                    }
                    else {
                        result.push({
                            alias: $(child).children('strong').text()
                        });
                    }
                }
            }
        }
        this.$data = result;
    };
    /**
     * print result in cmd line
     */
    Data.prototype.output = function () {
        var result = this.$data;
        if (result.length) {
            for (var _i = 0, _a = this.$data; _i < _a.length; _i++) {
                var _arr = _a[_i];
                if (_arr.type) {
                    console.log(_arr.type + " " + _arr.translation);
                }
                else {
                    console.log("" + (_arr.alias || _arr.translation));
                }
            }
        }
        else {
            if (this.lang === 'cn') {
                console.log('暂无匹配翻译');
            }
            else {
                console.log("No appropriate translation");
            }
        }
    };
    /**
     * detect language when no parameter input from cmd line
     */
    Data.prototype.detectLang = function (str) {
        var lang = '';
        var code = str.charCodeAt(0);
        if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
            lang = 'en';
        }
        else {
            lang = 'cn';
        }
        return lang;
    };
    return Data;
}());
/**
 * main execution function
 */
function exec() {
    return __awaiter(this, void 0, void 0, function () {
        var request, $data, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    request = new AsyncRequest();
                    $data = new Data(_);
                    return [4 /*yield*/, request.get("" + _)];
                case 1:
                    response = _a.sent();
                    $data.analyse(response);
                    setTimeout(function () {
                        spinner.stop();
                        $data.output();
                    }, 200);
                    return [2 /*return*/];
            }
        });
    });
}
exec();
