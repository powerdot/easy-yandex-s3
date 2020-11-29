[![Easy Yandex S3 Logo](https://storage.yandexcloud.net/actid-storage/easy-yandex-s3/eys3.png)](https://github.com/powerdot/easy-yandex-s3)

[![Build Status](https://travis-ci.org/powerdot/easy-yandex-s3.svg?branch=master)](https://travis-ci.org/powerdot/easy-yandex-s3) [![YouTube IlyaDevman](https://storage.yandexcloud.net/actid-storage/GitHubImages/gt-yt-overview.png)](https://youtu.be/L_6PiJFaldI)

Использовать S3 API ***Яндекс.Облака*** еще проще.
Хранилище называется у них там ***Object Storage***.

Поддержка от NodeJS 8 версии.

✓ Загружайте файл  
✓ Загружайте массив файлов  
✓ Загружайте целые папки с вложенными внутри папками и файлами  
✓ Загружайте Buffer  
✓ Скачивайте файлы с бакета  
✓ Удаляйте файлы с бакета  
✓ Получайте информацию о файлах в бакете  


Поехали!

## Оглавление
* [Теория](#теория-orly) - что такое хранилище и как работает
* [Инструкция создания](#создайте-сервисный-аккаунт-в-яндексоблаке) сервисного аккаунта
* [Начало работы](#как-с-этим-работать)
* * [Загрузка файла](#загрузка-файла-в-бакет)
* * * [Загрузка файлов](#загрузка-файлов-в-бакет) 
* * [Получение списка директорий и файлов бакета](#получение-списка-директорий-и-файлов-бакета)
* * [Скачивание файла из бакета](#получение-списка-директорий-и-файлов-бакета)
* * [Удаление файла из бакета](#удаление-файла-из-бакета)
* [Примеры использования](#примеры-использования)
* * [Загрузка с multer](#multer-и-express)
* [Разработчик git@powerdot](https://github.com/powerdot/)

Ссылка на описание официального API Яндекса.  
https://cloud.yandex.ru/docs/storage/s3/

Ссылка на описание S3 API Amazon (англ.)  
https://docs.aws.amazon.com/en_us/AmazonS3/latest/API/Welcome.html

## Теория O'RLY

Хранилище состоит из бакетов.  
Бакет (Bucket) - это, грубо говоря, ваш жесткий диск в интернетах.  
Чтобы загружать что-либо в Яндекс.Облако и хранить там свои файлы, вам нужно сделать этот самый бакет.  

У бакета есть ID. ID совпадает с его названием, которое вы придумаете, например **my-storage**.  

Доступ к бакету можно получить с помощью специального аккаунта, его называют **сервисный аккаунт**.  

От него есть логин и пароль, только логин и пароль называется **ключем**, а логин - это **"Идентификатор ключа"**, а пароль - это **"Секретный ключ"**. Не бойтесь, здесь все очень легко.  

И так, предположим вы уже сделали свой бакет (как его делать, я не рассказываю, там всё довольно просто). А может даже уже сделали папки внутри (кстати, это не обязательно).  

Время получить доступ для работ с бакетом!  

## Создайте сервисный аккаунт в Яндекс.Облаке

1. Зайдите в ЛК  
https://console.cloud.yandex.ru/cloud  

2. В каталогах выберите нужный каталог в списке справа.  

3. В меню слева нажмите *Сервисные аккаунты*  

4. Справа сверху нажмите *Создать аккаунт*  

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
var EasyYandexS3 = require("easy-yandex-s3");

// Инициализация
var s3 = new EasyYandexS3({
    auth: {
        accessKeyId: "ИДЕНТИФИКАТОР_КЛЮЧА",
        secretAccessKey: "ДЛИННЫЙ_СЕКРЕТНЫЙ_КЛЮЧ",
    },
    Bucket: "НАЗВАНИЕ_БАКЕТА", // например, "my-storage",
    debug: true // Дебаг в консоли, потом можете удалить в релизе
});
```

---------
### Загрузка файла в бакет

Общая конструкция:  

```javascript
.Upload(
    { параметры }, 
    "папка/в/бакете"
)
```

* Загрузка по расположению файла  
123.png -> [bucket-name]/test/07af8a67f6a4fa5f65a7f687a98fa6f2a34f.png  

```javascript
var upload = await s3.Upload({
    path: path.resolve(__dirname, "./123.png")
},  "/test/" );
console.log(upload);    // <- Возвращает путь к файлу в хранилище и всякую дополнительную информацию.
                        // если вернулся false - произошла ошибка
                        // Файл загрузится в [my-stogare]/test/{md5_сумма}.{расширение}
```

* Загрузка по расположению файла, с указанием оригинального имени и расширения файла  
123.png -> [bucket-name]/test/123.png  

```javascript
var upload = await s3.Upload({
    path: path.resolve(__dirname, "./123.png"),
    save_name: true
}, "/test/");
console.log(upload);    // Возвращает путь к файлу в хранилище и всякую дополнительную информацию.
                        // если вернулся false - произошла ошибка
                        // Файл загрузится в [my-stogare]/test/123.png
```

* Загрузка по расположению файла, с указанием имени файла для загрузки  
123.png -> [bucket-name]/test/lolkek.png  

```javascript
var upload = await s3.Upload({
    path: path.resolve(__dirname, "./123.png"),
    name: "lolkek.png"
}, "/test/");
  console.log(upload);  // <- Возвращает путь к файлу в хранилище и всякую дополнительную информацию.
                        // если вернулся false - произошла ошибка
                        // Файл загрузится в [my-stogare]/test/lolkek.png
```


* Загрузка буфера  
<Buffer> -> [bucket-name]/test/cad9c7a68dca57ca6dc9a7dc8a86c.png  

```javascript
var upload = await s3.Upload({
    buffer: file_buffer
}, "/test/");
console.log(upload);    // <- Возвращает путь к файлу в хранилище и всякую дополнительную информацию.
                        // если вернулся false - произошла ошибка
                        // Файл загрузится в [my-stogare]/test/{md5_сумма}.{расширение}
```

* Загрузка буфера с определением имени и расширения файла  
<Buffer> -> [bucket-name]/test/lolkek.png  

```javascript
var upload = await s3.Upload({
    buffer: file_buffer,
    name: "lolkek.png"
}, "/test/");
console.log(upload);    // <- Возвращает путь к файлу в хранилище и всякую дополнительную информацию.
                        // если вернулся false - произошла ошибка
                        // Файл загрузится в [my-stogare]/test/lolkek.png
```

**return:**
```
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

* Загружаем контент папки в бакет  
контент папки -> [bucket]/folder_on_server/  

Модуль берет все файлы и папки внутри указанной папки. **То есть саму папку он не загрузит, а только ее контент.**  

Представим себе папку `./my_folder`:  

- my_folder
- - 1.png
- - 2.png
- - folder_inside
- - - 3.png

Устанавливаем параметр ` route ` как "**folder_on_server**", грубо говоря, это ` [my_bucket]/folder_on_server/ `  
То загрузка на бакет будет следующей:  

`
[my_bucket]/folder_on_server/1.png 
`
`
[my_bucket]/folder_on_server/2.png 
`
`
[my_bucket]/folder_on_server/folder_inside/3.png 
`

Грубо говоря, мы просто телепортируем контент указанный папки в указанную папку на сервере.   
Ребят, это просто CMD+C CMD+V.  

```javascript
// Относительный путь:
var upload = await s3.Upload({
    path: "./my_folder",  // относительный путь до папки
    save_name: true // сохранять оригинальные названия файлов 
}, "/folder_on_server/");
console.log(upload);    // <- массив загруженных файлов
```

```javascript
// Игнорируем файлы и папки внутри:
var upload = await s3.Upload({
    path: "./my_folder",  // относительный путь до папки
    save_name: true, // сохранять оригинальные названия файлов 
    ignore: [".git", "/assets/video"] // игнорируем все файлы .git и путь внутри с файлами /assets/video
}, "/folder_on_server/");
console.log(upload);    // <- массив загруженных файлов
```

```javascript
// Прямой путь:
var upload = await s3.Upload({
    path: "/Users/powerdot/sites/example.com/", // прямой путь до папки
    save_name: true // сохранять оригинальные названия файлов 
}, "/folder_on_server/");
console.log(upload);    // <- массив загруженных файлов
```

* Загрузка нескольких файлов  
массив файлов -> [bucket]/folder_on_server/  

```javascript
// используем массив файлов следующим образом:
var upload = await s3.Upload([
    {path:"./file1.jpg", save_name: true}, // относительный путь до файла с сохранением имени
    {path:"/Users/powerodt/dev/sites/folder/file2.css"}, // прямой путь до файла с изменением имени на md5-сумму
    {path:"./file.html", name: 'index.html'}, // относительный путь на файл с изменением имени при загрузке на index.html
], "/folder_on_server/");
```


**return:**  
Массив из Upload-объектов  
```
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
...]
```



### Получение списка директорий и файлов бакета

Общая конструкция:  

```javascript
.GetList(
    "директория/бакета"
);
```

* Получение корня бакета

```javascript
var list = await s3.GetList();
```

* Получение списка директорий и файлов из конкретной директории

```javascript
var list = await s3.GetList("/test/");
```

**return:**  
```
{ IsTruncated: false,
  Contents:
   [ { Key: 'test/',
       LastModified: 2019-07-08T13:52:57.000Z,
       ETag: '"md5sum"',
       Size: 0,
       StorageClass: 'STANDARD' },
     { Key: 'test/name.png',
       LastModified: 2019-07-15T22:10:09.000Z,
       ETag: '"md5sum"',
       Size: 20705,
       StorageClass: 'STANDARD' },],
  Name: 'testbucket',
  Prefix: 'test/',
  Delimiter: '/',
  MaxKeys: 1000,
  CommonPrefixes: [],
  KeyCount: 5 }
```

### Скачивание файла из бакета

Общая конструкция:

```javascript
.Download(
    "путь/до/файла/в/бакете",
    "путь/куда/сохраняем/на/клиенте"
);
```

* Скачивание файла и получение буфера этого файла

```javascript
var download = await s3.Download( 'test/123.png' );
```

* Скачивание файла и сохранение его в файл 

```javascript
var download = await s3.Download( 'test/123.png', './myfile.png' );
  
// в download так же дополнительно вернется Buffer
// а полученный файл с бакета будет сохранен как myfile.png в директории выполнения скрипта
```

**return:**  
```
{ data:
   { AcceptRanges: 'bytes',
     LastModified: 2019-07-15T22:10:09.000Z,
     ContentLength: 20705,
     ETag: '"md5sum"',
     ContentType: 'application/octet-stream',
     Metadata: {},
     Body:
      <Buffer 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52 00 00 06 42 00 00 09 60 08 03 00 00 00 e3 c3 db 77 00 00 00 04 67 41 4d 41 00 00 b1 8f 0b fc 61 05 00 ... > },
  destination_full_path: false,
  file_replaced: false }
```

### Удаление файла из бакета

Общая конструкция:

```javascript
.Remove(
    "/путь до файла в бакете/"
);
```

* Удаляем файл


```javascript
var remove = await s3.Remove( 'test/123.png' );

// возвращается true или false.
// true при успешном удалении, даже если файла нет
// false при других критических ошибках
```

**return:**
```
true
```

## Примеры использования

### Multer и Express

Пример загрузки файлов через multer и express.  
Кейс: нужно загрузить файл с фронта на сервер, а потом загрузить его на Yandex Object Storage.

* Устанавливаешь express и multer
```bash
npm i express
npm i multer
```

* В файле проекта привязываешь multer и easy-yandex-s3
```javascript
// Создаем веб-сервер
var express = require("express");
var app = express();
app.listen(8000)

// Подключаем multer и eys3
var multer = require("multer");
var EasyYandexS3 = require("easy-yandex-s3");

// Указываем аутентификацию в Yandex Object Storage
var s3 = new EasyYandexS3({
    auth: {
        accessKeyId: "",
        secretAccessKey: "",
    },
    Bucket: "my-storage", // Название бакета
    debug: false // Дебаг в консоли
});

// Подключаешь мидлвар multer для чтения загруженных файлов
app.use(multer().any());

// Делаешь фетч post-запроса с отправленным файлом по ссылке /uploadFile
app.post('/uploadFile', async(req,res)=>{
    let buffer = req.files[0].buffer; // Буфер загруженного файла
    var upload = await s3.Upload({buffer}, '/files/'); // Загрузка в бакет
    res.send(upload); // Ответ сервера - ответ от Yandex Object Storage
});
```
