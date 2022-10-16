(() => {
  const { expect } = require('chai');

  const s3 = require('../s3.ts');

  describe('GetList', function () {
    this.timeout(20000);

    it('Getting list of test folder with slashes', async () => {
      const uploadFolder = '/eys3-testing/';
      const localSubfolder = 'folder1';

      await s3.Upload({ path: './test/data/folder', save_name: true }, uploadFolder);

      const { Contents, CommonPrefixes, KeyCount } = await s3.GetList(uploadFolder);

      // check objects count
      expect(KeyCount).to.be.equal(3);

      // check files
      Contents.forEach(({ Key }) => {
        const keyParts = Key.split('/');
        const [folderS3, filenameS3] = keyParts;
        const isCorrectFilename = !!filenameS3.match(/^file(1|2)\.rtf$/);

        expect(isCorrectFilename).to.be.equal(true);
        expect(folderS3).to.be.equal(uploadFolder.slice(1, -1));
      });

      // check subfolders
      expect(CommonPrefixes[0].Prefix).to.be.equal(`${uploadFolder.slice(1)}${localSubfolder}/`);

      await s3.CleanUp();
    });

    it('Getting list of test folder without slashes', async () => {
      const uploadFolder = 'eys3-testing';
      const localSubfolder = 'folder1';

      await s3.Upload({ path: './test/data/folder', save_name: true }, uploadFolder);

      const { Contents, CommonPrefixes, KeyCount } = await s3.GetList(uploadFolder);

      // check objects count
      expect(KeyCount).to.be.equal(3);

      // check files
      Contents.forEach(({ Key }) => {
        const keyParts = Key.split('/');
        const [folderS3, filenameS3] = keyParts;
        const isCorrectFilename = !!filenameS3.match(/^file(1|2)\.rtf$/);

        expect(isCorrectFilename).to.be.equal(true);
        expect(folderS3).to.be.equal(uploadFolder);
      });

      // check subfolders
      expect(CommonPrefixes[0].Prefix).to.be.equal(`${uploadFolder}/${localSubfolder}/`);

      await s3.CleanUp();
    });

    it('Getting list of test folder with starting slash', async () => {
      const uploadFolder = '/eys3-testing';
      const localSubfolder = 'folder1';

      await s3.Upload({ path: './test/data/folder', save_name: true }, uploadFolder);

      const { Contents, CommonPrefixes, KeyCount } = await s3.GetList(uploadFolder);

      // check objects count
      expect(KeyCount).to.be.equal(3);

      // check files
      Contents.forEach(({ Key }) => {
        const keyParts = Key.split('/');
        const [folderS3, filenameS3] = keyParts;
        const isCorrectFilename = !!filenameS3.match(/^file(1|2)\.rtf$/);

        expect(isCorrectFilename).to.be.equal(true);
        expect(folderS3).to.be.equal(uploadFolder.slice(1));
      });

      // check subfolders
      expect(CommonPrefixes[0].Prefix).to.be.equal(`${uploadFolder.slice(1)}/${localSubfolder}/`);

      await s3.CleanUp();
    });

    it('Getting list of test folder with starting slash relative path', async () => {
      const uploadFolder = './eys3-testing';
      const localSubfolder = 'folder1';

      await s3.Upload({ path: './test/data/folder', save_name: true }, uploadFolder);

      const { Contents, CommonPrefixes, KeyCount } = await s3.GetList(uploadFolder);

      // check objects count
      expect(KeyCount).to.be.equal(3);

      // check files
      Contents.forEach(({ Key }) => {
        const keyParts = Key.split('/');
        const [folderS3, filenameS3] = keyParts;
        const isCorrectFilename = !!filenameS3.match(/^file(1|2)\.rtf$/);

        expect(isCorrectFilename).to.be.equal(true);
        expect(folderS3).to.be.equal(uploadFolder.slice(2));
      });

      // check subfolders
      expect(CommonPrefixes[0].Prefix).to.be.equal(`${uploadFolder.slice(2)}/${localSubfolder}/`);

      await s3.CleanUp();
    });

    it('Getting list of test folder with ending slash', async () => {
      const uploadFolder = 'eys3-testing/';
      const localSubfolder = 'folder1';

      await s3.Upload({ path: './test/data/folder', save_name: true }, uploadFolder);

      const { Contents, CommonPrefixes, KeyCount } = await s3.GetList(uploadFolder);

      // check objects count
      expect(KeyCount).to.be.equal(3);

      // check files
      Contents.forEach(({ Key }) => {
        const keyParts = Key.split('/');
        const [folderS3, filenameS3] = keyParts;
        const isCorrectFilename = !!filenameS3.match(/^file(1|2)\.rtf$/);

        expect(isCorrectFilename).to.be.equal(true);
        expect(folderS3).to.be.equal(uploadFolder.slice(0, -1));
      });

      // check subfolders
      expect(CommonPrefixes[0].Prefix).to.be.equal(`${uploadFolder}${localSubfolder}/`);

      await s3.CleanUp();
    });

    it('Getting list of root directory with absolute path', async () => {
      const uploadFolder = 'eys3-testing';

      await s3.Upload({ path: './test/data/folder', save_name: true }, uploadFolder);

      const { Contents, CommonPrefixes, KeyCount } = await s3.GetList('/');

      // check objects count
      expect(KeyCount).to.be.equal(1);
      // check files
      expect(Contents.length).to.be.equal(0);
      // check subfolders
      expect(CommonPrefixes[0].Prefix).to.be.equal(`${uploadFolder}/`);

      await s3.CleanUp();
    });

    it('Getting list of root directory with relative path', async () => {
      const uploadFolder = 'eys3-testing';

      await s3.Upload({ path: './test/data/folder', save_name: true }, uploadFolder);

      const { Contents, CommonPrefixes, KeyCount } = await s3.GetList('./');

      // check objects count
      expect(KeyCount).to.be.equal(1);
      // check files
      expect(Contents.length).to.be.equal(0);
      // check subfolders
      expect(CommonPrefixes[0].Prefix).to.be.equal(`${uploadFolder}/`);

      await s3.CleanUp();
    });

    it('Getting list of test folder without path', async () => {
      const uploadFolder = 'eys3-testing';

      await s3.Upload({ path: './test/data/folder', save_name: true }, uploadFolder);

      const { Contents, CommonPrefixes, KeyCount } = await s3.GetList();
      // check objects count
      expect(KeyCount).to.be.equal(1);
      // check files
      expect(Contents.length).to.be.equal(0);
      // check subfolders
      expect(CommonPrefixes[0].Prefix).to.be.equal(`${uploadFolder}/`);

      await s3.CleanUp();
    });
  });

})()
