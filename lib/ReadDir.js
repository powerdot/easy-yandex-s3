"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
/**
 * Получение массива всех вложенных файлов и папок и их файлов и папок и их файлов и папок...
 * @param {string} dirPath Путь до папки, которую сканируем
 * @param {string=} originalFilePath
 * @param {Array} ignoreList
 */
function ReadDir(dirPath, originalFilePath, ignoreList) {
    if (!originalFilePath)
        originalFilePath = dirPath;
    const dirFiles = fs.readdirSync(dirPath);
    const paths = [];
    for (const fileName of dirFiles) {
        const fullFilePath = path.join(dirPath, fileName);
        const relativeFilePath = fullFilePath.replace(originalFilePath, '');
        const relativeDirPath = relativeFilePath.replace(fileName, '');
        if (ignoreList.includes(fileName))
            continue;
        if (ignoreList.includes(relativeFilePath.replace(/\\/g, '/')) ||
            ignoreList.includes(relativeFilePath.replace(/\//g, '\\')))
            continue;
        if (fs.lstatSync(fullFilePath).isDirectory()) {
            paths.push(...ReadDir(fullFilePath, originalFilePath, ignoreList));
            continue;
        }
        paths.push({ fullFilePath, relativeDirPath, fileName });
    }
    // console.log(paths);
    return paths;
}
exports.default = ReadDir;
