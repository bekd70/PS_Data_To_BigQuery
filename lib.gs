/**
 * Global constants
 */
const GLOBAL = {
  ssId: 'SPREADSHEET_ID',
  initializeTableSheet: 'Tables',
  psDailyImportTablesSheet: 'DailyPSImports',
  psMonthlyImportTablesSheet: 'MonthlyPSImports',
  fieldsSheet: 'Fields',
  projectId: 'YOUR-BIGQUERY-PROJECT-ID-HERE',
  datasetId: 'YOUR_DATASET_ID_HERE',
  dataImportsFolder: 'GOOGLE_DRIVE_FOLDER_ID'
}
//spreadsheet for the script to use
let ss = SpreadsheetApp.openById(GLOBAL.ssId);
//folder where .csv and .gzip files are stored
let folder = DriveApp.getFolderById(GLOBAL.dataImportsFolder)

/**
 * helper function to convert Array of JSON to 2D Array
 * this function is dependant on having dataType informaion
 * from oracle that is stores in the table sheets
 */
function jsonTo2DArray(jsonString,fieldInfo) {
  var data = jsonString;
  var headers = Object.keys(data[0]);
  var output = [];
  for (var i = 0; i < data.length; i++) {
    var row = [];
    for (var j = 0; j < headers.length; j++) {
      let fieldData = data[i][headers[j]];
      let dataType;
      //console.log(`the header is ${headers[j]}`)
      for(let dt=1;dt<fieldInfo.length;dt++){
        if(headers[j].toUpperCase() === fieldInfo[dt][3].toUpperCase()){
          dataType = fieldInfo[dt][7]
          break;
        }
      }
      if(dataType === 'DATE'){
        if(fieldData === '' || fieldData === null){
          row.push(null);
        }
        else{
          if(fieldData.indexOf('\n') > -1){
            //console.log(`I found a \\n character`)
            fieldData = fieldData.replace(/[\n\r]/g, '');
          }
          row.push(Utilities.formatDate(new Date(fieldData),"IST","yyyy-MM-dd"))
          //console.log(Utilities.formatDate(new Date(fieldData),"IST","yyyy-MM-dd"))
        }
      }
      else if(dataType === 'TIMESTAMP(6)'){
        //let dateTime = fieldData.substring(0,6)
        //console.log(dateTime)
        if(fieldData === '' || fieldData === null){
          row.push(null);
        }
        else{
          if(fieldData.indexOf('\n') > -1){
            //console.log(`I found a \\n character`)
            fieldData = fieldData.replace(/[\n\r]/g, '');
          }
          //console.log(fieldData)
          row.push(`${Utilities.formatDate(new Date(fieldData.substring(0,6)),'IST','yyyy-MM-dd')} 00:00:00`)
          //console.log(Utilities.formatDate(new Date(fieldData),"IST","yyyy-MM-dd"))
        }
      }
      else if(dataType === 'VARCHAR2' || dataType === 'CLOB'){
        if(fieldData === '' || fieldData === null){
          row.push(null);
        }
        else{
          if(fieldData.indexOf('\n') > -1){
            //console.log(`I found a \\n character`)
            fieldData = fieldData.replace(/[\n\r]/g, '\\r\\n');
          }
          
          if(fieldData.indexOf('"') > -1 || fieldData.indexOf("'") > -1){
            //console.log(`I found a \" character`)
            fieldData = fieldData.replace(/["'']/g,'')
          }
          /*
          if(fieldData.indexOf("'") > -1){
            //console.log(`I found a \' character`)
            fieldData = fieldData.replace("'","\'")
          }*/
          row.push(`"${fieldData}"`);
        }
      }
      else{
        if(fieldData === '' || fieldData === null){
          row.push(null);
        }
        else{
          if(fieldData.indexOf('\n') > -1){
            //console.log(`I found a \\n character`)
            fieldData = fieldData.replace(/[\n\r]/g, '');
          }
          row.push(fieldData)
        }
      }
    }
    output.push(row);
    
  }
  return output;
}
/**
 * helper function to move created files to import folder
 */
function saveItemInFolder(item,folder) {
  //console.log(`I am moving the file called ${item.getName()} to the folder called ${folder.getName()}`)
  var id = item.getId();  // Will throw error if getId() not supported.
  folder.addFile(DriveApp.getFileById(id));
  var temp = DriveApp.getFileById(id);
  DriveApp.getRootFolder().removeFile(temp);
}
/**
 * sends a gzip encoded csv file to BigQuery table
 */
function bqLoadCsv(thisProjectId, thisDatasetId, thisTableId, csvFileId) {
  
  // Load CSV jsonString from Drive and convert to the correct format for upload.
  //let blob = csvFileId.copyBlob()
  var file = DriveApp.getFileById(csvFileId);
  var data = file.getBlob().setContentType('application/octet-stream');

  // Create the data upload job.
  var myJob = {
    configuration: {
      load: {
        destinationTable: {
          projectId: thisProjectId,
          datasetId: thisDatasetId,
          tableId: thisTableId
        },
        writeDisposition: 'WRITE_TRUNCATE',
        allowJaggedRows:true
      }
    }
  };
  let loadJob = BigQuery.Jobs.insert(myJob,thisProjectId,data)
  //loadJob = BigQuery.Jobs.insert(myJob, thisProjectId, data);
  console.log('Load job started. Check on the status of it here: ' +
      'https://console.cloud.google.com/bigquery?project=%s&page=jobs', thisProjectId);
  return loadJob;
}



/* //this function deletes all of the tables from the tableNames sheet 
//and recreates them in BigQuery.  I keep this commented out so I do not accidently run this
//uncomment to use
function clearTestData(){
  let tableNames = ss.getSheetByName(GLOBAL.initializeTableSheet).getDataRange().getValues();
  for(let i=1;i<tableNames.length;i++){
    let tableName = tableNames[i][0];
    let status = BigQuery.Tables.remove(GLOBAL.projectId,'ps_sandbox',tableName)
    console.log(status)
  }
  //createBqTables()
}
*/