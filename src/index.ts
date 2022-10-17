import * as AWS from 'aws-sdk';
import type { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import GetFileExt from './GetFileExt';
import ReadDir from './ReadDir';

import type {
  DefaultParams,
  DefaultIgnoreList,
  UploadFile
} from '../types/EasyYandexS3';

/**
 * Создание объекта для работы с S3 хранилищем
 */
class EasyYandexS3 {
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

  public default_params: DefaultParams = {
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

  public threads = {}
  public s3: S3;
  public debug: Boolean;
  public Bucket: string;

  private defaultIgnoreList: DefaultIgnoreList = ['.DS_Store'];

  constructor(params: DefaultParams) {
    const newParams: DefaultParams = { ...this.default_params, ...params };

    // Legacy support for old params
    if (params.endpoint_url) newParams.endpointUrl = params.endpoint_url;

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

  private _log(...args) {
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
  public async Upload(file: UploadFile | UploadFile[], route: string): Promise<S3.ManagedUpload.SendData | S3.ManagedUpload.SendData[]> {
    if (typeof route !== 'string') {
      throw new Error('route (2nd argument) is not defined');
    }

    const { debug } = this;
    const debugObject = 'upload';

    if (Array.isArray(file)) {
      const files = file;
      if (files.length === 0) throw new Error('file array is empty');
      if (debug) this._log('S3', debugObject, 'array to upload:', files.length);
      const u = await this._uploadArray(files, route);
      if (debug) this._log('S3', debugObject, 'array upload done', u.length, 'files');
      return u;
    }

    if ('path' in file) {
      file.path = path.join(file.path);

      if (!fs.existsSync(file.path))
        throw new Error(`file/directory on path is not found (${file.path})`);

      if (fs.lstatSync(file.path).isDirectory()) {
        const dirPath = file.path;
        if (debug) this._log('S3', debugObject, 'folder to upload found', file.path);
        if (!file.ignore) file.ignore = [];
        const ignoreList = [...this.defaultIgnoreList, ...file.ignore];
        const u = await this._uploadDirectory(dirPath, file, route, ignoreList);
        if (debug) this._log('S3', debugObject, 'folder upload done', u.length, 'files');
        return u;
      }
    }

    const fileAttributes = this._getFileAttributes(file, debugObject);
    const { fileBody, fileExt } = fileAttributes;
    let { fileUploadName } = fileAttributes;

    route = route.replace(/\\/g, '/');
    if (route.slice(-1) !== '/') route += '/';
    if (route[0] === '/') route = route.slice(1);

    if (!fileUploadName) {
      const uniqueName = uuidv4();
      fileUploadName = `${uniqueName}${fileExt}`;
    }

    const uploadRoute = route;
    const Key = `${uploadRoute}${fileUploadName}`;
    const Body = fileBody;

    const { s3 } = this;
    const { Bucket } = this;
    const ContentType = mime.lookup(fileUploadName) || 'text/plain';
    const params = { Bucket, Key, Body, ContentType };

    if (debug) this._log('S3', debugObject, 'started');
    if (debug) this._log('S3', debugObject, params);

    try {
      const s3Promise: S3.ManagedUpload.SendData = await new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
          if (err) return reject(err);
          return resolve(data);
        });
      });
      if (debug) this._log('S3', debugObject, 'done:', s3Promise);
      return s3Promise;
    } catch (error) {
      if (debug) this._log('S3', debugObject, 'error:', error);
      throw new Error('S3 upload error');
    }
  }

  private _getFileAttributes(file: UploadFile, debugObject: string): {
    fileBody: Buffer;
    fileExt: string;
    fileUploadName: string;
  } {
    let fileBody;
    let fileExt;
    let fileUploadName;

    const { debug } = this;

    if ('path' in file) {
      fileBody = fs.readFileSync(file.path);
      fileExt = path.extname(file.path);
      if (file.save_name) fileUploadName = path.basename(file.path);
      if (file.name) fileUploadName = file.name;
    } else {
      fileBody = file.buffer;
      try {
        fileExt = `.${GetFileExt(file)}`;
      } catch (error) {
        if (debug) this._log('S3', debugObject, 'error:', error);
      }
      if (file.name) fileUploadName = file.name;
    }

    return { fileBody, fileExt, fileUploadName };
  }

  private async _uploadDirectory(dir, params, route, ignoreList) {
    const { debug } = this;
    const debugObject = '_uploadDirectory';

    const dirContent = ReadDir(dir, dir, ignoreList);

    if (debug) this._log('S3', debugObject, 'Promises length:', dirContent.length);

    const s3Promises = [];

    for (const file of dirContent) {
      params.path = file.fullFilePath;
      if (params.name) params.name = false;
      if (params.save_name) params.name = file.fileName;
      if (debug)
        this._log('S3', debugObject, 'dir file uploading:', route, 'to', file.relativeDirPath);
      const s3Promise = this.Upload(params, path.join(route, file.relativeDirPath));
      s3Promises.push(s3Promise);
    }

    return Promise.all(s3Promises);
  }

  private async _uploadArray(array, route) {
    const uploaded = [];

    for (const file of array) {
      const u = await this.Upload(file, route);
      uploaded.push(u);
    }
    return uploaded;
  }

  /**
   * Получение списка директорий и папок
   * @param {string=} route Необязательно. Путь к папке, которую смотрим
   *
   * @returns {Promise<Object>} Результат просмотра
   */
  public async GetList(route) {
    if (!route) route = '/';
    if (route === './') route = '/';
    if (route) route += route.slice(-1) !== '/' ? '/' : '';
    if (route[0] === '.') route = route.slice(1);
    if (route[0] === '/') route = route.slice(1);

    const { s3 } = this;
    const { Bucket } = this;
    const params = {
      Bucket,
      Prefix: route,
      Delimiter: '/',
    };

    const { debug } = this;
    const debugObject = 'listObjectsV2';
    if (debug) this._log('S3', debugObject, 'started');
    if (debug) this._log('S3', debugObject, params);

    try {
      const s3Promise = await new Promise((resolve, reject) => {
        s3.listObjectsV2(params, (err, data) => {
          if (err) return reject(err);
          return resolve(data);
        });
      });
      if (debug) this._log('S3', debugObject, 'done:', s3Promise);
      return s3Promise;
    } catch (error) {
      if (debug) this._log('S3', debugObject, 'error:', error);
      return false;
    }
  }

  /**
   * Скачивание файла
   * @param {string} routeFullPath Полный путь до файла. С папками, с названием и расширением файла
   * @param {string=} destinationFullPath Необязательно. Куда сохраняем файл. Абсолютный или относительный, с названием и расширением файла
   *
   * @returns {Promise<Object>} Результат скачивания и сохранения
   */
  public async Download(routeFullPath, destinationFullPath) {
    if (routeFullPath[0] === '/') routeFullPath = routeFullPath.slice(1);
    if (!destinationFullPath) destinationFullPath = false;

    const { s3 } = this;
    const { Bucket } = this;
    const Key = routeFullPath;
    const params = {
      Bucket,
      Key,
    };

    const { debug } = this;
    const debugObject = 'getObject';
    if (debug) this._log('S3', debugObject, 'started');
    if (debug) this._log('S3', debugObject, params);

    try {
      const s3Promise = await new Promise((resolve, reject) => {
        s3.getObject(params, (err, data) => {
          if (err) return reject(err);
          // data

          let fileReplaced = false;
          if (destinationFullPath) {
            const objectData = data.Body;
            if (fs.existsSync(destinationFullPath)) fileReplaced = true;
            fs.createWriteStream(destinationFullPath).write(objectData);
          }

          return resolve({
            data,
            destinationFullPath,
            fileReplaced,
          });
        });
      });
      if (debug) this._log('S3', debugObject, 'done:', s3Promise);
      return s3Promise;
    } catch (error) {
      if (debug) this._log('S3', debugObject, 'error:', error);
      return false;
    }
  }

  /**
   * Удаление файла из хранилища
   * @param {string} routeFullPath Полный путь до файла. С папками, с названием и расширением файла
   *
   * @returns {Promise<Object>} Результат удаления
   */
  public async Remove(routeFullPath) {
    if (routeFullPath[0] === '/') routeFullPath = routeFullPath.slice(1);

    const { s3 } = this;
    const { Bucket } = this;
    const Key = routeFullPath;
    const params = { Bucket, Key };

    const { debug } = this;
    const debugObject = 'deleteObject';
    if (debug) this._log('S3', debugObject, 'started');
    if (debug) this._log('S3', debugObject, params);

    try {
      const s3Promise = await new Promise((resolve, reject) => {
        s3.deleteObject(params, (err) => {
          if (err) return reject(err);
          return resolve(true);
        });
      });
      if (debug) this._log('S3', debugObject, 'done:', s3Promise);
      return s3Promise;
    } catch (error) {
      if (debug) this._log('S3', debugObject, 'error:', error);
      return false;
    }
  }

  /**
   * Удаление всех файлов с бакета
   * @returns {Promise<Object>} Результат удаления
   */
  public async CleanUp() {
    const { Bucket } = this;
    const { s3 } = this;

    const { debug } = this;
    const debugObject = 'deleteObjects';
    if (debug) this._log('S3', debugObject, 'started');
    if (debug) this._log('S3', debugObject, { Bucket });

    let objects;

    try {
      objects = await this._getAllObjects();
    } catch (error) {
      if (debug) this._log('S3', debugObject, 'error:', error);
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
            if (err) return reject(err);
            return resolve(data);
          });
        });

        s3Promises.push(s3Promise);
        chunk = [];
      }
    }

    try {
      const s3Promise = await Promise.all(s3Promises);
      if (debug) this._log('S3', debugObject, 'done:', s3Promise);
      return s3Promise;
    } catch (error) {
      if (debug) this._log('S3', debugObject, 'error:', error);
      return false;
    }
  }

  private async _getAllObjects() {
    let objects = [];

    const helper = async (token = "") => {
      const { Bucket } = this;
      const { s3 } = this;
      const params: S3.ListObjectsV2Request = {
        Bucket
      };

      if (token) params.ContinuationToken = token;

      await new Promise((resolve, reject) => {
        s3.listObjectsV2(params, async (err, data) => {
          if (err) return reject(err);

          objects = objects.concat(data.Contents);

          if (data.IsTruncated) {
            await helper(data.NextContinuationToken);
          }

          return resolve(true);
        });
      });
    };

    await helper();

    return objects;
  }
}

export default EasyYandexS3;
