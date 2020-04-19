import { FilesIndex } from '@pnpm/fetcher-base'
import contentPath = require('cacache/lib/content/path')
import fs = require('fs')
import StreamCache = require('stream-cache')
import decompress = require('decompress-maybe')
import fileOutputStream from './FileOutputStream'
import path = require('path')
import exists = require('path-exists')
import ssri = require('ssri')
import tar = require('tar-stream')
import { Duplex, PassThrough } from 'stream'

export default async function untar (
  unpackingLocker: Map<string, Promise<void>>,
  dest: string,
  stream: NodeJS.ReadableStream,
  _ignore?: (filename: string) => Boolean,
): Promise<FilesIndex> {
  const ignore = _ignore ? _ignore : () => false
  const extract = tar.extract()
  const filesIndex = {}
  await new Promise((resolve, reject) => {
    extract.on('entry', async (header, fileStream, next) => {
      const filename = header.name.substr(header.name.indexOf('/') + 1)
      if (header.type !== 'file' || ignore(filename)) {
        next()
        return
      }
      const generatingIntegrity = addFileToCafs(unpackingLocker, dest, fileStream)
      filesIndex[filename] = {
        generatingIntegrity,
        size: header.size,
      }
      await generatingIntegrity
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
  return filesIndex
}

async function addFileToCafs (
  locker: Map<string, Promise<void>>,
  cafsDir: string,
  fileStream: PassThrough,
): Promise<ssri.Integrity> {
  const cache = new StreamCache()
  fileStream.pipe(cache)
  const integrity = await ssri.fromStream(fileStream)
  const fileDest = contentPath(cafsDir, integrity)
  if (locker.has(fileDest)) {
    await locker.get(fileDest)
    return integrity
  }
  const p = (async () => {

    if (await exists(fileDest)) return

    await fileOutputStream(cache as any, fileDest)
  })()
  locker.set(fileDest, p)
  await p
  return integrity
}

export function getFilePathInCafs (cafsDir: string, integrity: string) {
  return contentPath(cafsDir, ssri.parse(integrity))
}
