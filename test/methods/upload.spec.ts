(() => {
  const { expect } = require('chai');
  const path = require('path');
  const fs = require('fs');

  const s3 = require('../s3.ts');

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  describe('Upload', function () {
    this.timeout(20000);

    it('full path to uploaded file with save name', async () => {
      const folderS3 = '/eys3-testing/';
      const filename = 'file.rtf';

      const u = await s3.Upload(
        { path: path.resolve(__dirname, `../data/${filename}`), save_name: true },
        folderS3
      );

      const keyS3 = `${folderS3}${filename}`.slice(1);

      expect(u.Key).to.equal(keyS3);

      await s3.CleanUp();
    });

    it('file with relative path with new name', async () => {
      const folderS3 = '/eys3-testing/';
      const filenameS3 = 'test.rtf';

      const u = await s3.Upload({ path: './test/data/file.rtf', name: filenameS3 }, folderS3);

      const keyS3 = `${folderS3}${filenameS3}`.slice(1);

      expect(u.Key).to.equal(keyS3);

      await s3.CleanUp();
    });

    it('upload by file buffer', async () => {
      const uploadFolder = '/eys3-testing/';
      const fileExtension = 'rtf';
      const localFilePath = `./test/data/folder/file1.${fileExtension}`;

      const buffer = fs.readFileSync(localFilePath);
      const u = await s3.Upload({ buffer }, uploadFolder);

      const keyParts = u.Key.split(/[/.]+/);
      const [folderS3, filenameS3, fileExtensionS3] = keyParts;

      const isUuid = !!filenameS3.match(uuidRegex);

      expect(isUuid).to.be.equal(true);
      expect(folderS3).to.be.equal(uploadFolder.slice(1, -1));
      expect(fileExtensionS3).to.be.equal(fileExtension);

      await s3.CleanUp();
    });

    it('upload array of files with uuid names', async () => {
      const uploadFolder = '/eys3-testing/';
      const fileExtension = 'rtf';

      const localFilePath1 = `./test/data/folder/file1.${fileExtension}`;
      const localFilePath2 = `./test/data/folder/file2.${fileExtension}`;

      const u = await s3.Upload([{ path: localFilePath1 }, { path: localFilePath2 }], uploadFolder);

      expect(u).have.lengthOf(2);

      u.forEach((result) => {
        const keyParts = result.Key.split(/[/.]+/);
        const [folderS3, filenameS3, fileExtensionS3] = keyParts;

        const isUuid = !!filenameS3.match(uuidRegex);

        expect(isUuid).to.be.equal(true);
        expect(folderS3).to.be.equal(uploadFolder.slice(1, -1));
        expect(fileExtensionS3).to.be.equal(fileExtension);
      });

      await s3.CleanUp();
    });

    it('upload full folder with relative path with uuid names', async () => {
      const uploadFolder = '/eys3-testing/';
      const subfolder = 'folder1';
      const fileExtension = 'rtf';

      const u = await s3.Upload({ path: './test/data/folder' }, uploadFolder);

      expect(u).have.lengthOf(3);

      // convert objects to json, use Set to get unique values
      const uniqueFiles = [...new Set(u.map((el) => JSON.stringify(el)))];
      expect(uniqueFiles).have.lengthOf(3);

      u.forEach(({ Key }) => {
        const keyParts = Key.split(/[/.]+/);

        let folderS3;
        let subfolderS3;
        let filenameS3;
        let fileExtensionS3;

        if (keyParts.length === 4) {
          [folderS3, subfolderS3, filenameS3, fileExtensionS3] = keyParts;
        } else {
          [folderS3, filenameS3, fileExtensionS3] = keyParts;
        }

        const isUuid = !!filenameS3.match(uuidRegex);

        expect(isUuid).to.be.equal(true);
        expect(folderS3).to.be.equal(uploadFolder.slice(1, -1));
        expect(fileExtensionS3).to.be.equal(fileExtension);

        if (keyParts.length === 4) {
          expect(subfolderS3).to.be.equal(subfolder);
        }
      });

      await s3.CleanUp();
    });

    it('upload full folder with relative path with save names and ignore', async () => {
      const uploadFolder = '/eys3-testing/';
      const subfolder = 'folder';
      const fileExtension = 'rtf';

      const u = await s3.Upload(
        { path: './test/data', save_name: true, ignore: ['/folder/folder1', 'file.rtf'] },
        '/eys3-testing/'
      );

      expect(u).have.lengthOf(2);

      u.forEach(({ Key }) => {
        const keyParts = Key.split(/[/.]+/);
        const [folderS3, subfolderS3, filenameS3, fileExtensionS3] = keyParts;

        const isCorrectFilename = !!filenameS3.match(/^file(1|2)$/);

        expect(isCorrectFilename).to.be.equal(true);
        expect(folderS3).to.be.equal(uploadFolder.slice(1, -1));
        expect(subfolderS3).to.be.equal(subfolder);
        expect(fileExtensionS3).to.be.equal(fileExtension);
      });

      await s3.CleanUp();
    });
  });


})()

