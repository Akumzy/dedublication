# deduplicate [![Build Status](https://travis-ci.com/Akumzy/deduplicate.svg?branch=master)](https://travis-ci.com/Akumzy/deduplicate)

## Introduction

This package provides you all the necessaries utility functions to implements file de-duplication ranging from splitting file content to blocks, generating hash and merging the file blocks together without corrupting the file.

## Installation

```bash
    npm install @akumzy/dd
    # Or
    yarn add @akumzy/dd
```

## Example

```js
const { deduplicate } = require('@akumzy/dd')
const { join } = require('path')
async function main() {
  const filePath = join(__dirname, './index.js')
  const ONE_MAGA_BYTES = 1024 * 1024
  const info = await deduplicate(filePath, ONE_MAGA_BYTES)
  console.log(info)
  // ->  {
  //     hash: 'f27a663ef8df8091e94d07ba090449a34b68461b9af5557377423057ce902484',
  //     blocks: [
  //       {
  //         order: 1,
  //         start: 0,
  //         end: 281,
  //         hash: '673c83b6fd07ba91954d4bc88f631bbe31bb9675b6c44b635801157c0ba94861'
  //       }
  //     ]
  //   }

  const bucket = join(__dirname, 'bucket') // directory most exists
  // write blocks to dist
  await createBlocks({ input: filePath, bucket })
  // -> Will create a blocks in bucket directory

  // merge blocks back
  const output = join(__dirname, 'new-index.js')
  const blocks = info.blocks.map(block => ({ start: block.start, end: block.end, bucket, hash: block.hash }))
  await mergeBlocks({ output, blocks })
  // -> Will create a new file out of the blocks
}
main()
```
