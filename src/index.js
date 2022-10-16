"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
        while (_) try {
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var AWS = require("aws-sdk");
var uuid_1 = require("uuid");
var fs = require("fs");
var path = require("path");
var mime = require("mime-types");
var GetFileExt_1 = require("./GetFileExt");
var ReadDir_1 = require("./ReadDir");
/**
 * Создание объекта для работы с S3 хранилищем
 */
var EasyYandexS3 = /** @class */ (function () {
    function EasyYandexS3(params) {
        /**
         *
         * @param {Object} params Параметры соединения, 4 обязательных параметра.
         * @param {Object} params.auth Обязательно. Данные для доступа от сервисного аккаунта
         * @param {String} params.auth.accessKeyId Обязательно. Идентификатор ключа сервисного аккаунта
         * @param {String} params.auth.secretAccessKey Обязательно. Cекретный ключ сервисного аккаунта
         * @param {String} params.Bucket Обязательно. ID бакета
         *
         * @param {String=} params.endpointUrl Необязательно. Ссылка на S3 сервер, например, на storage.yandexcloud.net
         * @param {String=} params.region Необязательно. Регион загрузки
         * @param {Object=} params.httpOptions Необязательно. Установки http-запроса
         * @param {Boolean=} params.debug Необязательно. Вывод дополнительной информации в консоль
         */
        this.default_params = {
            endpointUrl: 'https://storage.yandexcloud.net',
            auth: {
                accessKeyId: '',
                secretAccessKey: ''
            },
            region: 'us-east-1',
            httpOptions: {
                timeout: 10000,
                connectTimeout: 10000
            },
            Bucket: '',
            debug: false
        };
        this.threads = {};
        this.defaultIgnoreList = ['.DS_Store'];
        var newParams = __assign(__assign({}, this.default_params), params);
        // Legacy support for old params
        if (params.endpoint_url)
            newParams.endpointUrl = params.endpoint_url;
        this.s3 = new AWS.S3({
            endpoint: new AWS.Endpoint(newParams.endpointUrl),
            accessKeyId: newParams.auth.accessKeyId,
            secretAccessKey: newParams.auth.secretAccessKey,
            region: newParams.region,
            httpOptions: newParams.httpOptions
        });
        this.debug = newParams.debug;
        this.Bucket = params.Bucket;
    }
    EasyYandexS3.prototype._log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return console.log.apply(console, __spreadArray(["[".concat(new Date().toUTCString(), "] ")], args, false));
    };
    /**
     * Загрузка файла
     * @param {Object|Array<Object>} file Буфер файла и информация о расширении. Или путь к файлу.
     * @param {Buffer=} file.buffer Буфер файла
     * @param {String=} file.path Путь к файлу
     * @param {Boolean=} file.save_name Оставить оригинальное название файла. Работает только в случае передачи пути к файлу.
     * @param {String=} file.name Устаналивает название загружаемому файлу. Передавать с расширением.
     * @param {Array=} file.ignore Список игнорируемых файлов и папок
     *
     *
     * @param {String} route Папка загрузки - бакет
     *
     * @returns {Promise<Object>} Результат загрузки
     */
    EasyYandexS3.prototype.Upload = function (file, route) {
        return __awaiter(this, void 0, void 0, function () {
            var debug, debugObject, files, u, dirPath, ignoreList, u, fileAttributes, fileBody, fileExt, fileUploadName, uniqueName, uploadRoute, Key, Body, s3, Bucket, ContentType, params, s3Promise, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof route !== 'string') {
                            throw new Error('route (2nd argument) is not defined');
                        }
                        debug = this.debug;
                        debugObject = 'upload';
                        if (!Array.isArray(file)) return [3 /*break*/, 2];
                        files = file;
                        if (files.length === 0)
                            throw new Error('file array is empty');
                        if (debug)
                            this._log('S3', debugObject, 'array to upload:', files.length);
                        return [4 /*yield*/, this._uploadArray(files, route)];
                    case 1:
                        u = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'array upload done', u.length, 'files');
                        return [2 /*return*/, u];
                    case 2:
                        if (!file.path) return [3 /*break*/, 4];
                        file.path = path.join(file.path);
                        if (!fs.existsSync(file.path))
                            throw new Error("file/directory on path is not found (".concat(file.path, ")"));
                        if (!fs.lstatSync(file.path).isDirectory()) return [3 /*break*/, 4];
                        dirPath = file.path;
                        if (debug)
                            this._log('S3', debugObject, 'folder to upload found', file.path);
                        if (!file.ignore)
                            file.ignore = [];
                        ignoreList = __spreadArray(__spreadArray([], this.defaultIgnoreList, true), file.ignore, true);
                        return [4 /*yield*/, this._uploadDirectory(dirPath, file, route, ignoreList)];
                    case 3:
                        u = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'folder upload done', u.length, 'files');
                        return [2 /*return*/, u];
                    case 4:
                        fileAttributes = this._getFileAttributes(file, debugObject);
                        fileBody = fileAttributes.fileBody, fileExt = fileAttributes.fileExt;
                        fileUploadName = fileAttributes.fileUploadName;
                        route = route.replace(/\\/g, '/');
                        if (route.slice(-1) !== '/')
                            route += '/';
                        if (route[0] === '/')
                            route = route.slice(1);
                        if (!fileUploadName) {
                            uniqueName = (0, uuid_1.v4)();
                            fileUploadName = "".concat(uniqueName).concat(fileExt);
                        }
                        uploadRoute = route;
                        Key = "".concat(uploadRoute).concat(fileUploadName);
                        Body = fileBody;
                        s3 = this.s3;
                        Bucket = this.Bucket;
                        ContentType = mime.lookup(fileUploadName) || 'text/plain';
                        params = { Bucket: Bucket, Key: Key, Body: Body, ContentType: ContentType };
                        if (debug)
                            this._log('S3', debugObject, 'started');
                        if (debug)
                            this._log('S3', debugObject, params);
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                s3.upload(params, function (err, data) {
                                    if (err)
                                        return reject(err);
                                    return resolve(data);
                                });
                            })];
                    case 6:
                        s3Promise = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'done:', s3Promise);
                        return [2 /*return*/, s3Promise];
                    case 7:
                        error_1 = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'error:', error_1);
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    EasyYandexS3.prototype._getFileAttributes = function (file, debugObject) {
        var fileBody;
        var fileExt;
        var fileUploadName;
        var debug = this.debug;
        if (file.path) {
            fileBody = fs.readFileSync(file.path);
            fileExt = path.extname(file.path);
            if (file.save_name)
                fileUploadName = path.basename(file.path);
            if (file.name)
                fileUploadName = file.name;
        }
        else {
            fileBody = file.buffer;
            try {
                fileExt = ".".concat((0, GetFileExt_1["default"])(file));
            }
            catch (error) {
                if (debug)
                    this._log('S3', debugObject, 'error:', error);
            }
            if (file.name)
                fileUploadName = file.name;
        }
        return { fileBody: fileBody, fileExt: fileExt, fileUploadName: fileUploadName };
    };
    EasyYandexS3.prototype._uploadDirectory = function (dir, params, route, ignoreList) {
        return __awaiter(this, void 0, void 0, function () {
            var debug, debugObject, dirContent, s3Promises, _i, dirContent_1, file, s3Promise;
            return __generator(this, function (_a) {
                debug = this.debug;
                debugObject = '_uploadDirectory';
                dirContent = (0, ReadDir_1["default"])(dir, dir, ignoreList);
                if (debug)
                    this._log('S3', debugObject, 'Promises length:', dirContent.length);
                s3Promises = [];
                for (_i = 0, dirContent_1 = dirContent; _i < dirContent_1.length; _i++) {
                    file = dirContent_1[_i];
                    params.path = file.fullFilePath;
                    if (params.name)
                        params.name = false;
                    if (params.save_name)
                        params.name = file.fileName;
                    if (debug)
                        this._log('S3', debugObject, 'dir file uploading:', route, 'to', file.relativeDirPath);
                    s3Promise = this.Upload(params, path.join(route, file.relativeDirPath));
                    s3Promises.push(s3Promise);
                }
                return [2 /*return*/, Promise.all(s3Promises)];
            });
        });
    };
    EasyYandexS3.prototype._uploadArray = function (array, route) {
        return __awaiter(this, void 0, void 0, function () {
            var uploaded, _i, array_1, file, u;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uploaded = [];
                        _i = 0, array_1 = array;
                        _a.label = 1;
                    case 1:
                        if (!(_i < array_1.length)) return [3 /*break*/, 4];
                        file = array_1[_i];
                        return [4 /*yield*/, this.Upload(file, route)];
                    case 2:
                        u = _a.sent();
                        uploaded.push(u);
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, uploaded];
                }
            });
        });
    };
    /**
     * Получение списка директорий и папок
     * @param {String=} route Необязательно. Путь к папке, которую смотрим
     *
     * @returns {Promise<Object>} Результат просмотра
     */
    EasyYandexS3.prototype.GetList = function (route) {
        return __awaiter(this, void 0, void 0, function () {
            var s3, Bucket, params, debug, debugObject, s3Promise, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!route)
                            route = '/';
                        if (route === './')
                            route = '/';
                        if (route)
                            route += route.slice(-1) !== '/' ? '/' : '';
                        if (route[0] === '.')
                            route = route.slice(1);
                        if (route[0] === '/')
                            route = route.slice(1);
                        s3 = this.s3;
                        Bucket = this.Bucket;
                        params = {
                            Bucket: Bucket,
                            Prefix: route,
                            Delimiter: '/'
                        };
                        debug = this.debug;
                        debugObject = 'listObjectsV2';
                        if (debug)
                            this._log('S3', debugObject, 'started');
                        if (debug)
                            this._log('S3', debugObject, params);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                s3.listObjectsV2(params, function (err, data) {
                                    if (err)
                                        return reject(err);
                                    return resolve(data);
                                });
                            })];
                    case 2:
                        s3Promise = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'done:', s3Promise);
                        return [2 /*return*/, s3Promise];
                    case 3:
                        error_2 = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'error:', error_2);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Скачивание файла
     * @param {String} routeFullPath Полный путь до файла. С папками, с названием и расширением файла
     * @param {String=} destinationFullPath Необязательно. Куда сохраняем файл. Абсолютный или относительный, с названием и расширением файла
     *
     * @returns {Promise<Object>} Результат скачивания и сохранения
     */
    EasyYandexS3.prototype.Download = function (routeFullPath, destinationFullPath) {
        return __awaiter(this, void 0, void 0, function () {
            var s3, Bucket, Key, params, debug, debugObject, s3Promise, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (routeFullPath[0] === '/')
                            routeFullPath = routeFullPath.slice(1);
                        if (!destinationFullPath)
                            destinationFullPath = false;
                        s3 = this.s3;
                        Bucket = this.Bucket;
                        Key = routeFullPath;
                        params = {
                            Bucket: Bucket,
                            Key: Key
                        };
                        debug = this.debug;
                        debugObject = 'getObject';
                        if (debug)
                            this._log('S3', debugObject, 'started');
                        if (debug)
                            this._log('S3', debugObject, params);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                s3.getObject(params, function (err, data) {
                                    if (err)
                                        return reject(err);
                                    // data
                                    var fileReplaced = false;
                                    if (destinationFullPath) {
                                        var objectData = data.Body;
                                        if (fs.existsSync(destinationFullPath))
                                            fileReplaced = true;
                                        fs.createWriteStream(destinationFullPath).write(objectData);
                                    }
                                    return resolve({
                                        data: data,
                                        destinationFullPath: destinationFullPath,
                                        fileReplaced: fileReplaced
                                    });
                                });
                            })];
                    case 2:
                        s3Promise = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'done:', s3Promise);
                        return [2 /*return*/, s3Promise];
                    case 3:
                        error_3 = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'error:', error_3);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Удаление файла из хранилища
     * @param {String} routeFullPath Полный путь до файла. С папками, с названием и расширением файла
     *
     * @returns {Promise<Object>} Результат удаления
     */
    EasyYandexS3.prototype.Remove = function (routeFullPath) {
        return __awaiter(this, void 0, void 0, function () {
            var s3, Bucket, Key, params, debug, debugObject, s3Promise, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (routeFullPath[0] === '/')
                            routeFullPath = routeFullPath.slice(1);
                        s3 = this.s3;
                        Bucket = this.Bucket;
                        Key = routeFullPath;
                        params = { Bucket: Bucket, Key: Key };
                        debug = this.debug;
                        debugObject = 'deleteObject';
                        if (debug)
                            this._log('S3', debugObject, 'started');
                        if (debug)
                            this._log('S3', debugObject, params);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                s3.deleteObject(params, function (err) {
                                    if (err)
                                        return reject(err);
                                    return resolve(true);
                                });
                            })];
                    case 2:
                        s3Promise = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'done:', s3Promise);
                        return [2 /*return*/, s3Promise];
                    case 3:
                        error_4 = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'error:', error_4);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Удаление всех файлов с бакета
     * @returns {Promise<Object>} Результат удаления
     */
    EasyYandexS3.prototype.CleanUp = function () {
        return __awaiter(this, void 0, void 0, function () {
            var Bucket, s3, debug, debugObject, objects, error_5, s3Promises, chunk, _loop_1, i, s3Promise, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Bucket = this.Bucket;
                        s3 = this.s3;
                        debug = this.debug;
                        debugObject = 'deleteObjects';
                        if (debug)
                            this._log('S3', debugObject, 'started');
                        if (debug)
                            this._log('S3', debugObject, { Bucket: Bucket });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this._getAllObjects()];
                    case 2:
                        objects = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'error:', error_5);
                        return [2 /*return*/, false];
                    case 4:
                        s3Promises = [];
                        chunk = [];
                        _loop_1 = function (i) {
                            var index = i - 1;
                            chunk.push({ Key: objects[index].Key });
                            if (i % 1000 === 0 || i === objects.length) {
                                var params_1 = {
                                    Bucket: Bucket,
                                    Delete: {
                                        Objects: chunk.slice(),
                                        Quiet: !debug
                                    }
                                };
                                var s3Promise = new Promise(function (resolve, reject) {
                                    s3.deleteObjects(params_1, function (err, data) {
                                        if (err)
                                            return reject(err);
                                        return resolve(data);
                                    });
                                });
                                s3Promises.push(s3Promise);
                                chunk = [];
                            }
                        };
                        for (i = 1; i <= objects.length; i++) {
                            _loop_1(i);
                        }
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, Promise.all(s3Promises)];
                    case 6:
                        s3Promise = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'done:', s3Promise);
                        return [2 /*return*/, s3Promise];
                    case 7:
                        error_6 = _a.sent();
                        if (debug)
                            this._log('S3', debugObject, 'error:', error_6);
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    EasyYandexS3.prototype._getAllObjects = function () {
        return __awaiter(this, void 0, void 0, function () {
            var objects, helper;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        objects = [];
                        helper = function (token) {
                            if (token === void 0) { token = ""; }
                            return __awaiter(_this, void 0, void 0, function () {
                                var Bucket, s3, params;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            Bucket = this.Bucket;
                                            s3 = this.s3;
                                            params = {
                                                Bucket: Bucket
                                            };
                                            if (token)
                                                params.ContinuationToken = token;
                                            return [4 /*yield*/, new Promise(function (resolve, reject) {
                                                    s3.listObjectsV2(params, function (err, data) { return __awaiter(_this, void 0, void 0, function () {
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0:
                                                                    if (err)
                                                                        return [2 /*return*/, reject(err)];
                                                                    objects = objects.concat(data.Contents);
                                                                    if (!data.IsTruncated) return [3 /*break*/, 2];
                                                                    return [4 /*yield*/, helper(data.NextContinuationToken)];
                                                                case 1:
                                                                    _a.sent();
                                                                    _a.label = 2;
                                                                case 2: return [2 /*return*/, resolve(true)];
                                                            }
                                                        });
                                                    }); });
                                                })];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        };
                        return [4 /*yield*/, helper()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, objects];
                }
            });
        });
    };
    return EasyYandexS3;
}());
exports["default"] = EasyYandexS3;
