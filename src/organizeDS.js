//////////////////////////////////
// Import required modules
//////////////////////////////////

const zerorpc = require("zerorpc-rotkehlchen");
const fs = require("fs");
const os = require("os");
const path = require('path');
const {ipcRenderer} = require('electron');
const Editor = require('@toast-ui/editor');
const remote = require('electron').remote;
const imageDataURI = require("image-data-uri");
const log  = require("electron-log");
const Airtable = require('airtable');
require('v8-compile-cache');
const Tagify = require('@yaireo/tagify');
const https = require('https');
const $ = require( "jquery" );
const PDFDocument = require('pdfkit');
const html2canvas = require("html2canvas");
const removeMd = require('remove-markdown');
const electron = require('electron');
const bootbox = require('bootbox');
const app = remote.app;

var datasetStructureJSONObj = {
  "folders":{},
  "files":{},
  "type":""
}

// listItems(datasetStructureJSONObj, '#items')
// getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)

var sodaJSONObj = {}

var backFolder = []
var forwardFolder =[]

var highLevelFolders = ["code", "derivative", "docs", "source", "primary", "protocol"]
var highLevelFolderToolTip = {
  "code": "code: This folder contains all the source code used in the study (e.g., Python, MATLAB, etc.)",
  "derivative": "derivative: This folder contains data files derived from raw data (e.g., processed image stacks that are annotated via the MBF tools, segmentation files, smoothed overlays of current and voltage that demonstrate a particular effect, etc.)",
  "docs": "docs: This folder contains all other supporting files that don't belong to any of the other folders (e.g., a representative image for the dataset, figures, etc.)",
  "source": "source: This folder contains very raw data i.e. raw or untouched files from an experiment. For example, this folder may include the “truly” raw k-space data for an MR image that has not yet been reconstructed (the reconstructed DICOM or NIFTI files, for example, would be found within the primary folder). Another example is the unreconstructed images for a microscopy dataset.",
  "primary": "primary: This folder contains all folders and files for experimental subjects and/or samples. All subjects will have a unique folder with a standardized name the same as the names or IDs as referenced in the subjects metadata file. Within each subject folder, the experimenter may choose to include an optional “session” folder if the subject took part in multiple experiments/ trials/ sessions. The resulting data is contained within data type-specific (Datatype) folders within the subject (or session) folders. The SPARC program’s Data Sharing Committee defines 'raw' (primary) data as one of the types of data that should be shared. This covers minimally processed raw data, e.g. time-series data, tabular data, clinical imaging data, genomic, metabolomic, microscopy data, which can also be included within their own folders.",
  "protocol": "protocol: This folder contains supplementary files to accompany the experimental protocols submitted to Protocols.io. Please note that this is not a substitution for the experimental protocol which must be submitted to <b><a href='https://www.protocols.io/groups/sparc'> Protocols.io/sparc </a></b>."
}

/////// New Organize Datasets /////////////////////
const organizeDSglobalPath = document.getElementById("input-global-path")
const organizeDSbackButton = document.getElementById("button-back")
const organizeDSaddFiles = document.getElementById("add-files")
const organizeDSaddNewFolder = document.getElementById("new-folder")
const organizeDSaddFolders = document.getElementById("add-folders")
const contextMenu = document.getElementById("mycontext")
// const fullPathValue = document.querySelector(".hoverPath")
const fullNameValue = document.querySelector(".hoverFullName")
// const resetProgress = document.getElementById("clear-progress")
// const saveProgress = document.getElementById("save-progress")
// const importProgress = document.getElementById("import-progress")
const homePathButton = document.getElementById("home-path")
const menuFolder = document.querySelector('.menu.reg-folder');
const menuFile = document.querySelector('.menu.file');
const menuHighLevelFolders = document.querySelector('.menu.high-level-folder');
const organizeNextStepBtn = document.getElementById("button-organize-confirm-create")
const organizePrevStepBtn = document.getElementById("button-organize-prev")


//// option to show tool-tips for high-level folders
function showTooltips(ev) {
  var folderName = ev.parentElement.innerText;
  bootbox.alert({
    message: highLevelFolderToolTip[folderName],
    button: {
      ok: {
        className: 'btn-primary'
      }
    },
    centerVertical: true
  })
}

// initiate Tagify input fields for Dataset description file
var keywordInput1 = document.getElementById('textarea-keywords-techniques'),
keywordTagify1 = new Tagify(keywordInput1, {
    duplicates: false,
    maxTags  : 5,
    callbacks: {
      add   : e => { showConfirmBtn('confirm-techniques') }
  }
})
// initiate Tagify input fields for Dataset description file
var keywordInput2 = document.getElementById('textarea-keywords-variables'),
keywordTagify2 = new Tagify(keywordInput2, {
    duplicates: false,
    maxTags  : 5,
    callbacks: {
      add   : e => { showConfirmBtn('confirm-keywords') }
  }
})

/// back button
organizeDSbackButton.addEventListener("click", function() {
  // var currentPath = organizeDSglobalPath.value.trim()
  // if (currentPath !== "/") {
  var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    var filtered = getGlobalPath(organizeDSglobalPath)
    if (filtered.length === 1) {
      organizeDSglobalPath.value = filtered[0] + "/"
    } else {
      organizeDSglobalPath.value = filtered.slice(0,filtered.length-1).join("/") + "/"
    }
    var myPath = datasetStructureJSONObj;
    for (var item of filtered.slice(1,filtered.length-1)) {
      myPath = myPath["folders"][item]
    }
    // construct UI with files and folders
    var appendString = loadFileFolder(myPath)

    /// empty the div
    $('#items').empty()
    $('#items').html(appendString)

    // reconstruct div with new elements
    listItems(myPath, '#items')
    getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
  }
})

// Add folder button
organizeDSaddNewFolder.addEventListener("click", function(event) {
  event.preventDefault();
  var newFolderName = "New Folder"
  // show prompt for name
  bootbox.prompt({
    title: "Add new folder...",
    message: "Enter a name below:",
    centerVertical: true,
    callback: function(result) {
      if(result !== null && result!== "") {
        newFolderName = result.trim()
        // check for duplicate or files with the same name
        var duplicate = false
        var itemDivElements = document.getElementById("items").children
        for (var i=0;i<itemDivElements.length;i++) {
          if (newFolderName === itemDivElements[i].innerText) {
            duplicate = true
            break
          }
        }
        if (duplicate) {
          bootbox.alert({
            message: "Duplicate folder name: " + newFolderName,
            centerVertical: true
          })
        } else {
          var appendString = '';
          appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+ newFolderName +'</div></div>'
          $(appendString).appendTo('#items');

          /// update datasetStructureJSONObj
          var currentPath = organizeDSglobalPath.value
          var jsonPathArray = currentPath.split("/")
          var filtered = jsonPathArray.slice(1).filter(function (el) {
            return el != "";
          });

          var myPath = getRecursivePath(filtered, datasetStructureJSONObj)
          // update Json object with new folder created
          var renamedNewFolder = newFolderName
          myPath["folders"][renamedNewFolder] = {"folders": {}, "files": {}, "type":"virtual"}

          listItems(myPath,'#items')
          getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
          hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
          hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
        }
      }
    }
  })
})

// ///////////////////////////////////////////////////////////////////////////
// recursively populate json object
function populateJSONObjFolder(jsonObject, folderPath) {
    var myitems = fs.readdirSync(folderPath)
    myitems.forEach(element => {
      var statsObj = fs.statSync(path.join(folderPath, element))
      var addedElement = path.join(folderPath, element)
      if (statsObj.isDirectory()) {
        jsonObject["folders"][element] = {"type": "local", "folders": {}, "files": {}, "action":["new"]}
        populateJSONObjFolder(jsonObject["folders"][element], addedElement)
      } else if (statsObj.isFile()) {
          jsonObject["files"][element] = {"path": addedElement, "description": "", "additional-metadata":"", "type": "local", "action":["new"]}
        }
    });
}


function hideFullName() {
  fullNameValue.style.display = "none";
  fullNameValue.style.top = '-250%';
  fullNameValue.style.left = '-250%';
}

//// HOVER FOR FULL NAME (FOLDERS WITH WRAPPED NAME IN UI)
function showFullName(ev, element, text) {
  /// check if the full name of the folder is overflowing or not, if so, show full name on hover
  var isOverflowing = element.clientWidth < element.scrollWidth || element.clientHeight < element.scrollHeight;
  if (isOverflowing) {
    var mouseX = ev.pageX - 200;
    var mouseY = ev.pageY;
    fullNameValue.style.display = "block";
    fullNameValue.innerHTML = text
    $('.hoverFullName').css({'top':mouseY,'left':mouseX}).fadeIn('slow');
  }
}

/// hover over a function for full name
function hoverForFullName(ev) {
    var fullPath = ev.innerText
    // ev.children[1] is the child element folder_desc of div.single-item,
    // which we will put through the overflowing check in showFullName function
    showFullName(event, ev.children[1], fullPath)
}

// // If the document is clicked somewhere
// document.addEventListener('onmouseover', function(e){
//   if (e.target.classList.value !== "myFile") {
//     hideFullPath()
//   } else {
//     hoverForPath(e)
//   }
// });

document.addEventListener('onmouseover', function(e){
  if (e.target.classList.value === "fas fa-folder") {
    hoverForFullName(e)
  } else {
    hideFullName()
  }
});

// if a file/folder is clicked -> show details in right "sidebar"
function showDetailsFile() {
  $('.div-display-details.file').toggleClass('show');
  // $(".div-display-details.folders").hide()
}

var bfAddAccountBootboxMessage = "<form><div class='form-group row'><label for='bootbox-key-name' class='col-sm-3 col-form-label'> Key name:</label><div class='col-sm-9'><input type='text' id='bootbox-key-name' class='form-control'/></div></div><div class='form-group row'><label for='bootbox-api-key' class='col-sm-3 col-form-label'> API Key:</label><div class='col-sm-9'><input id='bootbox-api-key' type='text' class='form-control'/></div></div><div class='form-group row'><label for='bootbox-api-secret' class='col-sm-3 col-form-label'> API Secret:</label><div class='col-sm-9'><input id='bootbox-api-secret'  class='form-control' type='text' /></div></div></form>"

function addBFAccountInsideBootbox(myBootboxDialog) {
  var keyname = $("#bootbox-key-name").val();
  var apiKey = $("#bootbox-api-key").val();
  var apiSecret = $("#bootbox-api-secret").val();
  client.invoke("api_bf_add_account", keyname, apiKey, apiSecret, (error, res) => {
    if(error) {
      myBootboxDialog.find(".modal-footer").prepend("<span style='color:red;padding-right:10px;display:inline-block;'>"+error+"</span>");
      log.error(error)
      console.error(error);
    } else {
      curateBFAccountLoadStatus.innerHTML = "Loading account..."
      curateBFAccountLoad.style.display = 'block'
      updateBfAccountList();
      updateAllBfAccountList(curateBFaccountList);
      $("#bootbox-key-name").val("");
      $("#bootbox-api-key").val("");
      $("#bootbox-api-secret").val("");
      myBootboxDialog.modal('hide')
      bootbox.alert({
        message: "Successfully added!",
        centerVertical: true
      });
    }
  });
}

function showBFAddAccountBootbox() {
  var bootb = bootbox.dialog({
    title: "Please specify a key name and enter your Blackfynn API key and secret below:",
    message: bfAddAccountBootboxMessage,
    buttons: {
        cancel: {
            label: 'Cancel'
        },
        confirm: {
            label: 'Add',
            className: 'btn btn-primary bootbox-add-bf-class',
            callback: function() {
              addBFAccountInsideBootbox(bootb);
              return false
            }
          }
        },
    size: "medium",
    centerVertical: true
  })
}

///// function to trigger action for each context menu option
function hideMenu(category, menu1, menu2, menu3){
  if (category === "folder") {
    menu1.style.display = "none";
    menu1.style.top = "-200%";
    menu1.style.left = '-200%';
  } else if (category === "high-level-folder") {
    menu2.style.display = "none";
    menu2.style.top = "-220%";
    menu2.style.left = '-220%';
  } else {
    menu3.style.display = "none";
    menu3.style.top = "-210%";
    menu3.style.left = "-210%";
  }
}

function changeStepOrganize(step) {
    if (step.id==="button-organize-prev") {
      document.getElementById("div-step-1-organize").style.display = "block";
      document.getElementById("div-step-2-organize").style.display = "none";
      document.getElementById("dash-title").innerHTML = "Organize dataset<i class='fas fa-caret-right' style='margin-left: 10px; margin-right: 10px'></i>High-level folders"
      organizeNextStepBtn.style.display = "block"
      organizePrevStepBtn.style.display = "none"
    } else {
      document.getElementById("div-step-1-organize").style.display = "none";
      document.getElementById("div-step-2-organize").style.display = "block";
      document.getElementById("dash-title").innerHTML = "Organize dataset<i class='fas fa-caret-right' style='margin-left: 10px; margin-right: 10px'></i>Generate dataset"
      organizePrevStepBtn.style.display = "block"
      organizeNextStepBtn.style.display = "none"
    }
}

var newDSName;
function generateDataset(button) {
  document.getElementById("para-organize-datasets-success").style.display = "none"
  document.getElementById("para-organize-datasets-error").style.display = "none"
  if (button.id==="btn-generate-locally") {
    $("#btn-generate-BF").removeClass("active");
    $(button).toggleClass("active");
    bootbox.prompt({
      title: 'Generate dataset locally',
      message: 'Enter a name for the dataset:',
      buttons: {
        cancel: {
              label: '<i class="fa fa-times"></i> Cancel'
          },
          confirm: {
              label: '<i class="fa fa-check"></i> Confirm and Choose location',
              className: 'btn-success'
          }
      },
      centerVertical: true,
      callback: function (r) {
        if(r !== null && r.trim() !== ""){
          newDSName = r.trim()
          ipcRenderer.send('open-file-dialog-newdataset')
          }
        }
      })
    } else {
        $("#btn-generate-locally").removeClass("active");
        $(button).toggleClass("active");
    }
}

ipcRenderer.on('selected-new-dataset', (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null){
      document.getElementById("para-organize-datasets-loading").style.display = "block"
      document.getElementById("para-organize-datasets-loading").innerHTML = "<span>Please wait...</span>"
      client.invoke("api_generate_dataset_locally", "create new", filepath[0], newDSName, datasetStructureJSONObj, (error, res) => {
        document.getElementById("para-organize-datasets-loading").style.display = "none"
        if(error) {
          log.error(error)
          console.error(error)
          document.getElementById("para-organize-datasets-success").style.display = "none"
          document.getElementById("para-organize-datasets-error").style.display = "block"
          document.getElementById("para-organize-datasets-error").innerHTML = "<span> " + error + "</span>";
        } else {
          document.getElementById("para-organize-datasets-error").style.display = "none"
          document.getElementById("para-organize-datasets-success").style.display = "block"
          document.getElementById("para-organize-datasets-success").innerHTML = "<span>Generated successfully!</span>";
        }
    })
  }
}
})


//////////// FILE BROWSERS to import existing files and folders /////////////////////
organizeDSaddFiles.addEventListener("click", function() {
   ipcRenderer.send('open-files-organize-datasets-dialog')
 })
 ipcRenderer.on('selected-files-organize-datasets', (event, path) => {
   var filtered = getGlobalPath(organizeDSglobalPath)
   var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj)
   path = path.filter(file_path => fs.statSync(file_path).isFile())
   addFilesfunction(path, myPath, organizeDSglobalPath, '#items', '.single-item', datasetStructureJSONObj)
 })

organizeDSaddFolders.addEventListener("click", function() {
  ipcRenderer.send('open-folders-organize-datasets-dialog')
})
ipcRenderer.on('selected-folders-organize-datasets', (event, path) => {
  var filtered = getGlobalPath(organizeDSglobalPath)
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj)
  addFoldersfunction(path, myPath)
})

function addFoldersfunction(folderArray, currentLocation) {

  var uiFolders = {};
  var importedFolders = {};

  if (JSON.stringify(currentLocation["folders"]) !== "{}") {
    for (var folder in currentLocation["folders"]) {
      uiFolders[folder] = 1
    }
  }
  // check for duplicates/folders with the same name
  for (var i=0; i<folderArray.length;i++) {
      var j = 1;
      var originalFolderName = path.basename(folderArray[i]);
      var renamedFolderName = originalFolderName;
      while (renamedFolderName in uiFolders || renamedFolderName in importedFolders) {
        renamedFolderName = `${originalFolderName} (${j})`;
        j++;
      }
      importedFolders[renamedFolderName] = {"path": folderArray[i], "original-basename": originalFolderName};
    }
    if (Object.keys(importedFolders).length > 0) {
      for (var element in importedFolders) {
        currentLocation["folders"][element] = {"type": "local", "path": importedFolders[element]["path"], "folders": {}, "files": {}, "action": ["new"]}
        populateJSONObjFolder(currentLocation["folders"][element], importedFolders[element]["path"]);
        // check if a folder has to be renamed due to duplicate reason
        if (element !== importedFolders[element]["original-basename"]) {
          currentLocation["folders"][element]["action"].push('renamed');
        }
        var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+element+'</div></div>'
        $('#items').html(appendString)
        listItems(currentLocation, '#items')
        getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
        hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
        hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
      }
    }
}

//// Step 3. Organize dataset: Add files or folders with drag&drop
function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  // get global path
  var currentPath = organizeDSglobalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.slice(1).filter(function (el) {
    return el != "";
  });
  var myPath = getRecursivePath(filtered, datasetStructureJSONObj);
  var importedFiles = {};
  var importedFolders = {};
  var nonAllowedDuplicateFiles = [];
  ev.preventDefault();
  var uiFiles = {};
  var uiFolders = {};

  for (var file in myPath["files"]) {
    uiFiles[path.parse(file).name] = 1
  }
  for (var folder in myPath["folders"]) {
    uiFolders[path.parse(folder).name] = 1
  }

  for (var i=0; i<ev.dataTransfer.files.length;i++) {
    /// Get all the file information
    var itemPath = ev.dataTransfer.files[i].path
    var itemName = ev.dataTransfer.files[i].name
    var duplicate = false
    var statsObj = fs.statSync(itemPath)
    // check for duplicate or files with the same name
    for (var j=0; j<ev.target.children.length;j++) {
      if (itemName === ev.target.children[j].innerText) {
        duplicate = true
        break
      }
    }
    /// check for File duplicate
    if (statsObj.isFile()) {
      var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
      if (slashCount === 1) {
        bootbox.alert({
          message: "<p>SPARC metadata files can be imported in the next step!</p>",
          centerVertical: true
        })
        break
      } else {
          if (JSON.stringify(myPath["files"]) === "{}"  && JSON.stringify(importedFiles) === "{}") {
            importedFiles[path.parse(itemPath).name] = {"path": itemPath, "basename":path.parse(itemPath).base}
          } else {
              for (var objectKey in myPath["files"]) {
                if (objectKey !== undefined) {
                  var nonAllowedDuplicate = false;
                  if (itemPath === myPath["files"][objectKey]["path"]) {
                    nonAllowedDuplicateFiles.push(itemPath);
                    nonAllowedDuplicate = true;
                    break
                  }
                }
              }
              if (!nonAllowedDuplicate) {
                var j = 1;
                var fileBaseName = itemName;
                var originalFileNameWithoutExt = path.parse(itemName).name;
                var fileNameWithoutExt = originalFileNameWithoutExt;
                while (fileNameWithoutExt in uiFiles || fileNameWithoutExt in importedFiles) {
                  fileNameWithoutExt = `${originalFileNameWithoutExt} (${j})`;
                  j++;
                }
                importedFiles[fileNameWithoutExt] = {"path": itemPath, "basename": fileNameWithoutExt + path.parse(itemName).ext};
              }
            }
          }
    } else if (statsObj.isDirectory()) {
        var j = 1;
        var originalFolderName = itemName;
        var renamedFolderName = originalFolderName;
        while (renamedFolderName in uiFolders || renamedFolderName in importedFolders) {
          renamedFolderName = `${originalFolderName} (${j})`;
          j++;
        }
        importedFolders[renamedFolderName] = {"path": itemPath, "original-basename": originalFolderName};
      }
    }
  if (nonAllowedDuplicateFiles.length > 0) {
    var listElements = showItemsAsListBootbox(nonAllowedDuplicateFiles)
    bootbox.alert({
      message: 'The following files are already imported into the current location of your dataset: <p><ul>'+listElements+'</ul></p>',
      centerVertical: true
    })
  }
  // // now append to UI files and folders
  if (Object.keys(importedFiles).length > 0) {
    for (var element in importedFiles) {
      myPath["files"][importedFiles[element]["basename"]] = {"path": importedFiles[element]["path"], "type": "local", "description":"", "additional-metadata":"", "action":["new"]}
      // append "renamed" to "action" key if file is auto-renamed by UI
      var originalName = path.parse(myPath["files"][importedFiles[element]["basename"]]["path"]).name;
      if (element !== originalName) {
        myPath["files"][importedFiles[element]["basename"]]["action"].push('renamed');
      }
      var appendString = '<div class="single-item"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+importedFiles[element]["basename"]+'</div></div>'
      $(appendString).appendTo(ev.target);
      listItems(myPath, '#items')
      getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
      }
    }
    if (Object.keys(importedFolders).length > 0) {
      for (var element in importedFolders) {
        myPath["folders"][element] = {"type": "local", "path": importedFolders[element]["path"], "folders": {}, "files": {}, "action": ["new"]}
        // append "renamed" to "action" key if file is auto-renamed by UI
        var originalName = path.parse(myPath["folders"][element]["path"]).name;
        if (element !== originalName) {
          myPath["folders"][element]["action"].push('renamed');
        }
        populateJSONObjFolder(myPath["folders"][element], importedFolders[element]["path"]);
        var appendString = '<div class="single-item"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+element+'</div></div>'
        $(appendString).appendTo(ev.target);
        listItems(myPath, '#items')
        getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
        hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
        hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
        }
      }
}

// SAVE FILE ORG
ipcRenderer.on('save-file-organization-dialog', (event) => {
  const options = {
    title: 'Save File Organization',
    filters: [
      { name: 'JSON', extensions: ['json'] }
    ]
  }
  dialog.showSaveDialog(null, options, (filename) => {
    event.sender.send('selected-saveorganizationfile', filename)
  })
})


//////////////////////////////////////////////////////////////////////////////
/////////////////// CONTEXT MENU OPTIONS FOR FOLDERS AND FILES ///////////////
//////////////////////////////////////////////////////////////////////////////


//// helper functions for hiding/showing context menus
function showmenu(ev, category){
    //stop the real right click menu
    ev.preventDefault();
    var mouseX;
    if (ev.pageX <= 200) {
      mouseX = ev.pageX + 10;
    } else {
      mouseX = ev.pageX - 210;
    }
    var mouseY = ev.pageY - 15;
    if (category === "folder") {
      menuFolder.style.display = "block";
      $('.menu.reg-folder').css({'top':mouseY,'left':mouseX}).fadeIn('slow');
    } else if (category === "high-level-folder") {
      menuHighLevelFolders.style.display = "block";
      $('.menu.high-level-folder').css({'top':mouseY,'left':mouseX}).fadeIn('slow');
    } else {
        menuFile.style.display = "block";
        $('.menu.file').css({'top':mouseY,'left':mouseX}).fadeIn('slow');
      }
}

/// options for regular sub-folders
function folderContextMenu(event) {
  $(".menu.reg-folder li").unbind().click(function(){
    if ($(this).attr('id') === "folder-rename") {
        var itemDivElements = document.getElementById("items").children
        renameFolder(event, organizeDSglobalPath, itemDivElements, datasetStructureJSONObj, '#items', '.single-item')
      } else if ($(this).attr('id') === "folder-delete") {
        delFolder(event, organizeDSglobalPath, '#items', '.single-item', datasetStructureJSONObj)
      }
     // Hide it AFTER the action was triggered
     hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
     hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
     hideFullName()
 });

 /// options for high-level folders
 $(".menu.high-level-folder li").unbind().click(function(){
   if ($(this).attr('id') === "folder-rename") {
     var itemDivElements = document.getElementById("items").children
      renameFolder(event, organizeDSglobalPath, itemDivElements, datasetStructureJSONObj, '#items', '.single-item')
     } else if ($(this).attr('id') === "folder-delete") {
       delFolder(event, organizeDSglobalPath, '#items', '.single-item', datasetStructureJSONObj)
     } else if ($(this).attr('id') === "tooltip-folders") {
       showTooltips(event)
     }
    // Hide it AFTER the action was triggered
    hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
    hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
    hideFullName()

});
/// hide both menus after an option is clicked
  hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
  hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
  hideFullName()
}

//////// options for files
function fileContextMenu(event) {
  if ($(".div-display-details.file").hasClass('show')) {
    $(".div-display-details.file").removeClass('show')
  }
  $(".menu.file li").unbind().click(function(){
    if ($(this).attr('id') === "file-rename") {
        var itemDivElements = document.getElementById("items").children
        renameFolder(event, organizeDSglobalPath, itemDivElements, datasetStructureJSONObj, '#items', '.single-item')
      } else if ($(this).attr('id') === "file-delete") {
        delFolder(event, organizeDSglobalPath, '#items', '.single-item', datasetStructureJSONObj)
      } else if ($(this).attr('id') === "file-description") {
        manageDesc(event)
      }
     // Hide it AFTER the action was triggered
     hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
 });
 hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
}

// Trigger action when the contexmenu is about to be shown
$(document).bind("contextmenu", function (event) {
    // Avoid the real one
    event.preventDefault();
    /// check for high level folders
    var highLevelFolderBool = false
    var folderName = event.target.parentElement.innerText
    if (highLevelFolders.includes(folderName)) {
      highLevelFolderBool = true
    }
    // Show the rightcontextmenu for each clicked
    // category (high-level folders, regular sub-folders, and files)
    if (event.target.classList[0] === "myFol") {
      if (highLevelFolderBool) {
        showmenu(event, "high-level-folder")
        hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
      } else {
        showmenu(event, "folder")
        hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
      }
    } else if (event.target.classList[0] === "myFile") {
      showmenu(event, "file")
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
      // otherwise, do not show any menu
    } else {
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
      hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
      // hideFullPath()
      hideFullName()
    }
});

$(document).bind("click", function (event) {
  if (event.target.classList[0] !== "myFol" &&
      event.target.classList[0] !== "myFile") {
        hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
        hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
        hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
        // hideFullPath()
        hideFullName()
      }
})

// sort JSON objects by keys alphabetically (folder by folder, file by file)
function sortObjByKeys(object) {
  const orderedFolders = {};
  const orderedFiles = {};
  /// sort the files in objects
  if (object.hasOwnProperty("files")) {
    Object.keys(object["files"]).sort().forEach(function(key) {
      orderedFiles[key] = object["files"][key]
    });
  }
  if (object.hasOwnProperty("folders")) {
    Object.keys(object["folders"]).sort().forEach(function(key) {
      orderedFolders[key] = object["folders"][key]
    });
  }
  const orderedObject = {
    "folders": orderedFolders,
    "files": orderedFiles,
    "type": ""
  }
  return orderedObject
}

function listItems(jsonObj, uiItem) {
    var appendString = ''
    var sortedObj = sortObjByKeys(jsonObj)
    for (var item in sortedObj["folders"]) {
      var emptyFolder = "";
      if (! highLevelFolders.includes(item)) {
        if (
          JSON.stringify(sortedObj["folders"][item]["folders"]) === "{}" &&
          JSON.stringify(sortedObj["folders"][item]["files"]) === "{}"
        ) {
          emptyFolder = " empty";
        }
      }
      appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 oncontextmenu="folderContextMenu(this)" class="myFol'+emptyFolder+'"></h1><div class="folder_desc">'+item+'</div></div>'
    }
    for (var item in sortedObj["files"]) {
      // not the auto-generated manifest
      if (sortedObj["files"][item].length !== 1) {
        var extension = sliceStringByValue(sortedObj["files"][item]["path"],  ".")
        if (!["docx", "doc", "pdf", "txt", "jpg", "JPG", "xlsx", "xls", "csv", "png", "PNG"].includes(extension)) {
          extension = "other"
        }
      } else {
        extension = "other"
      }
      appendString = appendString + '<div class="single-item"><h1 class="myFile '+extension+'" oncontextmenu="fileContextMenu(this)" style="margin-bottom: 10px""></h1><div class="folder_desc">'+item+'</div></div>'
    }

    $(uiItem).empty()
    $(uiItem).html(appendString)
}

function getInFolder(singleUIItem, uiItem, currentLocation, globalObj) {
  $(singleUIItem).dblclick(function(){
    if($(this).children("h1").hasClass("myFol")) {
      var folderName = this.innerText
      var appendString = ''
      currentLocation.value = currentLocation.value + folderName + "/"

      var currentPath = currentLocation.value
      var jsonPathArray = currentPath.split("/")
      var filtered = jsonPathArray.slice(1).filter(function (el) {
        return el.trim() != "";
      });
      var myPath = getRecursivePath(filtered, globalObj)
      var appendString = loadFileFolder(myPath)

      $(uiItem).empty()
      $(uiItem).html(appendString)

      // reconstruct folders and files (child elements after emptying the Div)
      listItems(myPath, uiItem)
      getInFolder(singleUIItem, uiItem, currentLocation, globalObj)
    }
  })
}



function sliceStringByValue(string, endingValue) {
  var newString = string.slice(string.indexOf(endingValue) + 1)
  return newString
}

var fileNameForEdit;
///// Option to manage description for files
function manageDesc(ev) {
  var fileName = ev.parentElement.innerText
  /// get current location of files in JSON object
  var filtered = getGlobalPath(organizeDSglobalPath)
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj)
  //// load existing metadata/description
  loadDetailsContextMenu(fileName, myPath, 'textarea-file-description', 'textarea-file-metadata', 'para-local-path-file')
  $("#button-confirm-display-details-file").html('Confirm');
  showDetailsFile()
  hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
  hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
  fileNameForEdit = fileName
}

function updateFileDetails(ev) {
  var fileName = fileNameForEdit;
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj)
  triggerManageDetailsPrompts(ev, fileName, myPath, 'textarea-file-description', 'textarea-file-metadata')
  /// list Items again with new updated JSON structure
  listItems(myPath, '#items')
  getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj);
  // find checkboxes here and uncheck them
  for (var ele of $($(ev).siblings().find('input:checkbox'))) {
    document.getElementById(ele.id).checked = false
  }
  // close the display
  showDetailsFile();
}

function addDetailsForFile(ev) {
  var checked = false;
  for (var ele of $($(ev).siblings()).find('input:checkbox')) {
    if ($(ele).prop('checked')) {
      checked = true
      break
    }
  }
  /// if at least 1 checkbox is checked, then confirm with users
  if (checked) {
    bootbox.confirm({
      title: "Adding additional metadata for files",
      message: "If you check any checkboxes above, metadata will be modified for all files in the folder. Would you like to continue?",
      centerVertical: true,
      button: {
        ok: {
          label: 'Yes',
          className: 'btn-primary'
        }
      },
      callback: function(r) {
        if (r!==null && r === true) {
          updateFileDetails(ev);
          $("#button-confirm-display-details-file").html('Added')
        }
      }
    })
  } else {
      updateFileDetails(ev)
      $("#button-confirm-display-details-file").html('Added')
  }
}


//// Select to choose a local dataset
// document.getElementById("location-new-dataset").addEventListener("click", function() {
//   document.getElementById("location-new-dataset").placeholder = "Browse here"
//   ipcRenderer.send('open-file-dialog-newdataset-curate');
// })
//
// ipcRenderer.on('selected-new-datasetCurate', (event, filepath) => {
//   if (filepath.length > 0) {
//     if (filepath != null){
//       document.getElementById("location-new-dataset").placeholder = filepath[0];
//       document.getElementById("div-confirm-location-new-dataset").style.display = "flex";
//     }
//   }
// })

// document.getElementById('inputNewNameDataset').addEventListener('keydown', function() {
//   // document.getElementById('para-new-name-dataset-message').innerHTML = ""
// })

$("#inputNewNameDataset").keyup(function() {
  $('#Question-generate-dataset-generate-div').removeClass("show");
  $('#Question-generate-dataset-generate-div').removeClass("test2");
  $('#Question-generate-dataset-generate-div').removeClass("prev");
  var newName = $("#inputNewNameDataset").val().trim();
  if (newName !== "") {
    if (check_forbidden_characters_bf(newName)) {
      // document.getElementById('div-confirm-inputNewNameDataset').style.display = "none";
      document.getElementById('para-new-name-dataset-message').innerHTML = "Error: A Blackfynn dataset name cannot contain any of the following characters: \/:*?'<>."
    } else {
      // document.getElementById('div-confirm-inputNewNameDataset').style.display = "flex";
      $('#div-confirm-inputNewNameDataset button').click();
      document.getElementById('para-new-name-dataset-message').innerHTML = "";
    }
  }
});

// //// Select to choose a local dataset
// document.getElementById("input-destination-generate-dataset-locally").addEventListener("click", function() {
//   $("#Question-generate-dataset-locally-destination").nextAll().removeClass('show');
//   $("#Question-generate-dataset-locally-destination").nextAll().removeClass('test2');
//   $("#Question-generate-dataset-locally-destination").nextAll().removeClass('prev');
//   document.getElementById("input-destination-generate-dataset-locally").placeholder = "Browse here";
//   ipcRenderer.send('open-file-dialog-local-destination-curate');
// })

// ipcRenderer.on('selected-local-destination-datasetCurate', (event, filepath) => {
//   if (filepath.length > 0) {
//     if (filepath != null){
//       document.getElementById("input-destination-generate-dataset-locally").placeholder = filepath[0];
//       // document.getElementById('div-confirm-destination-locally').style.display = "flex";
//       $("#div-confirm-destination-locally button").click()
//     }
//   } else {
//       $("#Question-generate-dataset-locally-destination").nextAll().removeClass('show');
//       $("#Question-generate-dataset-locally-destination").nextAll().removeClass('test2');
//       $("#Question-generate-dataset-locally-destination").nextAll().removeClass('prev');
//       // document.getElementById("div-confirm-destination-locally").style.display = "none";
//       // $("#div-confirm-destination-locally button").hide()
//   }
// })
//
// document.getElementById("button-generate-comeback").addEventListener('click', function() {
//   document.getElementById('generate-dataset-progress-tab').style.display = "none";
//   document.getElementById('div-vertical-progress-bar').style.display = "flex";
//   document.getElementById('prevBtn').style.display = "inline";
//   $('#generate-dataset-tab').addClass('tab-active');
// })

// function to hide the sidebar and disable the sidebar expand button
function forceActionSidebar(action) {
  if (action === "hide") {
    if (!$('#main-nav').hasClass('active')) {
      $('#sidebarCollapse').click();
    }
    $('#sidebarCollapse').prop("disabled", true)
  } else {
      $('#sidebarCollapse').toggleClass('active');
      $('#main-nav').toggleClass('active');
      $('#sidebarCollapse').prop("disabled", false)
  }
}


///////// Option to delete folders or files
function delFolder(ev, organizeCurrentLocation, uiItem, singleUIItem, inputGlobal) {

  var itemToDelete = ev.parentElement.innerText
  var promptVar;
  var type; // renaming files or folders

  if (ev.classList.value.includes("myFile")) {
    promptVar = "file";
    type = "files"
  } else if (ev.classList.value.includes("myFol")) {
    promptVar = "folder";
    type = "folders"
  };

  bootbox.confirm({
    title: "Delete "+ promptVar,
    message: "Are you sure you want to delete this " + promptVar + "?",
    onEscape: true,
    centerVertical: true,
    callback: function(result) {
    if(result !== null && result === true) {
      /// get current location of folders or files
      var filtered = getGlobalPath(organizeCurrentLocation)
      var myPath = getRecursivePath(filtered.slice(1), inputGlobal)
      // update Json object with new folder created
      delete myPath[type][itemToDelete];
      // update UI with updated jsonobj
      listItems(myPath, uiItem)
      getInFolder(singleUIItem, uiItem, organizeCurrentLocation, inputGlobal)
      }
    }
  })
}

// helper function to rename files/folders
function checkValidRenameInput(event, input, type, oldName, newName, itemElement, myBootboxDialog) {
  var duplicate = false;
  // if renaming a file
  if (type==="files") {
    newName = input.trim() + path.parse(oldName).ext
    // check for duplicate or files with the same name
    for (var i=0;i<itemElement.length;i++) {
      if (path.parse(newName).name === path.parse(itemElement[i].innerText).name) {
        duplicate = true
        break
      }
    }
    if (duplicate) {
      $(myBootboxDialog).find(".modal-footer span").text("")
      myBootboxDialog.find(".modal-footer").prepend("<span style='color:red;padding-right:10px;display:inline-block;'>The file name: "+newName+" already exists, please rename to a different name!</span>");
      newName = "";
    }
  //// if renaming a folder
  } else {
      newName = input.trim()
      // check for duplicate folder as shown in the UI
      for (var i=0;i<itemElement.length;i++) {
        if (input.trim() === itemElement[i].innerText) {
          duplicate = true
          break
        }
      }
      if (duplicate) {
        $(myBootboxDialog).find(".modal-footer span").text("")
        myBootboxDialog.find(".modal-footer").prepend("<span style='color:red;padding-right:10px;display:inline-block;'>The folder name: "+input.trim()+" already exists, please rename to a different name!</span>");
        newName = "";
      }
  }
  return newName
}

///// Option to rename a folder and files
function renameFolder(event1, organizeCurrentLocation, itemElement, inputGlobal, uiItem, singleUIItem) {

  var promptVar;
  var type; // renaming files or folders
  var newName;
  var currentName = event1.parentElement.innerText
  var nameWithoutExtension;
  var highLevelFolderBool;

  if (highLevelFolders.includes(currentName)) {
    highLevelFolderBool = true
  } else {
    highLevelFolderBool = false
  }

  if (event1.classList[0] === "myFile") {
    promptVar = "file";
    type = "files";
  } else if (event1.classList[0] === "myFol") {
    promptVar = "folder";
    type = "folders";
  }
  if (type==="files") {
    nameWithoutExtension = path.parse(currentName).name
  } else {
    nameWithoutExtension = currentName
  }
  // show prompt to enter a new name
  var myBootboxDialog = bootbox.dialog({
    title: 'Rename '+ promptVar,
    message: 'Please enter a new name: <p><input type="text" id="input-new-name-renamed" class="form-control" value="'+nameWithoutExtension+'"></input></p>',
    buttons: {
      cancel: {
            label: '<i class="fa fa-times"></i> Cancel'
        },
        confirm: {
            label: '<i class="fa fa-check"></i> Save',
            className: 'btn-success',
            callback: function() {
              var returnedName = checkValidRenameInput(event1, $("#input-new-name-renamed").val().trim(), type, currentName, newName, itemElement, myBootboxDialog);
              if (returnedName !== "") {
                myBootboxDialog.modal('hide')
                bootbox.alert({
                  message: "Successfully renamed!",
                  centerVertical: true
                });

                /// assign new name to folder or file in the UI
                event1.parentElement.parentElement.innerText = returnedName
                /// get location of current file or folder in JSON obj
                var filtered = getGlobalPath(organizeCurrentLocation)
                var myPath = getRecursivePath(filtered.slice(1), inputGlobal)
                /// update jsonObjGlobal with the new name
                storedValue = myPath[type][currentName]
                delete myPath[type][currentName];
                myPath[type][returnedName] = storedValue;
                if ("action" in myPath[type][returnedName]
                  && !(myPath[type][returnedName]["action"].includes("renamed"))) {
                  myPath[type][returnedName]["action"].push("renamed")
                } else {
                  myPath[type][returnedName]["action"] = ["new", "renamed"]
                }
                /// list items again with updated JSON obj
                listItems(myPath, uiItem)
                getInFolder(singleUIItem, uiItem, organizeCurrentLocation, inputGlobal)
              }
              return false
            }
        }
    },
    centerVertical: true
})
}

function getGlobalPath(path) {
  var currentPath = path.value.trim()
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.filter(function (el) {
    return el != "";
  });
  return filtered
}

function loadFileFolder(myPath) {

  var appendString = ""
  var sortedObj = sortObjByKeys(myPath)

  for (var item in sortedObj["folders"]) {
    var emptyFolder = "";
    if (! highLevelFolders.includes(item)) {
      if (
        JSON.stringify(sortedObj["folders"][item]["folders"]) === "{}" &&
        JSON.stringify(sortedObj["folders"][item]["files"]) === "{}"
    ) {
        emptyFolder = " empty";
      }
    }
    appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 oncontextmenu="folderContextMenu(this)" class="myFol'+emptyFolder+'"></h1><div class="folder_desc">'+item+'</div></div>'
  }
  for (var item in sortedObj["files"]) {
    // not the auto-generated manifest
    if (sortedObj["files"][item].length !== 1) {
      var extension = sliceStringByValue(sortedObj["files"][item]["path"],  ".")
      if (!["docx", "doc", "pdf", "txt", "jpg", "JPG", "xlsx", "xls", "csv", "png", "PNG"].includes(extension)) {
        extension = "other"
      }
    } else {
      extension = "other"
    }
    appendString = appendString + '<div class="single-item"><h1 class="myFile '+extension+'" oncontextmenu="fileContextMenu(this)" style="margin-bottom: 10px""></h1><div class="folder_desc">'+item+'</div></div>'
  }

  return appendString
}

function getRecursivePath(filteredList, inputObj) {
  var myPath = inputObj;
  for (var item of filteredList) {
    if (item.trim()!=="") {
      myPath = myPath["folders"][item]
    }
  }
  return myPath
}

/// check if an array contains another array
function checkSubArrayBool(parentArray, childArray) {
  var bool = true
  for (var element of childArray) {
    if (!parentArray.includes(element)) {
      bool = false
      break
    }
  }
  return bool
}

function showItemsAsListBootbox(arrayOfItems) {
  var htmlElement = "";
  for (var element of arrayOfItems) {
    htmlElement = htmlElement + "<li>" + element + "</li>"
  }
  return htmlElement
}

function addFilesfunction(fileArray, currentLocation, organizeCurrentLocation, uiItem, singleUIItem, globalPathValue) {

  // check for duplicate or files with the same name
  var nonAllowedDuplicateFiles = [];
  var regularFiles = {};
  var uiFilesWithoutExtension = {};

  for (var file in currentLocation["files"]) {
    uiFilesWithoutExtension[path.parse(file).name] = 1
  }

  for (var i=0; i<fileArray.length;i++) {
    var fileName = fileArray[i];
    // check if dataset structure level is at high level folder
    var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
    if (slashCount === 1) {
      bootbox.alert({
        message: "<p>SPARC metadata files can be imported in the next step!</p>",
        centerVertical: true
      })
      break
    } else {
        if (JSON.stringify(currentLocation["files"]) === "{}" && JSON.stringify(regularFiles) === "{}") {
          regularFiles[path.parse(fileName).name] = {"path": fileName, "basename":path.parse(fileName).base}
        } else {
            for (var objectKey in currentLocation["files"]) {
              if (objectKey !== undefined) {
                var nonAllowedDuplicate = false;
                if (fileName === currentLocation["files"][objectKey]["path"]) {
                  nonAllowedDuplicateFiles.push(fileName);
                  nonAllowedDuplicate = true;
                  break
                }
              }
            }
            if (!nonAllowedDuplicate) {
              var j = 1;
              var fileBaseName = path.basename(fileName);
              var originalFileNameWithoutExt = path.parse(fileBaseName).name;
              var fileNameWithoutExt = originalFileNameWithoutExt;
              while (fileNameWithoutExt in uiFilesWithoutExtension || fileNameWithoutExt in regularFiles) {
                fileNameWithoutExt = `${originalFileNameWithoutExt} (${j})`;
                j++;
              }
              regularFiles[fileNameWithoutExt] = {"path": fileName, "basename": fileNameWithoutExt + path.parse(fileName).ext};
            }
          }
      }
    }

    // now handle non-allowed duplicates (show message), allowed duplicates (number duplicates & append to UI),
    // and regular files (append to UI)
    if (Object.keys(regularFiles).length > 0) {
      for (var element in regularFiles) {
        currentLocation["files"][regularFiles[element]["basename"]] = {"path": regularFiles[element]["path"], "type": "local", "description":"", "additional-metadata":"", "action":["new"]}
        // append "renamed" to "action" key if file is auto-renamed by UI
        var originalName = path.parse(currentLocation["files"][regularFiles[element]["basename"]]["path"]).name;
        if (element !== originalName) {
          currentLocation["files"][regularFiles[element]["basename"]]["action"].push('renamed');
        }
        var appendString = '<div class="single-item"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="fileContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+regularFiles[element]["basename"]+'</div></div>'
        $(uiItem).html(appendString)
        listItems(currentLocation, uiItem)
        getInFolder(singleUIItem, uiItem, organizeCurrentLocation, globalPathValue)
      }
    }
    if (nonAllowedDuplicateFiles.length > 0) {
      var listElements = showItemsAsListBootbox(nonAllowedDuplicateFiles)
      bootbox.alert({
        message: 'The following files are already imported into the current location of your dataset: <p><ul>'+listElements+'</ul></p>',
        centerVertical: true
      })
    }
}

///// function to load details to show in display once
///// users click Show details
function loadDetailsContextMenu(fileName, filePath, textareaID1, textareaID2, paraLocalPath) {
  document.getElementById(textareaID1).value = filePath["files"][fileName]["description"];
  document.getElementById(textareaID2).value = filePath["files"][fileName]["additional-metadata"];
  document.getElementById(paraLocalPath).innerHTML = filePath["files"][fileName]["path"];
}

function triggerManageDetailsPrompts(ev, fileName, filePath, textareaID1, textareaID2) {
  filePath["files"][fileName]["additional-metadata"] = document.getElementById(textareaID2).value.trim();
  filePath["files"][fileName]["description"] = document.getElementById(textareaID1).value.trim();
  // check for "Apply to all files"
  if (document.getElementById("input-add-file-metadata").checked) {
    for (var file in filePath["files"]) {
        filePath["files"][file]["additional-metadata"] = document.getElementById(textareaID2).value.trim();
      }
    }
  if (document.getElementById("input-add-file-description").checked) {
    for (var file in filePath["files"]) {
        filePath["files"][file]["description"] = document.getElementById(textareaID1).value.trim();
      }
    }
   // $(this).html("Done <i class='fas fa-check'></i>");
};

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
////////////////// ORGANIZE DATASETS NEW FEATURE /////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

var backFolder = []
var forwardFolder =[]

var highLevelFolders = ["code", "derivative", "docs", "source", "primary", "protocol"]
var highLevelFolderToolTip = {
  "code": "code: This folder contains all the source code used in the study (e.g., Python, MATLAB, etc.)",
  "derivative": "derivative: This folder contains data files derived from raw data (e.g., processed image stacks that are annotated via the MBF tools, segmentation files, smoothed overlays of current and voltage that demonstrate a particular effect, etc.)",
  "docs": "docs: This folder contains all other supporting files that don't belong to any of the other folders (e.g., a representative image for the dataset, figures, etc.)",
  "source": "source: This folder contains very raw data i.e. raw or untouched files from an experiment. For example, this folder may include the “truly” raw k-space data for an MR image that has not yet been reconstructed (the reconstructed DICOM or NIFTI files, for example, would be found within the primary folder). Another example is the unreconstructed images for a microscopy dataset.",
  "primary": "primary: This folder contains all folders and files for experimental subjects and/or samples. All subjects will have a unique folder with a standardized name the same as the names or IDs as referenced in the subjects metadata file. Within each subject folder, the experimenter may choose to include an optional “session” folder if the subject took part in multiple experiments/ trials/ sessions. The resulting data is contained within data type-specific (Datatype) folders within the subject (or session) folders. The SPARC program’s Data Sharing Committee defines 'raw' (primary) data as one of the types of data that should be shared. This covers minimally processed raw data, e.g. time-series data, tabular data, clinical imaging data, genomic, metabolomic, microscopy data, which can also be included within their own folders.",
  "protocol": "protocol: This folder contains supplementary files to accompany the experimental protocols submitted to Protocols.io. Please note that this is not a substitution for the experimental protocol which must be submitted to <b><a href='https://www.protocols.io/groups/sparc'> Protocols.io/sparc </a></b>."
}

var datasetStructureJSONObj = {
  "folders":{},
  "files":{},
  "type":""
}
//
// listItems(datasetStructureJSONObj, '#items')
// getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)

var sodaJSONObj = {}
//
// "bf-account-selected": {
//       "account-name": "",
//   },
//   "bf-dataset-selected": {
//       "dataset-name": "",
//   },
//   "dataset-structure": {"folders": {}, "files": {}},
//   "metadata-files": {},
//   "generate-dataset": {
//       "destination": "",
//       "path": "",
//       "dataset-name": "",
//       "if-existing": "",
//       "generate-option": ""
//   }


/// back button
organizeDSbackButton.addEventListener("click", function() {
  // var currentPath = organizeDSglobalPath.value.trim()
  // if (currentPath !== "/") {
  var slashCount = organizeDSglobalPath.value.trim().split("/").length - 1;
  if (slashCount !== 1) {
    var filtered = getGlobalPath(organizeDSglobalPath)
    if (filtered.length === 1) {
      organizeDSglobalPath.value = filtered[0] + "/"
    } else {
      organizeDSglobalPath.value = filtered.slice(0,filtered.length-1).join("/") + "/"
    }
    var myPath = datasetStructureJSONObj;
    for (var item of filtered.slice(1,filtered.length-1)) {
      myPath = myPath["folders"][item]
    }
    // construct UI with files and folders
    var appendString = loadFileFolder(myPath)

    /// empty the div
    $('#items').empty()
    $('#items').html(appendString)

    // reconstruct div with new elements
    listItems(myPath, '#items')
    getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
  }
})

// Add folder button
organizeDSaddNewFolder.addEventListener("click", function(event) {
  event.preventDefault();
  var newFolderName = "New Folder"
  // show prompt for name
  bootbox.prompt({
    title: "Add new folder...",
    message: "Enter a name below:",
    centerVertical: true,
    callback: function(result) {
      if(result !== null && result!== "") {
        newFolderName = result.trim()
        // check for duplicate or files with the same name
        var duplicate = false
        var itemDivElements = document.getElementById("items").children
        for (var i=0;i<itemDivElements.length;i++) {
          if (newFolderName === itemDivElements[i].innerText) {
            duplicate = true
            break
          }
        }
        if (duplicate) {
          bootbox.alert({
            message: "Duplicate folder name: " + newFolderName,
            centerVertical: true
          })
        } else {
          var appendString = '';
          appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder"></i></h1><div class="folder_desc">'+ newFolderName +'</div></div>'
          $(appendString).appendTo('#items');

          /// update datasetStructureJSONObj
          var currentPath = organizeDSglobalPath.value
          var jsonPathArray = currentPath.split("/")
          var filtered = jsonPathArray.slice(1).filter(function (el) {
            return el != "";
          });

          var myPath = getRecursivePath(filtered, datasetStructureJSONObj)
          // update Json object with new folder created
          var renamedNewFolder = newFolderName
          myPath["folders"][renamedNewFolder] = {"folders": {}, "files": {}, "type":"virtual"}

          listItems(myPath,'#items')
          getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
          hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
          hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
        }
      }
    }
  })
})

// ///////////////////////////////////////////////////////////////////////////
// recursively populate json object
function populateJSONObjFolder(jsonObject, folderPath) {
    var myitems = fs.readdirSync(folderPath)
    myitems.forEach(element => {
      var statsObj = fs.statSync(path.join(folderPath, element))
      var addedElement = path.join(folderPath, element)
      if (statsObj.isDirectory()) {
        jsonObject["folders"][element] = {"type": "local", "folders": {}, "files": {}, "action":["new"]}
        populateJSONObjFolder(jsonObject["folders"][element], addedElement)
      } else if (statsObj.isFile()) {
          jsonObject["files"][element] = {"path": addedElement, "description": "", "additional-metadata":"", "type": "local", "action":["new"]}
        }
    });
}


function hideFullName() {
  fullNameValue.style.display = "none";
  fullNameValue.style.top = '-250%';
  fullNameValue.style.left = '-250%';
}

//// HOVER FOR FULL NAME (FOLDERS WITH WRAPPED NAME IN UI)
function showFullName(ev, element, text) {
  /// check if the full name of the folder is overflowing or not, if so, show full name on hover
  var isOverflowing = element.clientWidth < element.scrollWidth || element.clientHeight < element.scrollHeight;
  if (isOverflowing) {
    var mouseX = ev.pageX - 200;
    var mouseY = ev.pageY;
    fullNameValue.style.display = "block";
    fullNameValue.innerHTML = text
    $('.hoverFullName').css({'top':mouseY,'left':mouseX}).fadeIn('slow');
  }
}

/// hover over a function for full name
function hoverForFullName(ev) {
    var fullPath = ev.innerText
    // ev.children[1] is the child element folder_desc of div.single-item,
    // which we will put through the overflowing check in showFullName function
    showFullName(event, ev.children[1], fullPath)
}

// // If the document is clicked somewhere
// document.addEventListener('onmouseover', function(e){
//   if (e.target.classList.value !== "myFile") {
//     hideFullPath()
//   } else {
//     hoverForPath(e)
//   }
// });

document.addEventListener('onmouseover', function(e){
  if (e.target.classList.value === "fas fa-folder") {
    hoverForFullName(e)
  } else {
    hideFullName()
  }
});

// if a file/folder is clicked -> show details in right "sidebar"
function showDetailsFile() {
  $('.div-display-details.file').toggleClass('show');
  // $(".div-display-details.folders").hide()
}

var bfAddAccountBootboxMessage = "<form><div class='form-group row'><label for='bootbox-key-name' class='col-sm-3 col-form-label'> Key name:</label><div class='col-sm-9'><input type='text' id='bootbox-key-name' class='form-control'/></div></div><div class='form-group row'><label for='bootbox-api-key' class='col-sm-3 col-form-label'> API Key:</label><div class='col-sm-9'><input id='bootbox-api-key' type='text' class='form-control'/></div></div><div class='form-group row'><label for='bootbox-api-secret' class='col-sm-3 col-form-label'> API Secret:</label><div class='col-sm-9'><input id='bootbox-api-secret'  class='form-control' type='text' /></div></div></form>"

function addBFAccountInsideBootbox(myBootboxDialog) {
  var keyname = $("#bootbox-key-name").val();
  var apiKey = $("#bootbox-api-key").val();
  var apiSecret = $("#bootbox-api-secret").val();
  client.invoke("api_bf_add_account", keyname, apiKey, apiSecret, (error, res) => {
    if(error) {
      myBootboxDialog.find(".modal-footer").prepend("<span style='color:red;padding-right:10px;display:inline-block;'>"+error+"</span>");
      log.error(error)
      console.error(error);
    } else {
      curateBFAccountLoadStatus.innerHTML = "Loading account..."
      curateBFAccountLoad.style.display = 'block'
      updateBfAccountList();
      updateAllBfAccountList(curateBFaccountList);
      $("#bootbox-key-name").val("");
      $("#bootbox-api-key").val("");
      $("#bootbox-api-secret").val("");
      myBootboxDialog.modal('hide')
      bootbox.alert({
        message: "Successfully added!",
        centerVertical: true
      });
    }
  });
}

function showBFAddAccountBootbox() {
  var bootb = bootbox.dialog({
    title: "Please specify a key name and enter your Blackfynn API key and secret below:",
    message: bfAddAccountBootboxMessage,
    buttons: {
        cancel: {
            label: 'Cancel'
        },
        confirm: {
            label: 'Add',
            className: 'btn btn-primary bootbox-add-bf-class',
            callback: function() {
              addBFAccountInsideBootbox(bootb);
              return false
            }
          }
        },
    size: "medium",
    centerVertical: true
  })
}


// function showDetailsFolder() {
//   $('.div-display-details.folders').toggleClass('show');
//   $(".div-display-details.file").hide()
// }

/// import progress
// importProgress.addEventListener("click", function() {
//   ipcRenderer.send('open-file-organization-dialog')
// });
//
// ipcRenderer.on('selected-file-organization', (event,filePath) => {
//   organizeDSglobalPath.value = "/"
//   if (filePath !== undefined) {
//     var progressData = fs.readFileSync(filePath[0])
//     var content = JSON.parse(progressData.toString())
//     var contentKeys = Object.keys(content["folders"])
//     if (checkSubArrayBool(highLevelFolders, contentKeys)) {
//       datasetStructureJSONObj = content
//     } else {
//       bootbox.alert({
//         message: "<p>Please import a valid file organization!</p>",
//         centerVertical: true
//       })
//       return
//     }
//     var bootboxDialog = bootbox.dialog({message: '<p><i class="fa fa-spin fa-spinner"></i>Importing file organization...</p>'})
//     bootboxDialog.init(function(){
//       listItems(datasetStructureJSONObj, '#items')
//       getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
//       hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
//       hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
//       bootboxDialog.find('.bootbox-body').html("<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully loaded!");
//     })
//   }
// })
//
// // save progress
// saveProgress.addEventListener("click", function() {
//   ipcRenderer.send('save-file-saveorganization-dialog');
// })
// ipcRenderer.on('selected-fileorganization', (event, filePath) => {
//   if (filePath.length > 0){
//     if (filePath !== undefined){
//       fs.writeFileSync(filePath, JSON.stringify(datasetStructureJSONObj))
//       bootbox.alert({
//         message: "<i style='margin-right: 5px !important' class='fas fa-check'></i>Successfully saved file organization.",
//         centerVertical: true
//       })
//     }
//   }
// })
//
// /// reset progress
// resetProgress.addEventListener("click", function() {
//   bootbox.confirm({
//     title: "Reset progress",
//     message: "<p>Are you sure you want to clear the current file organization?</p>",
//     centerVertical: true,
//     callback: function(r) {
//       if (r!==null) {
//         organizeDSglobalPath.value = "/"
//         datasetStructureJSONObj = {
//           "type": "virtual",
//           "folders": {
//             "code": {"type": "virtual", "folders": {}, "files": {}},
//             "derivative": {"type": "virtual", "folders": {}, "files": {}},
//             "primary": {"type": "virtual", "folders": {}, "files": {}},
//             "source": {"type": "virtual", "folders": {}, "files": {}},
//             "docs": {"type": "virtual", "folders": {}, "files": {}},
//             "protocols": {"type": "virtual", "folders": {}, "files": {}}
//           },
//           "files": {}
//         }
//         listItems(datasetStructureJSONObj, '#items')
//         getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
//         hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
//         hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
//       }
//     }
//   })
// })


////// function to trigger action for each context menu option
function hideMenu(category, menu1, menu2, menu3){
  if (category === "folder") {
    menu1.style.display = "none";
    menu1.style.top = "-200%";
    menu1.style.left = '-200%';
  } else if (category === "high-level-folder") {
    menu2.style.display = "none";
    menu2.style.top = "-220%";
    menu2.style.left = '-220%';
  } else {
    menu3.style.display = "none";
    menu3.style.top = "-210%";
    menu3.style.left = "-210%";
  }
}

function changeStepOrganize(step) {
    if (step.id==="button-organize-prev") {
      document.getElementById("div-step-1-organize").style.display = "block";
      document.getElementById("div-step-2-organize").style.display = "none";
      document.getElementById("dash-title").innerHTML = "Organize dataset<i class='fas fa-caret-right' style='margin-left: 10px; margin-right: 10px'></i>High-level folders"
      organizeNextStepBtn.style.display = "block"
      organizePrevStepBtn.style.display = "none"
    } else {
      document.getElementById("div-step-1-organize").style.display = "none";
      document.getElementById("div-step-2-organize").style.display = "block";
      document.getElementById("dash-title").innerHTML = "Organize dataset<i class='fas fa-caret-right' style='margin-left: 10px; margin-right: 10px'></i>Generate dataset"
      organizePrevStepBtn.style.display = "block"
      organizeNextStepBtn.style.display = "none"
    }
}

var newDSName;
function generateDataset(button) {
  document.getElementById("para-organize-datasets-success").style.display = "none"
  document.getElementById("para-organize-datasets-error").style.display = "none"
  if (button.id==="btn-generate-locally") {
    $("#btn-generate-BF").removeClass("active");
    $(button).toggleClass("active");
    bootbox.prompt({
      title: 'Generate dataset locally',
      message: 'Enter a name for the dataset:',
      buttons: {
        cancel: {
              label: '<i class="fa fa-times"></i> Cancel'
          },
          confirm: {
              label: '<i class="fa fa-check"></i> Confirm and Choose location',
              className: 'btn-success'
          }
      },
      centerVertical: true,
      callback: function (r) {
        if(r !== null && r.trim() !== ""){
          newDSName = r.trim()
          ipcRenderer.send('open-file-dialog-newdataset')
          }
        }
      })
    } else {
        $("#btn-generate-locally").removeClass("active");
        $(button).toggleClass("active");
    }
}

ipcRenderer.on('selected-new-dataset', (event, filepath) => {
  if (filepath.length > 0) {
    if (filepath != null){
      document.getElementById("para-organize-datasets-loading").style.display = "block"
      document.getElementById("para-organize-datasets-loading").innerHTML = "<span>Please wait...</span>"
      client.invoke("api_generate_dataset_locally", "create new", filepath[0], newDSName, datasetStructureJSONObj, (error, res) => {
        document.getElementById("para-organize-datasets-loading").style.display = "none"
        if(error) {
          log.error(error)
          console.error(error)
          document.getElementById("para-organize-datasets-success").style.display = "none"
          document.getElementById("para-organize-datasets-error").style.display = "block"
          document.getElementById("para-organize-datasets-error").innerHTML = "<span> " + error + "</span>";
        } else {
          document.getElementById("para-organize-datasets-error").style.display = "none"
          document.getElementById("para-organize-datasets-success").style.display = "block"
          document.getElementById("para-organize-datasets-success").innerHTML = "<span>Generated successfully!</span>";
        }
    })
  }
}
})


//////////// FILE BROWSERS to import existing files and folders /////////////////////
organizeDSaddFiles.addEventListener("click", function() {
   ipcRenderer.send('open-files-organize-datasets-dialog')
 })
 ipcRenderer.on('selected-files-organize-datasets', (event, path) => {
   var filtered = getGlobalPath(organizeDSglobalPath)
   var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj)
   path = path.filter(file_path => fs.statSync(file_path).isFile())
   addFilesfunction(path, myPath, organizeDSglobalPath, '#items', '.single-item', datasetStructureJSONObj)
 })

organizeDSaddFolders.addEventListener("click", function() {
  ipcRenderer.send('open-folders-organize-datasets-dialog')
})
ipcRenderer.on('selected-folders-organize-datasets', (event, path) => {
  var filtered = getGlobalPath(organizeDSglobalPath)
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj)
  addFoldersfunction(path, myPath)
})

function addFoldersfunction(folderArray, currentLocation) {

  var uiFolders = {};
  var importedFolders = {};

  if (JSON.stringify(currentLocation["folders"]) !== "{}") {
    for (var folder in currentLocation["folders"]) {
      uiFolders[folder] = 1
    }
  }
    // check for duplicates/folders with the same name
    for (var i=0; i<folderArray.length;i++) {
        var j = 1;
        var originalFolderName = path.basename(folderArray[i]);
        var renamedFolderName = originalFolderName;
        while (renamedFolderName in uiFolders || renamedFolderName in importedFolders) {
          renamedFolderName = `${originalFolderName} (${j})`;
          j++;
        }
        importedFolders[renamedFolderName] = {"path": folderArray[i], "original-basename": originalFolderName};
      }
      if (Object.keys(importedFolders).length > 0) {
        for (var element in importedFolders) {
          currentLocation["folders"][element] = {"type": "local", "path": importedFolders[element]["path"], "folders": {}, "files": {}, "action": ["new"]}
          populateJSONObjFolder(currentLocation["folders"][element], importedFolders[element]["path"]);
          // check if a folder has to be renamed due to duplicate reason
          if (element !== importedFolders[element]["original-basename"]) {
            currentLocation["folders"][element]["action"].push('renamed');
          }
          var appendString = '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 class="folder blue"><i class="fas fa-folder" oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+element+'</div></div>'
          $('#items').html(appendString)
          listItems(currentLocation, '#items')
          getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
          hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
          hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
        }
      }
}

//// Step 3. Organize dataset: Add files or folders with drag&drop
function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  // get global path
  var currentPath = organizeDSglobalPath.value
  var jsonPathArray = currentPath.split("/")
  var filtered = jsonPathArray.slice(1).filter(function (el) {
    return el != "";
  });
  var myPath = getRecursivePath(filtered, datasetStructureJSONObj);
  var importedFiles = {};
  var importedFolders = {};
  var nonAllowedDuplicateFiles = [];
  ev.preventDefault();
  var uiFiles = {};
  var uiFolders = {};

  for (var file in myPath["files"]) {
    uiFiles[path.parse(file).name] = 1
  }
  for (var folder in myPath["folders"]) {
    uiFolders[path.parse(folder).name] = 1
  }
  for (var i=0; i<ev.dataTransfer.files.length;i++) {
    /// Get all the file information
    var itemPath = ev.dataTransfer.files[i].path
    var itemName = ev.dataTransfer.files[i].name
    var duplicate = false
    var statsObj = fs.statSync(itemPath)
    // check for duplicate or files with the same name
    for (var j=0; j<ev.target.children.length;j++) {
      if (itemName === ev.target.children[j].innerText) {
        duplicate = true
        break
      }
    }
    /// check for File duplicate
    if (statsObj.isFile()) {
        if (JSON.stringify(myPath["files"]) === "{}"  && JSON.stringify(importedFiles) === "{}") {
          importedFiles[path.parse(itemPath).name] = {"path": itemPath, "basename":path.parse(itemPath).base}
        } else {
            for (var objectKey in myPath["files"]) {
              if (objectKey !== undefined) {
                var nonAllowedDuplicate = false;
                if (itemPath === myPath["files"][objectKey]["path"]) {
                  nonAllowedDuplicateFiles.push(itemPath);
                  nonAllowedDuplicate = true;
                  break
                }
              }
            }
            if (!nonAllowedDuplicate) {
              var j = 1;
              var fileBaseName = itemName;
              var originalFileNameWithoutExt = path.parse(itemName).name;
              var fileNameWithoutExt = originalFileNameWithoutExt;
              while (fileNameWithoutExt in uiFiles || fileNameWithoutExt in importedFiles) {
                fileNameWithoutExt = `${originalFileNameWithoutExt} (${j})`;
                j++;
              }
              importedFiles[fileNameWithoutExt] = {"path": itemPath, "basename": fileNameWithoutExt + path.parse(itemName).ext};
            }
          }
    } else if (statsObj.isDirectory()) {
        var j = 1;
        var originalFolderName = itemName;
        var renamedFolderName = originalFolderName;
        while (renamedFolderName in uiFolders || renamedFolderName in importedFolders) {
          renamedFolderName = `${originalFolderName} (${j})`;
          j++;
        }
        importedFolders[renamedFolderName] = {"path": itemPath, "original-basename": originalFolderName};
      }
    if (nonAllowedDuplicateFiles.length > 0) {
      var listElements = showItemsAsListBootbox(nonAllowedDuplicateFiles)
      bootbox.alert({
        message: 'The following files are already imported into the current location of your dataset: <p><ul>'+listElements+'</ul></p>',
        centerVertical: true
      })
    }
  // // now append to UI files and folders
  if (Object.keys(importedFiles).length > 0) {
    document.getElementById('div-file-org-buttons').style.display = "flex";
    if (document.getElementById('para-drag-drop')) {
      document.getElementById('para-drag-drop').style.display = "none";
    }
    document.getElementById('items').style.border = "1px solid #f5f5f5";

    for (var element in importedFiles) {
      myPath["files"][importedFiles[element]["basename"]] = {"path": importedFiles[element]["path"], "type": "local", "description":"", "additional-metadata":"", "action":["new"]}
      // append "renamed" to "action" key if file is auto-renamed by UI
      var originalName = path.parse(myPath["files"][importedFiles[element]["basename"]]["path"]).name;
      if (element !== originalName) {
        myPath["files"][importedFiles[element]["basename"]]["action"].push('renamed');
      }
      var appendString = '<div class="single-item"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+importedFiles[element]["basename"]+'</div></div>'
      $(appendString).appendTo(ev.target);
      listItems(myPath, '#items')
      getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
      }
    }
    if (Object.keys(importedFolders).length > 0) {
      document.getElementById('div-file-org-buttons').style.display = "flex";
      document.getElementById('items').style.border = "1px solid #f5f5f5";
      document.getElementById('items').style.display = "block"
      if (document.getElementById('para-drag-drop')) {
        document.getElementById('para-drag-drop').style.display = "none";
      }
      for (var element in importedFolders) {
        myPath["folders"][element] = {"type": "local", "path": importedFolders[element]["path"], "folders": {}, "files": {}, "action": ["new"]}
        // append "renamed" to "action" key if file is auto-renamed by UI
        var originalName = path.parse(myPath["folders"][element]["path"]).name;
        if (element !== originalName) {
          myPath["folders"][element]["action"].push('renamed');
        }
        populateJSONObjFolder(myPath["folders"][element], importedFolders[element]["path"]);
        var appendString = '<div class="single-item"><h1 class="folder file"><i class="far fa-file-alt"  oncontextmenu="folderContextMenu(this)" style="margin-bottom:10px"></i></h1><div class="folder_desc">'+element+'</div></div>'
        $(appendString).appendTo(ev.target);
        listItems(myPath, '#items')
        getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj)
        hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
        hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
        }
      }
    }
}

// SAVE FILE ORG
ipcRenderer.on('save-file-organization-dialog', (event) => {
  const options = {
    title: 'Save File Organization',
    filters: [
      { name: 'JSON', extensions: ['json'] }
    ]
  }
  dialog.showSaveDialog(null, options, (filename) => {
    event.sender.send('selected-saveorganizationfile', filename)
  })
})


//////////////////////////////////////////////////////////////////////////////
/////////////////// CONTEXT MENU OPTIONS FOR FOLDERS AND FILES ///////////////
//////////////////////////////////////////////////////////////////////////////


//// helper functions for hiding/showing context menus
function showmenu(ev, category){
    //stop the real right click menu
    ev.preventDefault();
    var mouseX;
    if (ev.pageX <= 200) {
      mouseX = ev.pageX + 10;
    } else {
      mouseX = ev.pageX - 210;
    }
    var mouseY = ev.pageY - 15;
    if (category === "folder") {
      menuFolder.style.display = "block";
      $('.menu.reg-folder').css({'top':mouseY,'left':mouseX}).fadeIn('slow');
    } else if (category === "high-level-folder") {
      menuHighLevelFolders.style.display = "block";
      $('.menu.high-level-folder').css({'top':mouseY,'left':mouseX}).fadeIn('slow');
    } else {
        menuFile.style.display = "block";
        $('.menu.file').css({'top':mouseY,'left':mouseX}).fadeIn('slow');
      }
}

/// options for regular sub-folders
function folderContextMenu(event) {
  $(".menu.reg-folder li").unbind().click(function(){
    if ($(this).attr('id') === "folder-rename") {
        var itemDivElements = document.getElementById("items").children
        renameFolder(event, organizeDSglobalPath, itemDivElements, datasetStructureJSONObj, '#items', '.single-item')
      } else if ($(this).attr('id') === "folder-delete") {
        delFolder(event, organizeDSglobalPath, '#items', '.single-item', datasetStructureJSONObj)
      }
     // Hide it AFTER the action was triggered
     hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
     hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
     hideFullName()
 });

 /// options for high-level folders
 $(".menu.high-level-folder li").unbind().click(function(){
   if ($(this).attr('id') === "folder-rename") {
     var itemDivElements = document.getElementById("items").children
      renameFolder(event, organizeDSglobalPath, itemDivElements, datasetStructureJSONObj, '#items', '.single-item')
     } else if ($(this).attr('id') === "folder-delete") {
       delFolder(event, organizeDSglobalPath, '#items', '.single-item', datasetStructureJSONObj)
     } else if ($(this).attr('id') === "tooltip-folders") {
       showTooltips(event)
     }
    // Hide it AFTER the action was triggered
    hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
    hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
    hideFullName()

});
/// hide both menus after an option is clicked
  hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
  hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
  hideFullName()
}

//////// options for files
function fileContextMenu(event) {
  if ($(".div-display-details.file").hasClass('show')) {
    $(".div-display-details.file").removeClass('show')
  }
  $(".menu.file li").unbind().click(function(){
    if ($(this).attr('id') === "file-rename") {
        var itemDivElements = document.getElementById("items").children
        renameFolder(event, organizeDSglobalPath, itemDivElements, datasetStructureJSONObj, '#items', '.single-item')
      } else if ($(this).attr('id') === "file-delete") {
        delFolder(event, organizeDSglobalPath, '#items', '.single-item', datasetStructureJSONObj)
      } else if ($(this).attr('id') === "file-description") {
        manageDesc(event)
      }
     // Hide it AFTER the action was triggered
     hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
 });
 hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
}

// Trigger action when the contexmenu is about to be shown
$(document).bind("contextmenu", function (event) {
    // Avoid the real one
    event.preventDefault();
    /// check for high level folders
    var highLevelFolderBool = false
    var folderName = event.target.parentElement.innerText
    if (highLevelFolders.includes(folderName)) {
      highLevelFolderBool = true
    }
    // Show the rightcontextmenu for each clicked
    // category (high-level folders, regular sub-folders, and files)
    if (event.target.classList[0] === "myFol") {
      if (highLevelFolderBool) {
        showmenu(event, "high-level-folder")
        hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
      } else {
        showmenu(event, "folder")
        hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
      }
    } else if (event.target.classList[0] === "myFile") {
      showmenu(event, "file")
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
      // otherwise, do not show any menu
    } else {
      hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
      hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
      hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
      // hideFullPath()
      hideFullName()
    }
});

$(document).bind("click", function (event) {
  if (event.target.classList[0] !== "myFol" &&
      event.target.classList[0] !== "myFile") {
        hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
        hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
        hideMenu("file", menuFolder, menuHighLevelFolders, menuFile)
        // hideFullPath()
        hideFullName()
      }
})

// sort JSON objects by keys alphabetically (folder by folder, file by file)
function sortObjByKeys(object) {
  const orderedFolders = {};
  const orderedFiles = {};
  /// sort the files in objects
  if (object.hasOwnProperty("files")) {
    Object.keys(object["files"]).sort().forEach(function(key) {
      orderedFiles[key] = object["files"][key]
    });
  }
  if (object.hasOwnProperty("folders")) {
    Object.keys(object["folders"]).sort().forEach(function(key) {
      orderedFolders[key] = object["folders"][key]
    });
  }
  const orderedObject = {
    "folders": orderedFolders,
    "files": orderedFiles,
    "type": ""
  }
  return orderedObject
}

function listItems(jsonObj, uiItem) {
    var appendString = ''
    var sortedObj = sortObjByKeys(jsonObj)
    for (var item in sortedObj["folders"]) {
      var emptyFolder = "";
      if (! highLevelFolders.includes(item)) {
        if (
          JSON.stringify(sortedObj["folders"][item]["folders"]) === "{}" &&
          JSON.stringify(sortedObj["folders"][item]["files"]) === "{}"
        ) {
          emptyFolder = " empty";
        }
      }
      appendString = appendString + '<div class="single-item" onmouseover="hoverForFullName(this)" onmouseleave="hideFullName()"><h1 oncontextmenu="folderContextMenu(this)" class="myFol'+emptyFolder+'"></h1><div class="folder_desc">'+item+'</div></div>'
    }
    for (var item in sortedObj["files"]) {
      // not the auto-generated manifest
      if (sortedObj["files"][item].length !== 1) {
        var extension = sliceStringByValue(sortedObj["files"][item]["path"],  ".")
        if (!["docx", "doc", "pdf", "txt", "jpg", "JPG", "xlsx", "xls", "csv", "png", "PNG"].includes(extension)) {
          extension = "other"
        }
      } else {
        extension = "other"
      }
      appendString = appendString + '<div class="single-item"><h1 class="myFile '+extension+'" oncontextmenu="fileContextMenu(this)" style="margin-bottom: 10px""></h1><div class="folder_desc">'+item+'</div></div>'
    }

    $(uiItem).empty()
    $(uiItem).html(appendString)
}

function getInFolder(singleUIItem, uiItem, currentLocation, globalObj) {
  $(singleUIItem).dblclick(function(){
    if($(this).children("h1").hasClass("myFol")) {
      var folderName = this.innerText
      var appendString = ''
      currentLocation.value = currentLocation.value + folderName + "/"

      var currentPath = currentLocation.value
      var jsonPathArray = currentPath.split("/")
      var filtered = jsonPathArray.slice(1).filter(function (el) {
        return el.trim() != "";
      });
      var myPath = getRecursivePath(filtered, globalObj)
      var appendString = loadFileFolder(myPath)

      $(uiItem).empty()
      $(uiItem).html(appendString)

      // reconstruct folders and files (child elements after emptying the Div)
      listItems(myPath, uiItem)
      getInFolder(singleUIItem, uiItem, currentLocation, globalObj)
    }
  })
}



function sliceStringByValue(string, endingValue) {
  var newString = string.slice(string.indexOf(endingValue) + 1)
  return newString
}

var fileNameForEdit;
///// Option to manage description for files
function manageDesc(ev) {
  var fileName = ev.parentElement.innerText
  /// get current location of files in JSON object
  var filtered = getGlobalPath(organizeDSglobalPath)
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj)
  //// load existing metadata/description
  loadDetailsContextMenu(fileName, myPath, 'textarea-file-description', 'textarea-file-metadata', 'para-local-path-file')
  $("#button-confirm-display-details-file").html('Confirm');
  showDetailsFile()
  hideMenu("folder", menuFolder, menuHighLevelFolders, menuFile)
  hideMenu("high-level-folder", menuFolder, menuHighLevelFolders, menuFile)
  fileNameForEdit = fileName
}

function updateFileDetails(ev) {
  var fileName = fileNameForEdit;
  var filtered = getGlobalPath(organizeDSglobalPath);
  var myPath = getRecursivePath(filtered.slice(1), datasetStructureJSONObj)
  triggerManageDetailsPrompts(ev, fileName, myPath, 'textarea-file-description', 'textarea-file-metadata')
  /// list Items again with new updated JSON structure
  listItems(myPath, '#items')
  getInFolder('.single-item', '#items', organizeDSglobalPath, datasetStructureJSONObj);
  // find checkboxes here and uncheck them
  for (var ele of $($(ev).siblings().find('input:checkbox'))) {
    document.getElementById(ele.id).checked = false
  }
  // close the display
  showDetailsFile();
}

function addDetailsForFile(ev) {
  var checked = false;
  for (var ele of $($(ev).siblings()).find('input:checkbox')) {
    if ($(ele).prop('checked')) {
      checked = true
      break
    }
  }
  /// if at least 1 checkbox is checked, then confirm with users
  if (checked) {
    bootbox.confirm({
      title: "Adding additional metadata for files",
      message: "If you check any checkboxes above, metadata will be modified for all files in the folder. Would you like to continue?",
      centerVertical: true,
      button: {
        ok: {
          label: 'Yes',
          className: 'btn-primary'
        }
      },
      callback: function(r) {
        if (r!==null && r === true) {
          updateFileDetails(ev);
          $("#button-confirm-display-details-file").html('Added')
        }
      }
    })
  } else {
      updateFileDetails(ev)
      $("#button-confirm-display-details-file").html('Added')
  }
}

function addNewRow(table) {
  var rowcount = document.getElementById(table).rows.length;
    /// append row to table from the bottom
  var rowIndex = rowcount;
  if (table==='doi-table') {
    $('.doi-table-row input').attr('contenteditable','false');
    $('.doi-table-row input').attr('readonly','readonly');
    $('.doi-helper-buttons').css('display', 'inline-flex');
    $('.doi-add-row-button').css('display', 'none');
    var row = document.getElementById(table).insertRow(rowIndex).outerHTML="<tr><td><input type='text' contenteditable='true'></input></td><td><div onclick='addNewRow(\"doi-table\")' class='ui right floated medium primary labeled icon button doi-add-row-button' style='display:block;font-size:14px;height:30px;padding-top:9px !important;background:dodgerblue'><i class='plus icon' style='padding:8px'></i>Add</div><div class='ui small basic icon buttons doi-helper-buttons' style='display:none'><button class='ui button'><i class='edit outline icon' style='color:var(--bs-table-active-color)'></i></button><button class='ui button'><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>";
  } else if (table === 'contributor-table') {
    $('.contributor-table-row input').attr('contenteditable','false');
    $('.contributor-table-row input').attr('readonly','readonly');
    $('#contributor-table .contributor-helper-buttons').css('display', 'inline-flex');
    $('#contributor-table .contributor-add-row-button').css('display', 'none');
    var row = document.getElementById(table).insertRow(rowIndex).outerHTML="<tr><td class='grab'><input type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true'></input></td><td><div onclick='addNewRow(\"contributor-table\")' class='ui right floated medium primary labeled icon button contributor-add-row-button' style='display:block;font-size:14px;height:30px;padding-top:9px !important;background:dodgerblue'><i class='plus icon' style='padding:8px'></i>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button'><i class='edit outline icon' style='color:var(--bs-table-active-color)'></i></button><button class='ui button'><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>";
  } else if (table === 'grant-table') {
    $('.grant-table-row input').attr('contenteditable','false');
    $('.grant-table-row input').attr('readonly','readonly');
    $('#grant-table .grant-helper-buttons').css('display', 'inline-flex');
    $('#grant-table .grant-add-row-button').css('display', 'none');
    var row = document.getElementById(table).insertRow(rowIndex).outerHTML="<tr><td class='grab'><input type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true'></input></td><td><div onclick='addNewRow(\"grant-table\")' class='ui right floated medium primary labeled icon button grant-add-row-button' style='display:block;font-size:14px;height:30px;padding-top:9px !important;background:dodgerblue'><i class='plus icon' style='padding:8px'></i>Add</div><div class='ui small basic icon buttons grant-helper-buttons' style='display:none'><button class='ui button'><i class='edit outline icon' style='color:var(--bs-table-active-color)'></i></button><button class='ui button'><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>";
  }
}
