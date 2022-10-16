(() => {
  const { expect } = require('chai');
  const fs = require('fs');

  const s3 = require('../s3.ts');
  const EYS3 = require('../../lib/index').default;

  describe('Download', function () {
    this.timeout(20000);

    it('Should successfully download file as buffer', async function () {
      await s3.Upload({ path: './test/data/file.rtf', save_name: true }, '/');

      const u = await s3.Download('file.rtf');
      const isBuffer = Buffer.isBuffer(u.data.Body);
      expect(isBuffer).to.be.equal(true);

      await s3.CleanUp();
    });

    it('Should successfully download file as buffer from nested folder', async function () {
      await s3.Upload({ path: './test/data/file.rtf', save_name: true }, '/folder/folder1');

      const u = await s3.Download('/folder/folder1/file.rtf');
      const isBuffer = Buffer.isBuffer(u.data.Body);
      expect(isBuffer).to.be.equal(true);

      await s3.CleanUp();
    });

    it('Should successfully download file', async function () {
      await s3.Upload({ path: './test/data/file.rtf', save_name: true }, '/');

      const filename = 'some-file.rtf';

      const u = await s3.Download('file.rtf', `./${filename}`);
      const isBuffer = Buffer.isBuffer(u.data.Body);
      expect(isBuffer).to.be.equal(true);

      const isExisted = fs.existsSync(`./${filename}`);
      expect(isExisted).to.be.equal(true);

      await s3.CleanUp();
      fs.unlinkSync(`./${filename}`);
    });

    it('Should successfully download file from nested folder', async function () {
      await s3.Upload({ path: './test/data/file.rtf', save_name: true }, '/folder/folder1');

      const filename = 'some-file.rtf';

      const u = await s3.Download('/folder/folder1/file.rtf', `./${filename}`);
      const isBuffer = Buffer.isBuffer(u.data.Body);
      expect(isBuffer).to.be.equal(true);

      const isExisted = fs.existsSync(`./${filename}`);
      expect(isExisted).to.be.equal(true);

      await s3.CleanUp();
      fs.unlinkSync(`./${filename}`);
    });

    it('Should fail, no file', async function () {
      const filename = 'some-file.rtf';

      const u = await s3.Download('/folder/folder1/file.rtf', `./${filename}`);

      expect(u).to.be.equal(false);
    });

    it('Should fail, invalid credentials', async function () {
      const invalidS3 = new EYS3({
        auth: {
          accessKeyId: 'invalidKeyId',
          secretAccessKey: 'invalidAccessKey',
        },
        Bucket: 'invalid-bucket',
        debug: true,
      });

      const u = await invalidS3.Download('file.rtf');

      expect(u).to.be.equal(false);
    });
  });

})()
