import path = require('path')
import ssri = require('ssri')
import tar = require('tar-stream')
import fileOutputStream from './FileOutputStream'
import decompress = require('decompress-maybe')
import { Duplex } from 'stream'
import StreamCache = require('stream-cache')

export default function untar (
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
      const integrity = await ssri.fromStream(fileStream)
      await fileOutputStream(cache as any, path.join(dest, encodeURIComponent(integrity.toString())))
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
