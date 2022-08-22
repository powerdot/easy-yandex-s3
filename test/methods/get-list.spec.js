const { expect } = require('chai');

const s3 = require('../s3');

describe('GetList', function () {
  this.timeout(20000);

  it('Getting list of test folder with slashes', async () => {
    const u = await s3.GetList('/eys3-testing/');
    expect(u.Contents).to.be.an('array').that.does.not.include(false);
    expect(u.Contents.length).to.be.above(1);
  });

  it('Getting list of test folder without slashes', async () => {
    const u = await s3.GetList('eys3-testing');
    expect(u.Contents).to.be.an('array').that.does.not.include(false);
    expect(u.Contents.length).to.be.above(1);
  });

  it('Getting list of test folder with starting slash', async () => {
    const u = await s3.GetList('/eys3-testing');
    expect(u.Contents).to.be.an('array').that.does.not.include(false);
    expect(u.Contents.length).to.be.above(1);
  });

  it('Getting list of test folder with starting slash relative path', async () => {
    const u = await s3.GetList('./eys3-testing');
    expect(u.Contents).to.be.an('array').that.does.not.include(false);
    expect(u.Contents.length).to.be.above(1);
  });

  it('Getting list of test folder with ending slash', async () => {
    const u = await s3.GetList('eys3-testing/');
    expect(u.Contents).to.be.an('array').that.does.not.include(false);
    expect(u.Contents.length).to.be.above(1);
  });

  it('Getting list of root directory with absolute path', async () => {
    const u = await s3.GetList('/');
    expect(u.Contents).to.be.an('array').that.does.not.include(false);
    expect(u.Contents.length).to.be.above(1);
  });

  it('Getting list of root directory with relative path', async () => {
    const u = await s3.GetList('./');
    expect(u.Contents.length).to.be.above(1);
  });

  it('Getting list of test folder without path', async () => {
    const u = await s3.GetList();
    expect(u.Contents.length).to.be.above(1);
  });
});
