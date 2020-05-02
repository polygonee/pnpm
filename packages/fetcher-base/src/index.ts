import { Resolution } from '@pnpm/resolver-base'
import { Hash, Integrity } from 'ssri'
import { Readable } from 'stream'

export type Cafs = {
  addFilesFromDir: (dir: string) => Promise<FilesIndex>,
  addFilesFromTarball: (stream: NodeJS.ReadableStream) => Promise<FilesIndex>,
  addTarballStream: (stream: Readable, integrity: string) => Promise<void>,
  getTarballStream: (integrity: string) => { stream: Readable, checking: Promise<Hash> },
}

export interface FetchOptions {
  cachedTarballLocation: string,
  lockfileDir: string,
  onStart?: (totalSize: number | null, attempt: number) => void,
  onProgress?: (downloaded: number) => void,
}

export type FetchFunction = (
  cafs: Cafs,
  resolution: Resolution,
  opts: FetchOptions,
) => Promise<FetchResult>

export interface FetchResult {
  filesIndex: FilesIndex,
}

export interface FilesIndex {
  [filename: string]: {
    mode: number,
    size: number,
    generatingIntegrity: Promise<Integrity>,
  },
}
