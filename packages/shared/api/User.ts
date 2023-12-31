export enum UserApiNames {
  FetchUserAccount = 'fetchUserAccount',
  FetchUserLikedTracksIds = 'fetchUserLikedTracksIDs',
  FetchUserPlaylists = 'fetchUserPlaylists',
  FetchUserAlbums = 'fetchUserAlbums',
  FetchUserArtists = 'fetchUserArtists',
  FetchListenedRecords = 'fetchListenedRecords',
  FetchUserVideos = 'fetchUserVideos',
  RefreshCookie = 'refreshCookie',
  DailyCheckIn = 'dailyCheckIn',
}

// 获取账号详情
export interface FetchUserAccountResponse {
  code: number
  account: {
    anonimousUser: boolean
    ban: number
    baoyueVersion: number
    createTime: number
    donateVersion: number
    id: number
    paidFee: boolean
    status: number
    tokenVersion: number
    type: number
    userName: string
    vipType: number
    whitelistAuthority: number
  } | null
  profile: {
    userId: number
    userType: number
    nickname: string
    avatarImgId: number
    avatarUrl: string
    backgroundImgId: number
    backgroundUrl: string
    signature: string
    createTime: number
    userName: string
    accountType: number
    shortUserName: string
    birthday: number
    authority: number
    gender: number
    accountStatus: number
    province: number
    city: number
    authStatus: number
    description: string | null
    detailDescription: string | null
    defaultAvatar: boolean
    expertTags: [] | null
    experts: [] | null
    djStatus: number
    locationStatus: number
    vipType: number
    followed: boolean
    mutual: boolean
    authenticated: boolean
    lastLoginTime: number
    lastLoginIP: string
    remarkName: string | null
    viptypeVersion: number
    authenticationTypes: number
    avatarDetail: string | null
    anchor: boolean
  } | null
}

// 获取用户歌单
export interface FetchUserPlaylistsParams {
  uid: number
  offset: number
  limit?: number // default 30
}
export interface FetchUserPlaylistsResponse {
  code: number
  more: boolean
  version: string
  playlist: Playlist[]
}

export interface FetchUserLikedTracksIDsParams {
  uid: number
}
export interface FetchUserLikedTracksIDsResponse {
  code: number
  checkPoint: number
  ids: number[]
}

export interface FetchUserAlbumsParams {
  offset?: number // default 0
  limit?: number // default 25
}
export interface FetchUserAlbumsResponse {
  code: number
  hasMore: boolean
  paidCount: number
  count: number
  data: Album[]
}

// 获取收藏的歌手
export interface FetchUserArtistsResponse {
  code: number
  hasMore: boolean
  count: number
  data: Artist[]
}
// 获取收藏的MV
export interface FetchUserVideosParams {}
export interface FetchUserVideosResponse {
  code: number
  hasMore: boolean
  count: number
  data: Video[]
}

// 听歌排名
export interface FetchListenedRecordsParams {
  uid: number // 用户id
  type: number // type=1 时只返回 weekData, type=0 时返回 allData
}
export interface FetchListenedRecordsResponse {
  code: number
  weekData: {
    playCount: number
    score: number
    song: Track
  }[]
}

// 刷新Cookie
export interface RefreshCookieResponse {
  code: number
  cookie: string
}

// 每日签到
export interface DailyCheckInResponse {
  code: number
  point: number
}

// 云盘信息
export interface CloudDiskInfoParam {
  timestamp?: number
  // 返回数量 , 默认为 30
  limit: number
  // 偏移数量，用于分页 , 如 :( 页数 -1)*200, 其中 200 为 limit 的值 , 默认为 0
  offset: number
}

export interface CloudDiskInfoResponse {
  code: number
  count: number
  hasMore: boolean
  size: string
  maxSize: string
  data: SimpleSong[]
}
