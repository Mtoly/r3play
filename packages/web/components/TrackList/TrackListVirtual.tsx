import Icon from '@/web/components/Icon'
import Wave from '@/web/components/Animation/Wave'
import { openContextMenu } from '@/web/states/contextMenus'
import player from '@/web/states/player'
import { formatDuration, resizeImage } from '@/web/utils/common'
import { State as PlayerState } from '@/web/utils/player'
import { css, cx } from '@emotion/css'
import { Fragment, memo, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useSnapshot } from 'valtio'
import React from 'react'
import { Virtuoso } from 'react-virtuoso'



const Track = memo(({
  track,
  index,
  playingTrackID,
  state,
  handleClick,
}: {
  track?: Track
  index: number
  playingTrackID: number
  state: PlayerState
  handleClick: (e: React.MouseEvent<HTMLElement>, trackID: number) => void
}) => {
  return (
    <div
      className={cx(
        'p-1 mb-3 grid duration-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-12',
        css`
          grid-template-columns: 3fr 2fr 1fr;
        `
      )}
      onClick={e => track && handleClick(e, track.id)}
      onContextMenu={e => track && handleClick(e, track.id)}
    >
      {/* Right part */}
      <div className='flex items-center'>
        {/* Cover */}
        <img
          alt='Cover'
          className='mr-4 aspect-square h-14 w-14 flex-shrink-0 rounded-12'
          src={resizeImage(track?.al?.picUrl || '', 'sm')}
        />

        {/* Track Name and Artists */}
        <div className='mr-3'>
          <div
            className={cx(
              'line-clamp-1 flex items-center text-16 font-medium transition-colors duration-500',
              playingTrackID === track?.id
                ? 'text-brand-700'
                : 'text-neutral-700 dark:text-neutral-200'
            )}
          >
            {track?.name}

            {[1318912, 1310848].includes(track?.mark || 0) && (
              <Icon name='explicit' className='ml-2 mt-px mr-4 h-3.5 w-3.5 ' />
            )}
          </div>
          <div className='line-clamp-1 mt-1 text-14 font-bold '>
            {track?.ar.map((a, index) => (
              <Fragment key={a.id + Math.random() * 3.14159}>
                {index > 0 && ', '}
                <NavLink
                  className='transition-all duration-200 hover:text-black/70 dark:hover:text-white/70'
                  to={`/artist/${a.id}`}
                >
                  {a.name}
                </NavLink>
              </Fragment>
            ))}
          </div>
        </div>

        {/* Wave icon */}
        {playingTrackID === track?.id && (
          <div className='ml-5'>
            <Wave playing={state === 'playing'} />
          </div>
        )}
      </div>

      {/* Album Name */}
      <div className='flex items-center'>
        <NavLink
          to={`/album/${track?.al?.id}`}
          className='line-clamp-1 text-14 font-bold transition-colors duration-200 hover:text-black/70 dark:hover:text-white/70'
        >
          {track?.al?.name}
        </NavLink>
      </div>

      {/* Duration */}
      <div className='line-clamp-1 flex items-center justify-end text-14 font-bold'>
        {formatDuration(track?.dt || 0, 'en-US', 'hh:mm:ss')}
      </div>
    </div>
  )
})

function TrackList({
  tracks,
  onPlay,
  className,
  isLoading,
  Header,
}: {
  tracks?: Track[]
  onPlay: (id: number) => void
  className?: string
  isLoading?: boolean
  placeholderRows?: number
  Header?: React.FC
}) {
  const { trackID, state } = useSnapshot(player)
  const tracksMap = new Map(tracks?.map(track => [track.id, track]))

  let playingTrack = tracksMap.get(trackID)
  
  const handleClick = (e: React.MouseEvent<HTMLElement>, trackID: number) => {
    if (isLoading) return
    if (e.type === 'contextmenu') {
      e.preventDefault()
      openContextMenu({
        event: e,
        type: 'track',
        dataSourceID: trackID,
        options: {
          useCursorPosition: true,
        },
      })
      return
    }

    if (e.detail === 2) onPlay?.(trackID)
  }
  return (
    <div className={cx('@container',className)}>
      <Virtuoso
        className=' no-scrollbar'
        style={{
          height: 'calc(100vh - 132px)',
        }}
        data={tracks}
        components={{
          Header
        }}
        itemSize={el => el.getBoundingClientRect().height + 24}
        totalCount={tracks?.length}
        itemContent={(index) => (
               <Track
               key={tracks![index]?.id || 0}
               track={tracks![index] || undefined}
               index={index}
               playingTrackID={playingTrack?.id || 0}
               state={state}
               handleClick={handleClick}
             />
        )}
      />
    </div>
  )
}

const TrackListVirtualMemo = React.memo(TrackList)
TrackListVirtualMemo.displayName = "TrackListVirtual"

export default TrackListVirtualMemo
