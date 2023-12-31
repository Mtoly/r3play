import { fetchArtistMV } from '@/web/api/artist'
import { IpcChannels } from '@/shared/IpcChannels'
import { CacheAPIs } from '@/shared/CacheAPIs'
import { FetchArtistMVParams, ArtistApiNames, FetchArtistMVResponse } from '@/shared/api/Artist'
import { useQuery } from '@tanstack/react-query'

export default function useArtistMV(params: FetchArtistMVParams) {
  return useQuery(
    [ArtistApiNames.FetchArtistMV, params],
    async () => {
      const data = await fetchArtistMV(params)
      return data
    },
    {
      enabled: !!params.id && params.id !== 0,
      staleTime: 3600000,
    }
  )
}
