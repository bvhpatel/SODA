## Background

SODA helps you prepare the [submission metadata file](https://github.com/bvhpatel/SODA/wiki/Prepare-your-submission-file) conveniently. We explain here how it must be structured according to the SPARC rules in order to provide some insight about the structure of the file generated by SODA.

## How to

* Format: the submission file is accepted in either xlsx, csv, or json format. SODA generates it in the xlsx format based on the template provided by the Curation Team. A screenshot is provided below. 

<p align="center">
<img src="https://github.com/bvhpatel/SODA/blob/master/docs/documentation/How%20to/submission/submission-template.PNG" width="650">
</p>

* Location in the dataset: The submission file must be included in the high-level dataset folder.

* Content: The "Submission Item" and "Value" columns are mandatory (the "Definition" column could be kept or removed). Each of the three "Submission Item" element must be provided a "Value".

  * SPARC Award number: The number of your SPARC award.
  * Milestone achieved: This milestone must match **exactly** with one of the milestones agreed with the NIH in the Dataset Deliverables document. A screenshot of a sample Dataset Deliverables document is provided below. In case the dataset isn't related to a pre-agreed dataset, it should be explicitly mentioned (e.g., "Not included in the Dataset Deliverables document").
  * Milestone completion date: This date must match **exactly** with the completion date agreed with the NIH in the Dataset Deliverables document for the above mentioned "Milestone achieved". In the case the dataset isn't related to a pre-agreed milestone, it should be explicitly mentioned (e.g., "Not included in the Dataset Deliverables document").

<p align="center">
<img src="https://github.com/bvhpatel/SODA/blob/master/docs/documentation/How%20to/submission/data-deliverables-doc-example.PNG" width="350">
<br/> 
  <i> A screenshot of our a demo Data Deliverables document. The "Milestone achieved" value in the submission file must be one of the milestone specified under "Related milestone, aim, or task" of the document and the "Milestone completion date" must be the corresponding "Expected date of completion" in the document. </i>
</p>