import * as fileType from 'file-type';

type File = {
  mimetype: string;
  buffer: Buffer;
}

/**
 * Расширенное определение расширения файла
 * https://github.com/powerdot/easy-yandex-s3/commit/8e5f3e42a5dffe6e54ceef16288e5a9c00868838
 * @param {File} file - файл для получения его расширения
 */
function GetFileExt(file: File): string {
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

export default GetFileExt;