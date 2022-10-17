import { S3 } from "aws-sdk";

type DefaultParams = {
  /** Необязательно. Ссылка на S3 сервер, например, на storage.yandexcloud.net */
  endpointUrl?: string;
  /** 
   * Необязательно. Ссылка на S3 сервер, например, на storage.yandexcloud.net
   * @deprecated Удалено в версиях > 2.0.0
   * @see Используйте endpointUrl
   */
  endpoint_url?: string;
  /** Обязательно. Данные для доступа от сервисного аккаунта */
  auth: {
    /** Обязательно. Идентификатор ключа сервисного аккаунта */
    accessKeyId: string;
    /** Обязательно. Cекретный ключ сервисного аккаунта */
    secretAccessKey: string;
  },
  /** Необязательно. Регион загрузки */
  region?: string;
  /** Необязательно. Установки http-запроса */
  httpOptions?: {
    timeout?: number;
    connectTimeout?: number;
  },
  /** Обязательно. ID бакета */
  Bucket: string;
  /** Необязательно. Вывод дополнительной информации в консоль */
  debug?: boolean;
}

type DefaultIgnoreList = string[];

type UploadFileBuffer = {
  /** Устаналивает название загружаемому файлу. Передавать с расширением. */
  name?: string;
  /** Буфер файла */
  buffer: Buffer;
  /** Mimetype файла */
  mimetype?: string;
}

type UploadFilePath = {
  /** Устаналивает название загружаемому файлу. Передавать с расширением. */
  name?: string;
  /** Путь к файлу */
  path: string;
  /** Оставить оригинальное название файла. Работает только в случае передачи пути к файлу. */
  save_name?: boolean;
  /** Список игнорируемых файлов и папок */
  ignore?: DefaultIgnoreList;
}

type UploadFile = UploadFileBuffer | UploadFilePath;

type DownloadedFile = {
  data: S3.GetObjectOutput;
  destinationFullPath: string | false;
  fileReplaced: boolean;
}

export { DownloadedFile, UploadFile, DefaultParams, DefaultIgnoreList };