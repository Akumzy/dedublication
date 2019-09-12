import { Deduplicate, deduplicate, mergeBlocks, getHash, pipeline } from '../src'
import { stat, writeFile, ensureDir, createWriteStream, createReadStream } from 'fs-extra'
import { join } from 'path'
const file = join(__dirname, 'file.zip'),
  output = join(__dirname, 'new-file.zip'),
  bucket = join(__dirname, 'bucket'),
  firstJson = join(__dirname, 'block.json')
let fileSize: number, blocks: Deduplicate.HashObject

describe("Generate file hash and it's blocks", () => {
  beforeAll(async () => {
    await ensureDir(bucket)
  })
  test('deduplicate file', async done => {
    fileSize = (await stat(file)).size
    blocks = await deduplicate(file)
    await writeFile(firstJson, JSON.stringify(blocks, null, '  '))
    done()
  })

  test('re-deduplicate file', done => {
    deduplicate(file).then(d => {
      expect(d).toEqual(blocks)
      done()
    })
  })
  test('Save blocks to bucket and compare re-hash and compare', async done => {
    const newBlockHashs: string[] = []
    for (const block of blocks.blocks) {
      const path = join(bucket, block.hash)
      await pipeline(
        createReadStream(file, { start: block.start, end: block.end - 1, encoding: null }),
        createWriteStream(path, { encoding: null })
      )
      const h = await getHash(path)
      newBlockHashs.push(h)
    }
    const blocksHash = blocks.blocks.map(b => b.hash)
    expect(newBlockHashs).toEqual(blocksHash)
    done()
  })
  test('Merge file blocks back', async done => {
    const op: Deduplicate.MergeOptions = {
      output,
      blocks: blocks.blocks.map(b => ({ start: b.start, end: b.end, bucket, hash: b.hash }))
    }
    await mergeBlocks(op)
    const newSize = (await stat(output)).size
    expect(newSize).toEqual(fileSize)
    const newBlocks = await deduplicate(output)
    expect(newBlocks).toEqual(blocks)
    done()
  })
})