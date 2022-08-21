const EYS3 = require("../index.js");

require('dotenv').config();

var s3 = new EYS3({
  auth: {
      accessKeyId: process.env.KEY,
      secretAccessKey: process.env.SECRET,
  },
  Bucket: process.env.BUCKET,
  debug: true
});

module.exports = s3;