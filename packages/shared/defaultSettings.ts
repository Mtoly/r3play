export const getKeyboardShortcutDefaultSettings = (): KeyboardShortcutSettings => ({
  localEnabled: true,
  globalEnabled: false,
  darwin: {
    playPause: [['Space'], ['Cmd', 'KeyP']],
    next: [['Right'], ['Cmd', 'Right']],
    previous: [['Left'], ['Cmd', 'Left']],
    volumeUp: [['Up'], ['Cmd', 'Up']],
    volumeDown: [['Down'], ['Cmd', 'Down']],
    favorite: [['KeyL'], ['Cmd', 'KeyL']],
    switchVisibility: [['KeyM'], ['Cmd', 'KeyM']],
  },
  win32: {
    playPause: [['Space'], ['Ctrl', 'Shift', 'KeyP']],
    next: [['Right'], ['Ctrl', 'Shift', 'Right']],
    previous: [['Left'], ['Ctrl', 'Shift', 'Left']],
    volumeUp: [['Up'], ['Ctrl', 'Shift', 'Up']],
    volumeDown: [['Down'], ['Ctrl', 'Shift', 'Down']],
    favorite: [['KeyL'], ['Ctrl', 'Shift', 'KeyL']],
    switchVisibility: [['KeyM'], ['Ctrl', 'Shift', 'KeyM']],
  },
  linux: {
    playPause: [['Space'], ['Ctrl', 'Shift', 'KeyP']],
    next: [['Right'], ['Ctrl', 'Shift', 'Right']],
    previous: [['Left'], ['Ctrl', 'Shift', 'Left']],
    volumeUp: [['Up'], ['Ctrl', 'Shift', 'Up']],
    volumeDown: [['Down'], ['Ctrl', 'Shift', 'Down']],
    favorite: [['KeyL'], ['Ctrl', 'Shift', 'KeyL']],
    switchVisibility: [['KeyM'], ['Ctrl', 'Shift', 'KeyM']],
  },
})
