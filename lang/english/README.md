[![Easy Yandex S3 Logo](https://storage.yandexcloud.net/actid-storage/easy-yandex-s3/eys3.png)](https://github.com/powerdot/easy-yandex-s3)

[![Build Status](https://travis-ci.org/powerdot/easy-yandex-s3.svg?branch=master)](https://travis-ci.org/powerdot/easy-yandex-s3) [![YouTube IlyaDevman](https://storage.yandexcloud.net/actid-storage/GitHubImages/gt-yt-overview.png)](https://youtu.be/L_6PiJFaldI)

Using the S3 API **_Yandex.Cloud_** is even easier.
The storage is called **_Object Storage_**.

Support from Node.js 8 version

✓ Upload a file  
✓ Upload an array of files  
✓ Upload entire folders with nested folders and files inside  
✓ Upload a Buffer  
✓ Download files from bucket  
✓ Delete individual files from a bucket  
✓ Clean up bucket  
✓ Get information about files in a bucket

Let's go!

## Contents

- [Theory](#theory-orly) - what is storage and how does it work
- [Instructions](#create-a-service-account-in-yandexcloud) for creating a service account
- [Get started](#get-started)
- - [File upload](#file-upload)
- - - [Upload files](#upload-files)
- - [Get list of directories and files of bucket](#getting-a-list-of-bucket-directories-and-files)
- - [Download file from bucket](#download-a-file)
- - [Remove file from bucket](#remove-a-file)
- - [Remove every file from bucket](#remove-every-file-from-bucket)
- [Examples](#examples)
- - [Upload with multer](#multer-and-express)
- [Developer @powerdot](https://github.com/powerdot/)
- [Developer @nukuutos](https://github.com/nukuutos/)

Link to official Yandex docs.  
https://cloud.yandex.ru/docs/storage/s3/

Link to description of S3 API Amazon  
https://docs.aws.amazon.com/en_us/AmazonS3/latest/API/Welcome.html

## Theory O'RLY

The storage consists of buckets.
Bucket is, roughly speaking, your hard drive on the Internet.
To upload something to Yandex.Cloud and store your files there, you need to create this bucket.

Bucket has an ID. The ID matches its name, which you come up with, for example **my-storage**.

Bucket access can be obtained using a special account, it is called **service account**.

From the service account there is a login and password, together login and password are called **key**, where the login is **"Key ID"**, and the password is **"Private key"**. Don't be afraid, everything is very easy here :)

And so, suppose you have already made your bucket (I don’t tell you how to do it, everything is quite simple there). Or maybe even already you made folders inside (by the way, this is not necessary).

Time to get access for manipulations with our bucket!

## Create a service account in Yandex.Cloud

1. Log in to your personal account 
   https://console.cloud.yandex.ru/cloud

2. In directories, select the desired directory in the list on the right.

3. In the menu on the left, click _Service accounts_

4. Click on the top right _Create service account_

5. Come up with a name for the account, you won't need it. Add Roles: iam.serviceAccounts.user, editor. Save.

6. Click on a service account to open it.

7. Click on the top right "Create new key" -> "Create static access key"

8. Come up with a description. Create it.

9. You have a window with 2 keys. Copy them somewhere, because the secret key is issued 1 time in this bundle. You won't see him again.

Congratulation! Now you have **Key ID** (accessKeyId) and **Private key** (secretAccessKey).

## Get Started

Install it with npm

```bash
npm i easy-yandex-s3
```

### Initialization stage

```javascript
// import module
var EasyYandexS3 = require('easy-yandex-s3');

// initialization
var s3 = new EasyYandexS3({
  auth: {
    accessKeyId: 'KEY_ID',
    secretAccessKey: 'PRIVATE_KEY',
  },
  Bucket: 'BUCKET_NAME',
  debug: true, // debug by console.log
});
```

---

### File upload

General usage:

```javascript
.Upload(
    { parameters },
    "path/to/folder/in/bucket"
)
```

- Upload a file by local path
  123.png -> [bucket-name]/test/07af8a67f6a4fa5f65a7f687a98fa6f2a34f.png

```javascript
var upload = await s3.Upload(
  {
    path: path.resolve(__dirname, './123.png'),
  },
  '/test/'
);

// Returns path to file in s3 and other stuff
// if it returns false - error is happened
// File is uploaded to [my-storage]/test/{md5_checksum}.{file extension}
console.log(upload); 
```

- Upload a file by local path and save filename of this file  
  123.png -> [bucket-name]/test/123.png

```javascript
var upload = await s3.Upload(
  {
    path: path.resolve(__dirname, './123.png'),
    save_name: true,
  },
  '/test/'
);

// Returns path to file in s3 and other stuff
// if it returns false - error is happened
// File is uploaded to [my-storage]/test/123.png
console.log(upload); 
```

- Upload a file by local path and assign new filename to this file in s3
  123.png -> [bucket-name]/test/lolkek.png

```javascript
var upload = await s3.Upload(
  {
    path: path.resolve(__dirname, './123.png'),
    name: 'lolkek.png',
  },
  '/test/'
);

// Returns path to file in s3 and other stuff
// if it returns false - error is happened
// File is uploaded to [my-storage]/test/lolkek.png
console.log(upload); 
```

- Upload a buffer 
  <Buffer> -> [bucket-name]/test/cad9c7a68dca57ca6dc9a7dc8a86c.png

```javascript
var upload = await s3.Upload(
  {
    buffer: file_buffer,
  },
  '/test/'
);

// Returns path to file in s3 and other stuff
// if it returns false - error is happened
// File is uploaded to [my-storage]/test/{md5_checksum}.{file extension}
console.log(upload); 
```

- Upload a buffer with filename and extension
  <Buffer> -> [bucket-name]/test/lolkek.png

```javascript
var upload = await s3.Upload(
  {
    buffer: file_buffer,
    name: 'lolkek.png',
  },
  '/test/'
);

// Returns path to file in s3 and other stuff
// if it returns false - error is happened
// File is uploaded to [my-storage]/test/lolkek.png
console.log(upload); 
```

**return:**

```javascript
{
  ETag: '"md5sum"',
  VersionId: 'null',
  Location:
   'https://actid-storage.storage.yandexcloud.net/test1/name.png',
  key: 'test1/name.png',
  Key: 'test1/name.png',
  Bucket: 'my-storage'
}
```

#### Upload files

- Upload content of a local folder -> [bucket]/folder_on_server/

Our module takes files and subfolders inside local folder.

Suppose a folder `./my_folder`:

- my_folder
- - 1.png
- - 2.png
- - folder_inside
- - - 3.png

Set `route` parameter to "**folder_on_server**", and we get this path on s3 `[my_bucket]/folder_on_server/`  
Our files after uploading to s3:

`[my_bucket]/folder_on_server/1.png `
`[my_bucket]/folder_on_server/2.png `
`[my_bucket]/folder_on_server/folder_inside/3.png `

```javascript
// Relative path:
var upload = await s3.Upload(
  {
    path: './my_folder', // relative path to folder
    save_name: true, // save original names of files
  },
  '/folder_on_server/'
);
console.log(upload); // <- array of uploaded files
```

```javascript
// Ignore files and folders inside
var upload = await s3.Upload(
  {
    path: './my_folder', // relative path to folder
    save_name: true, // save original names of files
    ignore: ['.git', '/assets/video'], // ignore .git and path /assets/video
  },
  '/folder_on_server/'
);
console.log(upload); // <- array of uploaded files
```

```javascript
// absolute path to local file:
var upload = await s3.Upload(
  {
    path: '/Users/powerdot/sites/example.com/', // absolute path to folder
    save_name: true, // save original names of files
  },
  '/folder_on_server/'
);
console.log(upload); // <- array of uploaded files
```

- Upload files with an array of files 
  files array -> [bucket]/folder_on_server/

```javascript
// using an array of files:
var upload = await s3.Upload(
  [
    { path: './file1.jpg', save_name: true }, // relative path to file, save name of this file
    { path: '/Users/powerodt/dev/sites/folder/file2.css' }, // absolute path to file, filename will be updated to md5-checksum
    { path: './file.html', name: 'index.html' }, // relative path to file with new name index.html
  ],
  '/folder_on_server/'
);
```

**return:**  
Array with uploaded objects

```javascript
[
    {
        ETag: '"md5sum"',
        VersionId: 'null',
        Location:
            'https://actid-storage.storage.yandexcloud.net/test1/name.png',
        key: 'test1/name.png',
        Key: 'test1/name.png',
        Bucket: 'actid-storage'
    },
    ...
]
```

### Getting a list of bucket directories and files

General usage:

```javascript
.GetList(
    "path/to/folder/in/bucket"
);
```

- Get root of the bucket

```javascript
var list = await s3.GetList();
```

- Getting a list of subfolder and files of specific directory

```javascript
var list = await s3.GetList('/test/');
```

- `Contents` - contains files that are in folder `test`
- `CommonPrefixes` - contains subfolders that are in folder `test`

**return:**

```javascript
{
  IsTruncated: false,
  Contents: [
    {
      Key: 'eys3-testing/file1.rtf',
      LastModified: new Date("2022-08-24T01:55:02.431Z"),
      ETag: '"ee4e1fb1ab82ee0a650d8e4a8c274d9b"',
      ChecksumAlgorithm: [],
      Size: 413,
      StorageClass: 'STANDARD',
      Owner: [Object]
    },
    {
      Key: 'eys3-testing/file2.rtf',
      LastModified: new Date("2022-08-24T01:55:02.483Z"),
      ETag: '"ee4e1fb1ab82ee0a650d8e4a8c274d9b"',
      ChecksumAlgorithm: [],
      Size: 413,
      StorageClass: 'STANDARD',
      Owner: [Object]
    }
  ],
  Name: 's3library',
  Prefix: 'eys3-testing/',
  Delimiter: '/',
  MaxKeys: 1000,
  CommonPrefixes: [ { Prefix: 'eys3-testing/folder1/' } ],
  KeyCount: 3
}
```

### Download a file

General usage:

```javascript
.Download(
    "path/to/file/in/bucket",
    "path/to/save/file/locally"
);
```

- Download file and get buffer of this file

```javascript
var download = await s3.Download('test/123.png');
```

- Download file and save it to local file

```javascript
var download = await s3.Download('test/123.png', './myfile.png');

// download variable also has a buffer of downloaded file
// received file from bucket will be saved as myfile.png
```

**return:**

```javascript
{
  data: {
    AcceptRanges: "bytes",
    LastModified: new Date("2019-07-15T22:10:09.000Z"),
    ContentLength: 20705,
    ETag: '"md5sum"',
    ContentType: "application/octet-stream",
    Metadata: {},
    Body: Buffer.from("250001000192CD0000002F6D6E742F72", "hex"),
  },
  destinationFullPath: false,
  fileReplaced: false,
};
```

### Remove a file

General usage:

```javascript
.Remove(
    "/path/to/file/in/bucket"
);
```

- Remove a file

```javascript
var remove = await s3.Remove('test/123.png');

// Returns true или false.
// true - file is removed successfully, even if the file does not exist
// false - error
```

**return:**

```javascript
true;
```

### Remove every file from bucket

General usage:

```javascript
.CleanUp()
```

Clean up bucket:

```javascript
var result = await s3.CleanUp();
```

Technically, files are deleted in batches by 1000 files. Each batch will have its own `Deleted` and `Errors` keys, which contain data about successfully deleted objects (files) and data about files that caused an error to be deleted. <br />
**return:**

```javascript
// Successfully deleted 3 objects
[ { Deleted: [ [Object], [Object], [Object] ], Errors: [] } ]

// What is object in side
{ Key: '/path/to/file/in/bucket', VersionId: 'null' }

// On unsuccessfully running of 'CleanUp' method you've got next result:
false
```

## Examples

### Multer and Express

An example of uploading files via multer and express.
Case: you need to upload a file from the client to the server, and then upload it to Yandex Object Storage.

- Installing express and multer

```bash
npm i express
npm i multer
```

- Importing multer and easy-yandex-s3

```javascript
// Creating a web server
var express = require('express');
var app = express();
app.listen(8000);

// Importing multer и eys3
var multer = require('multer');
var EasyYandexS3 = require('easy-yandex-s3');

// Setting up s3 object
var s3 = new EasyYandexS3({
  auth: {
    accessKeyId: '',
    secretAccessKey: '',
  },
  Bucket: 'my-storage', 
  debug: false, 
});

// Running multer middleware for uploading files
app.use(multer().any());

// Making a post request with file be route /uploadFile
app.post('/uploadFile', async (req, res) => {
  let buffer = req.files[0].buffer; // Buffer of uploaded file
  var upload = await s3.Upload({ buffer }, '/files/'); // Upload to bucket
  res.send(upload); // Sever responds with response from Yandex Object Storage
});
```
