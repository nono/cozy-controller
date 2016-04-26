Files service
=============

Cozy applications can use files for storing binary content, like photos or
bills in PDF. This service offers a REST API to manipulate easily without
having to know the underlying storage layer.



TODO
----

* compression (gzip, deflate, brotli)
* CORS
* checksum
* explain how to move/copy files from one bucket to another
* changes feed



Buckets
-------

A bucket can be seen as the equivalent of a partition on an hard-disk. It's a
space where to put files and folders. It has a slug to identify it and a
storage URL. We aim to implement three storage providers (CouchDB, directly on
the hard-disk and Open-Stack/Swift), but contributions for more providers are
welcomed.

It is recommended to have a bucket named `default`, as it will be used by
default by many applications.

### POST /services/buckets

Add a new bucket

#### Parameters

Parameter | Description
----------|------------
type      | `bucket`
id        | _UUID_
slug      | the slug of the bucket, lowercase alpha is prefered (_string_)
storage   | the URL to select a provider and configure it for storage (_string_)

> Request

```http
POST /services/buckets HTTP/1.1
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
```

```json
{
  "data": {
    "type": "bucket",
    "attributes": {
      "slug": "bills",
      "storage": "file:///media/external-disk"
    }
  }
}
```

> Response

```http
HTTP/1.1 202 Accepted
Location: http://cozy.example.com/services/buckets/fce1a6c0-dfc5-11e5-8d1a-1f854d4aaf81
Content-Type: application/vnd.api+json
```

```json
{
  "data": {
    "type": "bucket",
    "id": "fce1a6c0-dfc5-11e5-8d1a-1f854d4aaf81",
    "attributes": {
      "slug": "bills",
      "storage": "file:///media/external-disk"
    },
    "links": {
      "self": "/services/buckets/fce1a6c0-dfc5-11e5-8d1a-1f854d4aaf81"
    }
  }
}
```

### GET /services/buckets

Return the list of all the buckets

```http
GET /services/buckets/84be6fce-dfc6-11e5-a9e5-579e7aecbe76 HTTP/1.1
Accept: application/vnd.api+json
```

> Response

```json
{
  "data": [{
    "type": "bucket",
    "id": "67563b60-dfc6-11e5-9362-7f661eb6a672",
    "attributes": {
      "slug": "default",
      "storage": "swift://swift.cozycloud.cc/joe",
      "space": {
        "free": 1234567,
        "used": 7654321,
        "total": 8888888
      }
    },
    "links": {
      "self": "/services/buckets/67563b60-dfc6-11e5-9362-7f661eb6a672"
    }
  }, {
    "type": "bucket",
    "id": "fce1a6c0-dfc5-11e5-8d1a-1f854d4aaf81",
    "attributes": {
      "slug": "bills",
      "storage": "file:///media/external-disk",
      "space": {
        "free": 12345678,
        "used": 87654321,
        "total": 99999999
      }
    },
    "links": {
      "self": "/services/buckets/fce1a6c0-dfc5-11e5-8d1a-1f854d4aaf81"
    }
  }, {
    "type": "bucket",
    "id": "84be6fce-dfc6-11e5-a9e5-579e7aecbe76",
    "attributes": {
      "slug": "images",
      "storage": "couchd://127.0.0.1:5984/cozy-joe",
      "space": {
        "free": 123456,
        "used": 654321,
        "total": 777777
      }
    },
    "links": {
      "self": "/services/buckets/84be6fce-dfc6-11e5-a9e5-579e7aecbe76"
    }
  }]
}
```

### GET /services/buckets/:id

### GET /services/buckets/:slug

Return informations about this bucket

> Request

```http
GET /services/buckets/84be6fce-dfc6-11e5-a9e5-579e7aecbe76 HTTP/1.1
Accept: application/vnd.api+json
```

> Response

```json
{
  "data": {
    "type": "bucket",
    "id": "84be6fce-dfc6-11e5-a9e5-579e7aecbe76",
    "attributes": {
      "slug": "images",
      "storage": "couchd://127.0.0.1:5984/cozy-joe",
      "space": {
        "free": 123456,
        "used": 654321,
        "total": 777777
      }
    },
    "links": {
      "self": "/services/buckets/84be6fce-dfc6-11e5-a9e5-579e7aecbe76"
    }
  }
}
```

### DELETE /services/buckets/:id

### DELETE /services/buckets/:slug

Remove the bucket. All files and folders in this bucket will be lost!

> Request

```http
DELETE /services/buckets/84be6fce-dfc6-11e5-a9e5-579e7aecbe76 HTTP/1.1
```

> Response

```http
HTTP/1.1 204 No Content
```



Folders
-------

A folder is a container for files and sub-folders.

Its path is the path of its parent (or the slug of its bucket if at root), a
slash (`/`), and its name. It's case sensitive.

### POST /services/folders/:bucket-slug

### POST /services/folders/:folder-id

Create a new folder. It can be at the root of a bucket (with the
`bucket-slug`), or inside an already existing folder (with the `id` of this
folder).

#### Parameters

Parameter  | Description
-----------|------------
type       | `folder`
id         | _UUID_
rev        | revision from CouchDB (_string_)
name       | the name of the folder (_string_)
created_at | the date of the creation (_date_)
updated_at | the last metadata update (_date_)
tags       | the list of tags (_array of strings_)

> Request

```http
POST /services/folders/fce1a6c0-dfc5-11e5-8d1a-1f854d4aaf81 HTTP/1.1
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
```

```json
{
  "data": {
    "type": "folder",
    "attributes": {
      "name": "phone",
      "tags": ["from-konnectors"]
    }
  }
}
```

> Response

```http
HTTP/1.1 202 Accepted
Location: http://cozy.example.com/services/folders/6494e0ac-dfcb-11e5-88c1-472e84a9cbee
Content-Type: application/vnd.api+json
```

```json
{
  "data": {
    "type": "folder",
    "id": "6494e0ac-dfcb-11e5-88c1-472e84a9cbee",
    "attributes": {
      "rev": "1-ff3beeb456eb",
      "name": "phone",
      "created_at": "2016-03-01T16:45:08Z",
      "update_at": "2016-03-01T16:45:08Z",
      "tags": ["from-konnectors"]
    },
    "links": {
      "self": "/services/folders/6494e0ac-dfcb-11e5-88c1-472e84a9cbee"
    }
  }
}
```



Files
-----

A file is a binary content with some metadata.

### POST /services/files/:folder-id

#### Parameters

Parameter  | Description
-----------|------------
type       | `file`
id         | _UUID_
rev        | revision from CouchDB (_string_)
name       | the name of the file (_string_)
size       | the size on disk (_integer_)
created_at | the date of the creation (_date_)
updated_at | the last modification date (_date_)
checksum   | the sha1sum of its content (_string_)
class      | generic class of the mime-type (_string_, can be document, image, etc.)
mime       | the precise mime-type (_string_ like image/jpeg)
executable | true if the file is executable, undefined else (_bool_)
tags       | the list of tags (_array of strings_)

### GET /services/files/:id

### GET /services/files/:id/content

### GET /services/files/:id/thumbnail
