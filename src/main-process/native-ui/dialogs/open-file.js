const {ipcMain, dialog} = require('electron')

ipcMain.on('open-file-dialog-dataset', (event) => {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }, (files) => {
    if (files) {
      event.sender.send('selected-dataset', files);
    }
  })
})

// SPARC folder
ipcMain.on('open-file-dialog-code', (event) => {
  dialog.showOpenDialog({
    properties: ['openDirectory', 'openFile']
  }, (files) => {
    if (files) {
      event.sender.send('selected-code', files);
    }
  })
})


// Metadata
ipcMain.on('open-file-dialog-submission', (event) => {
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
    { name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] },
  ]
  }, (files) => {
    if (files) {
      event.sender.send('selected-submission', files)
    }
  })
})

ipcMain.on('open-file-dialog-description', (event) => {
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
    { name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] },
  ]
  }, (files) => {
    if (files) {
      event.sender.send('selected-description', files)
    }
  })
})

ipcMain.on('open-file-dialog-subjects', (event) => {
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
    { name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] },
  ]
  }, (files) => {
    if (files) {
      event.sender.send('selected-subjects', files)
    }
  })
})

ipcMain.on('open-file-dialog-samples', (event) => {
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
    { name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] },
  ]
  }, (files) => {
    if (files) {
      event.sender.send('selected-samples', files)
    }
  })
})

ipcMain.on('open-file-dialog-newdataset', (event) => {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }, (files) => {
    if (files) {
      event.sender.send('selected-new-dataset', files);
    }
  })
})

ipcMain.on('open-file-dialog-submit-dataset', (event) => {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }, (files) => {
    if (files) {
      event.sender.send('selected-submit-dataset', files);
    }
  })
})