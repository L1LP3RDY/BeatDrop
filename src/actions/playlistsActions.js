import { FETCH_LOCAL_PLAYLISTS, LOAD_NEW_PLAYLIST_IMAGE, SET_NEW_PLAYLIST_OPEN, SET_PLAYLIST_PICKER_OPEN, CLEAR_PLAYLIST_DIALOG, LOAD_PLAYLIST_DETAILS, CLEAR_PLAYLIST_DETAILS, SET_PLAYLIST_EDITING, SET_VIEW, SET_LOADING, DISPLAY_WARNING } from './types'
import { PLAYLIST_LIST, PLAYLIST_DETAILS } from '../views'
import { store } from '../store'

const { remote } = window.require('electron')
const fs = remote.require('fs')
const path = remote.require('path')

export const fetchLocalPlaylists = (doSetView) => dispatch => {
  let state = store.getState()
  console.log(typeof doSetView)
  if(typeof doSetView === 'object') { doSetView = true } else { doSetView = false }
  if(doSetView === true) {
    dispatch({
      type: SET_VIEW,
      payload: PLAYLIST_LIST
    })
    dispatch({
      type: SET_LOADING,
      payload: true
    })
  }
  let playlists = []
  fs.access(path.join(state.settings.installationDirectory, 'Playlists'), (err) => {
    if(err) { 
      alert('Could not find Playlists directory. Please make sure you have your installation directory set correctly and have the proper plugins installed.')
      return
    }
    fs.readdir(path.join(state.settings.installationDirectory, 'Playlists'), (err, files) => {
      if(err) return
      if (!files.length) {
        dispatch({
          type: FETCH_LOCAL_PLAYLISTS,
          payload: []
        })
        dispatch({
          type: SET_LOADING,
          payload: false
        })
        dispatch({
          type: DISPLAY_WARNING,
          payload: {
            color: 'gold',
            text: 'No playlists found!'
          }
        })
      }
      let playlistsFound = 0
      for(let f in files) {
        if(files[f].split('.')[files[f].split('.').length-1] === 'json') playlistsFound++
      }
      let pushPlaylist = playlist => {
        playlists.push(playlist)
        if(playlists.length === playlistsFound) {
          dispatch({
            type: FETCH_LOCAL_PLAYLISTS,
            payload: playlists
          })
          dispatch({
            type: SET_LOADING,
            payload: false
          })
        }
      }
      for(let f in files) {
        fs.readFile(path.join(state.settings.installationDirectory, 'Playlists', files[f]), 'UTF8', (err, data) => {
          let playlist = JSON.parse(data)
          playlist.file = path.join(state.settings.installationDirectory, 'Playlists', files[f])
          pushPlaylist(playlist)
        })
      }
    })
  })
}

export const loadPlaylistCoverImage = fileLocation => dispatch => {
  dispatch({
    type: LOAD_NEW_PLAYLIST_IMAGE,
    payload: fileLocation
  })
}

export const createNewPlaylist = playlistInfo => dispatch => {
  let state = store.getState()
  try {
    let buff = fs.readFileSync(state.playlists.newCoverImageSource)
    playlistInfo.image = `data:image/${state.playlists.newCoverImageSource.split('.')[state.playlists.newCoverImageSource.split('.').length]};base64,${buff.toString('base64')}`
  } catch(err) {
    playlistInfo.image = 'data:image/png;base64,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'
  }
  playlistInfo.songs = []
  fs.writeFile(path.join(state.settings.installationDirectory, 'Playlists', `${playlistInfo.playlistTitle.replace(/[\\/:*?"<>|. ]/g, '')}${Date.now()}.json`), JSON.stringify(playlistInfo), 'UTF8', () => {
    fetchLocalPlaylists()(dispatch)
  })
}

export const deletePlaylist = playlistFile => dispatch => {
  fs.unlink(playlistFile, (err) => {
    if(err) {
      dispatch({
        type: DISPLAY_WARNING,
        payload: {
          color: 'gold',
          text: 'Cannot delete playlist file! Try restarting BeatDrop and try again.'
        }
      })
      return
    }
  })
}

export const setNewPlaylistDialogOpen = open => dispatch => {
  dispatch({
    type: SET_NEW_PLAYLIST_OPEN,
    payload: open
  })
}

export const setPlaylistPickerOpen = open => dispatch => {
  dispatch({
    type: SET_PLAYLIST_PICKER_OPEN,
    payload: open
  })
}

export const clearPlaylistDialog = () => dispatch => {
  document.getElementById('new-playlist-title').value = ''
  document.getElementById('new-playlist-author').value = ''
  document.getElementById('new-playlist-description').value = ''
  dispatch({
    type: CLEAR_PLAYLIST_DIALOG
  })
}

export const loadPlaylistDetails = playlistFile => dispatch => {
  dispatch({
    type: SET_VIEW,
    payload: PLAYLIST_DETAILS
  })
  fs.access(playlistFile, (err) => {
    if(err) {
      dispatch({
        type: DISPLAY_WARNING,
        payload: {
          color: 'gold',
          text: 'Cannot access playlist file! Try redownloading the playlist or restarting BeatDrop and try again.'
        }
      })
      return
    }
    fs.readFile(playlistFile, 'UTF8', (err, data) => {
      if(err) {
        dispatch({
          type: DISPLAY_WARNING,
          payload: {
            color: 'gold',
            text: 'Error reading playlist file! The playlist may be corrupt or use encoding other than UTF8. Try redownloading the playlist and try again.'
          }
        })
        return
      }
      dispatch({
        type: CLEAR_PLAYLIST_DETAILS
      })
      dispatch({
        type: LOAD_PLAYLIST_DETAILS,
        payload: {...JSON.parse(data), playlistFile}
      })
    })
  })
}

export const savePlaylistDetails = details => dispatch => {
  let file = details.playlistFile
  delete details.playlistFile
  let newSongs = []
  function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
      if(array[i][attr] === value) {
          return i;
      }
    }
    return -1;
  }
  for(let i = 0; i < details.newOrder.length; i++) {
    newSongs.push(details.songs[findWithAttr(details.songs, 'key', details.newOrder[i])])
  }
  details.songs = newSongs
  delete details.newOrder
  fs.writeFile(file, JSON.stringify(details), 'UTF8', (err) => {
    if(err)  {
      dispatch({
        type: DISPLAY_WARNING,
        payload: {
          color: 'gold',
          text: 'Error saving playlist file! The playlist may be corrupt or use encoding other than UTF8. Try redownloading the playlist and try again.'
        }
      })
      return
    }
    delete details.songs
    dispatch({
      type: LOAD_PLAYLIST_DETAILS,
      payload: details
    })
    fetchLocalPlaylists(false)(dispatch)
  })
}

export const setPlaylistEditing = isEditing => dispatch => {
  dispatch({
    type: SET_PLAYLIST_EDITING,
    payload: isEditing
  })
}

export const addSongToPlaylist = (song, playlistFile) => dispatch => {
  fs.readFile(playlistFile, 'UTF8', (err, data) => {
    if(err) {
      dispatch({
        type: DISPLAY_WARNING,
        payload: {
          color: 'gold',
          text: 'Error reading playlist file! The playlist may be corrupt or use encoding other than UTF8. Try redownloading the playlist and try again.'
        }
      })
      return
    }
    let playlist = JSON.parse(data)
    playlist.songs.push({
      key: song.key,
      songName: song.name
    })
    fs.writeFile(playlistFile, JSON.stringify(playlist), 'UTF8', (err) => {
      if(err)  {
        dispatch({
          type: DISPLAY_WARNING,
          payload: {
            color: 'gold',
            text: 'Error saving playlist file! The playlist may be corrupt or use encoding other than UTF8. Try redownloading the playlist and try again.'
          }
        })
        return
      }
      fetchLocalPlaylists()(dispatch)
    })
  })
}