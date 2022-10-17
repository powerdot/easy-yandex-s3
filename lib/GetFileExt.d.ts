/// <reference types="node" />
declare type File = {
    mimetype: string;
    buffer: Buffer;
};
/**
 * Расширенное определение расширения файла
 * https://github.com/powerdot/easy-yandex-s3/commit/8e5f3e42a5dffe6e54ceef16288e5a9c00868838
 * @param {File} file - файл для получения его расширения
 */
declare function GetFileExt(file: File): string;
export default GetFileExt;
