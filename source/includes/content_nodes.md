# Content Nodes

After parsing, the `contents` value of each `YAML.Document` is the root of an [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) of nodes representing the document (or `null` for an empty document).

## Scalar Values

```js
class Node {
  comment: ?string,   // a comment on or immediately after this
  commentBefore: ?string, // a comment before this
  range: ?[number, number],
      // the [start, end] range of characters of the source parsed
      // into this node (undefined for pairs or if not parsed)
  tag: ?string,       // a fully qualified tag, if required
  toJSON(): any       // a plain JS representation of this node
}
```

For scalar values, the `tag` will not be set unless it was explicitly defined in the source document; this also applies for unsupported tags that have been resolved using a fallback tag (string, `Map`, or `Seq`).

```js
class Scalar extends Node {
  format: 'BIN' | 'HEX' | 'OCT' | 'TIME' | undefined,
      // By default (undefined), numbers use decimal notation.
      // The YAML 1.2 core schema only supports 'HEX' and 'OCT'.
  type:
    'BLOCK_FOLDED' | 'BLOCK_LITERAL' | 'PLAIN' |
    'QUOTE_DOUBLE' | 'QUOTE_SINGLE' | undefined,
  value: any
}
```

A parsed document's contents will have all of its non-object values wrapped in `Scalar` objects, which themselves may be in some hierarchy of `Map` and `Seq` collections. However, this is not a requirement for the document's stringification, which is rather tolerant regarding its input values, and will use [`YAML.createNode`](#yaml-createnode) when encountering an unwrapped value.

When stringifying, the node `type` will be taken into account by `!!str` and `!!binary` values, and ignored by other scalars. On the other hand, `!!int` and `!!float` stringifiers will take `format` into account.

## Collections

```js
class Pair extends Node {
  key: Node | any,    // key and value are always Node or null
  value: Node | any,  // when parsed, but can be set to anything
  type: 'PAIR'
}

class Map extends Node {
  items: Array<Pair>,
  type: 'FLOW_MAP' | 'MAP' | undefined
}

class Seq extends Node {
  items: Array<Node | any>,
  type: 'FLOW_SEQ' | 'SEQ' | undefined
}
```

Within a YAML document, two forms of collections are supported: sequential `Seq` collections and key-value `Map` collections. The JavaScript representations of these collections both have an `items` array, which may (`Seq`) or must (`Map`) consist of `Pair` objects that contain a `key` and a `value` of any type, including `null`. The `items` array of a `Seq` object may contain values of any type.

When stringifying collections, by default block notation will be used. Flow notation will be selected if `type` is `FLOW_MAP` or `FLOW_SEQ`, the collection is within a surrounding flow collection, or if the collection is in an implicit key.

## Alias Nodes

```js
class Alias extends Node {
  source: Scalar | Map | Seq,
  type: 'ALIAS'
}

class Merge extends Pair {
  key: Scalar('<<'),      // defined by the type specification
  value: Seq<Alias(Map)>, // stringified as *A if length = 1
  type: 'MERGE_PAIR'
}
```

`Alias` nodes provide a way to include a single node in multiple places in a document; the `source` of an alias node must be a preceding node in the document. Circular references are supported at the AST level, but cannot be JSON-ified.

`Merge` nodes are not a core YAML 1.2 feature, but are defined as a [YAML 1.1 type](http://yaml.org/type/merge.html). They are only valid directly within a `Map#items` array and must contain one or more `Alias` nodes that themselves refer to `Map` nodes. When the surrounding map is resolved as a plain JS object, the key-value pairs of the aliased maps will be included in the object. Earlier `Alias` nodes override later ones, as do values set in the object directly.

To create and work with alias and merge nodes, you should use the [`YAML.Document#anchors`](#working-with-anchors) object.

## Creating Nodes

```js
const seq = YAML.createNode(['some', 'values', { balloons: 99 }])
// YAMLSeq {
//   items:
//    [ Scalar { value: 'some' },
//      Scalar { value: 'values' },
//      YAMLMap {
//        items:
//         [ Pair {
//             key: Scalar { value: 'balloons' },
//             value: Scalar { value: 99 } } ] } ] }

const doc = new YAML.Document()
doc.contents = seq
seq.items[0].comment = ' A commented item'
String(doc)
// - some # A commented item
// - values
// - balloons: 99
```

#### `YAML.createNode(value): Map | Seq | Scalar`

#### `YAML.createNode(value, false): Map | Seq | string | number | boolean | null`

`YAML.createNode` recursively turns objects into `Map` and arrays to `Seq` [collections](#collections). If the second `wrapScalars` argument is undefined or `true`, it also wraps plain values in `Scalar` objects. Its primary use is to enable attaching comments or other metadata to a value, or to otherwise exert more fine-grained control over the stringified output.

To stringify the output of `YAML.createNode` as YAML, you'll need to assign it to the `contents` of a Document (or somewhere within said contents), as the document's schema is required for YAML string output.

<h4 style="clear:both"><code>new Map(), new Seq(), new Pair(key, value)</code></h4>

```js
import YAML from 'yaml'
import Pair from 'yaml/pair'
import Seq from 'yaml/seq'

const doc = new YAML.Document()
doc.contents = new Seq()
doc.contents.items = [
  'some values',
  42,
  { including: 'objects', 3: 'a string' }
]
doc.contents.items.push(new Pair(1, 'a number'))

doc.toString()
// - some values
// - 42
// - "3": a string
//   including: objects
// - 1: a number
```

To construct a `Seq` or `Map`, use [`YAML.createNode()`](#yaml-createnode) with array or object input, or create the collections directly by importing the classes from `yaml/seq` and `yaml/map`.

Once created, normal array operations may be used to modify the `items` array. New `Pair` objects may created by importing the class from `yaml/pair` and using its `new Pair(key, value)` constructor. Note in particular that this is required to create non-`string` keys.

## Comments

```js
const doc = YAML.parseDocument(`
# This is YAML.
---
it has:
  - an array
  - of values
`)

doc.toJSON()
// { 'it has': [ 'an array', 'of values' ] }

doc.commentBefore
// ' This is YAML.'

const seq = doc.contents.items[0].value
seq.items[0].comment = ' item comment'
seq.comment = ' collection end comment'

doc.toString()
// # This is YAML.
// it has:
//   - an array # item comment
//   - of values
//   # collection end comment
```

A primary differentiator between this and other YAML libraries is the ability to programmatically handle comments, which according to [the spec](http://yaml.org/spec/1.2/spec.html#id2767100) "must not have any effect on the serialization tree or representation graph. In particular, comments are not associated with a particular node."

This library does allow comments to be handled programmatically, and does attach them to particular nodes. Each `Scalar`, `Map`, `Seq` and the `Document` itself has `comment` and `commentBefore` members that may be set to a stringifiable value. The string contents of comments are not processed by the library, except for merging adjacent comment lines together and prefixing each line with the `#` comment indicator.

**Note**: Due to implementation details, the library's comment handling is not completely stable. In particular, when reading and writing a YAML file, comments may move around a bit due to getting associated with a different node than intended.
