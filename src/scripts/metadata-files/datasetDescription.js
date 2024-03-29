// Prepare Dataset Description File
const dsAwardArray = document.getElementById("ds-description-award-list");
const dsContributorArrayLast1 = document.getElementById(
  "ds-description-contributor-list-last-1"
);
const dsContributorArrayFirst1 = document.getElementById(
  "ds-description-contributor-list-first-1"
);

var currentContributorsLastNames = [];
var currentContributorsFirstNames = [];
var globalContributorNameObject = {};

// const affiliationInput = document.getElementById("input-con-affiliation-1");
const addCurrentContributorsBtn = document.getElementById(
  "button-ds-add-contributor"
);
const contactPerson = document.getElementById("ds-contact-person");
const currentConTable = document.getElementById("table-current-contributors");
const generateDSBtn = document.getElementById("button-generate-ds-description");
const addAdditionalLinkBtn = document.getElementById("button-ds-add-link");
const datasetDescriptionFileDataset = document.getElementById("ds-name");
const parentDSDropdown = document.getElementById("input-parent-ds");

// Main function to check Airtable status upon loading soda
///// config and load live data from Airtable
var sparcAwards = [];
var airtableRes = [];

$(document).ready(function () {
  $("#add-other-contributors").on("click", function () {
    if ($(this).text() == "Add contributors not listed above") {
      addOtherContributors("table-current-contributors");
      $(this).text("Cancel manual typing");
    } else {
      cancelOtherContributors("table-current-contributors");
      $(this).text("Add contributors not listed above");
    }
  });
  ipcRenderer.on(
    "selected-metadata-ds-description",
    (event, dirpath, filename) => {
      if (dirpath.length > 0) {
        // $("#generate-dd-spinner").show();
        var destinationPath = path.join(dirpath[0], filename);
        if (fs.existsSync(destinationPath)) {
          var emessage =
            "File '" +
            filename +
            "' already exists in " +
            dirpath[0] +
            ". Do you want to replace it?";
          Swal.fire({
            icon: "warning",
            title: "Metadata file already exists",
            text: `${emessage}`,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            showConfirmButton: true,
            showCancelButton: true,
            cancelButtonText: "No",
            confirmButtonText: "Yes",
          }).then((result) => {
            if (result.isConfirmed) {
              generateDDFile(dirpath, destinationPath);
            }
          });
        } else {
          Swal.fire({
            title: "Generating the dataset_description.xlsx file",
            html: "Please wait...",
            allowEscapeKey: false,
            allowOutsideClick: false,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            timerProgressBar: false,
            didOpen: () => {
              Swal.showLoading();
            },
          }).then((result) => {});
          generateDDFile(dirpath, destinationPath);
        }
      }
    }
  );
  checkAirtableStatus("");
  ipcRenderer.on("show-missing-items-ds-description", (event, index) => {
    if (index === 0) {
      ipcRenderer.send(
        "open-folder-dialog-save-ds-description",
        "dataset_description.xlsx"
      );
    }
  });

  $(".prepare-dd-cards").click(function () {
    $("create_dataset_description-tab").removeClass("show");
    var target = $(this).attr("data-next");
    $("#" + target).toggleClass("show");
    document.getElementById("prevBtn").style.display = "none";
  });
});

function checkAirtableStatus(keyword) {
  var airKeyContent = parseJson(airtableConfigPath);
  if (Object.keys(airKeyContent).length === 0) {
    airtableRes = [false, ""];
    $("#current-airtable-account").html("None");
    return airtableRes;
  } else {
    var airKeyInput = airKeyContent["api-key"];
    var airKeyName = airKeyContent["key-name"];
    if (airKeyInput !== "" && airKeyName !== "") {
      Airtable.configure({
        endpointUrl: "https://" + airtableHostname,
        apiKey: airKeyInput,
      });
      var base = Airtable.base("appiYd1Tz9Sv857GZ");
      base("sparc_members")
        .select({
          view: "All members (ungrouped)",
        })
        .eachPage(
          function page(records, fetchNextPage) {
            records.forEach(function (record) {
              if (record.get("Project_title") !== undefined) {
                item = record
                  .get("SPARC_Award_#")
                  .concat(" (", record.get("Project_title"), ")");
                sparcAwards.push(item);
              }
            }),
              fetchNextPage();
          },
          function done(err) {
            if (err) {
              log.error(err);
              console.log(err);
              $("#current-airtable-account").html("None");
              airtableRes = [false, ""];
              return airtableRes;
            } else {
              $("#current-airtable-account").text(airKeyName);
              var awardSet = new Set(sparcAwards);
              var resultArray = [...awardSet];
              airtableRes = [true, airKeyName];
              if (keyword === "dd") {
                helpSPARCAward("dd");
              }
              return airtableRes;
            }
          }
        );
    } else {
      $("#current-airtable-account").text(airKeyName);
      airtableRes = [true, airKeyName];
      return airtableRes;
    }
  }
}

/* The below function is needed because
  when users add a row and then delete it, the ID for such row is deleted (row-name-2),
  but the row count for the table (used for naming row ID) is changed and that messes up the naming and ID retrieval process
*/
function checkForUniqueRowID(rowID, no) {
  if ($("#" + rowID + no.toString()).length == 0) {
    return no;
  } else {
    no = no + 1;
    return checkForUniqueRowID(rowID, no);
  }
}

function populateProtocolLink(ev) {
  if ($(ev).val() === "Protocol URL or DOI*") {
    // display dropdown to select protocol titles
    if ($("#select-misc-links").length > 0) {
      $("#select-misc-links").css("display", "block");
    } else {
      var divElement =
        '<select id="select-misc-links" class="form-container-input-bf" style="font-size:13px; line-height:2;margin-top: 20px" onchange="autoPopulateProtocolLink(this, \'\', \'dd\')"></select>';
      $($(ev).parents()[0]).append(divElement);
      // populate dropdown with protocolResearcherList
      removeOptions(document.getElementById("select-misc-links"));
      addOption(
        document.getElementById("select-misc-links"),
        "Select protocol title",
        "Select"
      );
      for (var key of Object.keys(protocolResearcherList)) {
        $("#select-misc-links").append(
          '<option value="' +
            protocolResearcherList[key] +
            '">' +
            key +
            "</option>"
        );
      }
    }
  } else {
    if ($("#select-misc-links").length > 0) {
      $("#select-misc-links").css("display", "none");
    }
  }
}

// check for duplicates in names of contributors
function checkContributorNameDuplicates(table, currentRow) {
  var duplicate = false;
  var currentConLastName = $("#" + currentRow.cells[0].children[0].id).val();
  var currentConFirstName = $("#" + currentRow.cells[1].children[0].id).val();
  var rowcount = document.getElementById(table).rows.length;
  for (var i = 1; i < rowcount - 1; i++) {
    if (
      $(
        "#" + document.getElementById(table).rows[i].cells[0].children[0].id
      ).val() === currentConLastName &&
      $(
        "#" + document.getElementById(table).rows[i].cells[1].children[0].id
      ).val() === currentConFirstName
    ) {
      duplicate = true;
      break;
    }
  }
  return duplicate;
}

// clone Last names of contributors (from a global Airtable Contributor array) to subsequent selects so we don't have to keep calling Airtable API
function cloneConNamesSelect(selectLast) {
  removeOptions(document.getElementById(selectLast));
  addOption(document.getElementById(selectLast), "Select an option", "Select");
  for (var i = 0; i < currentContributorsLastNames.length; i++) {
    var opt = currentContributorsLastNames[i];
    if (document.getElementById(selectLast)) {
      addOption(document.getElementById(selectLast), opt, opt);
    }
  }
}

// the below 2 functions initialize Tagify for each input field for a new added row (Role and Affiliation)
function createConsRoleTagify(inputField) {
  var input = document.getElementById(inputField);
  // initialize Tagify on the above input node reference
  var tagify = new Tagify(input, {
    whitelist: [
      "PrincipleInvestigator",
      "Creator",
      "CoInvestigator",
      "DataCollector",
      "DataCurator",
      "DataManager",
      "Distributor",
      "Editor",
      "Producer",
      "ProjectLeader",
      "ProjectManager",
      "ProjectMember",
      "RelatedPerson",
      "Researcher",
      "ResearchGroup",
      "Sponsor",
      "Supervisor",
      "WorkPackageLeader",
      "Other",
    ],
    enforceWhitelist: true,
    dropdown: {
      enabled: 1,
      closeOnSelect: true,
    },
  });
}

function createConsAffliationTagify(inputField) {
  var input = document.getElementById(inputField);
  var tagify = new Tagify(input, {
    dropdown: {
      classname: "color-blue",
      enabled: 0, // show the dropdown immediately on focus
      maxItems: 25,
      closeOnSelect: true, // keep the dropdown open after selecting a suggestion
    },
    duplicates: false,
  });
}

function cancelOtherContributors(table) {
  var rowcount = document.getElementById(table).rows.length;
  var rowIndex = rowcount - 1;
  var currentRow =
    document.getElementById(table).rows[
      document.getElementById(table).rows.length - 1
    ];
  currentRow.cells[0].outerHTML =
    "<td class='grab'><select id='ds-description-contributor-list-last-" +
    rowIndex +
    "' onchange='onchangeLastNames(" +
    rowIndex +
    ")' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td>";
  currentRow.cells[1].outerHTML =
    "<td class='grab'><select disabled id='ds-description-contributor-list-first-" +
    rowIndex +
    "' onchange='onchangeFirstNames(" +
    rowIndex +
    ")' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td>";
  cloneConNamesSelect(
    "ds-description-contributor-list-last-" + rowIndex.toString()
  );
}

function addOtherContributors(table) {
  var rowcount = document.getElementById(table).rows.length;
  var rowIndex = rowcount;
  var currentRow =
    document.getElementById(table).rows[
      document.getElementById(table).rows.length - 1
    ];
  currentRow.cells[0].outerHTML =
    "<td><input type='text' placeholder='Type here' contenteditable='true' id='other-contributors-last-" +
    rowIndex +
    "'></input></td>";
  currentRow.cells[1].outerHTML =
    "<td><input type='text' placeholder='Type here' contenteditable='true' id='other-contributors-first-" +
    rowIndex +
    "'></input></td>";
  createConsRoleTagify("input-con-role-" + currentRow.rowIndex.toString());
  createConsAffliationTagify(
    "input-con-affiliation-" + currentRow.rowIndex.toString()
  );
}

function convertDropdownToTextBox(dropdown) {
  if (document.getElementById(dropdown)) {
    $($("#" + dropdown).parents()[1]).css("display", "none");
    if (dropdown == "ds-description-award-list") {
      $("#SPARC-Award-raw-input-div-dd").css("display", "flex");
    }
  }
}

/* The functions ddNoAirtableMode() and resetDDUI() is needed to track when Airtable connection status is changed within
  a SODA session -> SODA will accordingly update what to show under Submission and DD files
*/

function ddNoAirtableMode(action) {
  if (action == "On") {
    noAirtable = true;
    $("#add-other-contributors").css("display", "none");
    convertDropdownToTextBox("ds-description-award-list");
    convertDropdownToTextBox("ds-description-contributor-list-last-1");
    convertDropdownToTextBox("ds-description-contributor-list-first-1");
    $("#table-current-contributors").find("tr").slice(1).remove();
    rowIndex = 1;
    newRowIndex = 1;
    var row = (document
      .getElementById("table-current-contributors")
      .insertRow(rowIndex).outerHTML =
      "<tr id='row-current-name" +
      newRowIndex +
      "'><td class='grab'><input id='ds-description-raw-contributor-list-last-" +
      newRowIndex +
      "' class='form-container-input-bf' type='text'></input></td><td class='grab'><input id='ds-description-raw-contributor-list-first-" +
      newRowIndex +
      "' type='text' class='form-container-input-bf'></input></td><td class='grab'><input type='text' id='input-con-ID-" +
      newRowIndex +
      "' contenteditable='true'></input></td><td class='grab'><input id='input-con-affiliation-" +
      newRowIndex +
      "' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-" +
      newRowIndex +
      "'></input></td><td class='grab'><label class='switch'><input onclick='onChangeContactLabel(" +
      newRowIndex +
      ")' id='ds-contact-person-" +
      newRowIndex +
      "' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
      newRowIndex +
      ")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
    createConsRoleTagify("input-con-role-" + newRowIndex.toString());
    createConsAffliationTagify(
      "input-con-affiliation-" + newRowIndex.toString()
    );
  } else if (action == "Off") {
    noAirtable = false;
    resetDDUI("table-current-contributors");
    loadAwards();
  }
}

// resetting the dataset_description file
function resetDDUI(table) {
  var rowcount = document.getElementById(table).rows.length;
  var rowIndex = rowcount - 1;
  var currentRow =
    document.getElementById(table).rows[
      document.getElementById(table).rows.length - 1
    ];

  $("#SPARC-Award-raw-input-div-dd").css("display", "none");
  $("#dd-description-raw-contributor-list-last-1").css("display", "none");
  $("#ds-description-contributor-list-last-1").remove();
  $("#ds-description-contributor-list-first-1").remove();
  $("#dd-description-raw-contributor-list-first-1").css("display", "none");
  $($("#ds-description-award-list").parents()[1]).css("display", "flex");
  $("#add-other-contributors").css("display", "block");
  $("#add-other-contributors").text("Add contributors not listed above");
  $("#table-current-contributors").find("tr").slice(1).remove();

  rowIndex = 1;
  newRowIndex = 1;
  var row = (document.getElementById(table).insertRow(rowIndex).outerHTML =
    "<tr id='row-current-name" +
    newRowIndex +
    "'><td class='grab'><select id='ds-description-contributor-list-last-" +
    newRowIndex +
    "' onchange='onchangeLastNames(" +
    newRowIndex +
    ")' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td><td class='grab'><select disabled id='ds-description-contributor-list-first-" +
    newRowIndex +
    "' onchange='onchangeFirstNames(" +
    newRowIndex +
    ")'  class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td><td class='grab'><input type='text' id='input-con-ID-" +
    newRowIndex +
    "' contenteditable='true'></input></td><td class='grab'><input id='input-con-affiliation-" +
    newRowIndex +
    "' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-" +
    newRowIndex +
    "'></input></td><td class='grab'><label class='switch'><input onclick='onChangeContactLabel(" +
    newRowIndex +
    ")' id='ds-contact-person-" +
    newRowIndex +
    "' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
    newRowIndex +
    ")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
  changeAwardInputDsDescription();
  cloneConNamesSelect(
    "ds-description-contributor-list-last-" + rowIndex.toString()
  );
}

// check if the
function checkEmptyConRowInfo(table, row) {
  var empty = false;
  var type = ["select", "input"];
  for (var i = 0; i < row.cells.length - 2; i++) {
    if (row.cells[i].style.display !== "none") {
      var cell = $(row.cells[i]);
      for (var item of type) {
        if ($(cell).find(item).length > 0) {
          if (
            $(cell).find(item).val() == "" ||
            $(cell).find(item).val() == "Select an option" ||
            $(cell).find(item).val() == "Select"
          ) {
            empty = true;
            $(cell).find(item).addClass("invalid");
            if ($(cell).find("tags").length > 0) {
              $(cell).find("tags").addClass("invalid");
            }
          } else {
            $(cell).find(item).removeClass("invalid");
            if ($(cell).find("tags").length > 0) {
              $(cell).find("tags").removeClass("invalid");
            }
          }
        }
      }
    }
  }
  return empty;
}

function resetDD() {
  Swal.fire({
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "I want to start over!",
    focusCancel: true,
    heightAuto: false,
    icon: "warning",
    reverseButtons: reverseSwalButtons,
    showCancelButton: true,
    text: "Are you sure you want to start over and reset your progress?",
    showClass: {
      popup: "animate__animated animate__zoomIn animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__zoomOut animate__faster",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. remove Prev and Show from all individual-question except for the first one
      // 2. empty all input, textarea, select, para-elements
      $("#Question-prepare-dd-1").removeClass("prev");
      $("#Question-prepare-dd-1").nextAll().removeClass("show");
      $("#Question-prepare-dd-1").nextAll().removeClass("prev");
      $("#Question-prepare-dd-1 .option-card")
        .removeClass("checked")
        .removeClass("disabled")
        .removeClass("non-selected");
      $("#Question-prepare-dd-1 .option-card .folder-input-check").prop(
        "checked",
        false
      );

      // 1. empty all input, textarea, select, para-elements
      // 2. delete all rows from table Contributor
      // 3. delete all rows from table Links
      var inputFields = $("#Question-prepare-dd-2").find("input");
      var textAreaFields = $("#Question-prepare-dd-2").find("textarea");

      for (var field of inputFields) {
        $(field).val("");
      }
      for (var field of textAreaFields) {
        $(field).val("");
      }

      keywordTagify.removeAllTags();
      otherFundingTagify.removeAllTags();
      parentDSTagify.removeAllTags();
      completenessTagify.removeAllTags();

      $("#input-metadata-ver").val("1.2.3");

      // 3. deleting table rows
      globalContributorNameObject = {};
      currentContributorsLastNames = [];
      contributorObject = [];
      $("#contributor-table-dd tr:gt(0)").remove();
      $("#protocol-link-table-dd tr:gt(0)").remove();
      $("#additional-link-table-dd tr:gt(0)").remove();

      $("#div-contributor-table-dd").css("display", "none");
      document.getElementById("protocol-link-table-dd").style.display = "none";
      document.getElementById("additional-link-table-dd").style.display =
        "none";
    }
  });
}

/////////////// Generate ds description file ///////////////////
////////////////////////////////////////////////////////////////
generateDSBtn.addEventListener("click", (event) => {
  var funding = $("#ds-description-award-input").val().trim();
  var allFieldsSatisfied = detectEmptyRequiredFields(funding)[0];
  var errorMessage = detectEmptyRequiredFields(funding)[1];

  /// raise a warning if empty required fields are found
  if (allFieldsSatisfied === false) {
    var textErrorMessage = "";
    for (var i = 0; i < errorMessage.length; i++) {
      textErrorMessage += errorMessage[i] + "<br>";
    }
    var messageMissingFields = `<div>The following mandatory item(s) is/are missing:<br> ${textErrorMessage} <br>Would you still like to generate the dataset description file?</div>`;
    Swal.fire({
      icon: "warning",
      html: messageMissingFields,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      reverseButtons: reverseSwalButtons,
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        ipcRenderer.send(
          "open-folder-dialog-save-ds-description",
          "dataset_description.xlsx"
        );
      }
    });
  } else {
    ipcRenderer.send(
      "open-folder-dialog-save-ds-description",
      "dataset_description.xlsx"
    );
  }
});

function generateDDFile(fullpath, destinationPath) {
  var datasetInfoValueArray = grabDSInfoEntries();

  //// process obtained values to pass to an array ///
  ///////////////////////////////////////////////////
  var keywordVal = [];
  for (var i = 0; i < datasetInfoValueArray["keywords"].length; i++) {
    keywordVal.push(datasetInfoValueArray["keywords"][i].value);
  }
  /// replace keywordArray with keywordVal array
  datasetInfoValueArray["keywords"] = keywordVal;

  //// push to all ds info values to dsSectionArray
  var dsSectionArray = [];
  for (let elementDS in datasetInfoValueArray) {
    dsSectionArray.push(datasetInfoValueArray[elementDS]);
  }
  //// grab entries from contributor info section and pass values to conSectionArray
  var contributorObj = grabConInfoEntries();
  /// grab entries from other misc info section
  var miscObj = combineLinksSections();

  /// grab entries from other optional info section
  var completenessSectionObj = grabCompletenessInfo();

  ///////////// stringify JSON objects //////////////////////
  json_str_ds = JSON.stringify(dsSectionArray);
  json_str_misc = JSON.stringify(miscObj);
  json_str_completeness = JSON.stringify(completenessSectionObj);
  json_str_con = JSON.stringify(contributorObj);

  /// get current, selected Pennsieve account
  var bfaccountname = $("#current-bf-account").text();

  /// call python function to save file
  if (fullpath != null) {
    client.invoke(
      "api_save_ds_description_file",
      bfaccountname,
      destinationPath,
      json_str_ds,
      json_str_misc,
      json_str_completeness,
      json_str_con,
      (error, res) => {
        if (error) {
          var emessage = userError(error);
          log.error(error);
          console.error(error);
          Swal.fire({
            title: "Failed to generate the dataset_description file.",
            text: emessage,
            icon: "error",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
          ipcRenderer.send(
            "track-event",
            "Error",
            "Prepare Metadata - Create dataset_description",
            defaultBfDataset
          );
        } else {
          Swal.fire({
            title:
              "The dataset_description.xlsx file has been successfully generated at the specified location.",
            icon: "success",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
          ipcRenderer.send(
            "track-event",
            "Success",
            "Prepare Metadata - Create dataset_description",
            defaultBfDataset
          );
        }
      }
    );
  }
}

///// Functions to grab each piece of info to generate the dd file

// dataset info
function grabDSInfoEntries() {
  var name = document.getElementById("ds-name").value;
  var description = document.getElementById("ds-description").value;
  var keywordArray = keywordTagify.value;
  var samplesNo = document.getElementById("ds-samples-no").value;
  var subjectsNo = document.getElementById("ds-subjects-no").value;

  return {
    name: name,
    description: description,
    keywords: keywordArray,
    "number of samples": samplesNo,
    "number of subjects": subjectsNo,
  };
}

// contributor info
function grabConInfoEntries() {
  var funding = $("#ds-description-award-input").val();
  var acknowledgment = $("#ds-description-acknowledgments").val();

  var fundingArray = [];
  if (funding === "") {
    fundingArray = [""];
  } else {
    fundingArray = [funding];
  }
  /// other funding sources
  var otherFunding = otherFundingTagify.value;
  for (var i = 0; i < otherFunding.length; i++) {
    fundingArray.push(otherFunding[i].value);
  }

  var contributorInfo = {};

  contributorInfo["funding"] = fundingArray;
  contributorInfo["acknowledgment"] = acknowledgment;
  contributorInfo["contributors"] = contributorObject;
  return contributorInfo;
}

function grabAdditionalLinkSection() {
  var table = document.getElementById("additional-link-table-dd");
  var rowcountLink = table.rows.length;
  var originatingDOIArray = [];
  var additionalLinkArray = [];
  for (i = 1; i < rowcountLink; i++) {
    var linkType = table.rows[i].cells[1].innerText;
    var link = table.rows[i].cells[2].innerText;
    if (linkType === "Originating Article DOI") {
      originatingDOIArray.push(link);
    } else if (linkType === "Additional Link") {
      var linkObject = {
        link: link,
        description: table.rows[i].cells[3].innerText,
      };
      additionalLinkArray.push(linkObject);
    }
  }
  return [originatingDOIArray, additionalLinkArray];
}

function grabProtocolSection() {
  var table = document.getElementById("protocol-link-table-dd");
  var rowcountLink = table.rows.length;
  var protocolLinkInfo = [];
  for (i = 1; i < rowcountLink; i++) {
    var protocolLink = table.rows[i].cells[1].innerText;
    protocolLinkInfo.push(protocolLink);
  }
  return protocolLinkInfo;
}

function combineLinksSections() {
  var protocolLinks = grabProtocolSection();
  var otherLinks = grabAdditionalLinkSection();
  var miscObj = {};
  miscObj["Originating Article DOI"] = otherLinks[0];
  miscObj["Protocol URL or DOI*"] = protocolLinks;
  miscObj["Additional Link"] = otherLinks[1];
  return miscObj;
}

// completeness info
function grabCompletenessInfo() {
  var completeness = completenessTagify.value;
  var parentDS = parentDSTagify.value;
  var completeDSTitle = document.getElementById("input-completeds-title").value;
  var optionalSectionObj = {};
  var completenessValueArray = [];
  for (var i = 0; i < completeness.length; i++) {
    completenessValueArray.push(completeness[i].value);
  }
  optionalSectionObj["completeness"] = completenessValueArray.join(", ");

  var parentDSValueArray = [];
  for (var i = 0; i < parentDS.length; i++) {
    parentDSValueArray.push(parentDS[i].value);
  }
  optionalSectionObj["parentDS"] = parentDSValueArray;

  if (completeDSTitle.length === 0) {
    optionalSectionObj["completeDSTitle"] = "";
  } else {
    optionalSectionObj["completeDSTitle"] = completeDSTitle;
  }
  return optionalSectionObj;
}

// add protocol function for DD file
async function addProtocol() {
  const { value: values } = await Swal.fire({
    title: "Add a protocol",
    html: '<label>Protocol URL: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one "Protocol URLs or DOIs" link is mandatory."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-protocol-link" class="swal2-input" placeholder="Enter a URL">',
    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      var link = $("#DD-protocol-link").val();
      if (link === "") {
        Swal.showValidationMessage(`Please enter a link!`);
      }
      if (checkDuplicateLink(link, "protocol-link-table-dd")) {
        Swal.showValidationMessage(
          "The link provided is already added to the table. Please provide a different protocol."
        );
      }
      return [$("#DD-protocol-link").val()];
    },
  });
  if (values) {
    addProtocolLinktoTableDD(values[0]);
  }
}

function addExistingProtocol() {
  var credentials = loadExistingProtocolInfo();
  if (credentials[0]) {
    // show email for protocol account
    showProtocolCredentials(credentials[1], "DD");
  } else {
    protocolAccountQuestion("DD", false);
  }
}

function addProtocolLinktoTableDD(protocolLink) {
  var protocolTable = document.getElementById("protocol-link-table-dd");
  protocolTable.style.display = "block";
  var rowcount = protocolTable.rows.length;
  /// append row to table from the bottom
  var rowIndex = rowcount;
  var currentRow = protocolTable.rows[protocolTable.rows.length];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  var newRowIndex = checkForUniqueRowID("row-current-protocol", rowIndex);
  var indexNumber = rowIndex;
  var row = (protocolTable.insertRow(rowIndex).outerHTML =
    "<tr id='row-current-protocol" +
    newRowIndex +
    "' class='row-protocol'><td class='contributor-table-row'>" +
    indexNumber +
    "</td><td><a href='" +
    protocolLink +
    "' target='_blank'>" +
    protocolLink +
    "</a></td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='edit_current_protocol_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='delete_current_protocol_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
}

function addAdditionalLinktoTableDD(linkType, link, description) {
  var linkTable = document.getElementById("additional-link-table-dd");
  linkTable.style.display = "block";
  var rowcount = linkTable.rows.length;
  /// append row to table from the bottom
  var rowIndex = rowcount;
  var currentRow = linkTable.rows[linkTable.rows.length];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  var newRowIndex = checkForUniqueRowID(
    "row-current-additional-link",
    rowIndex
  );
  var indexNumber = rowIndex;
  var row = (linkTable.insertRow(rowIndex).outerHTML =
    "<tr id='row-current-additional-link" +
    newRowIndex +
    "' class='row-protocol'><td class='contributor-table-row'>" +
    indexNumber +
    "</td><td>" +
    linkType +
    "</td><td><a href='" +
    link +
    "' target='_blank'>" +
    link +
    "</a></td><td class='contributor-table-row' style='display:none'>" +
    description +
    "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='edit_current_additional_link_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='delete_current_additional_link_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
}

async function helpSPARCAward(filetype) {
  var award = "";
  if (filetype === "dd") {
    var res = airtableRes;
    $("#select-sparc-award-dd-spinner").css("display", "block");
    if (res[0]) {
      var keyname = res[1];
      var htmlEle = `<div><h2>Airtable information: </h2><h4 style="text-align:left;display:flex; flex-direction: row; justify-content: space-between">Airtable keyname: <span id="span-airtable-keyname" style="font-weight:500; text-align:left">${keyname}</span><span style="width: 40%; text-align:right"><a onclick="showAddAirtableAccountSweetalert(\'dd\')" style="font-weight:500;text-decoration: underline">Change</a></span></h4><h4 style="text-align:left">Select your award: </h4><div
        class="search-select-box"><select id="select-SPARC-award" class="w-100" data-live-search="true"style="width: 450px;border-radius: 7px;padding: 8px;"data-none-selected-text="Loading awards..."></select></div></div>`;
      const { value: awardVal } = await Swal.fire({
        html: htmlEle,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        inputPlaceholder: "Select an award",
        showCancelButton: true,
        confirmButtonText: "Confirm",
        didOpen: () => {
          $("#select-sparc-award-dd-spinner").css("display", "none");
          populateSelectSPARCAward(awardObj, "select-SPARC-award");
          $("#select-SPARC-award").selectpicker();
          $("#bf_list_users_pi").selectpicker("refresh");
        },
        preConfirm: () => {
          if ($("#select-SPARC-award").val() === "Select") {
            Swal.showValidationMessage("Please select an award.");
          } else {
            award = $("#select-SPARC-award").val();
          }
        },
      });
      if (awardVal) {
        if (contributorObject.length !== 0) {
          Swal.fire({
            title:
              "Are you sure you want to delete all of the previous contributor information?",
            showCancelButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            cancelButtonText: `No!`,
            cancelButtonColor: "#f44336",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Yes",
          }).then((boolean) => {
            if (boolean.isConfirmed) {
              changeAward(award);
            }
          });
        } else {
          changeAward(award);
        }
      }
    } else {
      Swal.fire({
        title:
          "At this moment, SODA is not connected with your Airtable account.",
        text: "Would you like to connect your Airtable account with SODA?",
        showCancelButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        cancelButtonText: `No!`,
        cancelButtonColor: "#f44336",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Yes",
      }).then((boolean) => {
        if (boolean.isConfirmed) {
          showAddAirtableAccountSweetalert("dd");
        }
      });
      $("#select-sparc-award-dd-spinner").css("display", "none");
    }
  } else {
    var res = airtableRes;
    $("#select-sparc-award-submission-spinner").css("display", "block");
    if (res[0]) {
      var keyname = res[1];
      var htmlEle = `<div><h2>Airtable information: </h2><h4 style="text-align:left;display:flex; flex-direction: row; justify-content: space-between">Airtable keyname: <span id="span-airtable-keyname" style="font-weight:500; text-align:left">${keyname}</span><span style="width: 40%; text-align:right"><a onclick="showAddAirtableAccountSweetalert(\'submission\')" style="font-weight:500;text-decoration: underline">Change</a></span></h4><h4 style="text-align:left">Select your award: </h4><div
        class="search-select-box"><select id="select-SPARC-award-submission" class="w-100" data-live-search="true"style="width: 450px;border-radius: 7px;padding: 8px;"data-none-selected-text="Loading awards..."></select></div></div>`;
      const { value: awardVal } = await Swal.fire({
        html: htmlEle,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        inputPlaceholder: "Select an award",
        showCancelButton: true,
        confirmButtonText: "Confirm",
        didOpen: () => {
          $("#select-sparc-award-submission-spinner").css("display", "none");
          populateSelectSPARCAward(awardObj, "select-SPARC-award-submission");
          $("#select-SPARC-award-submission").selectpicker();
          $("#bf_list_users_pi").selectpicker("refresh");
        },
        preConfirm: () => {
          if ($("#select-SPARC-award-submission").val() === "Select") {
            Swal.showValidationMessage("Please select an award.");
          } else {
            award = $("#select-SPARC-award-submission").val();
          }
        },
      });
      if (awardVal) {
        if ($("#selected-milestone-1").val() !== "") {
          Swal.fire({
            title:
              "Are you sure you want to delete all of the previous milestone information?",
            showCancelButton: true,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            cancelButtonText: `No!`,
            cancelButtonColor: "#f44336",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Yes",
          }).then((boolean) => {
            if (boolean.isConfirmed) {
              milestoneTagify1.removeAllTags();
              $("#submission-sparc-award").val(award);
              $("#ds-description-award-input").val(award);
              loadContributorInfofromAirtable(award);
            }
          });
        } else {
          milestoneTagify1.removeAllTags();
          $("#submission-sparc-award").val(award);
          $("#ds-description-award-input").val(award);
          loadContributorInfofromAirtable(award);
        }
      }
    } else {
      Swal.fire({
        title:
          "At this moment, SODA is not connected with your Airtable account.",
        text: "Would you like to connect your Airtable account with SODA?",
        showCancelButton: true,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        cancelButtonText: `No!`,
        cancelButtonColor: "#f44336",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Yes",
      }).then((boolean) => {
        if (boolean.isConfirmed) {
          showAddAirtableAccountSweetalert("submission");
        }
      });
      $("#select-sparc-award-submission-spinner").css("display", "none");
    }
  }
}

function populateSelectSPARCAward(object, id) {
  removeOptions(document.getElementById(id));
  addOption(document.getElementById(id), "Select an award", "Select");
  for (var award of Object.keys(object)) {
    addOption(document.getElementById(id), object[award], award);
  }
}

function changeAward(award) {
  Swal.fire({
    title: "Loading your award and contributor information.",
    html: "Please wait...",
    timer: 3000,
    allowEscapeKey: false,
    allowOutsideClick: false,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: false,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});
  $("#ds-description-award-input").val(award);
  $("#submission-sparc-award").val(award);
  loadContributorInfofromAirtable(award);
}

function loadContributorInfofromAirtable(award) {
  globalContributorNameObject = {};
  currentContributorsLastNames = [];
  $("#contributor-table-dd tr:gt(0)").remove();
  $("#div-contributor-table-dd").css("display", "none");
  contributorObject = [];
  var airKeyContent = parseJson(airtableConfigPath);
  if (Object.keys(airKeyContent).length !== 0) {
    var airKeyInput = airKeyContent["api-key"];
    Airtable.configure({
      endpointUrl: "https://" + airtableHostname,
      apiKey: airKeyInput,
    });
    var base = Airtable.base("appiYd1Tz9Sv857GZ");
    base("sparc_members")
      .select({
        filterByFormula: `({SPARC_Award_#} = "${award}")`,
      })
      .eachPage(function page(records, fetchNextPage) {
        records.forEach(function (record) {
          var firstName = record.get("First_name");
          var lastName = record.get("Last_name");
          if (firstName !== undefined && lastName !== undefined) {
            globalContributorNameObject[lastName] = firstName;
            currentContributorsLastNames.push(lastName);
          }
        }),
          fetchNextPage();
      });
    function done(err) {
      if (err) {
        log.error(err);
        console.error(err);
        return;
      }
    }
  }
}

function addContributortoTableDD(name, contactStatus) {
  var conTable = document.getElementById("contributor-table-dd");
  document.getElementById("div-contributor-table-dd").style.display = "block";
  var rowcount = conTable.rows.length;
  /// append row to table from the bottom
  var rowIndex = rowcount;
  var currentRow = conTable.rows[conTable.rows.length - 1];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  var newRowIndex = checkForUniqueRowID("row-current-con", rowIndex);
  var indexNumber = rowIndex;

  var conName = name;
  var conContactPerson = contactStatus;
  var row = (conTable.insertRow(rowIndex).outerHTML =
    "<tr id='row-current-con" +
    newRowIndex +
    "' class='row-protocol'><td class='contributor-table-row'>" +
    indexNumber +
    "</td><td>" +
    conName +
    "</td><td class='contributor-table-row'>" +
    conContactPerson +
    "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='edit_current_con_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='delete_current_con_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
}

var contributorElement =
  '<div id="contributor-popup"><div style="display:flex"><div style="margin-right:10px"><label>Last name</label><select id="dd-contributor-last-name" class="form-container-input-bf" onchange="onchangeLastNames()" style="line-height: 2"><option value="Select">Select an option</option></select></div><div class="div-child"><label>First name </label><select id="dd-contributor-first-name" disabled class="form-container-input-bf" onchange="onchangeFirstNames()" style="line-height: 2"><option value="Select">Select an option</option></select></div></div><div><label>ORCID ID <i class="fas fa-info-circle swal-popover" data-tippy-content="If contributor does not have an ORCID ID, we suggest they sign up for one at <a href=\'https://orcid.org\' target=\'_blank\'>https://orcid.org</a>" rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><input id="input-con-ID" class="form-container-input-bf" style="line-height: 2" contenteditable="true"></input></div><div><div style="margin: 15px 0;font-weight:600">Affiliation <i class="fas fa-info-circle swal-popover" data-tippy-content="Institutional affiliation for contributor. Hit \'Enter\' on your keyboard after each entry to register it." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-affiliation" contenteditable="true"></input></div></div><div><div style="margin: 15px 0;font-weight:600">Role <i class="fas fa-info-circle swal-popover" data-tippy-content="Role(s) of the contributor as per the Data Cite schema (c.f. associated dropdown list). Hit \'Enter\' after each entry to register it. Checkout the related <a href=\'https://schema.datacite.org/meta/kernel-4.3/\' target=\'_blank\'>documentation</a> for a definition of each of these roles." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-role" contenteditable="true"></input></div></div><div style="margin-top:15px;display:flex;flex-direction:column"><label>Contact Person <i class="fas fa-info-circle swal-popover" data-tippy-content="Check if the contributor is a contact person for the dataset. At least one and only one of the contributors should be the contact person." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><label class="switch" style="margin-top: 15px"><input id="ds-contact-person" name="contact-person" type="checkbox" class="with-style-manifest"></input><span class="slider round"></span></label></div></div>';

var contributorElementRaw =
  '<div id="contributor-popup"><div style="display:flex"><div style="margin-right:10px"><label>Last name</label><input id="dd-contributor-last-name" class="form-container-input-bf" style="line-height: 2"></input></div><div class="div-child"><label>First name</label><input id="dd-contributor-first-name" class="form-container-input-bf" style="line-height: 2"></input></div></div><div><label>ORCID ID <i class="fas fa-info-circle swal-popover" data-tippy-content="If contributor does not have an ORCID ID, we suggest they sign up for one at <a href=\'https://orcid.org\'  target=\'_blank\'>https://orcid.org</a>" rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><input id="input-con-ID" class="form-container-input-bf" style="line-height: 2" contenteditable="true"></input></div><div><div style="margin: 15px 0;font-weight:600">Affiliation <i class="fas fa-info-circle swal-popover" data-tippy-content="Institutional affiliation for contributor. Hit \'Enter\' on your keyboard after each entry to register it." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-affiliation" contenteditable="true"></input></div></div><div><div style="margin: 15px 0;font-weight:600">Role <i class="fas fa-info-circle swal-popover" data-tippy-content="Role(s) of the contributor as per the Data Cite schema (c.f. associated dropdown list). Hit \'Enter\' after each entry to register it. Checkout the related <a href=\'https://schema.datacite.org/meta/kernel-4.3/\' target=\'_blank\'>documentation</a> for a definition of each of these roles." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-role" contenteditable="true"></input></div></div><div style="margin-top:15px;display:flex;flex-direction:column"><label>Contact Person <i class="fas fa-info-circle swal-popover" data-tippy-content="Check if the contributor is a contact person for the dataset. At least one and only one of the contributors should be the contact person." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><label class="switch" style="margin-top: 15px"><input id="ds-contact-person" name="contact-person" type="checkbox" class="with-style-manifest"></input><span class="slider round"></span></label></div></div>';

var contributorObject = [];

function showContributorSweetalert(key) {
  var currentContributortagify;
  var currentAffliationtagify;
  if (key === false) {
    if (Object.keys(globalContributorNameObject).length !== 0) {
      var footer =
        "<a style='text-decoration: none !important' onclick='showContributorSweetalert(\"pass\")' target='_blank'>I want to add a contributor not listed above</a>";
      var element = contributorElement;
    } else {
      var footer = "";
      var element = contributorElementRaw;
    }
  } else if (key === "pass") {
    var element = contributorElementRaw;
    var footer = "";
  }
  Swal.fire({
    title: "Add a contributor",
    html: element,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Add contributor",
    width: "max-content",
    reverseButtons: reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    footer: footer,
    didOpen: () => {
      $(".swal-popover").popover();
      tippy("[data-tippy-content]", {
        allowHTML: true,
        interactive: true,
        placement: "right",
        theme: "light",
        interactiveBorder: 30,
      });
      // first destroy old tagify
      $($("#input-con-affiliation").siblings()[0]).remove();
      $($("#input-con-role").siblings()[0]).remove();
      /// initiate tagify for contributor roles
      currentContributortagify = new Tagify(
        document.getElementById("input-con-role"),
        {
          whitelist: [
            "PrincipleInvestigator",
            "Creator",
            "CoInvestigator",
            "DataCollector",
            "DataCurator",
            "DataManager",
            "Distributor",
            "Editor",
            "Producer",
            "ProjectLeader",
            "ProjectManager",
            "ProjectMember",
            "RelatedPerson",
            "Researcher",
            "ResearchGroup",
            "Sponsor",
            "Supervisor",
            "WorkPackageLeader",
            "Other",
          ],
          dropdown: {
            classname: "color-blue",
            enabled: 0, // show the dropdown immediately on focus
            maxItems: 25,
            closeOnSelect: true, // keep the dropdown open after selecting a suggestion
          },
          enforceWhitelist: true,
          duplicates: false,
        }
      );
      currentAffliationtagify = new Tagify(
        document.getElementById("input-con-affiliation"),
        {
          dropdown: {
            classname: "color-blue",
            enabled: 0, // show the dropdown immediately on focus
            maxItems: 25,
            closeOnSelect: true, // keep the dropdown open after selecting a suggestion
          },
          delimiters: null,
          duplicates: false,
        }
      );
      // load contributor names onto Select
      if (Object.keys(globalContributorNameObject).length !== 0) {
        if (key === false) {
          cloneConNamesSelect("dd-contributor-last-name");
        }
      }
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    preConfirm: () => {
      var affiliationVals = grabCurrentTagifyContributor(
        currentAffliationtagify
      ).join(", ");
      var roleVals = grabCurrentTagifyContributor(
        currentContributortagify
      ).join(", ");

      var firstName = $("#dd-contributor-first-name").val().trim();
      var lastName = $("#dd-contributor-last-name").val().trim();
      if (
        $("#input-con-ID").val().trim() === "" ||
        $("#input-con-affiliation").val().trim() === "" ||
        $("#input-con-role").val().trim() === "" ||
        firstName === "Select" ||
        lastName === "Select" ||
        firstName === "" ||
        lastName === ""
      ) {
        Swal.showValidationMessage(`Please fill in all required fields!`);
      } else {
        var duplicateConName = checkDuplicateContributorName(
          firstName,
          lastName
        );
        if (!duplicateConName) {
          if ($("#ds-contact-person").prop("checked")) {
            var contactPersonExists = checkContactPersonStatus("add", null);
            if (contactPersonExists) {
              Swal.showValidationMessage(
                "One contact person is already added. Only one contact person is allowed for a dataset."
              );
            } else {
              var myCurrentCon = {
                conName: lastName + ", " + firstName,
                conID: $("#input-con-ID").val().trim(),
                conAffliation: affiliationVals,
                conRole: roleVals,
                conContact: "Yes",
              };
              contributorObject.push(myCurrentCon);
              return [myCurrentCon.conName, myCurrentCon.conContact];
            }
          } else {
            var myCurrentCon = {
              conName: lastName + ", " + firstName,
              conID: $("#input-con-ID").val().trim(),
              conAffliation: affiliationVals,
              conRole: roleVals,
              conContact: "No",
            };
            contributorObject.push(myCurrentCon);
            return [myCurrentCon.conName, myCurrentCon.conContact];
          }
        } else {
          Swal.showValidationMessage(
            `The contributor ${lastName + ", " + firstName} is already added.`
          );
        }
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      addContributortoTableDD(result.value[0], result.value[1]);
    }
  });
}

function delete_current_con_id(ev) {
  Swal.fire({
    title: "Are you sure you want to delete this contributor?",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: `No!`,
    cancelButtonColor: "#f44336",
    confirmButtonColor: "#3085d6",
    confirmButtonText: "Yes",
  }).then((boolean) => {
    if (boolean.isConfirmed) {
      // 1. Delete from table
      var currentRow = $(ev).parents()[2];
      var currentRowid = $(currentRow).prop("id");
      document.getElementById(currentRowid).outerHTML = "";
      updateIndexForTable(document.getElementById("contributor-table-dd"));
      // 2. Delete from JSON
      var contributorName = $(currentRow)[0].cells[1].innerText;
      for (var i = 0; i < contributorObject.length; i++) {
        if (contributorObject[i].conName === contributorName) {
          contributorObject.splice(i, 1);
          break;
        }
      }
    }
  });
}

function edit_current_con_id(ev) {
  var currentContributortagify;
  var currentAffliationtagify;
  var element = contributorElementRaw;
  var currentRow = $(ev).parents()[2];
  var name = $(currentRow)[0].cells[1].innerText;
  Swal.fire({
    title: "Edit contributor",
    html: element,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Edit",
    width: "max-content",
    customClass: "contributor-popup",
    reverseButtons: reverseSwalButtons,
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    allowOutsideClick: false,
    didOpen: () => {
      $(".swal-popover").popover();
      tippy("[data-tippy-content]", {
        allowHTML: true,
        interactive: true,
        placement: "right",
        theme: "light",
        interactiveBorder: 30,
      });
      // disable first and last names (cannot edit these fields)
      // first destroy old tagify
      $($("#input-con-affiliation").siblings()[0]).remove();
      $($("#input-con-role").siblings()[0]).remove();
      /// initiate tagify for contributor roles
      currentContributortagify = new Tagify(
        document.getElementById("input-con-role"),
        {
          whitelist: [
            "PrincipleInvestigator",
            "Creator",
            "CoInvestigator",
            "DataCollector",
            "DataCurator",
            "DataManager",
            "Distributor",
            "Editor",
            "Producer",
            "ProjectLeader",
            "ProjectManager",
            "ProjectMember",
            "RelatedPerson",
            "Researcher",
            "ResearchGroup",
            "Sponsor",
            "Supervisor",
            "WorkPackageLeader",
            "Other",
          ],
          dropdown: {
            classname: "color-blue",
            enabled: 0, // show the dropdown immediately on focus
            maxItems: 25,
            closeOnSelect: true, // keep the dropdown open after selecting a suggestion
          },
          enforceWhitelist: true,
          duplicates: false,
        }
      );
      currentAffliationtagify = new Tagify(
        document.getElementById("input-con-affiliation"),
        {
          dropdown: {
            classname: "color-blue",
            enabled: 0, // show the dropdown immediately on focus
            maxItems: 25,
            closeOnSelect: true, // keep the dropdown open after selecting a suggestion
          },
          delimiters: null,
          duplicates: false,
        }
      );
      for (var contributor of contributorObject) {
        if (contributor.conName === name) {
          // add existing tags to tagifies
          for (var affiliation of contributor.conAffliation.split(" ,")) {
            currentAffliationtagify.addTags(affiliation);
          }
          for (var role of contributor.conRole.split(" ,")) {
            currentContributortagify.addTags(role);
          }
          if (contributor.conContact === "Yes") {
            $("#ds-contact-person").prop("checked", true);
          } else {
            $("#ds-contact-person").prop("checked", false);
          }
          var splitNames = name.split(", ");
          $("#dd-contributor-last-name").val(splitNames[0].trim());
          $("#dd-contributor-first-name").val(splitNames[1].trim());
          $("#dd-contributor-last-name").attr("disabled", true);
          $("#dd-contributor-first-name").attr("disabled", true);
          $("#input-con-ID").val(contributor.conID);
          break;
        }
      }
    },
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    preConfirm: () => {
      if (
        $("#input-con-ID").val().trim() === "" ||
        $("#input-con-affiliation").val().trim() === "" ||
        $("#input-con-role").val().trim() === "" ||
        $("#dd-contributor-last-name").val().trim() === "Select" ||
        $("#dd-contributor-first-name").val().trim() === "Select" ||
        $("#dd-contributor-last-name").val().trim() === "" ||
        $("#dd-contributor-first-name").val().trim() === ""
      ) {
        Swal.showValidationMessage(`Please fill in all required fields!`);
      } else {
        var affiliationVals = grabCurrentTagifyContributor(
          currentAffliationtagify
        ).join(", ");
        var roleVals = grabCurrentTagifyContributor(
          currentContributortagify
        ).join(", ");
        if ($("#ds-contact-person").prop("checked")) {
          var contactPersonExists = checkContactPersonStatus("edit", ev);
          if (contactPersonExists) {
            Swal.showValidationMessage(
              "One contact person is already added. Only one contact person is allowed for a dataset."
            );
          } else {
            var myCurrentCon = {
              conName:
                $("#dd-contributor-last-name").val().trim() +
                ", " +
                $("#dd-contributor-first-name").val().trim(),
              conID: $("#input-con-ID").val().trim(),
              conAffliation: affiliationVals,
              conRole: roleVals,
              conContact: "Yes",
            };
            for (var contributor of contributorObject) {
              if (contributor.conName === name) {
                contributorObject[contributorObject.indexOf(contributor)] =
                  myCurrentCon;
                break;
              }
            }
            return [myCurrentCon.conName, myCurrentCon.conContact];
          }
        } else {
          var myCurrentCon = {
            conName:
              $("#dd-contributor-last-name").val().trim() +
              ", " +
              $("#dd-contributor-first-name").val().trim(),
            conID: $("#input-con-ID").val().trim(),
            conAffliation: affiliationVals,
            conRole: roleVals,
            conContact: "No",
          };
          for (var contributor of contributorObject) {
            if (contributor.conName === name) {
              contributorObject[contributorObject.indexOf(contributor)] =
                myCurrentCon;
              break;
            }
          }
          return [myCurrentCon.conName, myCurrentCon.conContact];
        }
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      $(currentRow)[0].cells[2].innerText = result.value[1];
    }
  });
}

//////////////// Dataset description file ///////////////////////
//////////////// //////////////// //////////////// ////////////////

//// get datasets and append that to option list for parent datasets
function getParentDatasets() {
  var parentDatasets = [];
  for (var i = 0; i < datasetList.length; i++) {
    parentDatasets.push(datasetList[i].name);
  }
  return parentDatasets;
}

function changeAwardInputDsDescription() {
  if (dsContributorArrayLast1) {
    removeOptions(dsContributorArrayLast1);
  }
  if (dsContributorArrayFirst1) {
    removeOptions(dsContributorArrayFirst1);
    addOption(dsContributorArrayFirst1, "Select an option", "Select an option");
  }

  currentContributorsLastNames = [];
  currentContributorsFirstNames = [];
  globalContributorNameObject = {};

  /// delete old table
  $("#table-current-contributors").find("tr").slice(1, -1).remove();
  for (
    var i = 0;
    i <
    document.getElementById("table-current-contributors").rows[1].cells.length;
    i++
  ) {
    $(
      $($("#table-current-contributors").find("tr")[1].cells[i]).find(
        "input"
      )[0]
    ).val("");
    $(
      $($("#table-current-contributors").find("tr")[1].cells[i]).find(
        "textarea"
      )[0]
    ).val("");
  }

  var selectID = document.getElementById(
    $(
      $($("#table-current-contributors").find("tr")[1].cells[1]).find(
        "select"
      )[0]
    ).prop("id")
  );
  if (selectID) {
    removeOptions(selectID);
    $(
      $($("#table-current-contributors").find("tr")[1].cells[1]).find(
        "select"
      )[0]
    ).prop("disabled", true);
  }

  var awardVal = $("#ds-description-award-input");
  var airKeyContent = parseJson(airtableConfigPath);
  if (Object.keys(airKeyContent).length !== 0) {
    var airKeyInput = airKeyContent["api-key"];
    Airtable.configure({
      endpointUrl: "https://" + airtableHostname,
      apiKey: airKeyInput,
    });
    var base = Airtable.base("appiYd1Tz9Sv857GZ");
    base("sparc_members")
      .select({
        filterByFormula: `({SPARC_Award_#} = "${awardVal}")`,
      })
      .eachPage(function page(records, fetchNextPage) {
        records.forEach(function (record) {
          var firstName = record.get("First_name");
          var lastName = record.get("Last_name");
          globalContributorNameObject[lastName] = firstName;
          currentContributorsLastNames.push(lastName);
        }),
          fetchNextPage();
        var currentRowLeftID = $(
          $($("#table-current-contributors").find("tr")[1].cells[0]).find(
            "select"
          )[0]
        ).prop("id");
        if (currentRowLeftID) {
          cloneConNamesSelect(currentRowLeftID);
        }
      });
    function done(err) {
      if (err) {
        log.error(err);
        console.error(err);
        return;
      }
    }
  }
}

// on change event when users choose a contributor's last name
function onchangeLastNames() {
  $("#dd-contributor-first-name").attr("disabled", true);
  var conLastname = $("#dd-contributor-last-name").val();
  removeOptions(document.getElementById("dd-contributor-first-name"));
  if (conLastname in globalContributorNameObject) {
    addOption(
      document.getElementById("dd-contributor-first-name"),
      globalContributorNameObject[conLastname],
      globalContributorNameObject[conLastname]
    );
    $("#dd-contributor-first-name")
      .val(globalContributorNameObject[conLastname])
      .trigger("onchange");
  }
  $("#dd-contributor-first-name").attr("disabled", false);
}

// on change event when users choose a contributor's first name -> Load con info
function onchangeFirstNames() {
  var conLastname = $("#dd-contributor-last-name").val();
  var conFirstname = $("#dd-contributor-first-name").val();
  if (conFirstname !== "Select") {
    loadContributorInfo(conLastname, conFirstname);
  }
}

// Auto populate once a contributor is selected
function loadContributorInfo(lastName, firstName) {
  // first destroy old tagifies
  $($("#input-con-affiliation").siblings()[0]).remove();
  $($("#input-con-role").siblings()[0]).remove();

  var tagifyRole = new Tagify(document.getElementById("input-con-role"), {
    whitelist: [
      "PrincipleInvestigator",
      "Creator",
      "CoInvestigator",
      "DataCollector",
      "DataCurator",
      "DataManager",
      "Distributor",
      "Editor",
      "Producer",
      "ProjectLeader",
      "ProjectManager",
      "ProjectMember",
      "RelatedPerson",
      "Researcher",
      "ResearchGroup",
      "Sponsor",
      "Supervisor",
      "WorkPackageLeader",
      "Other",
    ],
    enforceWhitelist: true,
    dropdown: {
      classname: "color-blue",
      maxItems: 25,
      enabled: 0,
      closeOnSelect: true,
    },
  });
  var tagifyAffliation = new Tagify(
    document.getElementById("input-con-affiliation"),
    {
      dropdown: {
        classname: "color-blue",
        enabled: 0, // show the dropdown immediately on focus
        maxItems: 25,
        closeOnSelect: true, // keep the dropdown open after selecting a suggestion
      },
      delimiters: null,
      duplicates: false,
    }
  );
  tagifyRole.removeAllTags();
  tagifyAffliation.removeAllTags();
  var contactLabel = $("#ds-contact-person");
  $(contactLabel).prop("checked", false);
  document.getElementById("input-con-ID").value = "Loading...";

  tagifyAffliation.loading(true);
  tagifyRole.loading(true);

  var airKeyContent = parseJson(airtableConfigPath);
  var airKeyInput = airKeyContent["api-key"];
  var airtableConfig = Airtable.configure({
    endpointUrl: "https://" + airtableHostname,
    apiKey: airKeyInput,
  });
  var base = Airtable.base("appiYd1Tz9Sv857GZ");
  base("sparc_members")
    .select({
      filterByFormula: `AND({First_name} = "${firstName}", {Last_name} = "${lastName}")`,
    })
    .eachPage(function page(records, fetchNextPage) {
      var conInfoObj = {};
      records.forEach(function (record) {
        conInfoObj["ID"] = record.get("ORCID");
        conInfoObj["Role"] = record.get("Dataset_contributor_roles_for_SODA");
        conInfoObj["Affiliation"] = record.get("Institution");
      }),
        fetchNextPage();

      // if no records found, leave fields empty
      leaveFieldsEmpty(
        conInfoObj["ID"],
        document.getElementById("input-con-ID")
      );
      leaveFieldsEmpty(
        conInfoObj["Role"],
        document.getElementById("input-con-role")
      );
      leaveFieldsEmpty(
        conInfoObj["Affiliation"],
        document.getElementById("input-con-affiliation")
      );

      tagifyAffliation.addTags(conInfoObj["Affiliation"]);
      tagifyRole.addTags(conInfoObj["Role"]);
    }),
    function done(err) {
      if (err) {
        log.error(err);
        console.error(err);
        return;
      }
    };
  tagifyAffliation.loading(false);
  tagifyRole.loading(false);
}

//// De-populate dataset dropdowns to clear options
const clearDatasetDropdowns = () => {
  for (let list of [curateDatasetDropdown]) {
    removeOptions(list);
    addOption(list, "Search here...", "Select dataset");
    list.options[0].disabled = true;
  }
};

//////////////////////// Current Contributor(s) /////////////////////

function delete_current_con(no) {
  // after a contributor is deleted, add their name back to the contributor last name dropdown list
  if (
    $("#ds-description-contributor-list-last-" + no).length > 0 &&
    $("#ds-description-contributor-list-first-" + no).length > 0
  ) {
    var deletedLastName = $(
      "#ds-description-contributor-list-last-" + no
    ).val();
    var deletedFirstName = $(
      "#ds-description-contributor-list-first-" + no
    ).val();
    globalContributorNameObject[deletedLastName] = deletedFirstName;
    currentContributorsLastNames.push(deletedLastName);
  }
  document.getElementById("row-current-name" + no + "").outerHTML = "";
}

function delete_link(no) {
  document.getElementById("row-current-link" + no + "").outerHTML = "";
}

//////////////////////// Article(s) and Protocol(s) /////////////////////

//// function to leave fields empty if no data is found on Airtable
function leaveFieldsEmpty(field, element) {
  if (field !== undefined) {
    element.value = field;
  } else {
    element.value = "";
  }
}

$(currentConTable).mousedown(function (e) {
  var length = currentConTable.rows.length - 1;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
  }
  $(document).mousemove(move).mouseup(up);
});

$("#contributor-table-dd").mousedown(function (e) {
  var length = document.getElementById("contributor-table-dd").rows.length - 1;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    updateIndexForTable(document.getElementById("contributor-table-dd"));
    updateOrderContributorTable(
      document.getElementById("contributor-table-dd"),
      contributorObject
    );
  }
  $(document).mousemove(move).mouseup(up);
});

$("#protocol-link-table-dd").mousedown(function (e) {
  var length = document.getElementById("protocol-link-table-dd").rows.length;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    updateIndexForTable(document.getElementById("protocol-link-table-dd"));
  }
  $(document).mousemove(move).mouseup(up);
});

$("#additional-link-table-dd").mousedown(function (e) {
  var length = document.getElementById("additional-link-table-dd").rows.length;
  var tr = $(e.target).closest("tr"),
    sy = e.pageY,
    drag;
  if ($(e.target).is("tr")) tr = $(e.target);
  var index = tr.index();
  $(tr).addClass("grabbed");
  function move(e) {
    if (!drag && Math.abs(e.pageY - sy) < 10) return;
    drag = true;
    tr.siblings().each(function () {
      var s = $(this),
        i = s.index(),
        y = s.offset().top;
      if (e.pageY >= y && e.pageY < y + s.outerHeight()) {
        if (i !== 0) {
          if ($(e.target).closest("tr")[0].rowIndex !== length) {
            if (i < tr.index()) {
              s.insertAfter(tr);
            } else {
              s.insertBefore(tr);
            }
            return false;
          }
        }
      }
    });
  }
  function up(e) {
    if (drag && index != tr.index() && tr.index() !== length) {
      drag = false;
    }
    $(document).unbind("mousemove", move).unbind("mouseup", up);
    $(tr).removeClass("grabbed");
    updateIndexForTable(document.getElementById("additional-link-table-dd"));
  }
  $(document).mousemove(move).mouseup(up);
});

const emptyDSInfoEntries = () => {
  var fieldSatisfied = true;
  var inforObj = grabDSInfoEntries();
  var emptyFieldArray = [];
  /// check for number of keywords
  for (var element in inforObj) {
    if (element === "keywords") {
      if (inforObj[element].length < 3) {
        emptyFieldArray.push("at least 3 keywords");
        fieldSatisfied = false;
      }
    } else {
      if (
        inforObj[element].length === 0 ||
        inforObj[element] === "Select dataset"
      ) {
        fieldSatisfied = false;
        emptyFieldArray.push(element);
      }
    }
  }
  return [fieldSatisfied, emptyFieldArray];
};

function emptyLinkInfo() {
  var tableCurrentLinks = document.getElementById("protocol-link-table-dd");
  var fieldSatisfied = false;
  if (tableCurrentLinks.rows.length > 1) {
    fieldSatisfied = true;
  }
  return fieldSatisfied;
}

const emptyInfoEntries = (element) => {
  var fieldSatisfied = true;
  if (element === "") {
    fieldSatisfied = false;
  }
  return fieldSatisfied;
};

/// detect empty required fields and raise a warning
function detectEmptyRequiredFields(funding) {
  /// dataset info
  var dsContent = emptyDSInfoEntries();
  var dsSatisfied = dsContent[0];
  var dsEmptyField = dsContent[1];

  /// protocol info check
  var protocolSatisfied = emptyLinkInfo();

  /// contributor info
  var conEmptyField = [];
  var conSatisfied = true;
  var fundingSatisfied = emptyInfoEntries(funding);
  var contactPersonExists = checkAtLeastOneContactPerson();
  var contributorNumber = document.getElementById("contributor-table-dd").rows
    .length;
  if (!fundingSatisfied) {
    conEmptyField.push("SPARC Award");
  }
  if (!contactPersonExists) {
    conEmptyField.push("One contact person");
  }
  if (contributorNumber <= 1) {
    conEmptyField.push("At least one contributor");
  }
  if (conEmptyField.length !== 0) {
    conSatisfied = false;
  }

  /// detect empty required fields and raise a warning
  var emptyArray = [dsSatisfied, conSatisfied, protocolSatisfied];
  var emptyMessageArray = [
    "- Missing required fields under Dataset Info section: " +
      dsEmptyField.join(", "),
    "- Missing required fields under Contributor Info section: " +
      conEmptyField.join(", "),
    "- Missing required item under Article(s) and Protocol(s) Info section: At least one protocol url",
  ];
  var allFieldsSatisfied = true;
  errorMessage = [];
  for (var i = 0; i < emptyArray.length; i++) {
    if (!emptyArray[i]) {
      errorMessage.push(emptyMessageArray[i]);
      allFieldsSatisfied = false;
    }
  }
  return [allFieldsSatisfied, errorMessage];
}

function grabCurrentTagifyContributor(tagify) {
  var infoArray = [];
  // var element = document.getElementById(id)
  var values = tagify.DOM.originalInput.value;
  if (values !== "") {
    var valuesArray = JSON.parse(values);
    if (valuesArray.length > 0) {
      for (var val of valuesArray) {
        infoArray.push(val.value);
      }
    }
  }
  return infoArray;
}

function checkContactPersonStatus(type, ev) {
  var allConTable = document.getElementById("contributor-table-dd");
  if (type === "edit") {
    var contactPersonExists = false;
    var currentRow = $(ev).parents()[2];
    var name = $(currentRow)[0].cells[1].innerText;
    var rowcount = allConTable.rows.length;
    for (var i = 1; i < rowcount; i++) {
      var contactLabel = allConTable.rows[i].cells[2].innerText;
      var currentContributorName = allConTable.rows[i].cells[1].innerText;
      if (currentContributorName !== name) {
        if (contactLabel === "Yes") {
          contactPersonExists = true;
          break;
        }
      }
    }
    return contactPersonExists;
  } else {
    var contactPersonExists = false;
    var rowcount = allConTable.rows.length;
    for (var i = 1; i < rowcount; i++) {
      var contactLabel = allConTable.rows[i].cells[2].innerText;
      if (contactLabel === "Yes") {
        contactPersonExists = true;
        break;
      }
    }
    return contactPersonExists;
  }
}

function checkAtLeastOneContactPerson() {
  var contactPersonExists = false;
  var allConTable = document.getElementById("contributor-table-dd");
  var rowcount = allConTable.rows.length;
  if (allConTable.rows.length > 1) {
    for (var i = 1; i < rowcount; i++) {
      var contactLabel = allConTable.rows[i].cells[2].innerText;
      if (contactLabel === "Yes") {
        contactPersonExists = true;
        break;
      }
    }
  }
  return contactPersonExists;
}

function checkDuplicateContributorName(first, last) {
  var allConTable = document.getElementById("contributor-table-dd");
  var duplicate = false;
  var name = last + ", " + first;
  var rowcount = allConTable.rows.length;
  for (var i = 1; i < rowcount; i++) {
    var currentContributorName = allConTable.rows[i].cells[1].innerText;
    if (currentContributorName === name) {
      duplicate = true;
      break;
    }
  }
  return duplicate;
}

function checkDuplicateLink(link, table) {
  var duplicate = false;
  var rowcount = document.getElementById(table).rows.length;
  for (var i = 1; i < rowcount; i++) {
    var currentLink = document.getElementById(table).rows[i].cells[1].innerText;
    if (currentLink === link) {
      duplicate = true;
      break;
    }
  }
  return duplicate;
}

function showAddAirtableAccountSweetalert(keyword) {
  var htmlTitle = `<h4 style="text-align:center">Please enter your Airtable API key below: <i class="fas fa-info-circle swal-popover" data-tippy-content="Note that the key will be stored locally on your computer and the SODA Team will not have access to it." rel="popover" data-placement="right" data-html="true" data-trigger="hover" ></i></h4>`;

  var bootb = Swal.fire({
    title: htmlTitle,
    html: airtableAccountBootboxMessage,
    showCancelButton: true,
    focusCancel: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Add Account",
    backdrop: "rgba(0,0,0, 0.4)",
    heightAuto: false,
    reverseButtons: reverseSwalButtons,
    customClass: "swal-wide",
    footer:
      "<a href='https://github.com/bvhpatel/SODA/wiki/Connect-your-Airtable-account-with-SODA' target='_blank' style='text-decoration:none'> Where do i find my Airtable API key?</a>",
    showClass: {
      popup: "animate__animated animate__fadeInDown animate__faster",
    },
    hideClass: {
      popup: "animate__animated animate__fadeOutUp animate__faster",
    },
    didOpen: () => {
      // $(".swal-popover").popover();
      tippy("[data-tippy-content]", {
        allowHTML: true,
        interactive: true,
        placement: "right",
        theme: "light",
      });
    },
  }).then((result) => {
    if (result.isConfirmed) {
      addAirtableAccountInsideSweetalert(keyword);
    }
  });
}

// adding row for contributor table
function addNewRow(table) {
  $("#para-save-link-status").text("");
  $("#para-save-contributor-status").text("");
  var rowcount = document.getElementById(table).rows.length;
  /// append row to table from the bottom
  var rowIndex = rowcount;
  var currentRow =
    document.getElementById(table).rows[
      document.getElementById(table).rows.length - 1
    ];
  if (table === "doi-table") {
    if (
      $(document.getElementById("doi-table").rows[rowIndex - 1].cells[1])
        .find("input")
        .val() === "" ||
      $(document.getElementById("doi-table").rows[rowIndex - 1].cells[0])
        .find("select")
        .val() === "Select"
    ) {
      $("#para-save-link-status").text("Please enter a link to add!");
    } else {
      $(".doi-helper-buttons").css("display", "inline-flex");
      $(".doi-add-row-button").css("display", "none");
      $("#select-misc-links").remove();
      // check for unique row id in case users delete old rows and append new rows (same IDs!)
      var newRowIndex = checkForUniqueRowID("row-current-link", rowIndex);
      var row = (document.getElementById(table).insertRow(rowIndex).outerHTML =
        "<tr id='row-current-link" +
        newRowIndex +
        "'><td><select id='select-misc-link' class='form-container-input-bf' onchange='populateProtocolLink(this)' style='font-size:13px;line-height:2;'><option value='Select'>Select an option</option><option value='Protocol URL or DOI*'>Protocol URL or DOI*</option><option value='Originating Article DOI'>Originating Article DOI</option><option value='Additional Link'>Additional Link</option></select></td><td><input type='text' contenteditable='true'></input></td><td><input type='text' contenteditable='true'></input></td><td><div onclick='addNewRow(\"doi-table\")' class='ui right floated medium primary labeled icon button doi-add-row-button' style='display:block;font-size:14px;height:30px;padding-top:9px !important;background:dodgerblue'><i class='plus icon' style='padding:8px'></i>Add</div><div class='ui small basic icon buttons doi-helper-buttons' style='display:none'><button onclick='delete_link(" +
        rowIndex +
        ")'' class='ui button'><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
    }
  } else if (table === "table-current-contributors") {
    // check if all the fields are populated before Adding
    var empty = checkEmptyConRowInfo(table, currentRow);
    if (empty) {
      $("#para-save-contributor-status").text(
        "Please fill in all the fields to add!"
      );
      return;
    }
    if ($(currentRow).find("label").find("input")[0].checked) {
      var currentContactPersonIDNumber = $(
        $(currentRow).find("label").find("input")[0]
      )
        .prop("id")
        .slice(-1);
      var contactPersonBoolean = contactPersonCheck(
        currentContactPersonIDNumber
      );
      if (contactPersonBoolean) {
        $("#para-save-contributor-status").text(
          "One contact person is already added above. Only one contact person is allowed for a dataset."
        );
        return;
      }
    }
    var nameDuplicateBoolean = checkContributorNameDuplicates(
      table,
      currentRow
    );
    if (nameDuplicateBoolean) {
      $("#para-save-contributor-status").text("Contributor already added!");
      return;
    }
    $("#table-current-contributors .contributor-helper-buttons").css(
      "display",
      "inline-flex"
    );
    $("#table-current-contributors .contributor-add-row-button").css(
      "display",
      "none"
    );
    // check for unique row id in case users delete old rows and append new rows (same IDs!)
    var newRowIndex = checkForUniqueRowID("row-current-name", rowIndex);
    if (noAirtable) {
      var row = (document.getElementById(table).insertRow(rowIndex).outerHTML =
        "<tr id='row-current-name" +
        newRowIndex +
        "'><td class='grab'><input id='ds-description-raw-contributor-list-last-" +
        newRowIndex +
        "' class='form-container-input-bf' type='text'></input></td><td class='grab'><input id='ds-description-raw-contributor-list-first-" +
        newRowIndex +
        "' type='text' class='form-container-input-bf'></input></td><td class='grab'><input name='id' type='text' id='input-con-ID-" +
        newRowIndex +
        "' contenteditable='true'></input></td><td class='grab'><input name='affiliation' id='input-con-affiliation-" +
        newRowIndex +
        "' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-" +
        newRowIndex +
        "'></input></td><td class='grab'><label class='switch'><input onclick='onChangeContactLabel(" +
        newRowIndex +
        ")' id='ds-contact-person-" +
        newRowIndex +
        "' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
        newRowIndex +
        ")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
      createConsRoleTagify("input-con-role-" + newRowIndex.toString());
      createConsAffliationTagify(
        "input-con-affiliation-" + newRowIndex.toString()
      );
    } else {
      if ($("#add-other-contributors").text() == "Cancel manual typing") {
        var row = (document
          .getElementById(table)
          .insertRow(rowIndex).outerHTML =
          "<tr id='row-current-name" +
          newRowIndex +
          "'><td class='grab'><input placeholder='Type here' id='ds-description-raw-contributor-list-last-" +
          newRowIndex +
          "' class='form-container-input-bf' type='text'></input></td><td class='grab'><input placeholder='Type here' id='ds-description-raw-contributor-list-first-" +
          newRowIndex +
          "' type='text' class='form-container-input-bf'></input></td><td class='grab'><input type='text' id='input-con-ID-" +
          newRowIndex +
          "' contenteditable='true'></input></td><td class='grab'><input id='input-con-affiliation-" +
          newRowIndex +
          "' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-" +
          newRowIndex +
          "'></input></td><td class='grab'><label class='switch'><input onclick='onChangeContactLabel(" +
          newRowIndex +
          ")' id='ds-contact-person-" +
          newRowIndex +
          "' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
          newRowIndex +
          ")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
        createConsRoleTagify("input-con-role-" + newRowIndex.toString());
        createConsAffliationTagify(
          "input-con-affiliation-" + newRowIndex.toString()
        );
      } else {
        var row = (document
          .getElementById(table)
          .insertRow(rowIndex).outerHTML =
          "<tr id='row-current-name" +
          newRowIndex +
          "'><td class='grab'><select id='ds-description-contributor-list-last-" +
          newRowIndex +
          "' onchange='onchangeLastNames(" +
          newRowIndex +
          ")' class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td><td class='grab'><select disabled id='ds-description-contributor-list-first-" +
          newRowIndex +
          "' onchange='onchangeFirstNames(" +
          newRowIndex +
          ")' disabled class='form-container-input-bf' style='font-size:13px;line-height: 2;'><option>Select an option</option></select></td><td class='grab'><input type='text' id='input-con-ID-" +
          newRowIndex +
          "' contenteditable='true'></input></td><td class='grab'><input id='input-con-affiliation-" +
          newRowIndex +
          "' type='text' contenteditable='true'></input></td><td class='grab'><input type='text' contenteditable='true' name='role' id='input-con-role-" +
          newRowIndex +
          "'></input></td><td class='grab'><label class='switch'><input onclick='onChangeContactLabel(" +
          newRowIndex +
          ")' id='ds-contact-person-" +
          newRowIndex +
          "' name='contact-person' type='checkbox' class='with-style-manifest'/><span class='slider round'></span></label></td><td><div onclick='addNewRow(\"table-current-contributors\")' class='button contributor-add-row-button' style='display:block;font-size:13px;width:40px;color:#fff;border-radius:2px;height:30px;padding:5px !important;background:dodgerblue'>Add</div><div class='ui small basic icon buttons contributor-helper-buttons' style='display:none'><button class='ui button' onclick='delete_current_con(" +
          newRowIndex +
          ")''><i class='trash alternate outline icon' style='color:red'></i></button></div></td></tr>");
        cloneConNamesSelect(
          "ds-description-contributor-list-last-" + newRowIndex.toString()
        );
      }
    }
  }
}

function addAirtableAccountInsideSweetalert(keyword) {
  // var name = $("#bootbox-airtable-key-name").val();
  var name = "SODA-Airtable";
  var key = $("#bootbox-airtable-key").val();
  if (name.length === 0 || key.length === 0) {
    var errorMessage =
      "<span>Please fill in both required fields to add.</span>";
    Swal.fire({
      icon: "error",
      html: errorMessage,
      heightAuto: false,
      backdrop: "rgba(0,0,0,0.4)",
    }).then((result) => {
      if (result.isConfirmed) {
        showAddAirtableAccountSweetalert(keyword);
      }
    });
  } else {
    Swal.fire({
      icon: "warning",
      title: "Connect to Airtable",
      text: "This will erase your previous manual input under the submission and/or dataset description file(s). Would you like to continue?",
      heightAuto: false,
      showCancelButton: true,
      focusCancel: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes",
      reverseButtons: reverseSwalButtons,
      backdrop: "rgba(0,0,0,0.4)",
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const optionsSparcTable = {
          hostname: airtableHostname,
          port: 443,
          path: "/v0/appiYd1Tz9Sv857GZ/sparc_members",
          headers: { Authorization: `Bearer ${key}` },
        };
        var sparcTableSuccess;
        https.get(optionsSparcTable, (res) => {
          if (res.statusCode === 200) {
            /// updating api key in SODA's storage
            createMetadataDir();
            var content = parseJson(airtableConfigPath);
            content["api-key"] = key;
            content["key-name"] = name;
            fs.writeFileSync(airtableConfigPath, JSON.stringify(content));
            checkAirtableStatus(keyword);
            // document.getElementById(
            //   "para-generate-description-status"
            // ).innerHTML = "";
            // $("#span-airtable-keyname").html(name);
            $("#current-airtable-account").html(name);
            // $("#bootbox-airtable-key-name").val("");
            $("#bootbox-airtable-key").val("");
            loadAwardData();
            // ddNoAirtableMode("Off");
            Swal.fire({
              title: "Successfully connected. Loading your Airtable account...",
              timer: 10000,
              timerProgressBar: false,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              allowEscapeKey: false,
              allowOutsideClick: false,
              showConfirmButton: false,
              didOpen: () => {
                Swal.showLoading();
              },
            }).then((result) => {
              helpSPARCAward("submission");
            });
            // helpSPARCAward("submission")
            ipcRenderer.send(
              "track-event",
              "Success",
              "Prepare Metadata - Add Airtable account",
              defaultBfAccount
            );
          } else if (res.statusCode === 403) {
            $("#current-airtable-account").html("None");
            Swal.fire({
              icon: "error",
              text: "Your account doesn't have access to the SPARC Airtable sheet. Please obtain access (email Dr. Charles Horn at chorn@pitt.edu)!",
              heightAuto: false,
              backdrop: "rgba(0,0,0,0.4)",
            }).then((result) => {
              if (result.isConfirmed) {
                showAddAirtableAccountSweetalert(keyword);
              }
            });
          } else {
            log.error(res);
            console.error(res);
            ipcRenderer.send(
              "track-event",
              "Error",
              "Prepare Metadata - Add Airtable account",
              defaultBfAccount
            );
            Swal.fire({
              icon: "error",
              text: "Failed to connect to Airtable. Please check your API Key and try again!",
              heightAuto: false,
              backdrop: "rgba(0,0,0,0.4)",
            }).then((result) => {
              if (result.isConfirmed) {
                showAddAirtableAccountSweetalert(keyword);
              }
            });
          }
          res.on("error", (error) => {
            log.error(error);
            console.error(error);
            ipcRenderer.send(
              "track-event",
              "Error",
              "Prepare Metadata - Add Airtable account",
              defaultBfAccount
            );
            Swal.fire({
              icon: "error",
              text: "Failed to connect to Airtable. Please check your API Key and try again!",
              heightAuto: false,
              backdrop: "rgba(0,0,0,0.4)",
            }).then((result) => {
              if (result.isConfirmed) {
                showAddAirtableAccountSweetalert(keyword);
              }
            });
          });
        });
      }
    });
  }
}
