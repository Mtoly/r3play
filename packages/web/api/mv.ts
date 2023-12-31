import {
  FetchMVResponse,
  FetchMVParams,
  FetchMVUrlParams,
  FetchMVUrlResponse,
  FetchVideoParams,
  FetchVideoResponse,
  FetchVideoURLResponse,
} from '@/shared/api/MV'
import request from '@/web/utils/request'

// 获取 mv 数据
export function fetchMV(params: FetchMVParams): Promise<FetchMVResponse> {
  return request({
    url: '/mv/detail',
    method: 'get',
    params: {
      mvid: params.mvid,
      timestamp: new Date().getTime(),
    },
  })
}

// 获取 video 数据
export function fetchVideo(params: FetchVideoParams): Promise<FetchVideoResponse> {
  return request({
    url: '/video/detail',
    method: 'get',
    params: {
      ...params,
    },
  })
}

// mv 地址
export function fetchMVUrl(params: FetchMVUrlParams): Promise<FetchMVUrlResponse> {
  return request({
    url: '/mv/url',
    method: 'get',
    params,
  })
}

// 视频 地址
export function fetchVideoUrl(params: FetchVideoParams): Promise<FetchVideoURLResponse> {
  return request({
    url: '/video/url',
    method: 'get',
    params: {
      ...params,
    },
  })
}

/**
 * 相似 mv
 * 说明 : 调用此接口 , 传入 mvid 可获取相似 mv
 * @param {number} mvid
 */
export function simiMv(mvid: string | number) {
  return request({
    url: '/simi/mv',
    method: 'get',
    params: { mvid },
  })
}

// 收藏/取消收藏视频
export function likeAVideo(params: { id: number | string; t?: number }) {
  return request({
    url: '/mv/sub',
    method: 'post',
    params: {
      mvid: params.id,
      t: params.t,
      timestamp: new Date().getTime(),
    },
  })
}
