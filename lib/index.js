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
Object.defineProperty(exports, "__esModule", { value: true });
const AWS = require("aws-sdk");
const uuid_1 = require("uuid");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const GetFileExt_1 = require("./GetFileExt");
const ReadDir_1 = require("./ReadDir");
/**
 * Создание объекта для работы с S3 хранилищем
 */
class EasyYandexS3 {
    constructor(params) {
        /**
         *
         * @param {Object} params Параметры соединения, 4 обязательных параметра.
         * @param {Object} params.auth Обязательно. Данные для доступа от сервисного аккаунта
         * @param {string} params.auth.accessKeyId Обязательно. Идентификатор ключа сервисного аккаунта
         * @param {string} params.auth.secretAccessKey Обязательно. Cекретный ключ сервисного аккаунта
         * @param {string} params.Bucket Обязательно. ID бакета
         *
         * @param {string=} params.endpointUrl Необязательно. Ссылка на S3 сервер, например, на storage.yandexcloud.net
         * @param {string=} params.region Необязательно. Регион загрузки
         * @param {Object=} params.httpOptions Необязательно. Установки http-запроса
         * @param {boolean=} params.debug Необязательно. Вывод дополнительной информации в консоль
         *
         */
        this.default_params = {
            endpointUrl: 'https://storage.yandexcloud.net',
            auth: {
                accessKeyId: '',
                secretAccessKey: '',
            },
            region: 'us-east-1',
            httpOptions: {
                timeout: 10000,
                connectTimeout: 10000,
            },
            Bucket: '',
            debug: false,
        };
        this.threads = {};
        this.defaultIgnoreList = ['.DS_Store'];
        const newParams = Object.assign(Object.assign({}, this.default_params), params);
        // Support for legacy params
        if (params.endpoint_url)
            newParams.endpointUrl = params.endpoint_url;
        this.s3 = new AWS.S3({
            endpoint: new AWS.Endpoint(newParams.endpointUrl),
            accessKeyId: newParams.auth.accessKeyId,
            secretAccessKey: newParams.auth.secretAccessKey,
            region: newParams.region,
            httpOptions: newParams.httpOptions,
        });
        this.debug = newParams.debug;
        this.Bucket = params.Bucket;
    }
    _log(...args) {
        return console.log(`[${new Date().toUTCString()}] `, ...args);
    }
    /**
     * Загрузка файла
     * @param {UploadFile|UploadFile[]} file Буфер файла и информация о расширении. Или путь к файлу.
     * @param {Buffer=} file.buffer Буфер файла
     * @param {string=} file.path Путь к файлу
     * @param {boolean=} file.save_name Оставить оригинальное название файла. Работает только в случае передачи пути к файлу.
     * @param {string=} file.name Устаналивает название загружаемому файлу. Передавать с расширением.
     * @param {Array=} file.ignore Список игнорируемых файлов и папок
     *
     *
     * @param {string} route Папка загрузки - бакет
     *
     * @returns {Promise<Object>} Результат загрузки
     */
    Upload(file, route) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof route !== 'string') {
                throw new Error('route (2nd argument) is not defined');
            }
            const { debug } = this;
            const debugObject = 'upload';
            if (Array.isArray(file)) {
                const files = file;
                if (files.length === 0)
                    throw new Error('file array is empty');
                if (debug)
                    this._log('S3', debugObject, 'array to upload:', files.length);
                const u = yield this._uploadArray(files, route);
                if (debug)
                    this._log('S3', debugObject, 'array upload done', u.length, 'files');
                return u;
            }
            if ('path' in file) {
                file.path = path.join(file.path);
                if (!fs.existsSync(file.path))
                    throw new Error(`file/directory on path is not found (${file.path})`);
                if (fs.lstatSync(file.path).isDirectory()) {
                    const dirPath = file.path;
                    if (debug)
                        this._log('S3', debugObject, 'folder to upload found', file.path);
                    if (!file.ignore)
                        file.ignore = [];
                    const ignoreList = [...this.defaultIgnoreList, ...file.ignore];
                    const u = yield this._uploadDirectory(dirPath, file, route, ignoreList);
                    if (debug)
                        this._log('S3', debugObject, 'folder upload done', u.length, 'files');
                    return u;
                }
            }
            const fileAttributes = this._getFileAttributes(file, debugObject);
            const { fileBody, fileExt } = fileAttributes;
            let { fileUploadName } = fileAttributes;
            route = route.replace(/\\/g, '/');
            if (route.slice(-1) !== '/')
                route += '/';
            if (route[0] === '/')
                route = route.slice(1);
            if (!fileUploadName) {
                const uniqueName = (0, uuid_1.v4)();
                fileUploadName = `${uniqueName}${fileExt}`;
            }
            const uploadRoute = route;
            const Key = `${uploadRoute}${fileUploadName}`;
            const Body = fileBody;
            const { s3 } = this;
            const { Bucket } = this;
            const ContentType = mime.lookup(fileUploadName) || 'text/plain';
            const params = { Bucket, Key, Body, ContentType };
            if (debug)
                this._log('S3', debugObject, 'started');
            if (debug)
                this._log('S3', debugObject, params);
            try {
                const s3Promise = yield new Promise((resolve, reject) => {
                    s3.upload(params, (err, data) => {
                        if (err)
                            return reject(err);
                        return resolve(data);
                    });
                });
                if (debug)
                    this._log('S3', debugObject, 'done:', s3Promise);
                return s3Promise;
            }
            catch (error) {
                if (debug)
                    this._log('S3', debugObject, 'error:', error);
                return false;
            }
        });
    }
    _getFileAttributes(file, debugObject) {
        let fileBody;
        let fileExt;
        let fileUploadName;
        const { debug } = this;
        if ('path' in file) {
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
                fileExt = `.${(0, GetFileExt_1.default)(file)}`;
            }
            catch (error) {
                if (debug)
                    this._log('S3', debugObject, 'error:', error);
            }
            if (file.name)
                fileUploadName = file.name;
        }
        return { fileBody, fileExt, fileUploadName };
    }
    _uploadDirectory(dir, params, route, ignoreList) {
        return __awaiter(this, void 0, void 0, function* () {
            const { debug } = this;
            const debugObject = '_uploadDirectory';
            const dirContent = (0, ReadDir_1.default)(dir, dir, ignoreList);
            if (debug)
                this._log('S3', debugObject, 'Promises length:', dirContent.length);
            const s3Promises = [];
            for (const file of dirContent) {
                let file_path = file.fullFilePath;
                let file_set_name = params.name;
                let file_original_name = file.fileName;
                let final_name = "";
                let save_name = 'save_name' in params;
                if ('save_name' in params)
                    final_name = params.save_name ? file_original_name : (file_set_name || undefined);
                if (debug)
                    this._log('S3', debugObject, 'dir file uploading:', route, 'to', file.relativeDirPath);
                const s3Promise = this.Upload({
                    path: file_path,
                    name: final_name,
                    save_name
                }, path.join(route, file.relativeDirPath));
                s3Promises.push(s3Promise);
            }
            return Promise.all(s3Promises);
        });
    }
    _uploadArray(files, route) {
        return __awaiter(this, void 0, void 0, function* () {
            const uploaded = [];
            for (const file of files) {
                const u = yield this.Upload(file, route);
                uploaded.push(u);
            }
            return uploaded;
        });
    }
    /**
     * Получение списка директорий и папок
     * @param {string=} route Необязательно. Путь к папке, которую смотрим
     *
     * @returns {Promise<S3.ListObjectsV2Output>} Результат просмотра
     */
    GetList(route) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const { s3 } = this;
            const { Bucket } = this;
            const params = {
                Bucket,
                Prefix: route,
                Delimiter: '/',
            };
            const { debug } = this;
            const debugObject = 'listObjectsV2';
            if (debug)
                this._log('S3', debugObject, 'started');
            if (debug)
                this._log('S3', debugObject, params);
            try {
                const s3Promise = yield new Promise((resolve, reject) => {
                    s3.listObjectsV2(params, (err, data) => {
                        if (err)
                            return reject(err);
                        return resolve(data);
                    });
                });
                if (debug)
                    this._log('S3', debugObject, 'done:', s3Promise);
                return s3Promise;
            }
            catch (error) {
                if (debug)
                    this._log('S3', debugObject, 'error:', error);
                return false;
            }
        });
    }
    /**
     * Скачивание файла
     * @param {string} routeFullPath Полный путь до файла. С папками, с названием и расширением файла
     * @param {string=} destinationFullPath Необязательно. Куда сохраняем файл. Абсолютный или относительный, с названием и расширением файла
     *
     * @returns {Promise<Object>} Результат скачивания и сохранения
     */
    Download(routeFullPath, destinationFullPath = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (routeFullPath[0] === '/')
                routeFullPath = routeFullPath.slice(1);
            if (!destinationFullPath)
                destinationFullPath = false;
            const { s3 } = this;
            const { Bucket } = this;
            const Key = routeFullPath;
            const params = {
                Bucket,
                Key,
            };
            const { debug } = this;
            const debugObject = 'getObject';
            if (debug)
                this._log('S3', debugObject, 'started');
            if (debug)
                this._log('S3', debugObject, params);
            try {
                const s3Promise = yield new Promise((resolve, reject) => {
                    s3.getObject(params, (err, data) => {
                        if (err)
                            return reject(err);
                        // data
                        let fileReplaced = false;
                        if (destinationFullPath) {
                            const objectData = data.Body;
                            if (fs.existsSync(destinationFullPath))
                                fileReplaced = true;
                            fs.createWriteStream(destinationFullPath).write(objectData);
                        }
                        return resolve({
                            data,
                            destinationFullPath,
                            fileReplaced,
                        });
                    });
                });
                if (debug)
                    this._log('S3', debugObject, 'done:', s3Promise);
                return s3Promise;
            }
            catch (error) {
                if (debug)
                    this._log('S3', debugObject, 'error:', error);
                return false;
            }
        });
    }
    /**
     * Удаление файла из хранилища
     * @param {string} routeFullPath Полный путь до файла. С папками, с названием и расширением файла
     *
     * @returns {Promise<Object>} Результат удаления
     */
    Remove(routeFullPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (routeFullPath[0] === '/')
                routeFullPath = routeFullPath.slice(1);
            const { s3 } = this;
            const { Bucket } = this;
            const Key = routeFullPath;
            const params = { Bucket, Key };
            const { debug } = this;
            const debugObject = 'deleteObject';
            if (debug)
                this._log('S3', debugObject, 'started');
            if (debug)
                this._log('S3', debugObject, params);
            try {
                const s3Promise = yield new Promise((resolve, reject) => {
                    s3.deleteObject(params, (err) => {
                        if (err)
                            return reject(err);
                        return resolve(true);
                    });
                });
                if (debug)
                    this._log('S3', debugObject, 'done:', s3Promise);
                return s3Promise;
            }
            catch (error) {
                if (debug)
                    this._log('S3', debugObject, 'error:', error);
                return false;
            }
        });
    }
    /**
     * Удаление всех файлов с бакета
     * @returns {Promise<Object>} Результат удаления
     */
    CleanUp() {
        return __awaiter(this, void 0, void 0, function* () {
            const { Bucket } = this;
            const { s3 } = this;
            const { debug } = this;
            const debugObject = 'deleteObjects';
            if (debug)
                this._log('S3', debugObject, 'started');
            if (debug)
                this._log('S3', debugObject, { Bucket });
            let objects;
            try {
                objects = yield this._getAllObjects();
            }
            catch (error) {
                if (debug)
                    this._log('S3', debugObject, 'error:', error);
                return false;
            }
            const s3Promises = [];
            let chunk = [];
            for (let i = 1; i <= objects.length; i++) {
                const index = i - 1;
                chunk.push({ Key: objects[index].Key });
                if (i % 1000 === 0 || i === objects.length) {
                    const params = {
                        Bucket,
                        Delete: {
                            Objects: chunk.slice(),
                            Quiet: !debug,
                        },
                    };
                    const s3Promise = new Promise((resolve, reject) => {
                        s3.deleteObjects(params, (err, data) => {
                            if (err)
                                return reject(err);
                            return resolve(data);
                        });
                    });
                    s3Promises.push(s3Promise);
                    chunk = [];
                }
            }
            try {
                const s3Promise = yield Promise.all(s3Promises);
                if (debug)
                    this._log('S3', debugObject, 'done:', s3Promise);
                return s3Promise;
            }
            catch (error) {
                if (debug)
                    this._log('S3', debugObject, 'error:', error);
                return false;
            }
        });
    }
    _getAllObjects() {
        return __awaiter(this, void 0, void 0, function* () {
            let objects = [];
            const helper = (token = "") => __awaiter(this, void 0, void 0, function* () {
                const { Bucket } = this;
                const { s3 } = this;
                const params = {
                    Bucket
                };
                if (token)
                    params.ContinuationToken = token;
                yield new Promise((resolve, reject) => {
                    s3.listObjectsV2(params, (err, data) => __awaiter(this, void 0, void 0, function* () {
                        if (err)
                            return reject(err);
                        objects = objects.concat(data.Contents);
                        if (data.IsTruncated) {
                            yield helper(data.NextContinuationToken);
                        }
                        return resolve(true);
                    }));
                });
            });
            yield helper();
            return objects;
        });
    }
}
exports.default = EasyYandexS3;
