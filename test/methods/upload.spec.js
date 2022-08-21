const expect = require("chai").expect;
const path = require("path");
const fs = require("fs");

const s3 = require("../s3.js");

describe("Upload", function(){
    this.timeout(20000);

    it("file with full path with save name", async function(){
        var u = await s3.Upload({path: path.resolve(__dirname, "../data/file.rtf"), save_name: true}, "/eys3-testing/");
        expect(u).to.not.equal(false);
    });

    it("file with relative path with new name", async function(){
        var u = await s3.Upload({path: "./test/data/file.rtf", name: 'test.rtf'}, "/eys3-testing/");
        expect(u).to.not.equal(false);
    });

    it("upload by file buffer", async function(){
        let buffer = fs.readFileSync("./test/data/folder/file1.rtf");
        var u = await s3.Upload({buffer}, "/eys3-testing/");
        expect(u).to.not.equal(false);
    });

    it("upload array of files with md5 names", async function(){
        var u = await s3.Upload([
            {path: "./test/data/folder/file1.rtf"},
            {path: "./test/data/folder/file2.rtf"},
        ], "/eys3-testing/");
        expect(u).to.be.an('array').that.does.not.include(false);
        expect(u).have.lengthOf(2);
    });

    it("upload full folder with relative path with md5 names", async function(){
        var u = await s3.Upload({path: "./test/data/folder"}, "/eys3-testing/");
        expect(u).to.be.an('array').that.does.not.include(false);
        expect(u).have.lengthOf(3);
    });

    it("upload full folder with relative path with save names and ignore", async function(){
        var u = await s3.Upload({path: "./test/data/folder", save_name: true, ignore: ['/folder1']}, "/eys3-testing/");
        expect(u).to.be.an('array').that.does.not.include(false);
        expect(u).have.lengthOf(2);
    });
});