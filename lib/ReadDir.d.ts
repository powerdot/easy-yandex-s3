declare type ReadDirReturns = {
    fullFilePath: string;
    relativeDirPath: string;
    fileName: string;
}[];
/**
 * Получение массива всех вложенных файлов и папок и их файлов и папок и их файлов и папок...
 * @param {string} dirPath Путь до папки, которую сканируем
 * @param {string=} originalFilePath
 * @param {Array} ignoreList
 */
declare function ReadDir(dirPath: string, originalFilePath: string, ignoreList: string[]): ReadDirReturns;
export default ReadDir;
