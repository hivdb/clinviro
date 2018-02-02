## 0.3.3-dev

- Changed proficiency sample edit form label "Source" to "First name/Source".
- Display user email who generated the current report on QC report.
- Display filename on QC report of proficiency sample.
- Improved the patient search API to return more result than just 10.
- Fixed a bug which could cause previous sequences not loaded.

## 0.3.2 (11/14/2017)

- Added this CHANGELOG.md file.
- Fixed a layout error in Word template in sequence summary section.
- Fixed a numeric precision issue in Word template caused by the default setting of Texttable.
- Added a script to generate overall reports for sequences contained indels.
- Tweaked the sentences of Notes for Physician.
- Supported adding site configurations (nginx) through `--volumes` parameter of `docker run`.
- Fixed a bug that failed to generate Notes for Physician if a dosage comment was present.

## 0.3.1 (09/15/2017)

- Fixed a timeout bug when there were too many sequences to be aligned, especially for positive controls.
- Allowed to delete a report.
- Re-arranged the sections of PDF and Word report according to the suggestion from our lab.

## 0.3.0 (08/01/2017)

The first open source release of ClinViro.
