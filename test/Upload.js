const expect = require("chai").expect;
const EYS3 = require("../index.js");
const path = require("path");
const fs = require("fs");
require('dotenv').config();

var s3 = new EYS3({
    auth: {
        accessKeyId: process.env.KEY,
		secretAccessKey: process.env.SECRET,
    },
    Bucket: process.env.BUCKET,
    debug: true
});

describe("Upload", function(){
    this.timeout(20000);

    it("file with full path with save name", async function(){
        var u = await s3.Upload({path: path.resolve(__dirname, "./file.rtf"), save_name: true}, "/eys3-testing/");
        expect(u).to.not.equal(false);
    });

    it("file with relative path with new name", async function(){
        var u = await s3.Upload({path: "./test/file.rtf", name: 'test.rtf'}, "/eys3-testing/");
        expect(u).to.not.equal(false);
    });

    it("upload by file buffer", async function(){
        let buffer = fs.readFileSync("./test/folder/file1.rtf");
        var u = await s3.Upload({buffer}, "/eys3-testing/");
        expect(u).to.not.equal(false);
    });

    it("upload array of files with md5 names", async function(){
        var u = await s3.Upload([
            {path: "./test/folder/file1.rtf"},
            {path: "./test/folder/file2.rtf"},
        ], "/eys3-testing/");
        expect(u).to.be.an('array').that.does.not.include(false);
        expect(u).have.lengthOf(2);
    });

    it("upload full folder with relative path with md5 names", async function(){
        var u = await s3.Upload({path: "./test/folder"}, "/eys3-testing/");
        expect(u).to.be.an('array').that.does.not.include(false);
        expect(u).have.lengthOf(3);
    });

    it("upload full folder with relative path with save names and ignore", async function(){
        var u = await s3.Upload({path: "./test/folder", save_name: true, ignore: ['/folder1']}, "/eys3-testing/");
        expect(u).to.be.an('array').that.does.not.include(false);
        expect(u).have.lengthOf(2);
    });
});


describe("GetList", function(){
    this.timeout(20000);

    it("Getting list of test folder with slashes", async function(){
        var u = await s3.GetList("/eys3-testing/");
        expect(u.Contents).to.be.an('array').that.does.not.include(false);
        expect(u.Contents.length).to.be.above(1)
    });

    it("Getting list of test folder without slashes", async function(){
        var u = await s3.GetList("eys3-testing");
        expect(u.Contents).to.be.an('array').that.does.not.include(false);
        expect(u.Contents.length).to.be.above(1)
    });

    it("Getting list of test folder with starting slash", async function(){
        var u = await s3.GetList("/eys3-testing");
        expect(u.Contents).to.be.an('array').that.does.not.include(false);
        expect(u.Contents.length).to.be.above(1)
    });

    it("Getting list of test folder with starting slash relative path", async function(){
        var u = await s3.GetList("./eys3-testing");
        expect(u.Contents).to.be.an('array').that.does.not.include(false);
        expect(u.Contents.length).to.be.above(1)
    });

    it("Getting list of test folder with ending slash", async function(){
        var u = await s3.GetList("eys3-testing/");
        expect(u.Contents).to.be.an('array').that.does.not.include(false);
        expect(u.Contents.length).to.be.above(1)
    });

    it("Getting list of root directory with absolute path", async function(){
        var u = await s3.GetList('/');
        expect(u.Contents).to.be.an('array').that.does.not.include(false);
        expect(u.Contents.length).to.be.above(1)
    });

    it("Getting list of root directory with relative path", async function(){
        var u = await s3.GetList('./');
        expect(u.Contents.length).to.be.above(1)
    });

    it("Getting list of test folder without path", async function(){
        var u = await s3.GetList();
        expect(u.Contents.length).to.be.above(1)
    });
});