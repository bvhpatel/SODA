const {ipcRenderer} = require('electron')

function showAddAirtableKey(){
  document.getElementById('div-add-airtable-key').style.display ='block';
  document.getElementById('div-add-new-grant').style.display ='none';
  document.getElementById('div-select-existing-grant').style.display ='none';
  // document.getElementById('para-save-award-info').innerHTML = ""
}

function showAddGrant(){
  document.getElementById('div-add-new-grant').style.display ='block';
  document.getElementById('div-add-airtable-key').style.display ='none';
  document.getElementById('div-select-existing-grant').style.display ='none';
  // document.getElementById('para-save-award-info').innerHTML = ""
}

function showSelectGrant(){
  document.getElementById('div-add-new-grant').style.display ='none';
  document.getElementById('div-add-airtable-key').style.display ='none';
  document.getElementById('div-select-existing-grant').style.display ='block';
  // document.getElementById('para-save-award-info').innerHTML = ""
}

document.querySelector('#connectAirtable').addEventListener('click', () => {
    showAddAirtableKey()
})

document.querySelector('#addGrant').addEventListener('click', () => {
    showAddGrant()
})

document.querySelector('#selectGrant').addEventListener('click', () => {
    showSelectGrant()
})

function showDSInfo(){
  document.getElementById('div-ds-dataset-info').style.display ='block';
  document.getElementById('div-ds-contributor-info').style.display ='none';
  document.getElementById('div-ds-misc-info').style.display ='none';
  document.getElementById('div-ds-optional-info').style.display ='none';
  document.getElementById('para-save-award-info').innerHTML = ""
}
function showContributorInfo(){
  document.getElementById('div-ds-dataset-info').style.display ='none';
  document.getElementById('div-ds-contributor-info').style.display ='block';
  document.getElementById('div-ds-misc-info').style.display ='none';
  document.getElementById('div-ds-optional-info').style.display ='none';
  document.getElementById('para-save-award-info').innerHTML = ""
}
function showMiscInfo(){
  document.getElementById('div-ds-dataset-info').style.display ='none';
  document.getElementById('div-ds-contributor-info').style.display ='none';
  document.getElementById('div-ds-misc-info').style.display ='block';
  document.getElementById('div-ds-optional-info').style.display ='none';
  document.getElementById('para-save-award-info').innerHTML = ""
}
function showOptionalInfo(){
  document.getElementById('div-ds-dataset-info').style.display ='none';
  document.getElementById('div-ds-contributor-info').style.display ='none';
  document.getElementById('div-ds-misc-info').style.display ='none';
  document.getElementById('div-ds-optional-info').style.display ='block';
  document.getElementById('para-save-award-info').innerHTML = ""
}

function removeClasses(elemSet, className) {
  elemSet.forEach(elem => {
    elem.classList.remove(className);
  });
};
var domStrings = {dataset: [document.getElementById('ds-name'), document.getElementById('ds-description'),
                            document.getElementById('ds-keywords'),document.getElementById('ds-samples-no'),
                            document.getElementById('ds-subjects-no')],
                  optional: [document.getElementById("input-completeness"),document.getElementById("input-parent-ds"),
                            document.getElementById('input-completeds-title')]
                  }
//// check if all fields have been filled
function checkFields(div, fieldArray) {
  var empty = false
  for (let field of fieldArray) {
    if (field.value.length===0 || field.value==="Select") {
      empty = true
      break
    }
  }
  if (!empty) {
    document.getElementById(div).className = 'multisteps-form__progress-btn js-active2';
  }
}

/// check if at least one contributor is added
function checkFieldsContributors() {
  var div = 'ds-contributor-info';
  var award = document.getElementById('ds-description-award-list').options[document.getElementById('ds-description-award-list').selectedIndex]
  var acknowledgment = document.getElementById("ds-description-acknowlegdment")
  var tableCurrentCon = document.getElementById("table-current-contributors")
  var empty = false
  /// check for empty acknowlegdment box (value.length===1, and not 0 for some reason)
  if (acknowledgment.value.length === 1 || award.value==="Select") {
    empty = true
  }
  if (!empty && tableCurrentCon.rows.length>1) {
    document.getElementById(div).className = 'multisteps-form__progress-btn js-active2';
  }
}

/// check if other info section is all populated
function checkOtherInfoFields() {
  var div = 'ds-misc-info';
  var originatingDOI = document.getElementById('input-misc-DOI').value.length
  var protocolDOI = document.getElementById("input-misc-protocol").value.length
  var tableCurrentLinks = document.getElementById("table-addl-links")
  if ((originatingDOI>1) && (protocolDOI>1) && (tableCurrentLinks.rows.length>1)) {
    document.getElementById(div).className = 'multisteps-form__progress-btn js-active2';
  }
}
document.querySelector('#ds-dataset-info').addEventListener('click', () => {
    showDSInfo();
    removeClasses(document.querySelectorAll(`.multisteps-form__progress-btn`), 'js-active1');
    document.querySelector('#ds-dataset-info').classList.add('js-active1')
})

document.querySelector('#ds-contributor-info').addEventListener('click', () => {
    showContributorInfo()
    removeClasses(document.querySelectorAll(`.multisteps-form__progress-btn`), 'js-active1');
    document.querySelector('#ds-contributor-info').classList.add('js-active1')
})
document.querySelector('#ds-misc-info').addEventListener('click', () => {
    showMiscInfo()
    removeClasses(document.querySelectorAll(`.multisteps-form__progress-btn`), 'js-active1');
    document.querySelector('#ds-misc-info').classList.add('js-active1')
})
document.querySelector('#ds-optional-info').addEventListener('click', () => {
    showOptionalInfo()
    removeClasses(document.querySelectorAll(`.multisteps-form__progress-btn`), 'js-active1');
    document.querySelector('#ds-optional-info').classList.add('js-active1')
})

///prev buttons
document.querySelector('#button-prev-contributor-ds').addEventListener('click', () => {
    document.querySelector('#ds-dataset-info').click()
    checkFieldsContributors()
})
document.querySelector('#button-prev-misc-contributor').addEventListener('click', () => {
    document.querySelector('#ds-contributor-info').click()
    checkOtherInfoFields()
})
document.querySelector('#button-prev-optional-misc').addEventListener('click', () => {
    document.querySelector('#ds-misc-info').click()
    checkFields("ds-optional-info", domStrings.optional)
})

//next buttons
document.querySelector('#button-next-ds-contributor').addEventListener('click', () => {
    document.querySelector('#ds-contributor-info').click();
    checkFields("ds-dataset-info", domStrings.dataset)
})
document.querySelector('#button-next-contributor-misc').addEventListener('click', () => {
    document.querySelector('#ds-misc-info').click();
    checkFieldsContributors()
})
document.querySelector('#button-next-misc-optional').addEventListener('click', () => {
    document.querySelector('#ds-optional-info').click();
    checkOtherInfoFields()
})
