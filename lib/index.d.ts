import * as AWS from 'aws-sdk';
import type { S3 } from 'aws-sdk';
import type { DefaultParams, UploadFile, DownloadedFile } from '../types/EasyYandexS3';
/**
 * Создание объекта для работы с S3 хранилищем
 */
declare class EasyYandexS3 {
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
    default_params: DefaultParams;
    threads: {};
    s3: S3;
    debug: Boolean;
    Bucket: string;
    private defaultIgnoreList;
    constructor(params: DefaultParams);
    private _log;
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
    Upload(file: UploadFile | UploadFile[], route: string): Promise<S3.ManagedUpload.SendData | S3.ManagedUpload.SendData[] | false>;
    private _getFileAttributes;
    private _uploadDirectory;
    private _uploadArray;
    /**
     * Получение списка директорий и папок
     * @param {string=} route Необязательно. Путь к папке, которую смотрим
     *
     * @returns {Promise<S3.ListObjectsV2Output>} Результат просмотра
     */
    GetList(route: string): Promise<S3.ListObjectsV2Output | false>;
    /**
     * Скачивание файла
     * @param {string} routeFullPath Полный путь до файла. С папками, с названием и расширением файла
     * @param {string=} destinationFullPath Необязательно. Куда сохраняем файл. Абсолютный или относительный, с названием и расширением файла
     *
     * @returns {Promise<Object>} Результат скачивания и сохранения
     */
    Download(routeFullPath: string, destinationFullPath?: string | false): Promise<DownloadedFile | false>;
    /**
     * Удаление файла из хранилища
     * @param {string} routeFullPath Полный путь до файла. С папками, с названием и расширением файла
     *
     * @returns {Promise<Object>} Результат удаления
     */
    Remove(routeFullPath: string): Promise<boolean | AWS.AWSError>;
    /**
     * Удаление всех файлов с бакета
     * @returns {Promise<Object>} Результат удаления
     */
    CleanUp(): Promise<boolean | S3.DeleteObjectsOutput[]>;
    private _getAllObjects;
}
export default EasyYandexS3;
