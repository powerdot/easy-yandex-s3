const AWS = require('aws-sdk');
var md5 = require("md5");
var fs = require("fs");
var path = require("path");
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
				accessKeyId: "",
				secretAccessKey: ""
			},
			region: 'us-east-1',
			httpOptions: {
				timeout: 10000,
				connectTimeout: 10000
			},
			Bucket: "",
			debug: false
		};
		var new_params = {...this.default_params, ...params};

		this.s3 = new AWS.S3({
			endpoint: new AWS.Endpoint(new_params.endpoint_url),
			accessKeyId: new_params.auth.accessKeyId,
			secretAccessKey: new_params.auth.secretAccessKey,
			region: new_params.region,
			httpOptions: new_params.httpOptions
		});

		this.debug = new_params.debug;

		this.Bucket = params.Bucket;
	};


	_log(){
		return console.log('[' + (new Date().toUTCString()) + '] ', ...arguments)
	}


	/**
	 * Загрузка файла
	 * @param {Object} file Буфер файла и информация о расширении. Или путь к файлу.
	 * @param {Buffer=} file.buffer Буфер файла
	 * @param {String=} file.path Путь к файлу
	 * @param {Boolean=} file.save_name Оставить оригинальное название файла. Работает только в случае передачи пути к файлу.
	 * @param {String=} file.name Устаналивает название загружаемому файлу. Передавать с расширением.
	 * 
	 * @param {String} route Папка загрузки - бакет
	 * 
	 * @returns {Promise<Object>} Результат загрузки
	 */
	async Upload(file, route){
		var file_body;
		var file_ext;
		var file_md5;
		var file_upload_name;
	
		if(file.path){
			file_body = fs.readFileSync(file.path);
			file_ext = path.extname(file.path);
			if(file.save_name) file_upload_name = path.basename(file.path);
			if(file.name) file_upload_name = file.name;
		}else{
			file_body = file.buffer;
			file_ext = '.'+fileType(file_body).ext;
		}
	
		if(route.slice(-1)!="/") route+="/";
		if(route[0]=="/") route = route.slice(1);
	
		file_md5 = md5(file_body);
		if(!file_upload_name) file_upload_name = `${file_md5}${file_ext}`;
	
		var upload_route = route;
		var Key = `${upload_route}${file_upload_name}`;
		var Body = file_body;
		
		var s3 = this.s3;
		var Bucket = this.Bucket;
		var params = {Bucket, Key, Body}

		var debug = this.debug;
		var debug_object = "upload"
		if(debug) this._log("S3", debug_object, "started");
		if(debug) this._log("S3", debug_object, params);

		try {
			var s3Promise = await new Promise(function(resolve, reject) {
				s3.upload(params, function(err, data) {
					if (err) return reject(err);
					return resolve(data);
				});
			});
			if(debug) this._log("S3", debug_object, 'done:', s3Promise);
			return s3Promise;
		} catch (error) {
			if(debug) this._log("S3", debug_object,'error:', error);
			return false;
		}
	};


	/**
	 * Получение списка директорий и папок
	 * @param {String=} route Необязательно. Путь к папке, которую смотрим
	 * 
	 * @returns {Promise<Object>} Результат просмотра
	*/
	async GetList(route){
		if(route) route += route.slice(-1)!="/"?"/":"";
		if(route[0]=="/") route = route.slice(1);

		var s3 = this.s3;
		var Bucket = this.Bucket;
		var params = {
			Bucket, 
			Prefix: route, 
			Delimiter: '/'
		}

		var debug = this.debug;
		var debug_object = "listObjectsV2"
		if(debug) this._log("S3", debug_object, "started");
		if(debug) this._log("S3", debug_object, params);

		try {
			var s3Promise = await new Promise(function(resolve, reject) {
				s3.listObjectsV2(params, function(err, data) {
					if (err) return reject(err);
					return resolve(data);
				});
			});
			if(debug) this._log("S3", debug_object, 'done:', s3Promise);
			return s3Promise;
		} catch (error) {
			if(debug) this._log("S3", debug_object,'error:', error);
			return false;
		}
	}


	/**
	 * Скачивание файла
	 * @param {String} route_full_path Полный путь до файла. С папками, с названием и расширением файла
	 * @param {String=} destination_full_path Необязательно. Куда сохраняем файл. Абсолютный или относительный, с названием и расширением файла
	 * 
	 * @returns {Promise<Object>} Результат скачивания и сохранения
	*/
	async Download(route_full_path, destination_full_path){
		if(route_full_path[0]=="/") route_full_path = route_full_path.slice(1);
		if(!destination_full_path) destination_full_path = false;

		var s3 = this.s3;
		var Bucket = this.Bucket;
		var Key = route_full_path;
		var params = {
			Bucket, 
			Key
		}

		var debug = this.debug;
		var debug_object = "getObject"
		if(debug) this._log("S3", debug_object, "started");
		if(debug) this._log("S3", debug_object, params);

		try {
			var s3Promise = await new Promise(function(resolve, reject) {
				s3.getObject(params, function(err, data) {
					if (err) return reject(err);
					// data

					var file_replaced = false;
					if(destination_full_path){
						var buffer = data.Body;
						if(fs.existsSync(destination_full_path)) file_replaced = true;
						fs.writeFileSync(destination_full_path, buffer);
					}

					return resolve({
						data,
						destination_full_path,
						file_replaced
					});
				});
			});
			if(debug) this._log("S3", debug_object, 'done:', s3Promise);
			return s3Promise;
		} catch (error) {
			if(debug) this._log("S3", debug_object,'error:', error);
			return false;
		}
	}


	/**
	 * Удаление файла из хранилища
	 * @param {String} route_full_path Полный путь до файла. С папками, с названием и расширением файла
	 * 
	 * @returns {Promise<Object>} Результат удаления
	*/
	async Remove(route_full_path){
		if(route_full_path[0]=="/") route_full_path = route_full_path.slice(1);

		var s3 = this.s3;
		var Bucket = this.Bucket;
		var Key = route_full_path;
		var params = {Bucket, Key};

		var debug = this.debug;
		var debug_object = "deleteObject"
		if(debug) this._log("S3", debug_object, "started");
		if(debug) this._log("S3", debug_object, params);

		try {
			var s3Promise = await new Promise(function(resolve, reject) {
				s3.deleteObject(params, function(err, data) {
					if (err) return reject(err);
					return resolve(true);
				});
			});
			if(debug) this._log("S3", debug_object, 'done:', s3Promise);
			return s3Promise;
		} catch (error) {
			if(debug) this._log("S3", debug_object,'error:', error);
			return false;
		}
	}
}

module.exports = EasyYandexS3;