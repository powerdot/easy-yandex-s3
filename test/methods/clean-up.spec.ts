(() => {
  const { expect } = require('chai');

  const s3 = require('../s3.ts');
  const EYS3 = require('../../lib/index').default;

  describe('CleanUp', function () {
    this.timeout(20000);

    it('Should successfully clean up bucket', async function () {
      await s3.Upload({ path: './test/data/folder', save_name: true }, '/eys3-testing/');

      const u = await s3.CleanUp();

      expect(u.length).to.be.equal(1);
      expect(u[0].Deleted.length).to.be.equal(3);
      expect(u[0].Errors.length).to.be.equal(0);
    });

    it('Should successfully clean up empty bucket', async function () {
      const u = await s3.CleanUp();

      expect(u).to.be.an('array');
      expect(u.length).to.be.equal(0);
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

      const u = await invalidS3.CleanUp();

      expect(u).to.be.equal(false);
    });
  });

})()