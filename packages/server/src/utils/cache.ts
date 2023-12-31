import { db, Tables } from './db'
import type { FetchTracksResponse } from '../../../shared/api/Track'
import log from './log'
import fs from 'fs'
import { IAudioMetadata } from 'music-metadata'
import { CacheAPIs, CacheAPIsParams } from '../../../shared/CacheAPIs'
import { TablesStructures } from '../../../desktop/main/db'
import { FastifyReply } from 'fastify'
import { dirname } from './utils'

log.info('[electron] cache.ts')

class Cache {
  constructor() {
    //
  }

  async set(api: string, data: any, query: any = {}) {
    switch (api) {
      case CacheAPIs.UserPlaylist:
      case CacheAPIs.UserAccount:
      case CacheAPIs.Personalized:
      case CacheAPIs.RecommendResource:
      case CacheAPIs.UserAlbums:
      case CacheAPIs.UserArtists:
      case CacheAPIs.ListenedRecords:
      case CacheAPIs.Likelist: {
        if (!data) return
        db.upsert(Tables.AccountData, {
          id: api,
          json: JSON.stringify(data),
          updatedAt: Date.now(),
        })
        break
      }
      case CacheAPIs.Track: {
        const res = data as FetchTracksResponse
        if (!res.songs) return
        const tracks = res.songs.map(t => ({
          id: t.id,
          json: JSON.stringify(t),
          updatedAt: Date.now(),
        }))
        db.upsertMany(Tables.Track, tracks)
        break
      }
      case CacheAPIs.Unblock: {
        if (!data.id || !data.url) return
        db.upsert(Tables.Unblock, {
          id: data.id,
          json: JSON.stringify(data),
          updatedAt: Date.now(),
        })
        break
      }
      case CacheAPIs.Album: {
        if (!data.album) return
        data.album.songs = data.songs
        db.upsert(Tables.Album, {
          id: data.album.id,
          json: JSON.stringify(data.album),
          updatedAt: Date.now(),
        })
        break
      }
      case CacheAPIs.Playlist: {
        if (!data.playlist) return
        db.upsert(Tables.Playlist, {
          id: data.playlist.id,
          json: JSON.stringify(data),
          updatedAt: Date.now(),
        })
        break
      }
      case CacheAPIs.Artist: {
        if (!data.artist) return
        db.upsert(Tables.Artist, {
          id: data.artist.id,
          json: JSON.stringify(data),
          updatedAt: Date.now(),
        })
        break
      }
      case CacheAPIs.ArtistAlbum: {
        if (!data.hotAlbums) return
        db.createMany(
          Tables.Album,
          // data.hotAlbums.map((a: Album) => ({
          data.hotAlbums.map((a: any) => ({
            id: a.id,
            json: JSON.stringify(a),
            updatedAt: Date.now(),
          }))
        )
        const modifiedData = {
          ...data,
          // hotAlbums: data.hotAlbums.map((a: Album) => a.id),
          hotAlbums: data.hotAlbums.map((a: any) => a.id),
        }
        db.upsert(Tables.ArtistAlbum, {
          id: data.artist.id,
          json: JSON.stringify(modifiedData),
          updatedAt: Date.now(),
        })
        break
      }
      case CacheAPIs.Lyric: {
        if (!data.lrc) return
        db.upsert(Tables.Lyrics, {
          id: query.id,
          json: JSON.stringify(data),
          updatedAt: Date.now(),
        })
        break
      }
      case CacheAPIs.CoverColor: {
        if (!data.id || !data.color) return
        if (/^#([a-fA-F0-9]){3}$|[a-fA-F0-9]{6}$/.test(data.color) === false) {
          return
        }
        db.upsert(Tables.CoverColor, {
          id: data.id,
          color: data.color,
          queriedAt: Date.now(),
        })
        break
      }
      case CacheAPIs.AppleMusicAlbum: {
        if (!data.id) return
        db.upsert(Tables.AppleMusicAlbum, {
          id: data.id,
          json: data.album ? JSON.stringify(data.album) : 'no',
          updatedAt: Date.now(),
        })
        break
      }
      case CacheAPIs.AppleMusicArtist: {
        if (!data) return
        db.upsert(Tables.AppleMusicArtist, {
          id: data.id,
          json: data.artist ? JSON.stringify(data.artist) : 'no',
          updatedAt: Date.now(),
        })
        break
      }
    }
  }

  get<T extends keyof CacheAPIsParams>(api: T, params: any): any {
    switch (api) {
      case CacheAPIs.UserPlaylist:
      case CacheAPIs.UserAccount:
      case CacheAPIs.Personalized:
      case CacheAPIs.RecommendResource:
      case CacheAPIs.UserArtists:
      case CacheAPIs.ListenedRecords:
      case CacheAPIs.Likelist: {
        const data = db.find(Tables.AccountData, api)
        if (data?.json) return JSON.parse(data.json)
        break
      }
      case CacheAPIs.Track: {
        const ids: number[] = params?.ids.split(',').map((id: string) => Number(id))
        if (ids.length === 0) return

        if (ids.includes(NaN)) return

        const tracksRaw = db.findMany(Tables.Track, ids)

        if (tracksRaw.length !== ids.length) {
          return
        }
        const tracks = ids.map(id => {
          const track = tracksRaw.find(t => t.id === Number(id)) as any
          return JSON.parse(track.json)
        })
        return {
          code: 200,
          songs: tracks,
          privileges: {},
        }
      }
      case CacheAPIs.Unblock: {
        if (isNaN(Number(params?.id))) return
        const data = db.find(Tables.Unblock, params.id)
        if (data?.json)
          return {
            resourceState: true,
            songs: [],
            code: 200,
            album: JSON.parse(data.json),
          }
        break
      }
      case CacheAPIs.Album: {
        if (isNaN(Number(params?.id))) return
        const data = db.find(Tables.Album, params.id)
        if (data?.json)
          return {
            resourceState: true,
            songs: [],
            code: 200,
            album: JSON.parse(data.json),
          }
        break
      }
      case CacheAPIs.Playlist: {
        if (isNaN(Number(params?.id))) return
        const data = db.find(Tables.Playlist, params.id)
        if (data?.json) return JSON.parse(data.json)
        break
      }
      case CacheAPIs.Artist: {
        if (isNaN(Number(params?.id))) return
        const data = db.find(Tables.Artist, params.id)
        const fromAppleData = db.find(Tables.AppleMusicArtist, params.id)
        const fromApple = fromAppleData?.json && JSON.parse(fromAppleData.json)
        const fromNetease = data?.json && JSON.parse(data.json)
        if (fromNetease && fromApple && fromApple !== 'no') {
          fromNetease.artist.img1v1Url = fromApple.attributes.artwork.url
          fromNetease.artist.briefDesc = fromApple.attributes.artistBio
        }
        return fromNetease ? fromNetease : undefined
      }
      case CacheAPIs.ArtistAlbum: {
        if (isNaN(Number(params?.id))) return

        const artistAlbumsRaw = db.find(Tables.ArtistAlbum, params.id)
        if (!artistAlbumsRaw?.json) return
        const artistAlbums = JSON.parse(artistAlbumsRaw.json)

        const albumsRaw = db.findMany(Tables.Album, artistAlbums.hotAlbums)
        if (albumsRaw.length !== artistAlbums.hotAlbums.length) return
        const albums = albumsRaw.map(a => JSON.parse(a.json))

        artistAlbums.hotAlbums = artistAlbums.hotAlbums.map((id: number) =>
          albums.find(a => a.id === id)
        )
        return artistAlbums
      }
      case CacheAPIs.Lyric: {
        if (isNaN(Number(params?.id))) return
        const data = db.find(Tables.Lyrics, params.id)
        if (data?.json) return JSON.parse(data.json)
        break
      }
      case CacheAPIs.CoverColor: {
        if (isNaN(Number(params?.id))) return
        return db.find(Tables.CoverColor, params.id)?.color
      }
      case CacheAPIs.Artist: {
        if (!params.ids?.length) return
        const artists = db.findMany(Tables.Artist, params.ids)
        if (artists.length !== params.ids.length) return
        const result = artists.map(a => JSON.parse(a.json))
        result.sort((a, b) => {
          const indexA: number = params.ids.indexOf(a.artist.id)
          const indexB: number = params.ids.indexOf(b.artist.id)
          return indexA - indexB
        })
        return result
      }
      case CacheAPIs.AppleMusicAlbum: {
        if (isNaN(Number(params?.id))) return
        const data = db.find(Tables.AppleMusicAlbum, params.id)
        if (data?.json && data.json !== 'no') return JSON.parse(data.json)
        break
      }
      case CacheAPIs.AppleMusicArtist: {
        if (isNaN(Number(params?.id))) return
        const data = db.find(Tables.AppleMusicArtist, params.id)
        if (data?.json && data.json !== 'no') return JSON.parse(data.json)
        break
      }
    }
  }

  getAudio(fileName: string, reply: FastifyReply) {
    if (!fileName) {
      return reply.status(400).send({ error: 'No filename provided' })
    }
    const id = Number(fileName.split('-')[0])

    try {
      const path = `${dirname}/audio_cache/${fileName}`
      const audio = fs.readFileSync(path)
      if (audio.byteLength === 0) {
        db.delete(Tables.Audio, id)
        fs.unlinkSync(path)
        return reply.status(404).send({ error: 'Audio not found' })
      }
      db.update(Tables.Audio, id, { queriedAt: Date.now() })
      reply
        .status(206)
        .header('Accept-Ranges', 'bytes')
        .header('Connection', 'keep-alive')
        .header('Content-Range', `bytes 0-${audio.byteLength - 1}/${audio.byteLength}`)
        .send(audio)
    } catch (error) {
      reply.status(500).send({ error })
    }
  }

  async setAudio(
    buffer: Buffer,
    { id, url, bitrate }: { id: number; url: string; bitrate: number }
  ) {
    const path = `${dirname}/audio_cache`

    try {
      fs.statSync(path)
    } catch (e) {
      fs.mkdirSync(path)
    }
    let meta!: IAudioMetadata
    ;(async () => {
      const { parseBuffer } = await import('music-metadata')
      await parseBuffer(buffer).then(res => {
        meta = res
      })
    })()
    const bitRate = meta?.format?.codec === 'OPUS' ? 165000 : meta.format.bitrate ?? 0
    const type =
      {
        'MPEG 1 Layer 3': 'mp3',
        'Ogg Vorbis': 'ogg',
        AAC: 'm4a',
        FLAC: 'flac',
        OPUS: 'opus',
      }[meta.format.codec ?? ''] ?? 'unknown'

    let source: TablesStructures[Tables.Audio]['source'] = 'unknown'
    if (url.includes('googlevideo.com')) source = 'youtube'
    if (url.includes('126.net')) source = 'netease'

    fs.writeFile(`${path}/${id}-${bitRate}.${type}`, buffer, error => {
      if (error) {
        return log.error(`[cache] cacheAudio failed: ${error}`)
      }
      log.info(`Audio file ${id}-${bitRate}.${type} cached!`)

      db.upsert(Tables.Audio, {
        id,
        bitRate,
        format: type as TablesStructures[Tables.Audio]['format'],
        source,
        queriedAt: Date.now(),
      })

      log.info(`[cache] cacheAudio ${id}-${bitRate}.${type}`)
    })
  }
}
const cache = new Cache()

export default cache
