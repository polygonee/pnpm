import rimraf = require('@zkochan/rimraf')
import fs = require('mz/fs')
import pDefer = require('p-defer')
import path = require('path')
import renameOverwrite = require('rename-overwrite')
import ssri = require('ssri')
import { Readable } from 'stream'

// It might happen (extremly rarely), that two tarballs with
// the same integrity will be written to the store at the same
// time. It is a bit of an overhead but the store will not be
// left broken because the tarball write operation is atomic.
export async function addTarballStreamToCafs (
  cafsDir: string,
  tarballStream: Readable,
  integrity: string,
) {
  const hex = ssri.parse(integrity).hexDigest()
  const temp = path.join(cafsDir, 'tmp', hex)
  const writeStream = fs.createWriteStream(temp)
  try {
    const writePromise = pDefer()
    tarballStream
      .on('error', writePromise.reject)
      .pipe(writeStream)
      .on('error', writePromise.reject)
      .on('close', writePromise.resolve)
    await Promise.all([
      writePromise.promise,
      ssri.checkStream(tarballStream, integrity),
    ])
    const fileDest = getTarballPath(cafsDir, hex)
    await renameOverwrite(temp, fileDest)
  } catch (err) {
    rimraf(temp).catch(() => {
      // ignore errors
    })
    throw err
  }
}

export function readTarballStreamFromCafs (
  cafsDir: string,
  integrity: string,
) {
  const tarballPath = getTarballPath(cafsDir, ssri.parse(integrity).hexDigest())
  const stream = fs.createReadStream(tarballPath)
  return {
    checking: ssri.checkStream(stream, integrity).catch((err) => {
      rimraf(tarballPath).catch(() => {
        // ignore errors
      })
      throw err
    }),
    stream,
  }
}

function getTarballPath (cafsDir: string, hex: string) {
  return path.join(cafsDir, 'tar',
    `${path.join(hex.slice(0, 2), hex.slice(2))}.tgz`)
}
