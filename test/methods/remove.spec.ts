(() => {

  const { expect } = require('chai');

  const s3 = require('../s3.ts');
  const EYS3 = require('../../lib/index').default;

  describe('Remove', function () {
    this.timeout(20000);

    it('Should successfully remove file', async function () {
      await s3.Upload({ path: './test/data/file.rtf', save_name: true }, '/');

      const u = await s3.Remove('file.rtf');

      expect(u).to.be.equal(true);
    });

    it('Should successfully remove file from nested folder', async function () {
      await s3.Upload({ path: './test/data/file.rtf', save_name: true }, '/folder/folder1');

      const u = await s3.Remove('/folder/folder1/file.rtf');

      expect(u).to.be.equal(true);
    });

    it("Should successfully remove file even there's no file", async function () {
      const u = await s3.Remove('file.rtf');

      expect(u).to.be.equal(true);
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

      const u = await invalidS3.Remove('file.rtf');

      expect(u).to.be.equal(false);
    });
  });

})()

