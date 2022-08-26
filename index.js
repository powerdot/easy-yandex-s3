const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const fileType = require('file-type');

/**
 * Создание объекта для работы с S3 хранилищем
 */
class EasyYandexS3 {
  /**
   *
   * @param {Object} params Параметры соединения, 4 обязательных параметра.
   * @param {Object} params.auth Обязательно. Данные для доступа от сервисного аккаунта
   * @param {String} params.auth.accessKeyId Обязательно. Идентификатор ключа сервисного аккаунта
   * @param {String} params.auth.secretAccessKey Обязательно. Cекретный ключ сервисного аккаунта
   * @param {String} params.Bucket Обязательно. ID бакета
   *
   * @param {String=} params.endpoint_url Необязательно. Ссылка на S3 сервер, например, на storage.yandexcloud.net
   * @param {String=} params.region Необязательно. Регион загрузки
   * @param {Object=} params.httpOptions Необязательно. Установки http-запроса
   * @param {Boolean=} params.debug Необязательно. Вывод дополнительной информации в консоль
   */
  constructor(params) {
    this.default_params = {
      endpoint_url: 'https://storage.yandexcloud.net',
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
    const newParams = { ...this.default_params, ...params };
    this.threads = {};

    this.s3 = new AWS.S3({
      endpoint: new AWS.Endpoint(newParams.endpoint_url),
      accessKeyId: newParams.auth.accessKeyId,
      secretAccessKey: newParams.auth.secretAccessKey,
      region: newParams.region,
      httpOptions: newParams.httpOptions,
    });

    this.debug = newParams.debug;

    this.Bucket = params.Bucket;

    this.defaultIgnoreList = ['.DS_Store'];
  }

  _log(...args) {
    return console.log(`[${new Date().toUTCString()}] `, ...args);
  }

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
  async Upload(file, route) {
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

    if (file.path) {
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
      const s3Promise = await new Promise((resolve, reject) => {
        s3.upload(params, (err, data) => {
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

  _getFileAttributes(file, debugObject) {
    let fileBody;
    let fileExt;
    let fileUploadName;

    const { debug } = this;

    if (file.path) {
      fileBody = fs.readFileSync(file.path);
      fileExt = path.extname(file.path);
      if (file.save_name) fileUploadName = path.basename(file.path);
      if (file.name) fileUploadName = file.name;
    } else {
      fileBody = file.buffer;
      try {
        fileExt = `.${getFileExt(file)}`;
      } catch (error) {
        if (debug) this._log('S3', debugObject, 'error:', error);
      }
      if (file.name) fileUploadName = file.name;
    }

    return { fileBody, fileExt, fileUploadName };
  }

  async _uploadDirectory(dir, params, route, ignoreList) {
    const { debug } = this;
    const debugObject = '_uploadDirectory';

    const dirContent = readDir(dir, dir, ignoreList);

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

  async _uploadArray(array, route) {
    const uploaded = [];

    for (const file of array) {
      const u = await this.Upload(file, route);
      uploaded.push(u);
    }
    return uploaded;
  }

  /**
   * Получение списка директорий и папок
   * @param {String=} route Необязательно. Путь к папке, которую смотрим
   *
   * @returns {Promise<Object>} Результат просмотра
   */
  async GetList(route) {
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
   * @param {String} routeFullPath Полный путь до файла. С папками, с названием и расширением файла
   * @param {String=} destinationFullPath Необязательно. Куда сохраняем файл. Абсолютный или относительный, с названием и расширением файла
   *
   * @returns {Promise<Object>} Результат скачивания и сохранения
   */
  async Download(routeFullPath, destinationFullPath) {
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
            const buffer = data.Body;
            if (fs.existsSync(destinationFullPath)) fileReplaced = true;
            fs.writeFileSync(destinationFullPath, buffer);
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
   * @param {String} routeFullPath Полный путь до файла. С папками, с названием и расширением файла
   *
   * @returns {Promise<Object>} Результат удаления
   */
  async Remove(routeFullPath) {
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
  async CleanUp() {
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

  async _getAllObjects() {
    let objects = [];

    const helper = async (token) => {
      const { Bucket } = this;
      const { s3 } = this;
      const params = {
        Bucket,
      };

      if (token) params.ContinuationToken = token;

      await new Promise((resolve, reject) => {
        s3.listObjectsV2(params, async (err, data) => {
          if (err) return reject(err);

          objects = objects.concat(data.Contents);

          if (data.IsTruncated) {
            await helper(data.NextContinuationToken);
          }

          return resolve();
        });
      });
    };

    await helper();

    return objects;
  }
}

/**
 * Получение массива всех вложенных файлов и папок и их файлов и папок и их файлов и папок...
 * @param {String} dirPath Путь до папки, которую сканируем
 * @param {String=} originalFilePath
 * @param {Array} ignoreList
 */
function readDir(dirPath, originalFilePath, ignoreList) {
  if (!originalFilePath) originalFilePath = dirPath;
  const dirFiles = fs.readdirSync(dirPath);
  const paths = [];
  for (const fileName of dirFiles) {
    const fullFilePath = path.join(dirPath, fileName);
    const relativeFilePath = fullFilePath.replace(originalFilePath, '');
    const relativeDirPath = relativeFilePath.replace(fileName, '');

    if (ignoreList.includes(fileName)) continue;
    if (
      ignoreList.includes(relativeFilePath.replace(/\\/g, '/')) ||
      ignoreList.includes(relativeFilePath.replace(/\//g, '\\'))
    )
      continue;

    if (fs.lstatSync(fullFilePath).isDirectory()) {
      paths.push(...readDir(fullFilePath, originalFilePath, ignoreList));
      continue;
    }
    paths.push({ fullFilePath, relativeDirPath, fileName });
  }
  // console.log(paths);
  return paths;
}

/**
 * Расширенное определение расширения файла
 * https://github.com/powerdot/easy-yandex-s3/commit/8e5f3e42a5dffe6e54ceef16288e5a9c00868838
 * @param {*} file
 */
function getFileExt(file) {
  if (file.mimetype) {
    switch (file.mimetype) {
      case 'text/plain':
        return 'txt';
      case 'application/msword':
        return 'doc';
      case 'application/vnd.ms-excel':
        return 'xls';
      case 'text/csv':
        return 'csv';
      default:
        return fileType(file.buffer).ext;
    }
  } else if (file.buffer) return fileType(file.buffer).ext;

  return '';
}

module.exports = EasyYandexS3;
