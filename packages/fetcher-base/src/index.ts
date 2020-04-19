import { Resolution } from '@pnpm/resolver-base'
import { IntegrityMap } from 'ssri'

export type UnpackToCafs = (stream: NodeJS.ReadableStream, ignore: undefined | ((filename: string) => Boolean)) => Promise<FilesIndex>

export interface FetchOptions {
  cachedTarballLocation: string,
  lockfileDir: string,
  onStart?: (totalSize: number | null, attempt: number) => void,
  onProgress?: (downloaded: number) => void,
  unpackToCafs: UnpackToCafs,
}

export type FetchFunction = (
  resolution: Resolution,
  opts: FetchOptions,
) => Promise<FetchResult>

export interface FetchResult {
  filesIndex: FilesIndex,
}

export interface FilesIndex {
  [filename: string]: {
    size: number,
    generatingIntegrity: Promise<IntegrityMap>,
  },
}
