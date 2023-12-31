import axios, { AxiosInstance } from 'axios'
import { appName } from '../utils/const'

const request: AxiosInstance = axios.create({
  baseURL: `/${appName.toLowerCase()}`,
  withCredentials: true,
  timeout: 15000,
})

export async function cacheAudio(id: number, audioUrl: string, bitrate?: number) {
  const file = await axios.get(audioUrl, { responseType: 'arraybuffer' })
  if (file.status !== 200 && file.status !== 206) return

  const formData = new FormData()
  const blob = new Blob([file.data], { type: 'multipart/form-data' })
  formData.append('file', blob)

  request.post(`/audio/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      url: audioUrl,
      bitrate,
    },
  })
}
