import player from '@/web/states/player'
import { formatDuration } from '@/web/utils/common'
import { useSnapshot } from 'valtio'
import Slider from '../Slider'
import { IpcChannels } from '@/shared/IpcChannels'

const Progress = () => {
  const { track, progress } = useSnapshot(player)

  return (
    <div className='mt-9 mb-10 flex w-full flex-col'>
      <Slider
        min={0}
        max={(track?.dt ?? 100000) / 1000}
        value={progress}
        onChange={value => {
          window.ipcRenderer?.send(IpcChannels.SyncProgress, {
            progress: value,
          })
          player.progress = value
        }}
        onlyCallOnChangeAfterDragEnded={true}
      />

      <div className='mt-1 flex justify-between text-14 font-bold text-black/20 dark:text-white/20'>
        <span>{formatDuration(progress * 1000, 'en-US', 'hh:mm:ss')}</span>
        <span>{formatDuration(track?.dt || 0, 'en-US', 'hh:mm:ss')}</span>
      </div>
    </div>
  )
}

export default Progress
