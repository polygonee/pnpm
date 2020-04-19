import contentPath = require('cacache/lib/content/path')
import fs = require('fs')
import StreamCache = require('stream-cache')
import decompress = require('decompress-maybe')
import fileOutputStream from './FileOutputStream'
import path = require('path')
import exists = require('path-exists')
import ssri = require('ssri')
import tar = require('tar-stream')
import { Duplex } from 'stream'

export default function untar (
  unpackingLocker: Map<string, Promise<void>>,
  stream: NodeJS.ReadableStream,
  dest: string,
  opts?: {
    ignore?: (filename: string) => boolean,
  },
) {
  const ignore = opts && opts.ignore ? function (header: {name: string}) {
    return opts.ignore!(header && header.name)
  } : () => false
  const extract = tar.extract()
  return new Promise((resolve, reject) => {
    extract.on('entry', async (header, fileStream, next) => {
      if (header.type !== 'file' || ignore(header)) {
        next()
        return
      }
      const cache = new StreamCache()
      fileStream.pipe(cache)
      const integrity = (await ssri.fromStream(fileStream)).toString()
      if (unpackingLocker.has(integrity)) {
        await unpackingLocker.get(integrity)
        next()
        return
      }
      const p = (async () => {
        const fileDest = contentPath(dest, integrity)

        if (await exists(fileDest)) return

        await fileOutputStream(cache as any, fileDest)
      })()
      unpackingLocker.set(integrity, p)
      await p
      next()
    })
    // listener
    extract.on('finish', function(){
        resolve();
    });
    extract.on('error', reject);

    // pipe through extractor
    stream.pipe(decompress() as Duplex).on('error', reject).pipe(extract)
  })
}
