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

- [Theory](#теория-orly) - what is storage and how does it work
- [Instructions](#создайте-сервисный-аккаунт-в-яндексоблаке) for creating a service account
- [Get started](#как-с-этим-работать)
- - [File upload](#загрузка-файла-в-бакет)
- - - [Upload files](#загрузка-файлов-в-бакет)
- - [Get list of directories and files of bucket](#получение-списка-директорий-и-файлов-бакета)
- - [Download file from bucket](#получение-списка-директорий-и-файлов-бакета)
- - [Delete file from bucket](#удаление-файла-из-бакета)
- - [Delete every file from bucket](#удаление-всех-файлов-из-бакета)
- [Examples](#примеры-использования)
- - [Upload with multer](#multer-и-express)
- [Developer git@powerdot](https://github.com/powerdot/)

Link to official Yandex docs.  
https://cloud.yandex.ru/docs/storage/s3/

Link to description of S3 API Amazon  
https://docs.aws.amazon.com/en_us/AmazonS3/latest/API/Welcome.html

## Theory O'RLY

The storage consists of buckets.
Bucket is, roughly speaking, your hard drive on the Internet.
To upload something to Yandex.Cloud and store your files there, you need to create this bucket.

Bucket has an ID. The ID matches its name, which you come up with, for example **my-storage**.

Bucket access can be obtained using a special account, it is called **сервисный аккаунт**.

From the service account there is a login and password, together login and password are called **ключем**, where the login is **"Идентификатор ключа"**, and the password is **"Секретный ключ"**. Don't be afraid, everything is very easy here :)

And so, suppose you have already made your bucket (I don’t tell you how to do it, everything is quite simple there). Or maybe even already you made folders inside (by the way, this is not necessary).

Time to get access for manipulations with our bucket!

## Создайте сервисный аккаунт в Яндекс.Облаке

1. Зайдите в ЛК  
   https://console.cloud.yandex.ru/cloud

2. В каталогах выберите нужный каталог в списке справа.

3. В меню слева нажмите _Сервисные аккаунты_

4. Справа сверху нажмите _Создать аккаунт_

5. Придумайте название аккаунту, оно вам не понадобится. Добавьте роли: iam.serviceAccounts.user, editor. Сохраняйте.

6. Нажмите на сервисный аккаунт, чтобы открыть его.

7. Справа сверху нажмите "Создать новый ключ" -> "Создать клч доступа"

8. Придумайте описание. Создавайте.

9. У вас появилось окошко с 2мя ключами. Скопируйте их куда-нибудь, потому что секретный ключ выдается 1 раз в этой связке. Больше вы его не увидите.

Теперь у вас есть **Идентификатор ключа** (accessKeyId) и **Секретный ключ** (secretAccessKey), поздравляю, от души.

## Как с этим работать

Установите npm-модуль в директории вашего проекта, это очень просто.

```bash
npm i easy-yandex-s3
```

### Инициализируем работу с бакетом.

```javascript
// Подключаем модуль
var EasyYandexS3 = require('easy-yandex-s3');

// Инициализация
var s3 = new EasyYandexS3({
  auth: {
    accessKeyId: 'ИДЕНТИФИКАТОР_КЛЮЧА',
    secretAccessKey: 'ДЛИННЫЙ_СЕКРЕТНЫЙ_КЛЮЧ',
  },
  Bucket: 'НАЗВАНИЕ_БАКЕТА', // например, "my-storage",
  debug: true, // Дебаг в консоли, потом можете удалить в релизе
});
```

---

### Загрузка файла в бакет

Общая конструкция:

```javascript
.Upload(
    { параметры },
    "папка/в/бакете"
)
```

- Загрузка по расположению файла  
  123.png -> [bucket-name]/test/07af8a67f6a4fa5f65a7f687a98fa6f2a34f.png

```javascript
var upload = await s3.Upload(
  {
    path: path.resolve(__dirname, './123.png'),
  },
  '/test/'
);
console.log(upload); // <- Возвращает путь к файлу в хранилище и всякую дополнительную информацию.
// если вернулся false - произошла ошибка
// Файл загрузится в [my-stogare]/test/{md5_сумма}.{расширение}
```

- Загрузка по расположению файла, с указанием оригинального имени и расширения файла  
  123.png -> [bucket-name]/test/123.png

```javascript
var upload = await s3.Upload(
  {
    path: path.resolve(__dirname, './123.png'),
    save_name: true,
  },
  '/test/'
);
console.log(upload); // Возвращает путь к файлу в хранилище и всякую дополнительную информацию.
// если вернулся false - произошла ошибка
// Файл загрузится в [my-stogare]/test/123.png
```

- Загрузка по расположению файла, с указанием имени файла для загрузки  
  123.png -> [bucket-name]/test/lolkek.png

```javascript
var upload = await s3.Upload(
  {
    path: path.resolve(__dirname, './123.png'),
    name: 'lolkek.png',
  },
  '/test/'
);
console.log(upload); // <- Возвращает путь к файлу в хранилище и всякую дополнительную информацию.
// если вернулся false - произошла ошибка
// Файл загрузится в [my-stogare]/test/lolkek.png
```

- Загрузка буфера  
  <Buffer> -> [bucket-name]/test/cad9c7a68dca57ca6dc9a7dc8a86c.png

```javascript
var upload = await s3.Upload(
  {
    buffer: file_buffer,
  },
  '/test/'
);
console.log(upload); // <- Возвращает путь к файлу в хранилище и всякую дополнительную информацию.
// если вернулся false - произошла ошибка
// Файл загрузится в [my-stogare]/test/{md5_сумма}.{расширение}
```

- Загрузка буфера с определением имени и расширения файла  
  <Buffer> -> [bucket-name]/test/lolkek.png

```javascript
var upload = await s3.Upload(
  {
    buffer: file_buffer,
    name: 'lolkek.png',
  },
  '/test/'
);
console.log(upload); // <- Возвращает путь к файлу в хранилище и всякую дополнительную информацию.
// если вернулся false - произошла ошибка
// Файл загрузится в [my-stogare]/test/lolkek.png
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
  Bucket: 'actid-storage'
}
```

#### Загрузка файлов в бакет

- Загружаем контент папки в бакет  
  контент папки -> [bucket]/folder_on_server/

Модуль берет все файлы и папки внутри указанной папки. **То есть саму папку он не загрузит, а только ее контент.**

Представим себе папку `./my_folder`:

- my_folder
- - 1.png
- - 2.png
- - folder_inside
- - - 3.png

Устанавливаем параметр `route` как "**folder_on_server**", грубо говоря, это `[my_bucket]/folder_on_server/`  
То загрузка на бакет будет следующей:

`[my_bucket]/folder_on_server/1.png `
`[my_bucket]/folder_on_server/2.png `
`[my_bucket]/folder_on_server/folder_inside/3.png `

Грубо говоря, мы просто телепортируем контент указанный папки в указанную папку на сервере.  
Ребят, это просто CMD+C CMD+V.

```javascript
// Относительный путь:
var upload = await s3.Upload(
  {
    path: './my_folder', // относительный путь до папки
    save_name: true, // сохранять оригинальные названия файлов
  },
  '/folder_on_server/'
);
console.log(upload); // <- массив загруженных файлов
```

```javascript
// Игнорируем файлы и папки внутри:
var upload = await s3.Upload(
  {
    path: './my_folder', // относительный путь до папки
    save_name: true, // сохранять оригинальные названия файлов
    ignore: ['.git', '/assets/video'], // игнорируем все файлы .git и путь внутри с файлами /assets/video
  },
  '/folder_on_server/'
);
console.log(upload); // <- массив загруженных файлов
```

```javascript
// Прямой путь:
var upload = await s3.Upload(
  {
    path: '/Users/powerdot/sites/example.com/', // прямой путь до папки
    save_name: true, // сохранять оригинальные названия файлов
  },
  '/folder_on_server/'
);
console.log(upload); // <- массив загруженных файлов
```

- Загрузка нескольких файлов  
  массив файлов -> [bucket]/folder_on_server/

```javascript
// используем массив файлов следующим образом:
var upload = await s3.Upload(
  [
    { path: './file1.jpg', save_name: true }, // относительный путь до файла с сохранением имени
    { path: '/Users/powerodt/dev/sites/folder/file2.css' }, // прямой путь до файла с изменением имени на md5-сумму
    { path: './file.html', name: 'index.html' }, // относительный путь на файл с изменением имени при загрузке на index.html
  ],
  '/folder_on_server/'
);
```

**return:**  
Массив из Upload-объектов

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

### Получение списка директорий и файлов бакета

Общая конструкция:

```javascript
.GetList(
    "директория/бакета"
);
```

- Получение корня бакета

```javascript
var list = await s3.GetList();
```

- Получение списка директорий и файлов из конкретной директории

```javascript
var list = await s3.GetList('/test/');
```

- `Contents` - содержит список файлов, содержащихся в папке `test`
- `CommonPrefixes` - содержит список папок, содержащихся в папке `test`

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

### Скачивание файла из бакета

Общая конструкция:

```javascript
.Download(
    "путь/до/файла/в/бакете",
    "путь/куда/сохраняем/на/клиенте"
);
```

- Скачивание файла и получение буфера этого файла

```javascript
var download = await s3.Download('test/123.png');
```

- Скачивание файла и сохранение его в файл

```javascript
var download = await s3.Download('test/123.png', './myfile.png');

// в download так же дополнительно вернется Buffer
// а полученный файл с бакета будет сохранен как myfile.png в директории выполнения скрипта
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

### Удаление файла из бакета

Общая конструкция:

```javascript
.Remove(
    "/путь до файла в бакете/"
);
```

- Удаляем файл

```javascript
var remove = await s3.Remove('test/123.png');

// возвращается true или false.
// true при успешном удалении, даже если файла нет
// false при других критических ошибках
```

**return:**

```javascript
true;
```

### Удаление всех файлов из бакета

Общая инструкция:

```javascript
.CleanUp()
```

Очищаем бакет от файлов целиком и полностью:

```javascript
var result = await s3.CleanUp();
```

Технически файлы удаляются пачками по 1000 штук. Для каждой пачки будут свои `Deleted` и `Errors` ключи, которые содержат данные об успешно удалённых объектах(файлах) и данные о файлах, при удалении которых возникла ошибка. <br />
**return:**

```javascript
// Успешно удаленно 3 объекта
[ { Deleted: [ [Object], [Object], [Object] ], Errors: [] } ]

// Что из себя представляет Object.
{ Key: '/путь/до/файла', VersionId: 'null' }

// При неуспешном выполнении метода будет получен следующий результат:
false
```

## Примеры использования

### Multer и Express

Пример загрузки файлов через multer и express.  
Кейс: нужно загрузить файл с фронта на сервер, а потом загрузить его на Yandex Object Storage.

- Устанавливаешь express и multer

```bash
npm i express
npm i multer
```

- В файле проекта привязываешь multer и easy-yandex-s3

```javascript
// Создаем веб-сервер
var express = require('express');
var app = express();
app.listen(8000);

// Подключаем multer и eys3
var multer = require('multer');
var EasyYandexS3 = require('easy-yandex-s3');

// Указываем аутентификацию в Yandex Object Storage
var s3 = new EasyYandexS3({
  auth: {
    accessKeyId: '',
    secretAccessKey: '',
  },
  Bucket: 'my-storage', // Название бакета
  debug: false, // Дебаг в консоли
});

// Подключаешь мидлвар multer для чтения загруженных файлов
app.use(multer().any());

// Делаешь фетч post-запроса с отправленным файлом по ссылке /uploadFile
app.post('/uploadFile', async (req, res) => {
  let buffer = req.files[0].buffer; // Буфер загруженного файла
  var upload = await s3.Upload({ buffer }, '/files/'); // Загрузка в бакет
  res.send(upload); // Ответ сервера - ответ от Yandex Object Storage
});
```
