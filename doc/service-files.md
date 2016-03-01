Files service
=============

Cozy applications can use files for storing binary content, like photos or
bills in PDF. This service offers a REST API to manipulate easily without
having to know the underlying storage layer.



Buckets
-------

A bucket can be seen as the equivalent of a partition on an hard-disk. It's a
space where to put files and folders. It has a name to identify it and a
storage URL. We aim to implement three storage providers (CouchDB, directly on
the hard-disk and Open-Stack/Swift), but contributions for more providers are
welcomed.

It is recommended to have a bucket named `default`, as it will be used by
default by many applications.

### POST /services/buckets

Add a new bucket

#### Parameters

**type**    | `bucket`
**id**      | _UUID_
**name**    | the name of the bucket, lowercase is prefered (_string_)
**storage** | the URL to select a provider and configure it for storage (_string_)

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
      "name": "bills",
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
      "name": "bills",
      "storage": "file:///media/external-disk"
    },
    "links": {
      "self": "/services/buckets/bills/fce1a6c0-dfc5-11e5-8d1a-1f854d4aaf81"
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
[
  "data": [{
    "type": "bucket",
    "id": "67563b60-dfc6-11e5-9362-7f661eb6a672",
    "attributes": {
      "name": "default",
      "storage": "swift://swift.cozycloud.cc/joe",
      "space": {
        "free": 1234567,
        "used": 7654321,
        "total": 8888888
      }
    },
    "links": {
      "self": "/services/buckets/bills/67563b60-dfc6-11e5-9362-7f661eb6a672"
    }
  }, {
    "type": "bucket",
    "id": "fce1a6c0-dfc5-11e5-8d1a-1f854d4aaf81",
    "attributes": {
      "name": "bills",
      "storage": "file:///media/external-disk",
      "space": {
        "free": 12345678,
        "used": 87654321,
        "total": 99999999
      }
    },
    "links": {
      "self": "/services/buckets/bills/fce1a6c0-dfc5-11e5-8d1a-1f854d4aaf81"
    }
  }, {
    "type": "bucket",
    "id": "84be6fce-dfc6-11e5-a9e5-579e7aecbe76",
    "attributes": {
      "name": "images",
      "storage": "couchd://127.0.0.1:5984/cozy-joe",
      "space": {
        "free": 123456,
        "used": 654321,
        "total": 777777
      }
    },
    "links": {
      "self": "/services/buckets/bills/84be6fce-dfc6-11e5-a9e5-579e7aecbe76"
    }
  }]
]
```

### GET /services/buckets/:id

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
      "name": "images",
      "storage": "couchd://127.0.0.1:5984/cozy-joe",
      "space": {
        "free": 123456,
        "used": 654321,
        "total": 777777
      }
    },
    "links": {
      "self": "/services/buckets/bills/84be6fce-dfc6-11e5-a9e5-579e7aecbe76"
    }
  }
}
```

### DELETE /services/buckets/:id

Remove the bucket. All files and folders in this bucket will be lost!

> Request

```http
DELETE /services/buckets/84be6fce-dfc6-11e5-a9e5-579e7aecbe76 HTTP/1.1
```

> Response

```http
HTTP/1.1 204 No Content
```
