const EYS3 = require('../index');

require('dotenv').config();

const s3 = new EYS3({
  auth: {
    accessKeyId: process.env.KEY,
    secretAccessKey: process.env.SECRET,
  },
  Bucket: process.env.BUCKET,
  debug: true,
});

module.exports = s3;
