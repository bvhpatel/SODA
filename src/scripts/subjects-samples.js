var subjectsFormDiv = document.getElementById("form-add-a-subject");
var samplesFormDiv = document.getElementById("form-add-a-sample");
var subjectsTableData = [];
var subjectsFileData = [];
var samplesTableData = [];
var samplesFileData = [];
var headersArrSubjects = [];
var headersArrSamples = [];

function showForm(type, editBoolean) {
  if (subjectsTableData.length > 1) {
    var subjectsDropdownOptions = [];
    for (var i = 1; i < subjectsTableData.length; i++) {
      subjectsDropdownOptions.push(subjectsTableData[i][0]);
    }
    if (!editBoolean) {
      // prompt users if they want to import entries from previous sub_ids
      Swal.fire({
        title: "Would you like to re-use information from a previous subject?",
        showCancelButton: true,
        cancelButtonText: `No, start fresh!`,
        cancelButtonColor: "#f44336",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Yes!",
        reverseButtons: reverseSwalButtons,
      }).then((boolean) => {
        if (boolean.isConfirmed) {
          promptImportPrevInfoSubject(
            subjectsDropdownOptions
          );
        } else {
          clearAllSubjectFormFields(subjectsFormDiv);
        }
      });
    }
  } else {
    if (type !== "edit") {
      clearAllSubjectFormFields(subjectsFormDiv);
    }
  }
  subjectsFormDiv.style.display = "flex";
  $("#create_subjects-tab").removeClass("show");
  $("#create_subjects-tab").css("display", "none");
  $("#footer-div-subjects").css("display", "none");
  $("#btn-add-custom-field").show();
  $("#sidebarCollapse").prop("disabled", "true");
}

function showFormSamples(type, editBoolean) {
  if (samplesTableData.length > 1) {
    var samplesDropdownOptions = [];
    var subjectsDropdownOptions = [];
    for (var i = 1; i < samplesTableData.length; i++) {
      samplesDropdownOptions.push(samplesTableData[i][1]);
      subjectsDropdownOptions.push(samplesTableData[i][0]);
    }
    if (!editBoolean) {
      // prompt users if they want to import entries from previous sub_ids
      Swal.fire({
        title: "Would you like to re-use information from previous sample(s)?",
        showCancelButton: true,
        cancelButtonText: `No, start fresh!`,
        cancelButtonColor: "#f44336",
        confirmButtonColor: "#3085d6",
        reverseButtons: reverseSwalButtons,
        confirmButtonText: "Yes!",
      }).then((boolean) => {
        if (boolean.isConfirmed) {
          promptImportPrevInfoSamples(
            subjectsDropdownOptions,
            samplesDropdownOptions
          );
        } else {
          clearAllSubjectFormFields(samplesFormDiv);
        }
      });
    }
  } else {
    if (type !== "edit") {
      clearAllSubjectFormFields(samplesFormDiv);
    }
  }
  samplesFormDiv.style.display = "flex";
  $("#create_samples-tab").removeClass("show");
  $("#create_samples-tab").css("display", "none");
  $("#footer-div-samples").css("display", "none");
  $("#btn-add-custom-field-samples").show();
  $("#sidebarCollapse").prop("disabled", "true");
}

var selectHTMLSamples =
  "<div><select id='previous-subject' class='swal2-input' onchange='displayPreviousSample()'></select><select style='display:none' id='previous-sample' class='swal2-input' onchange='confirmSample()'></select></div>";
var prevSubID = "";
var prevSamID = "";
var prevSubIDSingle = "";
var selectHTMLSubjects =
  "<div><select id='previous-subject-single' class='swal2-input'></select></div>";

function promptImportPrevInfoSamples(arr1, arr2) {
  Swal.fire({
    title: "Choose a previous sample:",
    html: selectHTMLSamples,
    showCancelButton: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Confirm",
    reverseButtons: reverseSwalButtons,
    customClass: {
      confirmButton: "confirm-disabled",
    },
    onOpen: function () {
      $(".swal2-confirm").attr("id", "btn-confirm-previous-import");
      removeOptions(document.getElementById("previous-subject"));
      removeOptions(document.getElementById("previous-sample"));
      $("#previous-subject").append(
        `<option value="Select">Select a subject</option>`
      );
      $("#previous-sample").append(
        `<option value="Select">Select a sample</option>`
      );
      for (var ele of arr1) {
        $("#previous-subject").append(`<option value="${ele}">${ele}</option>`);
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      if (
        $("#previous-subject").val() !== "Select" &&
        $("#previous-sample").val() !== "Select"
      ) {
        populateFormsSamples(prevSubID, prevSamID, "import");
      }
    } else {
      hideSamplesForm();
    }
  });
}

function promptImportPrevInfoSubject(arr1) {
  Swal.fire({
    title: "Choose a previous subject:",
    html: selectHTMLSubjects,
    showCancelButton: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Confirm",
    reverseButtons: reverseSwalButtons,
    // customClass: {
    //   confirmButton: "confirm-disabled",
    // },
    onOpen: function () {
      // $(".swal2-confirm").attr("id", "btn-confirm-previous-import-subject");
      removeOptions(document.getElementById("previous-subject-single"));
      $("#previous-subject-single").append(
        `<option value="Select">Select a subject</option>`
      );
      for (var ele of arr1) {
        $("#previous-subject-single").append(`<option value="${ele}">${ele}</option>`);
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      if (
        $("#previous-subject-single").val() !== "Select"
      ) {
        prevSubIDSingle = $("#previous-subject-single").val()
        populateForms(prevSubIDSingle, "import");
      }
    } else {
      hideSubjectsForm();
    }
  });
}

function displayPreviousSample() {
  if ($("#previous-subject").val() !== "Select") {
    $("#previous-sample").css("display", "block");
    prevSubID = $("#previous-subject").val();
    // load previous sample ids accordingly for a particular subject
    var prevSampleArr = [];
    for (var subject of samplesTableData.slice(1)) {
      if (subject[0] === prevSubID) {
        prevSampleArr.push(subject[1]);
      }
    }
    for (var ele of prevSampleArr) {
      $("#previous-sample").append(`<option value="${ele}">${ele}</option>`);
    }
  } else {
    $("#previous-sample").css("display", "none");
    prevSubID = "";
  }
}

function confirmSample() {
  if ($("#previous-sample").val() !== "Select") {
    $("#btn-confirm-previous-import").removeClass("confirm-disabled");
    prevSamID = $("#previous-sample").val();
  } else {
    $("#btn-confirm-previous-import").addClass("confirm-disabled");
    prevSamID = "";
  }
}

// for "Done adding" button - subjects
function addSubject() {
  var subjectID = $("#bootbox-subject-id").val();
  addSubjectIDtoDataBase(subjectID);
  if (subjectsTableData.length !== 0) {
    $("#div-import-primary-folder-sub").hide();
  }
}

// for "Done adding" button - samples
function addSample() {
  var sampleID = $("#bootbox-sample-id").val();
  var subjectID = $("#bootbox-subject-id-samples").val();
  addSampleIDtoDataBase(sampleID, subjectID);
  if (samplesTableData.length !== 0) {
    $("#div-import-primary-folder-sam").hide();
  }
}

function warningBeforeHideForm(type) {
  Swal.fire({
    title: "Are you sure you want to cancel?",
    text: "This will reset your progress with the current subject_id.",
    icon: "warning",
    showCancelButton: true,
    showConfirmButton: true,
    confirmButtonText: "Yes, cancel",
    cancelButtonText: "No, stay here",
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  }).then((result) => {
    if (result.isConfirmed) {
      if (type === "subjects") {
        hideSubjectsForm();
      } else {
        hideSamplesForm();
      }
    }
  });
}

function hideSubjectsForm() {
  subjectsFormDiv.style.display = "none";
  $("#create_subjects-tab").addClass("show");
  $("#create_subjects-tab").css("display", "flex");
  $("#footer-div-subjects").css("display", "flex");
  $("#sidebarCollapse").prop("disabled", false);
  $("#btn-edit-subject").css("display", "none");
  $("#btn-add-subject").css("display", "inline-block");
}

function hideSamplesForm() {
  samplesFormDiv.style.display = "none";
  $("#create_samples-tab").addClass("show");
  $("#create_samples-tab").css("display", "flex");
  $("#footer-div-samples").css("display", "flex");
  $("#sidebarCollapse").prop("disabled", false);
  $("#btn-edit-sample").css("display", "none");
  $("#btn-add-sample").css("display", "inline-block");
}

function validateSubSamID(ev) {
  var regex = /^[a-zA-Z0-9-_]+$/;
  var id = $(ev).prop("id");
  var value = $("#" + id).val();
  //Validate TextBox value against the Regex.
  var isValid = regex.test(value);
  if (!isValid && value.trim() !== "") {
    $(ev).addClass("invalid");
    $("#para-" + id).css("display", "block");
  } else {
    $(ev).removeClass("invalid");
    $("#para-" + id).css("display", "none");
  }
}

function addNewIDToTable(newID, secondaryID, type) {
  var message = "";
  if (type === "subjects") {
    var keyword = "subject";
    var int = 1;
    var table = document.getElementById("table-subjects");
  } else if (type === "samples") {
    var keyword = "sample";
    var int = 1;
    var table = document.getElementById("table-samples");
  }
  var duplicate = false;
  var rowcount = table.rows.length;
  for (var i = 1; i < rowcount; i++) {
    if (newID === table.rows[i].cells[int].innerText) {
      duplicate = true;
      break;
    }
  }
  if (duplicate) {
    var message = `We detect duplicate ${keyword}_id(s). Please make sure ${keyword}_id(s) are unique before you generate.`;
  }
  var rowIndex = rowcount;
  var indexNumber = rowIndex;
  var currentRow = table.rows[table.rows.length - 1];
  // check for unique row id in case users delete old rows and append new rows (same IDs!)
  var newRowIndex = checkForUniqueRowID("row-current-" + keyword, rowIndex);
  if (type === "subjects") {
    var row = (table.insertRow(rowIndex).outerHTML =
      "<tr id='row-current-" +
      keyword +
      newRowIndex +
      "' class='row-" +
      type +
      "'><td class='contributor-table-row'>" +
      indexNumber +
      "</td><td>" +
      newID +
      "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='edit_current_" +
      keyword +
      "_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='copy_current_" +
      keyword +
      "_id(this)'><i class='fas fa-copy' style='color: orange'></i></button><button class='ui button' onclick='delete_current_" +
      keyword +
      "_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
  } else if (type === "samples") {
    var row = (table.insertRow(rowIndex).outerHTML =
      "<tr id='row-current-" +
      keyword +
      newRowIndex +
      "' class='row-" +
      type +
      "'><td class='contributor-table-row'>" +
      indexNumber +
      "</td><td>" +
      newID +
      "</td><td>" +
      secondaryID +
      "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='edit_current_" +
      keyword +
      "_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='copy_current_" +
      keyword +
      "_id(this)'><i class='fas fa-copy' style='color: orange'></i></button><button class='ui button' onclick='delete_current_" +
      keyword +
      "_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
  }
  return message;
}

function addNewIDToTableStrict(newID, secondaryID, type) {
  var message = "";
  if (type === "subjects") {
    var keyword = "subject";
    var int = 1;
    var table = document.getElementById("table-subjects");
  } else if (type === "samples") {
    var keyword = "sample";
    var int = 1;
    var table = document.getElementById("table-samples");
  }
  var duplicate = false;
  var rowcount = table.rows.length;
  for (var i = 1; i < rowcount; i++) {
    if (newID === table.rows[i].cells[int].innerText) {
      duplicate = true;
      break;
    }
  }
  if (duplicate) {
    var message = `We detect duplicate ${keyword}_id(s). Please make sure ${keyword}_id(s) are unique before you generate.`;
  }
  return message;
}

function addSubjectIDtoDataBase(id) {
  var table = document.getElementById("table-subjects");
  var duplicate = false;
  var error = "";
  var rowcount = table.rows.length;
  for (var i = 1; i < rowcount; i++) {
    if (id === table.rows[i].cells[1].innerText) {
      duplicate = true;
      break;
    }
  }
  if (id.trim() !== "") {
    if (!duplicate) {
      var message = addNewIDToTable(id, null, "subjects");
      addSubjectIDToJSON(id);
    } else {
      error =
        "A similar subject_id already exists. Please either delete the existing subject_id or choose a different subject_id.";
    }
  } else {
    error = "The subject_id is required to add a subject.";
  }
  if (error !== "") {
    Swal.fire("Failed to add the subject", error, "error");
  }
}

function addSampleIDtoDataBase(samID, subID) {
  var table = document.getElementById("table-samples");
  var duplicate = false;
  var error = "";
  var rowcount = table.rows.length;
  for (var i = 1; i < rowcount; i++) {
    if (samID === table.rows[i].cells[1].innerText) {
      duplicate = true;
      break;
    }
  }
  if (samID.trim() !== "" && subID.trim() !== "") {
    if (!duplicate) {
      var message = addNewIDToTable(samID.trim(), subID.trim(), "samples");
      addSampleIDtoJSON(samID.trim());
    } else {
      error =
        "A similar sample_id already exists. Please either delete the existing sample_id or choose a different sample_id.";
    }
  } else {
    error = "The subject_id and sample_id are required to add a sample.";
  }
  if (error !== "") {
    Swal.fire("Failed to add the sample", error, "error");
  }
}

function clearAllSubjectFormFields(form) {
  for (var field of $(form).children().find("input")) {
    $(field).val("");
  }
  for (var field of $(form).children().find("select")) {
    $(field).val("Select");
  }
}

// add new subject ID to JSON file (main file to be converted to excel)
function addSubjectIDToJSON(subjectID) {
  if ($("#form-add-a-subject").length > 0) {
    addTheRestSubjectEntriesToJSON();
  }
}

// populate RRID
function populateRRID(strain, type) {
  var rridHostname = "scicrunch.org";
  // this is to handle spaces and other special characters in strain name
  var encodedStrain = encodeURIComponent(strain);
  var rridInfo = {
    hostname: rridHostname,
    port: 443,
    path: `/api/1/dataservices/federation/data/nlx_154697-1?q=${encodedStrain}&key=2YOfdcQRDVN6QZ1V6x3ZuIAsuypusxHD`,
    headers: { accept: "text/xml" },
  };
  Swal.fire({
    title: `Retrieving RRID for ${strain}...`,
    allowEscapeKey: false,
    allowOutsideClick: false,
    html: "Please wait...",
    timer: 10000,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
    },
  }).then((result) => {});
  https.get(rridInfo, (res) => {
    if (res.statusCode === 200) {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (d) => {
        data += d;
      });
      res.on("end", () => {
        var returnRes = readXMLScicrunch(data, type);
        if (!returnRes) {
          Swal.fire({
            title: `Failed to retrieve the RRID for ${strain} from <a target="_blank" href="https://scicrunch.org/resources/Organisms/search">Scicrunch.org</a>.`,
            text: "Please make sure you enter the correct strain.",
            showCancelButton: false,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
          });
          if (type === "subjects") {
            $("#bootbox-subject-strain").val("");
            $("#bootbox-subject-strain-RRID").val("");
          } else if (type === "samples") {
            $("#bootbox-sample-strain").val("");
            $("#bootbox-sample-strain-RRID").val("");
          }
        } else {
          Swal.fire(
            `Successfully retrieved the RRID for "${strain}".`,
            "",
            "success"
          );
        }
      });
    } else {
      if (type === "subjects") {
        $("#bootbox-subject-strain").val("");
        $("#bootbox-subject-strain-RRID").val("");
      } else if (type === "samples") {
        $("#bootbox-sample-strain").val("");
        $("#bootbox-sample-strain-RRID").val("");
      }
      Swal.fire({
        title: `Failed to retrieve the RRID for "${strain}" from <a target="_blank" href="https://scicrunch.org/resources/Organisms/search">Scicrunch.org</a>.`,
        text: "Please check your Internet Connection or contact us at sodasparc@gmail.com",
        showCancelButton: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      });
    }
  });
}

function addTheRestSubjectEntriesToJSON() {
  var dataLength = subjectsTableData.length;
  var valuesArr = [];
  headersArrSubjects = [];
  for (var field of $("#form-add-a-subject")
    .children()
    .find(".subjects-form-entry")) {
    if (
      field.value === "" ||
      field.value === undefined ||
      field.value === "Select"
    ) {
      field.value = null;
    }
    headersArrSubjects.push(field.name);
    // if it's age, then add age info input (day/week/month/year)
    if (field.name === "Age") {
      if (
        $("#bootbox-subject-age-info").val() !== "Select" &&
        $("#bootbox-subject-age-info").val() !== "N/A"
      ) {
        field.value = field.value + " " + $("#bootbox-subject-age-info").val();
      } else {
        field.value = field.value;
      }
    }
    valuesArr.push(field.value);
  }
  subjectsTableData[0] = headersArrSubjects;
  if (valuesArr !== undefined && valuesArr.length !== 0) {
    if (subjectsTableData[dataLength] !== undefined) {
      subjectsTableData[dataLength + 1] = valuesArr;
    } else {
      subjectsTableData[dataLength] = valuesArr;
    }
  }
  $("#table-subjects").css("display", "block");
  $("#button-generate-subjects").css("display", "block");
  clearAllSubjectFormFields(subjectsFormDiv);
  hideSubjectsForm();
}

function addTheRestSampleEntriesToJSON() {
  var dataLength = samplesTableData.length;
  var valuesArr = [];
  headersArrSamples = [];
  for (var field of $("#form-add-a-sample")
    .children()
    .find(".samples-form-entry")) {
    if (
      field.value === "" ||
      field.value === undefined ||
      field.value === "Select"
    ) {
      field.value = null;
    }
    headersArrSamples.push(field.name);
    // if it's age, then add age info input (day/week/month/year)
    if (field.name === "Age") {
      if (
        $("#bootbox-sample-age-info").val() !== "Select" &&
        $("#bootbox-sample-age-info").val() !== "N/A"
      ) {
        field.value = field.value + " " + $("#bootbox-sample-age-info").val();
      } else {
        field.value = field.value;
      }
    }
    valuesArr.push(field.value);
  }
  samplesTableData[0] = headersArrSamples;
  if (valuesArr !== undefined && valuesArr.length !== 0) {
    if (samplesTableData[dataLength] !== undefined) {
      samplesTableData[dataLength + 1] = valuesArr;
    } else {
      samplesTableData[dataLength] = valuesArr;
    }
  }
  $("#table-samples").css("display", "block");
  $("#button-generate-samples").css("display", "block");
  clearAllSubjectFormFields(samplesFormDiv);
  hideSamplesForm();
}

function addSampleIDtoJSON(sampleID) {
  if ($("#form-add-a-sample").length > 0) {
    addTheRestSampleEntriesToJSON();
  }
}

// associated with the edit icon (edit a subject)
function edit_current_subject_id(ev) {
  var currentRow = $(ev).parents()[2];
  var subjectID = $(currentRow)[0].cells[1].innerText;
  loadSubjectInformation(ev, subjectID);
}
function edit_current_sample_id(ev) {
  var currentRow = $(ev).parents()[2];
  var subjectID = $(currentRow)[0].cells[2].innerText;
  var sampleID = $(currentRow)[0].cells[1].innerText;
  loadSampleInformation(ev, subjectID, sampleID);
}

async function edit_current_protocol_id(ev) {
  var currentRow = $(ev).parents()[2];
  var link = $(currentRow)[0].cells[1].innerText;
  var type = $(currentRow)[0].cells[2].innerText;
  var relation = $(currentRow)[0].cells[3].innerText;
  var desc = $(currentRow)[0].cells[4].innerText;

  const { value: values } = await Swal.fire({
    title: "Edit protocol",
    html:
    '<label>Protocol URL: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-protocol-link" class="swal2-input" placeholder="Enter a URL" value="'+link+'"/>' +
    '<label>Protocol Type: <i class="fas fa-info-circle swal-popover" data-content="This will state whether your protocol is a \'URL\' or \'DOI\' item. Use one of those two items to reference the type of identifier." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-protocol-link-select" class="swal2-input"><option value="Select">Select a type</option><option value="URL">URL</option><option value="DOI">DOI</option></select>' +
    '<label>Relation to the dataset: <i class="fas fa-info-circle swal-popover" data-content="A prespecified list of relations for common protocols used in SPARC datasets. </br> The value in this field must be read as the \'relationship that this dataset has to the specified protocol\'." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-protocol-link-relation" class="swal2-input"><option value="Select">Select a relation</option><option value="IsProtocolFor">IsProtocolFor</option><option value="HasProtocol">HasProtocol</option><option value="IsSoftwareFor">IsSoftwareFor</option><option value="HasSoftware">HasSoftware</option></select>' +
    '<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description">'+ desc +'</textarea>',
    focusConfirm: false,
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    reverseButtons: reverseSwalButtons,
    onOpen: () => {
      $("#DD-protocol-link-select").val(type);
      $("#DD-protocol-link-relation").val(relation);
    },
    preConfirm: () => {
      if ($("#DD-protocol-link").val() === "") {
        Swal.showValidationMessage(`Please enter a link!`);
      }
      if ($("#DD-protocol-link-select").val() === "Select") {
        Swal.showValidationMessage(`Please choose a link type!`);
      }
      if ($("#DD-protocol-link-relation").val() === "Select") {
        Swal.showValidationMessage(`Please choose a link relation!`);
      }
      if ($("#DD-protocol-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description!`);
      }
      return [
        $("#DD-protocol-link").val(),
        $("#DD-protocol-link-select").val(),
        $("#DD-protocol-link-relation").val(),
        $("#DD-protocol-description").val()
      ];
    },
  });
  if (values) {
    $(currentRow)[0].cells[1].innerHTML =
      "<a href='" + values[0] + "' target='_blank'>" + values[0] + "</a>";
    $(currentRow)[0].cells[2].innerHTML = values[1];
    $(currentRow)[0].cells[3].innerHTML = values[2];
    $(currentRow)[0].cells[4].innerText = values[3];
  }
}

async function edit_current_additional_link_id(ev) {
  var currentRow = $(ev).parents()[2];
  var link = $(currentRow)[0].cells[1].innerText;
  var linkType = $(currentRow)[0].cells[2].innerText;
  var linkRelation = $(currentRow)[0].cells[3].innerText;
  var desc = $(currentRow)[0].cells[4].innerText;
  const { value: values } = await Swal.fire({
    title: "Edit link",
    html:
    '<label>URL or DOI: <i class="fas fa-info-circle swal-popover" data-content="Specify your actual URL (if resource is public) or DOI (if resource is private). This can be web links to repositories or papers (DOI)."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-other-link" class="swal2-input" placeholder="Enter a URL" value="'+link+'"/>' +
    '<label>Link Type: <i class="fas fa-info-circle swal-popover" data-content="This will state whether your link is a \'URL\' or \'DOI\' item. Use one of those two items to reference the type of link." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-other-link-type" class="swal2-input"><option value="Select">Select a type</option><option value="URL">URL</option><option value="DOI">DOI</option></select>' +
    '<label>Relation to the dataset: <i class="fas fa-info-circle swal-popover" data-content="A prespecified list of relations for common URLs or DOIs used in SPARC datasets. </br> The value in this field must be read as the \'relationship that this dataset has to the specified URL/DOI\'."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-other-link-relation" class="swal2-input"><option value="Select">Select a relation</option><option value="IsCitedBy">IsCitedBy</option><option value="Cites">Cites</option><option value="IsSupplementTo">IsSupplementTo</option><option value="IsSupplementedBy">IsSupplementedBy</option><option value="IsContinuedByContinues">IsContinuedByContinues</option><option value="IsDescribedBy">IsDescribedBy</option><option value="Describes">Describes</option><option value="HasMetadata">HasMetadata</option><option value="IsMetadataFor">IsMetadataFor</option><option value="HasVersion">HasVersion</option><option value="IsVersionOf">IsVersionOf</option><option value="IsNewVersionOf">IsNewVersionOf</option><option value="IsPreviousVersionOf">IsPreviousVersionOf</option><option value="IsPreviousVersionOf">IsPreviousVersionOf</option><option value="HasPart">HasPart</option><option value="IsPublishedIn">IsPublishedIn</option><option value="IsReferencedBy">IsReferencedBy</option><option value="References">References</option><option value="IsDocumentedBy">IsDocumentedBy</option><option value="Documents">Documents</option><option value="IsCompiledBy">IsCompiledBy</option><option value="Compiles">Compiles</option><option value="IsVariantFormOf">IsVariantFormOf</option><option value="IsOriginalFormOf">IsOriginalFormOf</option><option value="IsIdenticalTo">IsIdenticalTo</option><option value="IsReviewedBy">IsReviewedBy</option><option value="Reviews">Reviews</option><option value="IsDerivedFrom">IsDerivedFrom</option><option value="IsSourceOf">IsSourceOf</option><option value="IsRequiredBy">IsRequiredBy</option><option value="Requires">Requires</option><option value="IsObsoletedBy">IsObsoletedBy</option><option value="Obsoletes">Obsoletes</option></select>' +
    '<label>Link description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-other-description" class="swal2-textarea" placeholder="Enter a description">'+desc+'</textarea>',
    focusConfirm: false,
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $("#DD-other-link-type").val(linkType);
      $("#DD-other-link-relation").val(linkRelation);
    },
    preConfirm: () => {
      if ($("#DD-other-link-type").val() === "Select") {
        Swal.showValidationMessage(`Please select a type of links!`);
      }
      if ($("#DD-other-link").val() === "") {
        Swal.showValidationMessage(`Please enter a link.`);
      }
      if ($("#DD-other-link-relation").val() === "Select") {
        Swal.showValidationMessage(`Please enter a link relation.`);
      }
      if ($("#DD-other-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description.`);
      }
      return [
        $("#DD-other-link").val(),
        $("#DD-other-link-type").val(),
        $("#DD-other-link-relation").val(),
        $("#DD-other-description").val()
      ];
    },
  });
  if (values) {
    // $(currentRow)[0].cells[1].innerText = values[0];
    $(currentRow)[0].cells[1].innerHTML =
      "<a href='" + values[0] + "' target='_blank'>" + values[0] + "</a>";
    $(currentRow)[0].cells[2].innerText = values[1];
    $(currentRow)[0].cells[3].innerText = values[2];
    $(currentRow)[0].cells[4].innerText = values[3];
  }
}

function loadSubjectInformation(ev, subjectID) {
  // 1. load fields for form
  showForm("display", true);
  $("#btn-edit-subject").css("display", "inline-block");
  $("#btn-add-subject").css("display", "none");
  clearAllSubjectFormFields(subjectsFormDiv);
  populateForms(subjectID, "");
  $("#btn-edit-subject").unbind("click");
  $("#btn-edit-subject").click(function () {
    editSubject(ev, subjectID);
  });
  $("#new-custom-header-name").keyup(function () {
    var customName = $(this).val().trim();
    if (customName !== "") {
      $("#button-confirm-custom-header-name").show();
    } else {
      $("#button-confirm-custom-header-name").hide();
    }
  });
}

function populateForms(subjectID, type) {
  if (subjectID !== "clear" && subjectID.trim() !== "") {
    var infoJson = [];
    if (subjectsTableData.length > 1) {
      for (var i = 1; i < subjectsTableData.length; i++) {
        if (subjectsTableData[i][0] === subjectID) {
          infoJson = subjectsTableData[i];
          break;
        }
      }
    }
    // populate form
    var fieldArr = $(subjectsFormDiv).children().find(".subjects-form-entry");
    var emptyEntries = ["nan", "nat"];
    var c = fieldArr.map(function (i, field) {
      if (infoJson[i]) {
        if (!emptyEntries.includes(infoJson[i].toLowerCase())) {
          if (field.name === "Age") {
            var fullAge = infoJson[i].split(" ");
            var unitArr = ["hours", "days", "weeks", "months", "years"];
            var breakBoolean = false;
            field.value = fullAge[0];
            for (var unit of unitArr) {
              if (fullAge[1]) {
                if (unit.includes(fullAge[1].toLowerCase())) {
                  $("#bootbox-subject-age-info").val(unit);
                  breakBoolean = true;
                  break;
                }
                if (!breakBoolean) {
                  $("#bootbox-subject-age-info").val("N/A");
                }
              } else {
                $("#bootbox-subject-age-info").val("N/A");
              }
            }
          } else {
            if (type === "import") {
              if (field.name === "subject id") {
                field.value = "";
              } else {
                field.value = infoJson[i];
              }
            } else {
              field.value = infoJson[i];
            }
          }
        } else {
          field.value = "";
        }
      }
    });
  }
}

function populateFormsSamples(subjectID, sampleID, type) {
  if (sampleID !== "clear" && sampleID.trim() !== "") {
    var infoJson = [];
    if (samplesTableData.length > 1) {
      for (var i = 1; i < samplesTableData.length; i++) {
        if (
          samplesTableData[i][0] === subjectID &&
          samplesTableData[i][1] === sampleID
        ) {
          infoJson = samplesTableData[i];
          break;
        }
      }
    }
    // populate form
    var fieldArr = $(samplesFormDiv).children().find(".samples-form-entry");
    var emptyEntries = ["nan", "nat"];
    var c = fieldArr.map(function (i, field) {
      if (infoJson[i]) {
        if (!emptyEntries.includes(infoJson[i].toLowerCase())) {
          if (field.name === "Age") {
            var fullAge = infoJson[i].split(" ");
            var unitArr = ["hours", "days", "weeks", "months", "years"];
            var breakBoolean = false;
            field.value = fullAge[0];
            if (fullAge[1]) {
              for (var unit of unitArr) {
                if (unit.includes(fullAge[1].toLowerCase())) {
                  $("#bootbox-sample-age-info").val(unit);
                  breakBoolean = true;
                  break;
                }
                if (!breakBoolean) {
                  $("#bootbox-sample-age-info").val("N/A");
                }
              }
            } else {
              $("#bootbox-sample-age-info").val("N/A");
            }
          } else {
            if (type === "import") {
              if (field.name === "subject id") {
                field.value = "";
              } else if (field.name === "sample id") {
                field.value = "";
              } else {
                field.value = infoJson[i];
              }
            } else {
              field.value = infoJson[i];
            }
          }
        } else {
          field.value = "";
        }
      }
    });
  }
}

function loadSampleInformation(ev, subjectID, sampleID) {
  // 1. load fields for form
  showFormSamples("display", true);
  $("#btn-edit-sample").css("display", "inline-block");
  $("#btn-add-sample").css("display", "none");
  clearAllSubjectFormFields(samplesFormDiv);
  populateFormsSamples(subjectID, sampleID, "");
  $("#btn-edit-sample").unbind("click");
  $("#btn-edit-sample").click(function () {
    editSample(ev, sampleID);
  });
  $("#new-custom-header-name-samples").keyup(function () {
    var customName = $(this).val().trim();
    if (customName !== "") {
      $("#button-confirm-custom-header-name-samples").show();
    } else {
      $("#button-confirm-custom-header-name-samples").hide();
    }
  });
}

function editSubject(ev, subjectID) {
  for (var field of $("#form-add-a-subject")
    .children()
    .find(".subjects-form-entry")) {
    if (
      field.value.trim() !== "" &&
      field.value !== undefined &&
      field.value !== "Select"
    ) {
      // if it's age, then add age info input (day/week/month/year)
      if (field.name === "Age") {
        if ($("#bootbox-subject-age-info").val() !== "Select") {
          field.value =
            field.value + " " + $("#bootbox-subject-age-info").val();
        }
      }
      subjectsFileData.push(field.value);
    } else {
      subjectsFileData.push("");
    }
  }
  var currentRow = $(ev).parents()[2];
  var newID = $("#bootbox-subject-id").val();
  if (newID === subjectID) {
    for (var i = 1; i < subjectsTableData.length; i++) {
      if (subjectsTableData[i][0] === subjectID) {
        subjectsTableData[i] = subjectsFileData;
        break;
      }
    }
    hideSubjectsForm();
  } else {
    var table = document.getElementById("table-subjects");
    var duplicate = false;
    var error = "";
    var rowcount = table.rows.length;
    for (var i = 1; i < rowcount; i++) {
      if (newID === table.rows[i].cells[1].innerText) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) {
      error =
        "A similar subject_id already exists. Please either delete the existing subject_id or choose a different subject_id.";
      Swal.fire("Duplicate subject_id", error, "error");
    } else {
      for (var i = 1; i < subjectsTableData.length; i++) {
        if (subjectsTableData[i][0] === subjectID) {
          subjectsTableData[i] = subjectsFileData;
          break;
        }
      }
      $(currentRow)[0].cells[1].innerText = newID;
      hideSubjectsForm();
    }
  }
  subjectsFileData = [];
}

function editSample(ev, sampleID) {
  for (var field of $("#form-add-a-sample")
    .children()
    .find(".samples-form-entry")) {
    if (
      field.value.trim() !== "" &&
      field.value !== undefined &&
      field.value !== "Select"
    ) {
      samplesFileData.push(field.value);
    } else {
      samplesFileData.push("");
    }
  }
  var currentRow = $(ev).parents()[2];
  var newID = $("#bootbox-sample-id").val();
  if (newID === sampleID) {
    for (var i = 1; i < samplesTableData.length; i++) {
      if (samplesTableData[i][1] === sampleID) {
        samplesTableData[i] = samplesFileData;
        break;
      }
    }
    hideSamplesForm();
  } else {
    var table = document.getElementById("table-samples");
    var duplicate = false;
    var error = "";
    var rowcount = table.rows.length;
    for (var i = 1; i < rowcount; i++) {
      if (newID === table.rows[i].cells[1].innerText) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) {
      error =
        "A similar sample_id already exists. Please either delete the existing sample_id or choose a different sample_id.";
      Swal.fire("Duplicate sample_id", error, "error");
    } else {
      for (var i = 1; i < samplesTableData.length; i++) {
        if (samplesTableData[i][1] === sampleID) {
          samplesTableData[i] = samplesFileData;
          break;
        }
      }
      $(currentRow)[0].cells[1].innerText = newID;
      hideSamplesForm();
    }
  }
  samplesFileData = [];
}

function delete_current_subject_id(ev) {
  Swal.fire({
    title: "Are you sure you want to delete this subject?",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: `No!`,
    cancelButtonColor: "#f44336",
    confirmButtonColor: "#3085d6",
    reverseButtons: reverseSwalButtons,
    confirmButtonText: "Yes",
  }).then((boolean) => {
    if (boolean.isConfirmed) {
      // 1. Delete from table
      var currentRow = $(ev).parents()[2];
      var currentRowid = $(currentRow).prop("id");
      document.getElementById(currentRowid).outerHTML = "";
      updateIndexForTable(document.getElementById("table-subjects"));
      // 2. Delete from JSON
      var subjectID = $(currentRow)[0].cells[1].innerText;
      for (var i = 1; i < subjectsTableData.length; i++) {
        if (subjectsTableData[i][0] === subjectID) {
          subjectsTableData.splice(i, 1);
          break;
        }
      }
    }
  });
}

function delete_current_sample_id(ev) {
  Swal.fire({
    title: "Are you sure you want to delete this sample?",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: `No!`,
    cancelButtonColor: "#f44336",
    confirmButtonColor: "#3085d6",
    reverseButtons: reverseSwalButtons,
    confirmButtonText: "Yes",
  }).then((boolean) => {
    if (boolean.isConfirmed) {
      // 1. Delete from table
      var currentRow = $(ev).parents()[2];
      var currentRowid = $(currentRow).prop("id");
      document.getElementById(currentRowid).outerHTML = "";
      updateIndexForTable(document.getElementById("table-samples"));
      // 2. Delete from JSON
      var sampleId = $(currentRow)[0].cells[1].innerText;
      for (var i = 1; i < samplesTableData.length; i++) {
        if (samplesTableData[i][1] === sampleId) {
          samplesTableData.splice(i, 1);
          break;
        }
      }
    }
  });
}

function delete_current_protocol_id(ev) {
  Swal.fire({
    title: "Are you sure you want to delete this protocol?",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: `No!`,
    cancelButtonColor: "#f44336",
    confirmButtonColor: "#3085d6",
    reverseButtons: reverseSwalButtons,
    confirmButtonText: "Yes",
  }).then((boolean) => {
    if (boolean.isConfirmed) {
      // 1. Delete from table
      var currentRow = $(ev).parents()[2];
      var currentRowid = $(currentRow).prop("id");
      document.getElementById(currentRowid).outerHTML = "";
      updateIndexForTable(document.getElementById("protocol-link-table-dd"));
    }
  });
}

function delete_current_additional_link_id(ev) {
  Swal.fire({
    title: "Are you sure you want to delete this link?",
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    cancelButtonText: `No!`,
    cancelButtonColor: "#f44336",
    confirmButtonColor: "#3085d6",
    confirmButtonText: "Yes",
    reverseButtons: reverseSwalButtons,
  }).then((boolean) => {
    if (boolean.isConfirmed) {
      // 1. Delete from table
      var currentRow = $(ev).parents()[2];
      var currentRowid = $(currentRow).prop("id");
      document.getElementById(currentRowid).outerHTML = "";
      updateIndexForTable(document.getElementById("other-link-table-dd"));
    }
  });
}

async function copy_current_subject_id(ev) {
  const { value: newSubject } = await Swal.fire({
    title: "Copying information from this subject: ",
    text: "Enter an ID for the new subject: ",
    input: "text",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    inputValidator: (value) => {
      if (!value) {
        return "Please enter an ID";
      }
    },
  });
  if (newSubject && newSubject !== "") {
    // // add new row to table
    var message = addNewIDToTableStrict(newSubject, null, "subjects");
    if (message !== "") {
      Swal.fire(message, "", "warning");
    } else {
      var res = addNewIDToTable(newSubject, null, "subjects");
      // add new subject_id to JSON
      // 1. copy from current ev.id (the whole array)
      var currentRow = $(ev).parents()[2];
      var id = currentRow.cells[1].innerText;
      // 2. append that to the end of matrix
      for (var subArr of subjectsTableData.slice(1)) {
        if (subArr[0] === id) {
          var ind = subjectsTableData.indexOf(subArr);
          var newArr = [...subjectsTableData[ind]];
          subjectsTableData.push(newArr);
          // 3. change first entry of that array
          subjectsTableData[subjectsTableData.length - 1][0] = newSubject;
          break;
        }
      }
    }
  }
}

async function copy_current_sample_id(ev) {
  const { value: newSubSam } = await Swal.fire({
    title: "Copying information from this sample: ",
    text: "Enter an ID for the new subject and sample: ",
    html:
      '<input id="new-subject" class="swal2-input" placeholder="Subject ID">' +
      '<input id="new-sample" class="swal2-input" placeholder="Sample ID">',
    focusConfirm: false,
    preConfirm: () => {
      return [
        document.getElementById("new-subject").value,
        document.getElementById("new-sample").value,
      ];
    },
  });
  if (newSubSam && (newSubSam[0] !== "") & (newSubSam[1] !== "")) {
    var message = addNewIDToTableStrict(newSubSam[1], newSubSam[0], "samples");
    if (message !== "") {
      Swal.fire(message, "", "warning");
    } else {
      var res = addNewIDToTable(newSubSam[1], newSubSam[0], "samples");
      // // add new row to table
      // add new subject_id to JSON
      // 1. copy from current ev.id (the whole array)
      var currentRow = $(ev).parents()[2];
      var id1 = currentRow.cells[1].innerText;
      var id2 = currentRow.cells[2].innerText;
      // 2. append that to the end of matrix
      for (var samArr of samplesTableData.slice(1)) {
        if (samArr[0] === id1 && samArr[1] === id2) {
          var ind = samplesTableData.indexOf(samArr);
          var newArr = [...samplesTableData[ind]];
          samplesTableData.push(newArr);
          // 3. change first entry of that array
          samplesTableData[samplesTableData.length - 1][0] = newSubSam[0];
          samplesTableData[samplesTableData.length - 1][1] = newSubSam[1];
          break;
        }
      }
    }
  }
}

function updateIndexForTable(table) {
  // disable table to prevent further row-moving action before the updateIndexForTable finishes
  if (table === document.getElementById("table-subjects")) {
    $("#table-subjects").css("pointer-events", "none");
  } else if (table === document.getElementById("table-samples")) {
    $("#table-samples").css("pointer-events", "none");
  }
  var rowcount = table.rows.length;
  var index = 1;
  for (var i = 1; i < rowcount; i++) {
    table.rows[i].cells[0].innerText = index;
    index = index + 1;
  }
  if (rowcount === 1) {
    table.style.display = "none";
    if (table === document.getElementById("table-subjects")) {
      $("#button-generate-subjects").css("display", "none");
    } else if (table === document.getElementById("table-samples")) {
      $("#button-generate-samples").css("display", "none");
    } else if (
      table === document.getElementById("table-current-contributors")
    ) {
      document.getElementById("div-contributor-table-dd").style.display =
        "none";
    } else if (table === document.getElementById("protocol-link-table-dd")) {
      document.getElementById("protocol-link-table-dd").style.display = "none";
      document.getElementById("div-protocol-link-table-dd").style.display = "none";
    } else if (table === document.getElementById("other-link-table-dd")) {
      document.getElementById("other-link-table-dd").style.display = "none";
      document.getElementById("div-other-link-table-dd").style.display =
        "none";
    }
  }
  $("#table-subjects").css("pointer-events", "auto");
  $("#table-samples").css("pointer-events", "auto");
}

function updateOrderIDTable(table, json, type) {
  var length = table.rows.length;
  // 1. make a new json object - orderedTableData
  var orderedTableData = [];
  // 2. add headers as the first array
  orderedTableData[0] = json[0];
  // 3. loop through the UI table by index -> grab subject_id accordingly, find subject_id in json, append that to orderedSubjectsTableData
  i = 1;
  for (var index = 1; index < length; index++) {
    var id = table.rows[index].cells[1].innerText;
    for (var ind of json.slice(1)) {
      if (ind[1] === id) {
        orderedTableData[i] = ind;
        i += 1;
        break;
      }
    }
  }
  if (type === "subjects") {
    subjectsTableData = orderedTableData;
  } else if (type === "samples") {
    samplesTableData = orderedTableData;
  }
}

function updateOrderContributorTable(table, json) {
  var length = table.rows.length;
  // 1. make a new json object - orderedTableData
  var orderedTableData = [];
  // 2. loop through the UI table by index -> grab subject_id accordingly, find subject_id in json, append that to orderedSubjectsTableData
  i = 0;
  for (var index = 1; index < length; index++) {
    var name = table.rows[index].cells[1].innerText;
    for (var con of json) {
      if (con.conName === name) {
        orderedTableData[i] = con;
        i += 1;
        break;
      }
    }
  }
  contributorArray = orderedTableData;
}

function generateSubjects() {
  ipcRenderer.send("open-folder-dialog-save-subjects", "subjects.xlsx");
}

function generateSamples() {
  ipcRenderer.send("open-folder-dialog-save-samples", "samples.xlsx");
}

function showPrimaryBrowseFolder() {
  ipcRenderer.send("open-file-dialog-local-primary-folder");
}
function showPrimaryBrowseFolderSamples() {
  ipcRenderer.send("open-file-dialog-local-primary-folder-samples");
}

function importPrimaryFolderSubjects(folderPath) {
  headersArrSubjects = [];
  for (var field of $("#form-add-a-subject")
    .children()
    .find(".subjects-form-entry")) {
    if (
      field.value === "" ||
      field.value === undefined ||
      field.value === "Select"
    ) {
      field.value = null;
    }
    headersArrSubjects.push(field.name);
  }
  if (folderPath === "Browse here") {
    Swal.fire({
      title: "No folder chosen",
      text: "Please select a path to your primary folder.",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error"
    })
  } else {
    if (path.parse(folderPath).base !== "primary") {
      Swal.fire({
        title: "Incorrect folder name",
        text: "Your folder must be named 'primary' to be imported to SODA.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error"
      })
    } else {
      var folders = fs.readdirSync(folderPath);
      var j = 1;
      subjectsTableData[0] = headersArrSubjects;
      for (var folder of folders) {
        subjectsFileData = [];
        var stats = fs.statSync(path.join(folderPath, folder));
        if (stats.isDirectory()) {
          subjectsFileData[0] = folder;
          for (var i = 1; i < 26; i++) {
            subjectsFileData.push("");
          }
          subjectsTableData[j] = subjectsFileData;
          j += 1;
        }
      }
      subjectsFileData = [];
      var subIDArray = [];
      // grab and confirm with users about their sub-ids
      for (var index of subjectsTableData.slice(1)) {
        subIDArray.push(index[0]);
      }
      Swal.fire({
        title: "Please confirm the subject id(s) below:",
        text: "The subject_ids are: " + subIDArray.join(", "),
        icon: "warning",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        showCancelButton: true,
        reverseButtons: reverseSwalButtons,
        showConfirmButton: true,
        confirmButtonText: "Yes, correct",
        cancelButtonText: "No",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      }).then((result) => {
        if (result.isConfirmed) {
          if (subjectsTableData.length > 1) {
            loadSubjectsDataToTable();
            $("#table-subjects").show();
            $("#div-import-primary-folder-sub").hide();
          } else {
            Swal.fire(
              "Could not load subject IDs from the imported primary folder!",
              "Please check that you provided the correct path to a SPARC primary folder that has at least 1 subject folder.",
              "error"
            );
          }
        }
      });
    }
  }
}
function importPrimaryFolderSamples(folderPath) {
  headersArrSamples = [];
  for (var field of $("#form-add-a-sample")
    .children()
    .find(".samples-form-entry")) {
    if (
      field.value === "" ||
      field.value === undefined ||
      field.value === "Select"
    ) {
      field.value = null;
    }
    headersArrSamples.push(field.name);
  }
  // var folderPath = $("#primary-folder-destination-input-samples").prop("placeholder");
  if (folderPath === "Browse here") {
    Swal.fire({
      title: "No folder chosen",
      text: "Please select a path to your primary folder.",
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      icon: "error"
    })
  } else {
    if (path.parse(folderPath).base !== "primary") {
      Swal.fire({
        title: "Incorrect folder name",
        text: "Your folder must be named 'primary' to be imported to SODA.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error"
      })
    } else {
      var folders = fs.readdirSync(folderPath);
      var j = 1;
      samplesTableData[0] = headersArrSamples;
      for (var folder of folders) {
        samplesFileData = [];
        var statsSubjectID = fs.statSync(path.join(folderPath, folder));
        if (statsSubjectID.isDirectory()) {
          samplesFileData[0] = folder;
          var subjectFolder = fs.readdirSync(path.join(folderPath, folder));
          for (var subfolder of subjectFolder) {
            var statsSampleID = fs.statSync(
              path.join(folderPath, folder, subfolder)
            );
            if (statsSampleID.isDirectory()) {
              samplesFileData[1] = subfolder;
            }
          }
          for (var i = 2; i < 18; i++) {
            samplesFileData.push("");
          }
          samplesTableData[j] = samplesFileData;
          j += 1;
        }
      }
      samplesFileData = [];
      var subIDArray = [];
      var samIDArray = [];
      // grab and confirm with users about their sub-ids
      for (var index of samplesTableData.slice(1)) {
        subIDArray.push(index[0]);
        samIDArray.push(index[1]);
      }
      Swal.fire({
        title: "Please confirm the subject id(s) and sample id(s) below:",
        html:
          "The subject_id(s) are: " +
          subIDArray.join(", ") +
          "<br> The sample_id(s) are: " +
          samIDArray.join(", "),
        icon: "warning",
        showCancelButton: true,
        reverseButtons: reverseSwalButtons,
        showConfirmButton: true,
        confirmButtonText: "Yes, correct",
        cancelButtonText: "No",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
      }).then((result) => {
        if (result.isConfirmed) {
          if (samplesTableData.length > 1) {
            loadSamplesDataToTable();
            $("#table-samples").show();
            $("#div-import-primary-folder-sam").hide();
            // $("#div-confirm-primary-folder-import-samples").hide();
            // $("#button-fake-confirm-primary-folder-load-samples").click();
          } else {
            Swal.fire(
              "Could not load samples IDs from the imported primary folder!",
              "Please check that you provided the correct path to a SPARC primary folder that has at least 1 subject folder and 1 sample folder.",
              "error"
            );
          }
        }
      });
    }
  }
}

function loadSubjectsDataToTable() {
  var iconMessage = "success";
  var showConfirmButtonBool = false;
  var text =
    "Please add or edit your subject_id(s) in the following subjects table.";
  // delete table rows except headers
  $("#table-subjects tr:gt(0)").remove();
  for (var i = 1; i < subjectsTableData.length; i++) {
    var message = addNewIDToTable(subjectsTableData[i][0], null, "subjects");
  }
  if (message !== "") {
    Swal.fire({
      title: "Loaded successfully!",
      text: message,
      icon: "warning",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
  } else {
    Swal.fire({
      title: "Loaded successfully!",
      text: "Please add or edit your subject_id(s) in the following subjects table.",
      icon: "success",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
  }
  Swal.fire({
    title: "Loaded successfully!",
    text: text,
    icon: iconMessage,
    showConfirmButton: showConfirmButtonBool,
    timer: 1200,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  });
  $("#button-generate-subjects").css("display", "block");
  $("#div-import-primary-folder-sub").hide();
}

function loadSamplesDataToTable() {
  // delete table rows except headers
  $("#table-samples tr:gt(0)").remove();
  for (var i = 1; i < samplesTableData.length; i++) {
    var message = addNewIDToTable(
      samplesTableData[i][1],
      samplesTableData[i][0],
      "samples"
    );
  }
  if (message !== "") {
    Swal.fire({
      title: "Loaded successfully!",
      text: message,
      icon: "warning",
      showConfirmButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
  } else {
    Swal.fire({
      title: "Loaded successfully!",
      text: "Please add or edit your sample_id(s) in the following samples table.",
      icon: "success",
      showConfirmButton: false,
      timer: 1200,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
    });
  }
  $("#button-generate-samples").css("display", "block");
  $("#div-import-primary-folder-sam").hide();
}

function resetSubjects() {
  Swal.fire({
    text: "Are you sure you want to start over and reset your progress?",
    icon: "warning",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "I want to start over",
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. remove Prev and Show from all individual-question except for the first one
      // 2. empty all input, textarea, select, para-elements
      $("#Question-prepare-subjects-1").removeClass("prev");
      $("#Question-prepare-subjects-1").nextAll().removeClass("show");
      $("#Question-prepare-subjects-1").nextAll().removeClass("prev");
      $("#Question-prepare-subjects-1 .option-card")
        .removeClass("checked")
        .removeClass("disabled")
        .removeClass("non-selected");
      $("#Question-prepare-subjects-1 .option-card .folder-input-check").prop(
        "checked",
        false
      );
      $("#Question-prepare-subjects-2").find("button").show();
      $("#div-confirm-primary-folder-import").find("button").hide();

      $("#Question-prepare-subjects-primary-import")
        .find("input")
        .prop("placeholder", "Browse here");
      subjectsFileData = [];
      subjectsTableData = [];

      // delete custom fields (if any)
      var fieldLength = $(".subjects-form-entry").length;
      if (fieldLength > 18) {
        for (var field of $(".subjects-form-entry").slice(18, fieldLength)) {
          $($(field).parents()[2]).remove();
        }
      }

      // delete table rows except headers
      $("#table-subjects tr:gt(0)").remove();
      $("#table-subjects").css("display", "none");

      $("#div-import-primary-folder-sub").show();

      // Hide Generate button
      $("#button-generate-subjects").css("display", "none");
    }
  });
}

function resetSamples() {
  Swal.fire({
    text: "Are you sure you want to start over and reset your progress?",
    icon: "warning",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "I want to start over",
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. remove Prev and Show from all individual-question except for the first one
      // 2. empty all input, textarea, select, para-elements
      $("#Question-prepare-samples-1").removeClass("prev");
      $("#Question-prepare-samples-1").nextAll().removeClass("show");
      $("#Question-prepare-samples-1").nextAll().removeClass("prev");
      $("#Question-prepare-samples-1 .option-card")
        .removeClass("checked")
        .removeClass("disabled")
        .removeClass("non-selected");
      $("#Question-prepare-samples-1 .option-card .folder-input-check").prop(
        "checked",
        false
      );
      $("#Question-prepare-samples-2").find("button").show();
      $("#div-confirm-primary-folder-import-samples").find("button").hide();

      $("#Question-prepare-subjects-primary-import-samples")
        .find("input")
        .prop("placeholder", "Browse here");
      samplesFileData = [];
      samplesTableData = [];

      // delete custom fields (if any)
      var fieldLength = $(".samples-form-entry").length;
      if (fieldLength > 21) {
        for (var field of $(".samples-form-entry").slice(21, fieldLength)) {
          $($(field).parents()[2]).remove();
        }
      }
      $("#div-import-primary-folder-sam").show();
      // delete table rows except headers
      $("#table-samples tr:gt(0)").remove();
      $("#table-samples").css("display", "none");
      // Hide Generate button
      $("#button-generate-samples").css("display", "none");
    }
  });
}

// functions below are to show/add/cancel a custom header
async function addCustomField(type) {
  if (type === "subjects") {
    var lowercaseCasedArray = $.map(headersArrSubjects, function (item, index) {
      return item.toLowerCase();
    });
    const { value: customField } = await Swal.fire({
      title: "Enter a custom field:",
      input: "text",
      showCancelButton: true,
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      inputValidator: (value) => {
        if (!value) {
          return "Please enter a custom field";
        } else {
          if (lowercaseCasedArray.includes(value.toLowerCase())) {
            return "Duplicate field name! <br> You entered a custom field that is already listed.";
          }
        }
      },
    });
    if (customField) {
      addCustomHeader("subjects", customField);
    }
  } else if (type === "samples") {
    var lowercaseCasedArray = $.map(headersArrSamples, function (item, index) {
      return item.toLowerCase();
    });
    const { value: customField } = await Swal.fire({
      title: "Enter a custom field:",
      input: "text",
      showCancelButton: true,
      reverseButtons: reverseSwalButtons,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      inputValidator: (value) => {
        if (!value) {
          return "Please enter a custom field";
        } else {
          if (headersArrSamples.includes(value.toLowerCase())) {
            return "Duplicate field name! <br> You entered a custom field that is already listed.";
          }
        }
      },
    });
    if (customField) {
      addCustomHeader("samples", customField);
    }
  }
}

function addCustomHeader(type, customHeaderValue) {
  var customName = customHeaderValue.trim();
  if (type === "subjects") {
    var divElement =
      '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">' +
      customName +
      ':</font></div></div><div class="demo-controls-body"><div class="ui input modified"><input class="subjects-form-entry" type="text" placeholder="Type here..." id="bootbox-subject-' +
      customName +
      '" name="' +
      customName +
      '"></input></div></div><div class="tooltipnew demo-controls-end"><svg onclick="deleteCustomField(this, \'' +
      customName +
      '\', 0)" style="cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash custom-fields" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></div></div>';
    $("#accordian-custom-fields").append(divElement);
    headersArrSubjects.push(customName);
    // add empty entries for all of the other sub_ids to normalize the size of matrix
    for (var subId of subjectsTableData.slice(1, subjectsTableData.length)) {
      subId.push("");
    }
  } else if (type === "samples") {
    var divElement =
      '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">' +
      customName +
      ':</font></div></div><div class="demo-controls-body"><div class="ui input modified"><input class="samples-form-entry" type="text" placeholder="Type here..." id="bootbox-subject-' +
      customName +
      '" name="' +
      customName +
      '"></input></div></div><div class="tooltipnew demo-controls-end"><svg onclick="deleteCustomField(this, \'' +
      customName +
      '\', 1)" style="cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash custom-fields" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></div></div>';
    $("#accordian-custom-fields-samples").append(divElement);
    headersArrSamples.push(customName);
    // add empty entries for all of the other sub_ids to normalize the size of matrix
    for (var sampleId of samplesTableData.slice(1, samplesTableData.length)) {
      sampleId.push("");
    }
  }
}

function deleteCustomField(ev, customField, category) {
  //  category 0 => subjects;
  // category 1 => samples
  Swal.fire({
    text: "Are you sure you want to delete this custom field?",
    icon: "warning",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText: "Yes",
  }).then((result) => {
    if (result.isConfirmed) {
      $(ev).parents()[1].remove();
      if (category === 0) {
        if (headersArrSubjects.includes(customField)) {
          headersArrSubjects.splice(headersArrSubjects.indexOf(customField), 1);
        }
      } else {
        if (headersArrSamples.includes(customField)) {
          headersArrSamples.splice(headersArrSamples.indexOf(customField), 1);
        }
      }
    }
  });
}

function addExistingCustomHeader(customName) {
  var divElement =
    '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">' +
    customName +
    ':</font></div></div><div class="demo-controls-body"><div class="ui input"><input class="subjects-form-entry" type="text" placeholder="Type here..." id="bootbox-subject-' +
    customName +
    '" name="' +
    customName +
    '"></input></div></div><div class="tooltipnew demo-controls-end"><svg onclick="deleteCustomField(this, \'' +
    customName +
    '\', 0)" style="cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash custom-fields" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></div></div>';
  $("#accordian-custom-fields").append(divElement);
  headersArrSubjects.push(customName);
}

function addExistingCustomHeaderSamples(customName) {
  var divElement =
    '<div class="div-dd-info"><div class="demo-controls-head"><div style="width: 100%;"><font color="black">' +
    customName +
    ':</font></div></div><div class="demo-controls-body"><div class="ui input"><input class="samples-form-entry" type="text" placeholder="Type here..." id="bootbox-subject-' +
    customName +
    '" name="' +
    customName +
    '"></input></div></div><div class="tooltipnew demo-controls-end"><svg onclick="deleteCustomField(this, \'' +
    customName +
    '\', 1)" style="cursor: pointer;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-trash custom-fields" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg></div></div>';
  $("#accordian-custom-fields-samples").append(divElement);
  headersArrSamples.push(customName);
}

$(document).ready(function () {
  loadExistingProtocolInfo();
  for (var field of $("#form-add-a-subject")
    .children()
    .find(".subjects-form-entry")) {
    if (
      field.value === "" ||
      field.value === undefined ||
      field.value === "Select"
    ) {
      field.value = null;
    }
    headersArrSubjects.push(field.name);
  }
  for (var field of $("#form-add-a-sample")
    .children()
    .find(".samples-form-entry")) {
    if (
      field.value === "" ||
      field.value === undefined ||
      field.value === "Select"
    ) {
      field.value = null;
    }
    headersArrSamples.push(field.name);
  }

  ipcRenderer.on("selected-existing-subjects", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        document.getElementById(
          "existing-subjects-file-destination"
        ).placeholder = filepath[0];
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Metadata - Continue with existing subjects.xlsx",
          defaultBfAccount
        );
      } else {
        document.getElementById("existing-subjects-file-destination").placeholder = "Browse here"
        $("#div-confirm-existing-subjects-import").hide();
      }
    } else {
      document.getElementById("existing-subjects-file-destination").placeholder = "Browse here"
      $("#div-confirm-existing-subjects-import").hide();
    }
    if (
      document.getElementById("existing-subjects-file-destination")
        .placeholder !== "Browse here"
    ) {
      $("#div-confirm-existing-subjects-import").show();
      $($("#div-confirm-existing-subjects-import button")[0]).show();
    } else {
      $("#div-confirm-existing-subjects-import").hide();
      $($("#div-confirm-existing-subjects-import button")[0]).hide();
    }
  });

  ipcRenderer.on("selected-existing-samples", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath != null) {
        document.getElementById(
          "existing-samples-file-destination"
        ).placeholder = filepath[0];
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Metadata - Continue with existing samples.xlsx",
          defaultBfAccount
        );
      } else {
        document.getElementById("existing-samples-file-destination").placeholder = "Browse here"
        $("#div-confirm-existing-samples-import").hide();
      }
    } else {
      document.getElementById("existing-samples-file-destination").placeholder = "Browse here"
      $("#div-confirm-existing-samples-import").hide();
    }
    if (
      document.getElementById("existing-samples-file-destination")
        .placeholder !== "Browse here"
    ) {
      $("#div-confirm-existing-samples-import").show();
      $($("#div-confirm-existing-samples-import button")[0]).show();
    } else {
      $("#div-confirm-existing-samples-import").hide();
      $($("#div-confirm-existing-samples-import button")[0]).hide();

    }
  });

  ipcRenderer.on("selected-existing-DD", (event, filepath) => {
    if (filepath.length > 0) {
      if (filepath !== null) {
        document.getElementById(
          "existing-dd-file-destination"
        ).placeholder = filepath[0];
        ipcRenderer.send(
          "track-event",
          "Success",
          "Prepare Metadata - Continue with existing dataset_description.xlsx",
          defaultBfAccount
        );
        if (
          document.getElementById("existing-dd-file-destination")
          .placeholder !== "Browse here"
        ) {
          $("#div-confirm-existing-dd-import").show();
          $($("#div-confirm-existing-dd-import button")[0]).show();
        } else {
          $("#div-confirm-existing-dd-import").hide();
          $($("#div-confirm-existing-dd-import button")[0]).hide();
        }
      } else {
        document.getElementById("existing-dd-file-destination").placeholder = "Browse here"
        $("#div-confirm-existing-dd-import").hide();
      }
    } else {
      document.getElementById("existing-dd-file-destination").placeholder = "Browse here"
      $("#div-confirm-existing-dd-import").hide();
    }
  });
});

function showExistingSubjectsFile() {
  if ($("#existing-subjects-file-destination").prop("placeholder") !== "Browse here") {
    Swal.fire({
      title: "Are you sure you want to import a different subjects file?",
      text: "This will delete all of your previous work on this file.",
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: `No!`,
      cancelButtonColor: "#f44336",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Yes",
      icon: "warning",
      reverseButtons: reverseSwalButtons,
    }).then((boolean) => {
      if (boolean.isConfirmed) {
        ipcRenderer.send("open-file-dialog-existing-subjects");
        document.getElementById("existing-subjects-file-destination").placeholder = "Browse here"
        $("#div-confirm-existing-subjects-import").hide();
        $($("#div-confirm-existing-subjects-import button")[0]).hide();
        $("#Question-prepare-subjects-3").removeClass("show")
      }
    })
  } else {
    ipcRenderer.send("open-file-dialog-existing-subjects");
  }
}

function showExistingSamplesFile() {
  if ($("#existing-samples-file-destination").prop("placeholder") !== "Browse here") {
    Swal.fire({
      title: "Are you sure you want to import a different samples file?",
      text: "This will delete all of your previous work on this file.",
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: `No!`,
      cancelButtonColor: "#f44336",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Yes",
      icon: "warning",
      reverseButtons: reverseSwalButtons,
    }).then((boolean) => {
      if (boolean.isConfirmed) {
        ipcRenderer.send("open-file-dialog-existing-samples");
        document.getElementById("existing-samples-file-destination").placeholder = "Browse here"
        $("#div-confirm-existing-samples-import").hide();
        $($("#div-confirm-existing-samples-import button")[0]).hide();
        $("#Question-prepare-samples-3").removeClass("show")
      }
    })
  } else {
    ipcRenderer.send("open-file-dialog-existing-samples");
  }
}

function showExistingDDFile() {
  if ($("#existing-dd-file-destination").prop("placeholder") !== "Browse here") {
    Swal.fire({
      title: "Are you sure you want to import a different dataset_description file?",
      text: "This will delete all of your previous work on this file.",
      showCancelButton: true,
      heightAuto: false,
      backdrop: "rgba(0,0,0, 0.4)",
      cancelButtonText: `No!`,
      cancelButtonColor: "#f44336",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Yes",
      icon: "warning",
      reverseButtons: reverseSwalButtons,
    }).then((boolean) => {
      if (boolean.isConfirmed) {
        ipcRenderer.send("open-file-dialog-existing-DD");
        document.getElementById("existing-dd-file-destination").placeholder = "Browse here"
        $("#div-confirm-existing-dd-import").hide();
        $($("#div-confirm-existing-dd-import button")[0]).hide();
        $("#Question-prepare-dd-2").removeClass("show")
      }
    })
  } else {
    ipcRenderer.send("open-file-dialog-existing-DD");
  }
}

function importExistingSubjectsFile() {
  var filePath = $("#existing-subjects-file-destination").prop("placeholder");
  if (filePath === "Browse here") {
    Swal.fire(
      "No file chosen",
      "Please select a path to your subjects.xlsx file,",
      "error"
    );
  } else {
    if (path.parse(filePath).base !== "subjects.xlsx") {
      Swal.fire({
        title: "Incorrect file name",
        text: "Your file must be named 'subjects.xlsx' to be imported to SODA.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error"
      })
    } else {
      Swal.fire({
        title: "Loading an existing subjects.xlsx file",
        html: "Please wait...",
        timer: 2000,
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      }).then((result) => {});
      setTimeout(loadSubjectsFileToDataframe(filePath), 1000);
    }
  }
}

function importExistingSamplesFile() {
  var filePath = $("#existing-samples-file-destination").prop("placeholder");
  if (filePath === "Browse here") {
    Swal.fire(
      "No file chosen",
      "Please select a path to your samples.xlsx file.",
      "error"
    );
  } else {
    if (path.parse(filePath).base !== "samples.xlsx") {
      Swal.fire({
        title: "Incorrect file name",
        text: "Your file must be named 'samples.xlsx' to be imported to SODA.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error"
      })
    } else {
      Swal.fire({
        title: "Loading an existing samples.xlsx file",
        allowEscapeKey: false,
        allowOutsideClick: false,
        html: "Please wait...",
        timer: 1500,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      }).then((result) => {});
      setTimeout(loadSamplesFileToDataframe(filePath), 1000);
    }
  }
}

function importExistingDDFile() {
  var filePath = $("#existing-dd-file-destination").prop("placeholder");
  if (filePath === "Browse here") {
    Swal.fire(
      "No file chosen",
      "Please select a path to your dataset_description.xlsx file,",
      "error"
    );
  } else {
    if (path.parse(filePath).base !== "dataset_description.xlsx") {
      Swal.fire({
        title: "Incorrect file name",
        text: "Your file must be named 'dataset_description.xlsx' to be imported to SODA.",
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error"
      })
    } else {
      Swal.fire({
        title: "Loading an existing dataset_description.xlsx file",
        html: "Please wait...",
        timer: 5000,
        allowEscapeKey: false,
        allowOutsideClick: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        timerProgressBar: false,
        didOpen: () => {
          Swal.showLoading();
        },
      }).then((result) => {});
      setTimeout(loadDDfileDataframe(filePath), 1000);
    }
  }
}

function loadDDfileDataframe(filePath) {
  client.invoke("api_load_existing_DD_file", filePath, (error, res) => {
    if (error) {
      var emessage = userError(error);
      console.log(error);
      Swal.fire({
        title: "Failed to load the existing dataset_description.xlsx file",
        html: emessage,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        icon: "error"
      })
    } else {
        loadDDFileToUI(res)
      }
  })
}

function loadDDFileToUI(object) {
  var basicInfoObj = object["Basic information"]
  var studyInfoObj = object["Study information"]
  var conInfo = object["Contributor information"]
  var awardInfoObj = object["Award information"]
  var relatedInfo = object["Related information"]

  ///// populating Basic info UI
  for (var arr of basicInfoObj) {
    if (arr[0] === "Type") {
      $("#ds-type").val(arr[1])
    } else if (arr[0] === "Title") {
      $("#ds-name").val(arr[1])
    } else if (arr[0] === "Subtitle") {
      $("#ds-description").val(arr[1])
    } else if (arr[0] === "Number of subjects") {
      $("#ds-subjects-no").val(arr[1])
    } else if (arr[0] === "Number of samples") {
      $("#ds-samples-no").val(arr[1])
    } else if (arr[0] === "Keywords") {
      // populate keywords
      populateTagifyDD(keywordTagify, arr.splice(1))
    }
  }
  //// populating Study info UI
  for (var arr of studyInfoObj) {
    if (arr[0] === "Study purpose") {
      $("#ds-study-purpose").val(arr[1])
    } else if (arr[0] === "Study data collection") {
      $("#ds-study-data-collection").val(arr[1])
    } else if (arr[0] === "Study primary conclusion") {
      $("#ds-study-primary-conclusion").val(arr[1])
    } else if (arr[0] === "Study organ system") {
      // populate organ systems
      populateTagifyDD(studyOrganSystemsTagify, arr.splice(1))
    } else if (arr[0] === "Study approach") {
      // populate approach
      populateTagifyDD(studyApproachesTagify, arr.splice(1))
    } else if (arr[0] === "Study technique") {
      // populate technique
      populateTagifyDD(studyTechniquesTagify, arr.splice(1))
    } else if (arr[0] === "Study collection title") {
      // populate collection title
      $("#ds-study-collection-title").val(arr[1])
    }
  }

  for (var arr of awardInfoObj) {
    if (arr[0] === "Acknowledgments") {
      $("#ds-description-acknowledgments").val(arr[1])
    } else if (arr[0] === "Funding") {
      // populate awards
      globalSPARCAward = arr[1]
      $("#ds-description-award-input").val(arr[1])
      changeAward(globalSPARCAward)
      populateTagifyDD(otherFundingTagify, arr.splice(2))
    }
  }

  /// populating Con info UI
  loadContributorsToTable(conInfo)

  /// populating Related info UI
  loadRelatedInfoToTable(relatedInfo)

  Swal.fire({
    title: "Loaded successfully!",
    icon: "success",
    showConfirmButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
  });
  $("#div-confirm-existing-dd-import").hide();
  $($("#div-confirm-existing-dd-import button")[0]).hide();
  $("#button-fake-confirm-existing-dd-file-load").click()
}

function populateTagifyDD(tagify, values) {
  tagify.removeAllTags()
  for (var value of values) {
    if (value.trim() !== "") {
      tagify.addTags(value.trim())
    }
  }
}

function loadContributorsToTable(array) {
  contributorArray = []
  $("#contributor-table-dd tr:gt(0)").remove();
  $("#div-contributor-table-dd").css("display", "none");
  for (var arr of array.splice(1)) {
    if (arr[0].trim() !== "") {
      var myCurrentCon = {
        conName: arr[0].trim(),
        conID: arr[1].trim(),
        conAffliation: arr[2].trim(),
        conRole: arr[3].trim(),
      };
      contributorArray.push(myCurrentCon);
      var contact = ""
      if (myCurrentCon.conRole.includes("CorrespondingAuthor")) {
        contact = "Yes"
      } else {
        contact = "No"
      }
      addContributortoTableDD(myCurrentCon.conName, contact)
    }
  }
}

function loadRelatedInfoToTable(array) {
  $("#protocol-link-table-dd tr:gt(0)").remove();
  $("#div-protocol-link-table-dd").css("display", "none");
  $("#other-link-table-dd tr:gt(0)").remove();
  $("#div-other-link-table-dd").css("display", "none");
  for (var arr of array.splice(1)) {
    if (arr[2].trim() !== "") {
      var protocolBoolean = protocolCheck(arr)
      if (protocolBoolean) {
        addProtocolLinktoTableDD(arr[2], arr[3], arr[1], arr[0]);
      } else {
        addAdditionalLinktoTableDD(arr[2], arr[3], arr[1], arr[0]);
      }
    }
  }
}

// check if a link is a protocol for UI import purpose (Basic version, could be improved further for accuracy)
// (nothing will be changed for the generating purpose, just for the UI link separation between protocols and other links)
function protocolCheck(array) {
  var boolean = false
  // if relation includes IsProtocolFor, HasProtocol OR if description includes the word "protocol"(s) at all
  if (array[1].includes("IsProtocolFor") || array[1].includes("HasProtocol")
      || array[0].includes("protocol") || array[0].includes("protocols")) {
    boolean = true
  }
  return boolean
}

function loadDataFrametoUI() {
  var fieldSubjectEntries = [];
  for (var field of $("#form-add-a-subject")
    .children()
    .find(".subjects-form-entry")) {
    fieldSubjectEntries.push(field.name.toLowerCase());
  }
  // separate regular headers and custom headers
  const lowercasedHeaders = subjectsTableData[0].map((header) =>
    header.toLowerCase()
  );
  const customHeaders = [];
  for (var field of lowercasedHeaders) {
    if (!fieldSubjectEntries.includes(field)) {
      customHeaders.push(field);
    }
  }
  headersArrSubjects = headersArrSubjects.concat(customHeaders);
  for (var headerName of customHeaders) {
    addExistingCustomHeader(headerName);
  }
  // load sub-ids to table
  loadSubjectsDataToTable();
  $("#table-subjects").show();
  $("#button-fake-confirm-existing-subjects-file-load").click();
}

function loadDataFrametoUISamples() {
  // separate regular headers and custom headers
  const lowercasedHeaders = samplesTableData[0].map((header) =>
    header.toLowerCase()
  );
  var fieldSampleEntries = [];
  for (var field of $("#form-add-a-sample")
    .children()
    .find(".samples-form-entry")) {
    fieldSampleEntries.push(field.name.toLowerCase());
  }
  const customHeaders = [];
  for (var field of lowercasedHeaders) {
    if (!fieldSampleEntries.includes(field)) {
      customHeaders.push(field);
    }
  }
  headersArrSamples = headersArrSamples.concat(customHeaders);
  for (var headerName of customHeaders) {
    addExistingCustomHeaderSamples(headerName);
  }
 // load sub-ids to table
  loadSamplesDataToTable();
  $("#table-samples").show();
  $("#button-fake-confirm-existing-samples-file-load").click();
}

function preliminaryProtocolStep(type) {
  var credentials = loadExistingProtocolInfo();
  if (credentials[0]) {
    // show email for protocol account
    showProtocolCredentials(credentials[1], type);
  } else {
    protocolAccountQuestion(type, false);
  }
}

function protocolAccountQuestion(type, changeAccountBoolean) {
  if (changeAccountBoolean) {
    var titleText = "Do you want to connect to a different protocol account?";
  } else {
    var titleText = "Do you have an account with protocol.io?";
  }
  Swal.fire({
    title: titleText,
    showCancelButton: true,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    confirmButtonText:
      '<a target="_blank" href="https://www.protocols.io/developers" style="color:#fff;border-bottom:none">Yes, I do</a>',
    cancelButtonText: "No, I don't",
    allowEscapeKey: false,
    allowOutsideClick: false,
    reverseButtons: reverseSwalButtons,
  }).then(async (result) => {
    if (result.isConfirmed) {
      setTimeout(function () {
        connectProtocol(type);
      }, 1500);
    } else {
      if (!changeAccountBoolean) {
        if (type !== "DD") {
          Swal.fire(
            "Please create an account with protocol.io.",
            "SODA suggests you create an account with protocols.io first. For help with creating and sharing a protocol with SPARC, please visit <a target='_blank' href='https://sparc.science/help/1slXZSS2XtTYQsdY6mEJi5'>this dedicated webpage</a>.",
            "warning"
          );
        } else {
          const { value: formValues } = await Swal.fire({
            title: "Enter a protocol link and its description below:",
            text: " For help with creating and sharing a protocol with SPARC, please visit <a target='_blank' href='https://sparc.science/help/1slXZSS2XtTYQsdY6mEJi5'>this dedicated webpage</a>.",
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            confirmButtonText: "Add",
            cancelButtonText: "Cancel",
            showCancelButton: true,
            allowEscapeKey: false,
            allowOutsideClick: false,
            html:
            '<label>Protocol URL: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-protocol-link" class="swal2-input" placeholder="Enter a URL">' +
            '<label>Protocol Type: <i class="fas fa-info-circle swal-popover" data-content="This will state whether your protocol is a \'URL\' or \'DOI\' item. Use one of those two items to reference the type of protocol." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-protocol-link-select" class="swal2-input"><option value="Select">Select a type</option><option value="URL">URL</option><option value="DOI">DOI</option></select>' +
            '<label>Relation to the dataset: <i class="fas fa-info-circle swal-popover" data-content="A prespecified list of relations for common protocols used in SPARC datasets. </br>  The value in this field must be read as the \'relationship that this dataset has to the specified protocol\'." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-protocol-link-relation" class="swal2-input"><option value="Select">Select a relation</option><option value="IsProtocolFor">IsProtocolFor</option><option value="HasProtocol">HasProtocol</option><option value="IsSoftwareFor">IsSoftwareFor</option><option value="HasSoftware">HasSoftware</option></select>' +
            '<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description"></textarea>',
            focusConfirm: false,
            preConfirm: () => {
                if ($("#DD-protocol-link").val() === "") {
                  Swal.showValidationMessage(`Please enter a link!`);
                }
                if ($("#DD-protocol-link-select").val() === "Select") {
                  Swal.showValidationMessage(`Please choose a link type!`);
                }
                if ($("#DD-protocol-link-relation").val() === "Select") {
                  Swal.showValidationMessage(`Please choose a link relation!`);
                }
                if ($("#DD-protocol-description").val() === "") {
                  Swal.showValidationMessage(`Please enter a short description!`);
                }
                return [
                  $("#DD-protocol-link").val(),
                  $("#DD-protocol-link-select").val(),
                  $("#DD-protocol-link-relation").val(),
                  $("#DD-protocol-description").val()
              ];
            },
          });
          if (formValues) {
            addProtocolLinktoTableDD(formValues[0], formValues[1], formValues[2], formValues[3]);
          }
        }
      }
    }
  });
}

async function connectProtocol(type) {
  const { value: protocolCredentials } = await Swal.fire({
    width: "fit-content",
    title:
      "Once you're signed in, grab your <i>private access token</i> and enter it below: ",
    html: '<div class="ui input" style="margin: 10px 0"><i style="margin-top: 12px; margin-right:10px; font-size:20px" class="lock icon"></i><input type="text" id="protocol-password" class="subjects-form-entry" placeholder="Private access token" style="padding-left:5px"></div>',
    imageUrl:
      "../docs/documentation/Prepare-metadata/subjects/protocol-info.png",
    imageWidth: 450,
    imageHeight: 200,
    imageAlt: "Custom image",
    focusConfirm: false,
    confirmButtonText: "Let's connect",
    showCancelButton: true,
    showLoaderOnConfirm: true,
    heightAuto: false,
    allowEscapeKey: false,
    allowOutsideClick: false,
    backdrop: "rgba(0,0,0, 0.4)",
    reverseButtons: reverseSwalButtons,
    preConfirm: () => {
      var res = document.getElementById("protocol-password").value;
      if (res) {
        return res;
      } else {
        Swal.showValidationMessage("Please provide a access token to connect.");
        return false;
      }
    },
  });
  if (protocolCredentials) {
    sendHttpsRequestProtocol(protocolCredentials.trim(), "first-time", type);
  }
}

const protocolHostname = "protocols.io";
var protocolResearcherList = {};

function sendHttpsRequestProtocol(accessToken, accessType, filetype) {
  var protocolList = {};
  var protocolInfo = {
    hostname: protocolHostname,
    port: 443,
    path: `/api/v3/session/profile`,
    headers: { Authorization: `Bearer ${accessToken}` },
  };
  https.get(protocolInfo, (res) => {
    if (res.statusCode === 200) {
      res.setEncoding("utf8");
      res.on("data", async function (body) {
        var bodyRes = JSON.parse(body);
        saveProtocolInfo(accessToken, bodyRes.user.email);
        await grabResearcherProtocolList(
          bodyRes.user.username,
          bodyRes.user.email,
          accessToken,
          accessType,
          filetype
        );
      });
    } else {
      if (accessType === "first-time") {
        Swal.fire(
          "Failed to connect with protocol.io",
          "Please check your access token and try again.",
          "error"
        );
      }
    }
  });
}

function grabResearcherProtocolList(username, email, token, type, filetype) {
  var protocolInfoList = {
    hostname: protocolHostname,
    port: 443,
    path: `/api/v3/researchers/${username}/protocols?filter="user_all"`,
    headers: { Authorization: `Bearer ${token}` },
  };
  https.get(protocolInfoList, (res) => {
    if (res.statusCode === 200) {
      res.setEncoding("utf8");
      res.on("data", function (body) {
        var result = JSON.parse(body);
        protocolResearcherList = {};
        for (var item of result["items"]) {
          protocolResearcherList["https://www.protocols.io/view/" + item.uri] =
            item.title;
        }
        if (Object.keys(protocolResearcherList).length > 0) {
          if (type === "first-time") {
            Swal.fire({
              title:
                "Successfully connected! <br/>Loading your protocol information...",
              timer: 2000,
              timerProgressBar: true,
              allowEscapeKey: false,
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
              showConfirmButton: false,
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              },
            }).then((result) => {
              showProtocolCredentials(email, filetype);
            });
          }
        } else {
          if (type === "first-time") {
            Swal.fire({
              title: "Successfully connected",
              text: "However, at this moment, you do not have any protocol information for SODA to extract.",
              icon: "success",
              heightAuto: false,
              backdrop: "rgba(0,0,0, 0.4)",
            });
          }
        }
      });
    }
  });
}

async function showProtocolCredentials(email, filetype) {
  if (Object.keys(protocolResearcherList).length === 0) {
    var warningText = "You currently don't have any protocols.";
  } else {
    var warningText = "Please select a protocol.";
  }
  var htmlEle = `<div><h2>Protocol information: </h2><h3 style="text-align:left;display:flex; flex-direction: row; justify-content: space-between">Email: <span style="font-weight:500; text-align:left">${email}</span><span style="width: 40%; text-align:right"><a onclick="protocolAccountQuestion('${filetype}', true)" style="font-weight:500;text-decoration: underline">Change</a></span></h3><h3 style="text-align:left">Current protocols: </h3></div>`;
  const { value: protocol } = await Swal.fire({
    html: htmlEle,
    input: "select",
    inputOptions: protocolResearcherList,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    inputPlaceholder: "Select a protocol",
    showCancelButton: true,
    confirmButtonText: "Add",
    reverseButtons: reverseSwalButtons,
    inputValidator: (value) => {
      return new Promise((resolve) => {
        if (value) {
          resolve();
        } else {
          resolve(warningText);
        }
      });
    },
  });
  if (protocol) {
    if (filetype === "subjects") {
      $("#bootbox-subject-protocol-title").val(
        protocolResearcherList[protocol]
      );
      $("#bootbox-subject-protocol-location").val(protocol);
    } else if (filetype === "samples") {
      $("#bootbox-sample-protocol-title").val(protocolResearcherList[protocol]);
      $("#bootbox-sample-protocol-location").val(protocol);
    } else {
      const { value: formValue } = await Swal.fire({
        html:
        '<label>Protocol Type: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-protocol-link-select" class="swal2-input"><option value="Select">Select a type</option><option value="URL">URL</option><option value="DOI">DOI</option></select>' +
        '<label>Relation to the dataset: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-protocol-link-relation" class="swal2-input"><option value="Select">Select a relation</option><option value="IsProtocolFor">IsProtocolFor</option><option value="HasProtocol">HasProtocol</option><option value="IsSoftwareFor">IsSoftwareFor</option><option value="HasSoftware">HasSoftware</option></select>' +
        '<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Optionally provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description"></textarea>',
        title: "Fill in the below fields to add the protocol: ",
        focusConfirm: false,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        cancelButtonText: "Cancel",
        customClass: "swal-content-additional-link",
        showCancelButton: true,
        reverseButtons: reverseSwalButtons,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        didOpen: () => {
          $(".swal-popover").popover();
        },
        preConfirm: () => {
          if ($("#DD-protocol-link-select").val() === "Select") {
            Swal.showValidationMessage(`Please choose a link type!`);
          }
          if ($("#DD-protocol-link-relation").val() === "Select") {
            Swal.showValidationMessage(`Please choose a link relation!`);
          }
          if ($("#DD-protocol-description").val() === "") {
            Swal.showValidationMessage(`Please enter a short description!`);
          }
          var duplicate = checkLinkDuplicate(protocol, document.getElementById("protocol-link-table-dd"))
          if (duplicate) {
            Swal.showValidationMessage("Duplicate protocol. The protocol you entered is already added.")
          }
          return [
            protocol,
            $("#DD-protocol-link-select").val(),
            $("#DD-protocol-link-relation").val(),
            $("#DD-protocol-description").val()
          ];
        },
      });
      if (formValue) {
        addProtocolLinktoTableDD(formValue[0], formValue[1], formValue[2], formValue[3]);
      }
    }
  }
}

function saveProtocolInfo(token, email) {
  var content = parseJson(protocolConfigPath);
  content["access-token"] = token;
  content["email"] = email;
  fs.writeFileSync(protocolConfigPath, JSON.stringify(content));
}

function loadExistingProtocolInfo() {
  var protocolExists = false;
  //// config and load live data from Airtable
  var protocolTokenContent = parseJson(protocolConfigPath);
  if (JSON.stringify(protocolTokenContent) !== "{}") {
    var protocolToken = protocolTokenContent["access-token"];
    if (protocolToken.trim() !== "") {
      sendHttpsRequestProtocol(protocolToken.trim(), "upon-loading");
      protocolExists = true;
    }
  }
  return [protocolExists, protocolTokenContent["email"]];
}

async function addAdditionalLink() {
  const { value: values } = await Swal.fire({
    title: "Add additional link",
    html:
      '<label>URL or DOI: <i class="fas fa-info-circle swal-popover" data-content="Specify your actual URL (if resource is public) or DOI (if resource is private). This can be web links to repositories or papers (DOI)."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-other-link" class="swal2-input" placeholder="Enter a URL">' +
      '<label>Link Type: <i class="fas fa-info-circle swal-popover" data-content="This will state whether your protocol is a \'URL\' or \'DOI\' item. Use one of those two items to reference the type of identifier." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-other-link-type" class="swal2-input"><option value="Select">Select a type</option><option value="URL">URL</option><option value="DOI">DOI</option></select>' +
      '<label>Relation to the dataset: <i class="fas fa-info-circle swal-popover" data-content="A prespecified list of relations for common URLs or DOIs used in SPARC datasets. </br>  The value in this field must be read as the \'relationship that this dataset has to the specified URL/DOI\'." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-other-link-relation" class="swal2-input"><option value="Select">Select a relation</option><option value="IsCitedBy">IsCitedBy</option><option value="Cites">Cites</option><option value="IsSupplementTo">IsSupplementTo</option><option value="IsSupplementedBy">IsSupplementedBy</option><option value="IsContinuedByContinues">IsContinuedByContinues</option><option value="IsDescribedBy">IsDescribedBy</option><option value="Describes">Describes</option><option value="HasMetadata">HasMetadata</option><option value="IsMetadataFor">IsMetadataFor</option><option value="HasVersion">HasVersion</option><option value="IsVersionOf">IsVersionOf</option><option value="IsNewVersionOf">IsNewVersionOf</option><option value="IsPreviousVersionOf">IsPreviousVersionOf</option><option value="IsPreviousVersionOf">IsPreviousVersionOf</option><option value="HasPart">HasPart</option><option value="IsPublishedIn">IsPublishedIn</option><option value="IsReferencedBy">IsReferencedBy</option><option value="References">References</option><option value="IsDocumentedBy">IsDocumentedBy</option><option value="Documents">Documents</option><option value="IsCompiledBy">IsCompiledBy</option><option value="Compiles">Compiles</option><option value="IsVariantFormOf">IsVariantFormOf</option><option value="IsOriginalFormOf">IsOriginalFormOf</option><option value="IsIdenticalTo">IsIdenticalTo</option><option value="IsReviewedBy">IsReviewedBy</option><option value="Reviews">Reviews</option><option value="IsDerivedFrom">IsDerivedFrom</option><option value="IsSourceOf">IsSourceOf</option><option value="IsRequiredBy">IsRequiredBy</option><option value="Requires">Requires</option><option value="IsObsoletedBy">IsObsoletedBy</option><option value="Obsoletes">Obsoletes</option></select>' +
      '<label>Link description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-other-description" class="swal2-textarea" placeholder="Enter a description"></textarea>',

    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      var link = $("#DD-other-link").val();
      if ($("#DD-other-link-type").val() === "Select") {
        Swal.showValidationMessage(`Please select a type of links!`);
      }
      if (link === "") {
        Swal.showValidationMessage(`Please enter a link.`);
      }
      if ($("#DD-other-link-relation").val() === "Select") {
        Swal.showValidationMessage(`Please enter a link relation.`);
      }
      if ($("#DD-other-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description.`);
      }
      var duplicate = checkLinkDuplicate(link, document.getElementById("other-link-table-dd"))
      if (duplicate) {
        Swal.showValidationMessage("Duplicate URL/DOI. The URL/DOI you entered is already added.")
      }
      return [
        $("#DD-other-link").val(),
        $("#DD-other-link-type").val(),
        $("#DD-other-link-relation").val(),
        $("#DD-other-description").val()
      ];
    },
  });
  if (values) {
    addAdditionalLinktoTableDD(values[0], values[1], values[2], values[3]);
  }
}

function checkLinkDuplicate(link, table) {
  var duplicate = false;
  var rowcount = table.rows.length;
  for (var i = 1; i < rowcount; i++) {
    var currentLink = table.rows[i].cells[1].innerText;
    if (currentLink === link) {
      duplicate = true;
      break;
    }
  }
  return duplicate;
}

function showAgeSection(ev, div, type) {
  var allDivsArr = [];
  if (type === "subjects") {
    allDivsArr = ["div-exact-age", "div-age-category", "div-age-range"];
  } else {
    allDivsArr = [
      "div-exact-age-samples",
      "div-age-category-samples",
      "div-age-range-samples",
    ];
  }
  allDivsArr.splice(allDivsArr.indexOf(div), 1);
  if ($("#" + div).hasClass("hidden")) {
    $("#" + div).removeClass("hidden");
  }
  $(".age.ui").removeClass("positive active");
  $(ev).addClass("positive active");
  for (var divEle of allDivsArr) {
    $("#" + divEle).addClass("hidden");
  }
}

function readXMLScicrunch(xml, type) {
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(xml, "text/xml");
  var resultList = xmlDoc.getElementsByTagName("name"); // THE XML TAG NAME.
  var rrid = "";
  var res;
  for (var i = 0; i < resultList.length; i++) {
    if (resultList[i].childNodes[0].nodeValue === "Proper Citation") {
      rrid = resultList[i].nextSibling.childNodes[0].nodeValue;
      break;
    }
  }
  if (type === "subjects") {
    if (rrid.trim() !== "") {
      $("#bootbox-subject-strain-RRID").val(rrid.trim());
      res = true;
    } else {
      $("#bootbox-subject-strain-RRID").val("");
      res = false;
    }
  } else {
    if (rrid.trim() !== "") {
      $("#bootbox-sample-strain-RRID").val(rrid.trim());
      res = true;
    } else {
      $("#bootbox-sample-strain-RRID").val("");
      res = false;
    }
  }
  return res;
}

// add protocol function for DD file
async function addProtocol() {
  const { value: values } = await Swal.fire({
    title: "Add a protocol",
    html:
      '<label>Protocol URL: <i class="fas fa-info-circle swal-popover" data-content="URLs (if still private) / DOIs (if public) of protocols from protocols.io related to this dataset.<br />Note that at least one \'Protocol URLs or DOIs\' link is mandatory." rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><input id="DD-protocol-link" class="swal2-input" placeholder="Enter a URL">' +
      '<label>Protocol Type: <i class="fas fa-info-circle swal-popover" data-content="This will state whether your link is a \'URL\' or \'DOI\' item. Use one of those two items to reference the type of identifier." "rel="popover" data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-protocol-link-select" class="swal2-input"><option value="Select">Select a type</option><option value="URL">URL</option><option value="DOI">DOI</option></select>' +
      '<label>Relation to the dataset: <i class="fas fa-info-circle swal-popover" data-content="A prespecified list of relations for common protocols used in SPARC datasets. </br> The value in this field must be read as the \'relationship that this dataset has to the specified protocol\'."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><select id="DD-protocol-link-relation" class="swal2-input"><option value="Select">Select a relation</option><option value="IsProtocolFor">IsProtocolFor</option><option value="HasProtocol">HasProtocol</option><option value="IsSoftwareFor">IsSoftwareFor</option><option value="HasSoftware">HasSoftware</option></select>' +
      '<label>Protocol description: <i class="fas fa-info-circle swal-popover" data-content="Provide a short description of the link."rel="popover"data-placement="right"data-html="true"data-trigger="hover"></i></label><textarea id="DD-protocol-description" class="swal2-textarea" placeholder="Enter a description"></textarea>',
    focusConfirm: false,
    confirmButtonText: "Add",
    cancelButtonText: "Cancel",
    customClass: "swal-content-additional-link",
    showCancelButton: true,
    reverseButtons: reverseSwalButtons,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    didOpen: () => {
      $(".swal-popover").popover();
    },
    preConfirm: () => {
      if ($("#DD-protocol-link").val() === "") {
        Swal.showValidationMessage(`Please enter a link!`);
      }
      if ($("#DD-protocol-link-select").val() === "Select") {
        Swal.showValidationMessage(`Please choose a link type!`);
      }
      if ($("#DD-protocol-link-relation").val() === "Select") {
        Swal.showValidationMessage(`Please choose a link relation!`);
      }
      if ($("#DD-protocol-description").val() === "") {
        Swal.showValidationMessage(`Please enter a short description!`);
      }
      var duplicate = checkLinkDuplicate($("#DD-protocol-link").val(), document.getElementById("protocol-link-table-dd"))
      if (duplicate) {
        Swal.showValidationMessage("Duplicate protocol. The protocol you entered is already added.")
      }
      return [
        $("#DD-protocol-link").val(),
        $("#DD-protocol-link-select").val(),
        $("#DD-protocol-link-relation").val(),
        $("#DD-protocol-description").val()
      ];
    },
  });
  if (values) {
    addProtocolLinktoTableDD(values[0], values[1], values[2], values[3]);
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

function addProtocolLinktoTableDD(protocolLink, protocolType, protocolRelation, protocolDesc) {
  var protocolTable = document.getElementById("protocol-link-table-dd");
  protocolTable.style.display = "block";
  document.getElementById("div-protocol-link-table-dd").style.display = "block";
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
    "</a></td><td class='contributor-table-row' style='display:none'>" +
    protocolType +
    "</td><td class='contributor-table-row'>" +
    protocolRelation +
    "</td><td class='contributor-table-row' style='display:none'>" +
    protocolDesc +
    "</td><td><div class='ui small basic icon buttons contributor-helper-buttons' style='display: flex'><button class='ui button' onclick='edit_current_protocol_id(this)'><i class='pen icon' style='color: var(--tagify-dd-color-primary)'></i></button><button class='ui button' onclick='delete_current_protocol_id(this)'><i class='trash alternate outline icon' style='color: red'></i></button></div></td></tr>");
}

function addAdditionalLinktoTableDD(link, linkType, linkRelation, description) {
  var linkTable = document.getElementById("other-link-table-dd");
  linkTable.style.display = "block";
  document.getElementById("div-other-link-table-dd").style.display = "block"
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
  "<tr id='row-current-other" +
  newRowIndex +
  "' class='row-protocol'><td class='contributor-table-row'>" +
  indexNumber +
  "</td><td><a href='" +
  link +
  "' target='_blank'>" +
  link +
  "</a></td><td class='contributor-table-row' style='display:none'>" +
  linkType +
  "</td><td class='contributor-table-row'>" +
  linkRelation +
  "</td><td class='contributor-table-row' style='display:none'>" +
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
        // input: 'select',
        // inputOptions: awardObj,
        heightAuto: false,
        backdrop: "rgba(0,0,0, 0.4)",
        inputPlaceholder: "Select an award",
        showCancelButton: true,
        confirmButtonText: "Confirm",
        reverseButtons: reverseSwalButtons,
        didOpen: () => {
          $("#select-sparc-award-dd-spinner").css("display", "none");
          populateSelectSPARCAward(awardObj);
          $("#select-SPARC-award").selectpicker();
        },
        preConfirm: () => {
          if ($("#select-SPARC-award").val() === "Select") {
            Swal.showValidationMessage("Please select an award.");
          } else {
            award = $("#select-SPARC-award").val();
            globalSPARCAward = $("#select-SPARC-award").val();
          }
        },
      });
      if (awardVal) {
        if (contributorArray.length !== 0) {
          Swal.fire({
            title:
              "Are you sure you want to delete all of the previous contributor information?",
            showCancelButton: true,
            reverseButtons: reverseSwalButtons,
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
        reverseButtons: reverseSwalButtons,
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
  }
}

function populateSelectSPARCAward(object) {
  removeOptions(document.getElementById("select-SPARC-award"));
  addOption(
    document.getElementById("select-SPARC-award"),
    "Select an award",
    "Select"
  );
  for (var award of Object.keys(object)) {
    addOption(
      document.getElementById("select-SPARC-award"),
      object[award],
      award
    );
  }
  if (globalSPARCAward.trim() !== "") {
    if (Object.keys(object).includes(globalSPARCAward.trim())) {
      $("#select-SPARC-award").val(globalSPARCAward.trim())
    }
  }
}

function changeAward(award) {
  $("#ds-description-award-input").val(award);
  globalContributorNameObject = {};
  currentContributorsLastNames = [];
  $("#contributor-table-dd tr:gt(0)").remove();
  $("#div-contributor-table-dd").css("display", "none");
  contributorArray = [];
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
          globalContributorNameObject[lastName] = firstName;
          currentContributorsLastNames.push(lastName);
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
  '<div id="contributor-popup"><div style="display:flex"><div style="margin-right:10px"><label>Last name</label><select id="dd-contributor-last-name" class="form-container-input-bf" onchange="onchangeLastNames()" style="line-height: 2"><option value="Select">Select an option</option></select></div><div class="div-child"><label>First name </label><select id="dd-contributor-first-name" disabled class="form-container-input-bf" onchange="onchangeFirstNames()" style="line-height: 2"><option value="Select">Select an option</option></select></div></div><div><label>ORCiD <i class="fas fa-info-circle swal-popover" data-content="If contributor does not have an ORCID ID, we suggest they sign up for one at <a href=\'https://orcid.org\' style=\'color: white\' target=\'_blank\'>https://orcid.org</a>" rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><input id="input-con-ID" class="form-container-input-bf" style="line-height: 2" contenteditable="true"></input></div><div><div style="margin: 15px 0;font-weight:600">Affiliation <i class="fas fa-info-circle swal-popover" data-content="Institutional affiliation for contributor. Hit \'Enter\' on your keyboard after each entry to register it." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-affiliation" contenteditable="true"></input></div></div><div><div style="margin: 15px 0;font-weight:600">Role <i class="fas fa-info-circle swal-popover" data-content="Role(s) of the contributor as per the Data Cite schema (c.f. associated dropdown list). Hit \'Enter\' after each entry to register it. Checkout the related <a href=\'https://schema.datacite.org/meta/kernel-4.3/\' target=\'_blank\' style=\'color: white\'>documentation</a> for a definition of each of these roles." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-role" contenteditable="true"></input></div></div><div style="margin-top:15px;display:flex;flex-direction:column"><label>Corresponding Author <i class="fas fa-info-circle swal-popover" data-content="Check if the contributor is a corresponding author for the dataset. At least one and only one of the contributors should be the corresponding author." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><label class="switch" style="margin-top: 15px"><input id="ds-contact-person" name="contact-person" type="checkbox" class="with-style-manifest"></input><span class="slider round"></span></label></div></div>';

var contributorElementRaw =
  '<div id="contributor-popup"><div style="display:flex"><div style="margin-right:10px"><label>Last name</label><input id="dd-contributor-last-name" class="form-container-input-bf" style="line-height: 2"></input></div><div class="div-child"><label>First name</label><input id="dd-contributor-first-name" class="form-container-input-bf" style="line-height: 2"></input></div></div><div><label>ORCiD <i class="fas fa-info-circle swal-popover" data-content="If contributor does not have an ORCID ID, we suggest they sign up for one at <a href=\'https://orcid.org\' style=\'color: white\' target=\'_blank\'>https://orcid.org</a>" rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><input id="input-con-ID" class="form-container-input-bf" style="line-height: 2" contenteditable="true"></input></div><div><div style="margin: 15px 0;font-weight:600">Affiliation <i class="fas fa-info-circle swal-popover" data-content="Institutional affiliation for contributor. Hit \'Enter\' on your keyboard after each entry to register it." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-affiliation" contenteditable="true"></input></div></div><div><div style="margin: 15px 0;font-weight:600">Role <i class="fas fa-info-circle swal-popover" data-content="Role(s) of the contributor as per the Data Cite schema (c.f. associated dropdown list). Hit \'Enter\' after each entry to register it. Checkout the related <a href=\'https://schema.datacite.org/meta/kernel-4.3/\' target=\'_blank\' style=\'color: white\'>documentation</a> for a definition of each of these roles." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></div><div><input id="input-con-role" contenteditable="true"></input></div></div><div style="margin-top:15px;display:flex;flex-direction:column"><label>Corresponding Author <i class="fas fa-info-circle swal-popover" data-content="Check if the contributor is a corresponding author for the dataset. At least one and only one of the contributors should be the corresponding author." rel="popover" data-html="true" data-placement="right" data-trigger="hover"></i></label><label class="switch" style="margin-top: 15px"><input id="ds-contact-person" name="contact-person" type="checkbox" class="with-style-manifest"></input><span class="slider round"></span></label></div></div>';

var contributorArray = [];
var affiliationSuggestions = []

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
          whitelist: affiliationSuggestions,
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
      var affValues = grabCurrentTagifyContributor(
        currentAffliationtagify
      )
      // store affiliation info as suggestions
      affiliationSuggestions.push.apply(affiliationSuggestions, affValues)
      var affSet = new Set(affiliationSuggestions);
      var affArray = [...affSet];
      affiliationSuggestions = affArray;
      var affiliationVals = affValues.join(", ");
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
                "One corresponding author is already added. Only one corresponding author is allowed for a dataset."
              );
            } else {
              var myCurrentCon = {
                conName: lastName + ", " + firstName,
                conID: $("#input-con-ID").val().trim(),
                conAffliation: affiliationVals,
                conRole: roleVals + ", CorrespondingAuthor",
              };
              contributorArray.push(myCurrentCon);
              return [myCurrentCon.conName, "Yes"];
            }
          } else {
            var myCurrentCon = {
              conName: lastName + ", " + firstName,
              conID: $("#input-con-ID").val().trim(),
              conAffliation: affiliationVals,
              conRole: roleVals,
            };
            contributorArray.push(myCurrentCon);
            return [myCurrentCon.conName, "No"];
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
      // memorize Affiliation info for next time as suggestions
      memorizeAffiliationInfo(affiliationSuggestions)
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
    reverseButtons: reverseSwalButtons,
  }).then((boolean) => {
    if (boolean.isConfirmed) {
      // 1. Delete from table
      var currentRow = $(ev).parents()[2];
      var currentRowid = $(currentRow).prop("id");
      document.getElementById(currentRowid).outerHTML = "";
      updateIndexForTable(document.getElementById("contributor-table-dd"));
      // 2. Delete from JSON
      var contributorName = $(currentRow)[0].cells[1].innerText;
      for (var i = 0; i < contributorArray.length; i++) {
        if (contributorArray[i].conName === contributorName) {
          contributorArray.splice(i, 1);
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
    text: "Edit contributor",
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
          // delimiters: ",",
          whitelist: affiliationSuggestions,
          duplicates: false,
        }
      );
      for (var contributor of contributorArray) {
        if (contributor.conName === name) {
          // add existing tags to tagifies
          for (var affiliation of contributor.conAffliation.split(" ,")) {
            currentAffliationtagify.addTags(affiliation);
          }
          for (var role of contributor.conRole.split(" ,")) {
            currentContributortagify.addTags(role);
          }
          if (contributor.conRole.includes("CorrespondingAuthor")) {
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
        var affValues = grabCurrentTagifyContributor(
          currentAffliationtagify
        )
        affiliationSuggestions.push.apply(affiliationSuggestions, affValues)
        var affSet = new Set(affiliationSuggestions);
        var affArray = [...affSet];
        affiliationSuggestions = affArray;
        var affiliationVals = affValues.join(", ");
        var roleVals = grabCurrentTagifyContributor(
          currentContributortagify
        ).join(", ");
        if ($("#ds-contact-person").prop("checked")) {
          var contactPersonExists = checkContactPersonStatus("edit", ev);
          if (contactPersonExists) {
            Swal.showValidationMessage(
              "One corresponding author is already added above. Only corresponding author person is allowed for a dataset."
            );
          } else {
            var myCurrentCon = {
              conName:
                $("#dd-contributor-last-name").val().trim() +
                ", " +
                $("#dd-contributor-first-name").val().trim(),
              conID: $("#input-con-ID").val().trim(),
              conAffliation: affiliationVals,
              conRole: roleVals + ", CorrespondingAuthor",
              // conContact: "Yes",
            };
            for (var contributor of contributorArray) {
              if (contributor.conName === name) {
                contributorArray[contributorArray.indexOf(contributor)] =
                  myCurrentCon;
                break;
              }
            }

            return [myCurrentCon.conName, "Yes"];
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
            // conContact: "No",
          };
          for (var contributor of contributorArray) {
            if (contributor.conName === name) {
              contributorArray[contributorArray.indexOf(contributor)] =
                myCurrentCon;
              break;
            }
          }
          return [myCurrentCon.conName, "No"];
        }
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      $(currentRow)[0].cells[2].innerText = result.value[1];
      memorizeAffiliationInfo(affiliationSuggestions)
    }
  });
}

function memorizeAffiliationInfo(values) {
  createMetadataDir();
  var content = parseJson(affiliationConfigPath);
  content["affiliation"] = values;
  fs.writeFileSync(affiliationConfigPath, JSON.stringify(content));
}

function grabCurrentTagifyContributor(tagify) {
  var infoArray = [];
  // var element = document.getElementById(id)
  var values = tagify.DOM.originalInput.value;
  if (values.trim() !== "") {
    var valuesArray = JSON.parse(values.trim());
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

///// Functions to grab each piece of info to generate the dd file

// dataset and participant info
function grabDSInfoEntries() {

  var name = document.getElementById("ds-name").value;
  var description = document.getElementById("ds-description").value;
  var type = $("#ds-type").val();
  var keywordArray = keywordTagify.value;
  var samplesNo = document.getElementById("ds-samples-no").value;
  var subjectsNo = document.getElementById("ds-subjects-no").value;

  return {
    name: name,
    description: description,
    type: type,
    keywords: keywordArray,
    "number of samples": samplesNo,
    "number of subjects": subjectsNo,
  };
}


// study info
function grabStudyInfoEntries() {
  var studyOrganSystem = studyOrganSystemsTagify.value;
  var studyApproach = studyApproachesTagify.value;
  var studyTechnique = studyTechniquesTagify.value;
  var studyPurpose = document.getElementById("ds-study-purpose").value;
  var studyDataCollection = document.getElementById("ds-study-data-collection").value;
  var studyPrimaryConclusion = document.getElementById("ds-study-primary-conclusion").value;
  var studyCollectionTitle = document.getElementById("ds-study-collection-title").value;

  return {
    "study organ system": studyOrganSystem,
    "study approach": studyApproach,
    "study technique": studyTechnique,
    "study purpose": studyPurpose,
    "study data collection": studyDataCollection,
    "study primary conclusion": studyPrimaryConclusion,
    "study collection title": studyCollectionTitle
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
  contributorInfo["contributors"] = contributorArray;
  return contributorInfo;
}

function grabAdditionalLinkSection() {
  var table = document.getElementById("other-link-table-dd");
  var rowcountLink = table.rows.length;
  var additionalLinkInfo = [];
  for (i = 1; i < rowcountLink; i++) {
    var additionalLink = {
      link: table.rows[i].cells[1].innerText,
      type: table.rows[i].cells[2].innerText,
      relation: table.rows[i].cells[3].innerText,
      description: table.rows[i].cells[4].innerText,
    };
    additionalLinkInfo.push(additionalLink);
  }
  return additionalLinkInfo;
}

function grabProtocolSection() {
  var table = document.getElementById("protocol-link-table-dd");
  var rowcountLink = table.rows.length;
  var protocolLinkInfo = [];
  for (i = 1; i < rowcountLink; i++) {
    var protocol = {
      link: table.rows[i].cells[1].innerText,
      type: table.rows[i].cells[2].innerText,
      relation: table.rows[i].cells[3].innerText,
      description: table.rows[i].cells[4].innerText,
    };
    protocolLinkInfo.push(protocol);
  }
  return protocolLinkInfo;
}

function combineLinksSections() {
  var protocolLinks = grabProtocolSection();
  var otherLinks = grabAdditionalLinkSection();
  protocolLinks.push.apply(protocolLinks, otherLinks)
  return protocolLinks
}
