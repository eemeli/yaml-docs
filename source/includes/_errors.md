# Errors

All errors and warnings produced by the `yaml` parser functions contain the following fields:

| Member  | Type       | Description                                                                           |
| ------- | ---------- | ------------------------------------------------------------------------------------- |
| name    | `string`   | One of `YAMLReferenceError`, `YAMLSemanticError`, `YAMLSyntaxError`, or `YAMLWarning` |
| message | `string`   | A human-readable description of the error                                             |
| source  | `AST Node` | The AST node at which this error or warning was encountered                           |

## YAMLReferenceError

An error resolving a tag or an anchor that is referred to in the source. It is likely that the contents of the `source` node have not been completely parsed into the document. Not used by the AST parser.

## YAMLSemanticError

An error related to the metadata of the document, or an error with limitations imposed by the YAML spec. The data contents of the document should be valid, but the metadata may be broken.

## YAMLSyntaxError

A serious parsing error; the document contents will not be complete, and the AST is likely to be rather broken.

## YAMLWarning

Not an error, but a spec-mandated warning about unsupported directives or a fallback resolution being used for a node with an unavailable tag. Not used by the AST parser.
