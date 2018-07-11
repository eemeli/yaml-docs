# YAML

> To install:

```sh
npm install yaml
# or
yarn add yaml
```

`yaml` is a JavaScript parser and stringifier for [YAML](http://yaml.org/), a human friendly data serialization standard. It supports both parsing and stringifying data using all versions of YAML, along with all common data schemas. As a particularly distinguishing feature, `yaml` fully supports reading and writing comments in YAML documents.

The library is released under the ISC open source license, and the code is [available on GitHub](https://github.com/eemeli/yaml/). It has no external dependencies, and is usable in both browser and node environments.

## API Overview

The API provided by `yaml` has three layers, depending on how deep you need to go: [Pure JavaScript](#pure-javascript), [YAML Documents](#yaml-documents), and the [CST Parser](#cst-parser). The first has the simplest API and "just works", the second gets you all the bells and whistles supported by the library along with a decent AST, and the third is the closest to YAML source, making it fast, raw, and crude.

<h3>Pure JavaScript</h3>

```js
import YAML from 'yaml'
// or
const YAML = require('yaml').default
```

* [`YAML.parse(str, options): value`](#yaml-parse)
* [`YAML.stringify(value, options): string`](#yaml-stringify)

<h3>YAML Documents</h3>

* [`YAML.createNode(value, wrapScalars): Node`](#creating-nodes)
* [`YAML.defaultOptions`](#options)
* [`YAML.Document`](#yaml-documents)
  * [`constructor(options)`](#creating-documents)
  * [`defaults`](#options)
  * [`#anchors`](#working-with-anchors)
  * [`#contents`](#content-nodes)
  * [`#errors`](#errors)
* [`YAML.parseAllDocuments(str, options): YAML.Document[]`](#parsing-documents)
* [`YAML.parseDocument(str, options): YAML.Document`](#parsing-documents)

```js
import Map from 'yaml/map'
import Pair from 'yaml/pair'
import Seq from 'yaml/seq'
```

* [`new Map()`](#creating-nodes)
* [`new Pair(key, value)`](#creating-nodes)
* [`new Seq()`](#creating-nodes)

<h3>CST Parser</h3>

```js
import parseCST from 'yaml/parse-cst'
```

* [`parseCST(str): CSTDocument[]`](#parsecst)
* [`YAML.parseCST(str): CSTDocument[]`](#parsecst)
