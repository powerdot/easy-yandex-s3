"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
/**
 * Получение массива всех вложенных файлов и папок и их файлов и папок и их файлов и папок...
 * @param {String} dirPath Путь до папки, которую сканируем
 * @param {String=} originalFilePath
 * @param {Array} ignoreList
 */
function ReadDir(dirPath, originalFilePath, ignoreList) {
    if (!originalFilePath)
        originalFilePath = dirPath;
    var dirFiles = fs.readdirSync(dirPath);
    var paths = [];
    for (var _i = 0, dirFiles_1 = dirFiles; _i < dirFiles_1.length; _i++) {
        var fileName = dirFiles_1[_i];
        var fullFilePath = path.join(dirPath, fileName);
        var relativeFilePath = fullFilePath.replace(originalFilePath, '');
        var relativeDirPath = relativeFilePath.replace(fileName, '');
        if (ignoreList.includes(fileName))
            continue;
        if (ignoreList.includes(relativeFilePath.replace(/\\/g, '/')) ||
            ignoreList.includes(relativeFilePath.replace(/\//g, '\\')))
            continue;
        if (fs.lstatSync(fullFilePath).isDirectory()) {
            paths.push.apply(paths, ReadDir(fullFilePath, originalFilePath, ignoreList));
            continue;
        }
        paths.push({ fullFilePath: fullFilePath, relativeDirPath: relativeDirPath, fileName: fileName });
    }
    // console.log(paths);
    return paths;
}
exports["default"] = ReadDir;
