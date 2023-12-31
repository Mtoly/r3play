import { BrowserWindow, ipcMain, app, BrowserWindowConstructorOptions, App } from 'electron'
import { join } from 'path'
import store from './store'
import { IpcChannels, IpcChannelsParams } from '@/shared/IpcChannels'
import cache from './cache'
import log from './log'
import Store from 'electron-store'
import { TypedElectronStore } from './store'
import { CacheAPIs } from '@/shared/CacheAPIs'
import { YPMTray } from './tray'
import { Thumbar } from './windowsTaskbar'
import fastFolderSize from 'fast-folder-size'
import path from 'path'
import prettyBytes from 'pretty-bytes'
import { db, Tables } from './db'
import { LyricsWindow } from './lyricsWindow'
import { getPlatform } from './utils'
import { bindingKeyboardShortcuts } from './keyboardShortcuts'
import { checkForUpdates } from './updateWindow'
import main from '.'

log.info('[electron] ipcMain.ts')

const on = <T extends keyof IpcChannelsParams>(
  channel: T,
  listener: (event: Electron.IpcMainEvent, params: IpcChannelsParams[T]) => void
) => {
  ipcMain.on(channel, listener)
}

const handle = <T extends keyof IpcChannelsParams>(
  channel: T,
  listener: (event: Electron.IpcMainInvokeEvent, params: IpcChannelsParams[T]) => void
) => {
  return ipcMain.handle(channel, listener)
}

export function initIpcMain(
  win: BrowserWindow | null,
  tray: YPMTray | null,
  thumbar: Thumbar | null,
  store: Store<TypedElectronStore>
) {
  initWindowIpcMain(win)
  initTrayIpcMain(tray)
  initTaskbarIpcMain(thumbar)
  initStoreIpcMain(win,store)
  initOtherIpcMain(win)
}

export let lyricWin: LyricsWindow | null
let hidden: boolean = false
export function handleLyricsWinClose() {
  lyricWin = null
  hidden = false
}
/**
 * 处理需要win对象的事件
 * @param {BrowserWindow} win
 */
function initWindowIpcMain(win: BrowserWindow | null) {
  on(IpcChannels.Minimize, () => {
    win?.minimize()
  })

  let isMaximized = false
  let unMaximizeSize: { width: number; height: number } | null = null
  let windowPosition: { x: number; y: number } | null = null
  on(IpcChannels.MaximizeOrUnmaximize, () => {
    if (!win) return false

    if (isMaximized) {
      if (unMaximizeSize) {
        win.setSize(unMaximizeSize.width, unMaximizeSize.width, true)
      }
      if (windowPosition) {
        win.setPosition(windowPosition.x, windowPosition.y, true)
      }
      win.unmaximize()
    } else {
      const size = win.getSize()
      unMaximizeSize = { width: size[1], height: size[0] }
      const position = win.getPosition()
      windowPosition = { x: position[0], y: position[1] }
      win.maximize()
    }

    isMaximized = !isMaximized
    win.webContents.send(IpcChannels.IsMaximized, isMaximized)
  })

  on(IpcChannels.MinimizeOrUnminimize, () => {
    if (!win) return false

    if (win.isMinimized() || !win.isFocused()) {
      win.show()
    } else {
      win.minimize()
    }

    isMaximized = !isMaximized
    win.webContents.send(IpcChannels.IsMaximized, isMaximized)
  })

  on(IpcChannels.Close, () => {
    app.exit()
  })

  on(IpcChannels.Hide, () => {
    win?.hide()
  })

  on(IpcChannels.ResetWindowSize, () => {
    if (!win) return
    win?.setSize(1440, 1024, true)
  })

  handle(IpcChannels.IsMaximized, () => {
    if (!win) return
    return isMaximized
  })
}

/**
 * 处理需要tray对象的事件
 * @param {YPMTray} tray
 */
function initTrayIpcMain(tray: YPMTray | null) {
  on(IpcChannels.SetTrayTooltip, (e, { text, coverImg }) => {
    tray?.setTooltip(text)
    // console.log('cover ', coverImg)
    // if (coverImg && coverImg !== '') tray?.setCoverImg(coverImg)
  })

  on(IpcChannels.Like, (e, { isLiked }) => tray?.setLikeState(isLiked))

  on(IpcChannels.Play, (e, { trackID }) => {
    tray?.setPlayState(true)
    lyricWin?.win?.webContents.send(IpcChannels.Play, { trackID })
  })
  on(IpcChannels.Pause, () => {
    tray?.setPlayState(false)
  })

  on(IpcChannels.Repeat, (e, { mode }) => tray?.setRepeatMode(mode))
}

/**
 * 处理需要thumbar对象的事件
 * @param {Thumbar} thumbar
 */
function initTaskbarIpcMain(thumbar: Thumbar | null) {
  on(IpcChannels.Play, () => {
    thumbar?.setPlayState(true)
  })
  on(IpcChannels.Pause, () => thumbar?.setPlayState(false))
}

/**
 * 处理需要electron-store的事件
 * @param {Store<TypedElectronStore>} store
 */
function initStoreIpcMain(win: BrowserWindow | null,store: Store<TypedElectronStore>) {
  /**
   * 同步设置到Main
   */
  on(IpcChannels.SyncSettings, (event, settings) => {
    const lang = store.get('settigns.language')
    store.set('settings', settings)
    if(settings.language !== lang )
    {
      main.tray?.updateTray()
    }
  })
}

/**
 * 处理其他事件
 */
function initOtherIpcMain(win: BrowserWindow | null) {
  /**
   * 清除API缓存
   */
  on(IpcChannels.ClearAPICache, () => {
    db.truncate(Tables.Track)
    db.truncate(Tables.Album)
    db.truncate(Tables.Artist)
    db.truncate(Tables.Playlist)
    db.truncate(Tables.ArtistAlbum)
    db.truncate(Tables.AccountData)
    db.truncate(Tables.Audio)
    db.vacuum()
  })

  handle(IpcChannels.CheckUpdate, e => {
    checkForUpdates()
  })

  handle(IpcChannels.SetDesktopLyric, (event, args) => {
    if (lyricWin && lyricWin.win !== undefined) {
      if (hidden) {
        lyricWin.win?.show()
        hidden = !hidden
        return true
      }
      lyricWin.win?.hide()
      hidden = !hidden
      return false
    }
    // win cant be null
    lyricWin = new LyricsWindow(win as BrowserWindow)
    return true
  })

  on(IpcChannels.SyncAccentColor, (e, { color }) => {
    lyricWin?.win?.webContents.send(IpcChannels.SyncAccentColor, { color: color })
  })

  on(IpcChannels.SyncTheme, (e, { theme }) => {
    lyricWin?.win?.webContents.send(IpcChannels.SyncTheme, { theme: theme })
  })

  on(IpcChannels.Previous, (event, args) => {
    lyricWin && lyricWin.win?.webContents.send(IpcChannels.Previous)
  })

  on(IpcChannels.Next, (event, args) => {
    lyricWin && lyricWin.win?.webContents.send(IpcChannels.Next)
  })

  on(IpcChannels.SyncProgress, (event, args) => {
    const { progress } = args
    lyricWin &&
      lyricWin.win?.webContents.send(IpcChannels.SyncProgress, {
        progress: progress,
      })
  })
  // handle(IpcChannels.Previous, (event, args) => {
  //   lyricWin && lyricWin.win?.webContents.send(IpcChannels.LPrevious)

  // })
  // handle(IpcChannels.Next, (event, args) => {
  //   lyricWin && lyricWin.win?.webContents.send(IpcChannels.LNext)
  // })

  // handle(IpcChannels.SyncProgress, (event, args) => {
  //   const {progress} = args
  //   lyricWin && lyricWin.win?.webContents.send(IpcChannels.LSyncProgress,{
  //     progress: progress
  //   })
  // })

  // handle(IpcChannels.Play, (event, {track}) => {
  //   lyricWin && lyricWin.win?.webContents.send(IpcChannels.LPlay,{
  //     track: track
  //   })
  // })

  /**
   * Get API cache
   */
  on(IpcChannels.GetApiCache, (event, args) => {
    const { api, query } = args
    const data = cache.get(api, query)
    event.returnValue = data
  })

  handle(IpcChannels.GetApiCache, async (event, args) => {
    const { api, query } = args
    if (api !== 'user/account') {
      return null
    }
    try {
      const data = await cache.get(api, query)
      return data
    } catch {
      return null
    }
  })

  /**
   * 缓存封面颜色
   */
  on(IpcChannels.CacheCoverColor, (event, args) => {
    const { id, color } = args
    cache.set(CacheAPIs.CoverColor, { id, color })
  })

  /**
   * 获取音频缓存文件夹大小
   */
  on(IpcChannels.GetAudioCacheSize, event => {
    fastFolderSize(path.join(app.getPath('userData'), './audio_cache'), (error, bytes) => {
      if (error) throw error
      event.returnValue = prettyBytes(bytes ?? 0)
    })
  })

  /**
   * 从Apple Music获取专辑信息
   */
  // handle(
  //   IpcChannels.GetAlbumFromAppleMusic,
  //   async (event, { id, name, artist }) => {
  //     const fromCache = cache.get(APIs.AppleMusicAlbum, { id })
  //     if (fromCache) {
  //       return fromCache === 'no' ? undefined : fromCache
  //     }

  //     const fromApple = await getAlbum({ name, artist })
  //     cache.set(APIs.AppleMusicAlbum, { id, album: fromApple })
  //     return fromApple
  //   }
  // )

  // /**
  //  * 从Apple Music获取歌手信息
  //  **/
  // handle(IpcChannels.GetArtistFromAppleMusic, async (event, { id, name }) => {
  //   const fromApple = await getArtist(name)
  //   cache.set(APIs.AppleMusicArtist, { id, artist: fromApple })
  //   return fromApple
  // })

  // /**
  //  * 从缓存读取Apple Music歌手信息
  //  */
  // on(IpcChannels.GetArtistFromAppleMusic, (event, { id }) => {
  //   const artist = cache.get(APIs.AppleMusicArtist, id)
  //   event.returnValue = artist === 'no' ? undefined : artist
  // })

  /**
   * 退出登陆
   */
  handle(IpcChannels.Logout, async () => {
    await db.truncate(Tables.AccountData)
    return true
  })

  /**
   * 导出tables到json文件，方便查看table大小（dev环境）
   */
  if (process.env.NODE_ENV === 'development') {
    // on(IpcChannels.DevDbExportJson, () => {
    //   const tables = [
    //     Tables.ArtistAlbum,
    //     Tables.Playlist,
    //     Tables.Album,
    //     Tables.Track,
    //     Tables.Artist,
    //     Tables.Audio,
    //     Tables.AccountData,
    //     Tables.Lyric,
    //   ]
    //   tables.forEach(table => {
    //     const data = db.findAll(table)
    //     fs.writeFile(
    //       `./tmp/${table}.json`,
    //       JSON.stringify(data),
    //       function (err) {
    //         if (err) {
    //           return console.log(err)
    //         }
    //         console.log('The file was saved!')
    //       }
    //     )
    //   })
    // })
  }

  /**
   * 读取操作系统的平台类型
   */
  handle(IpcChannels.GetPlatform, event => {
    event.returnValue = getPlatform()
  })

  /**
   * 绑定键盘快捷键
   */
  handle(IpcChannels.BindKeyboardShortcuts, (ev, { shortcuts }) => {
    bindingKeyboardShortcuts(ev.sender, shortcuts)
  })

  /**
   * 设置是否响应应用内快捷键
   */
  handle(IpcChannels.setInAppShortcutsEnabled, (ev, { enabled }) => {
    console.log(enabled)
    ev.sender.setIgnoreMenuShortcuts(!enabled)
  })
}
