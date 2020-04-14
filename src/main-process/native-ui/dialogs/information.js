const {ipcMain, dialog, BrowserWindow} = require('electron')

ipcMain.on('warning-delete-award', (event) => {
  const options = {
    type: 'info',
    title: 'Warning',
    message: "This will delete all presaved information regarding the award number, are you sure you want to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-delete-award-selection', index)
  })
})

ipcMain.on('warning-clear-table', (event) => {
  const options = {
    type: 'info',
    title: 'Warning',
    message: "This will erase all your progress, are you sure you want to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-clear-table-selection', index)
  })
})

ipcMain.on('warning-add-permission-owner', (event) => {
  const options = {
    type: 'info',
    title: 'Warning',
    message: "This will give owner access to another user (and set you as 'manager'), are you sure you want to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-add-permission-owner-selection', index)
  })
})

ipcMain.on('warning-add-permission-owner-PI', (event) => {
  const options = {
    type: 'info',
    title: 'Warning',
    message: "This will give owner access to another user (and set you as 'manager'), are you sure you want to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-add-permission-owner-selection-PI', index)
  })
})

ipcMain.on('warning-new-version', (event) => {
  const options = {
    type: 'info',
    title: 'New version of SODA available',
    message: "We suggest to uninstall the current version and download the latest version to make sure you are up-to-date with the SPARC curation rules!",
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-new-version-showed')
  })
})

ipcMain.on('warning-no-internet-connection', (event) => {
  const options = {
    type: 'warning',
    title: 'No internect connection',
    message: "It appears that your computer is not connected to the internet. You may continue, but you will not be able to use features of SODA related to Blackfynn and especially none of the features located under the 'Manage Datasets' section.",
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-no-internet-connection-showed')
  })
})

ipcMain.on('open-error-file-exist', (event, emessage) => {
  const options = {
    type: 'error',
    title: 'Duplicate file(s) / folder(s)',
    message: emessage,
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('error-file-exist-shown')
  })
})

ipcMain.on('open-error-folder-selected', (event, emessage) => {
  const options = {
    type: 'error',
    title: 'Folder(s) not allowed',
    message: emessage,
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('error-folder-selected-shown')
  })
})

ipcMain.on('open-error-wrong-file', (event, emessage) => {
  const options = {
    type: 'error',
    title: 'Non-SPARC metadata file selected',
    message: emessage,
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('error-folder-selected-shown')
  })
})

ipcMain.on('open-error-metadata-file-exits', (event, emessage) => {
  const options = {
    type: 'error',
    title: 'Metadata file already exists',
    message: emessage,
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('error-metadata-file-exists-shown')
  })
})

ipcMain.on('open-info-metadata-file-donwloaded', (event, emessage) => {
  const options = {
    type: 'info',
    title: 'Download successful',
    message: emessage,
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('info-metadata-downloaded-showed')
  })
})


ipcMain.on('warning-banner-image-below-1024', (event, currentSize) => {
  const options = {
    type: 'info',
    title: 'Warning',
    message: "Although not mandatory, it is highly recommended to upload a banner image with display size of at least 1024 px. Your cropped image is " + currentSize + " px. Would you like to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('show-banner-image-below-1024', index)
  })
})

ipcMain.on('open-info-upload-limitations', (event) => {
  const options = {
    type: 'info',
    title: 'Potential upload issues',
    message: 'We have encountered issues with the Blackfynn agent to upload certain datasets and are working with the Blackfynn Team to solve them. If you encounter any issues, please report to us using our feedback form (provide information such as operating system, dataset size, screenshot of error, etc.) and it will help us greatly in fixing the issues.'
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('info-upload-limitations-shown')
  })
})


ipcMain.on('warning-share-with-curation-team', (event) => {
  const options = {
    type: 'info',
    title: 'Sharing with Curation Team',
    message: "This will inform the Curation Team that your dataset is ready to be reviewed. It is then advised not to make changes to the dataset until the Curation Team contacts you. Would you like to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-share-with-curation-team-selection', index)
  })
})

ipcMain.on('warning-share-with-consortium', (event) => {
  const options = {
    type: 'info',
    title: 'Sharing with SPARC consortium',
    message: "Sharing will give viewer permissions to any SPARC investigator who has signed the SPARC Non-disclosure form and will allow them to see your data. This must be done only once your dataset has been approved by the Curation Team. Would you like to continue?",
    buttons: ['Yes', 'No']
  }
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options, (index) => {
    event.sender.send('warning-share-with-consortium-selection', index)
  })
})

