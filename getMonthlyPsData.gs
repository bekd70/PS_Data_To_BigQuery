/**
 * goes through each table on the monthlyImport sheet
 * for each table:
 * gets the total number of records,
 * if the number is larger than the batchSize, it breaks it
 * up into batches
 * 
 * once the batches are complete, it saves the data as a csv,
 * saves the csv as a gzip archive, and uploads to BigQuery
 * 
 * This function is getting data from our API as an array of JSON
 * it uses the jsonTo2DArray() in the lib.gs file to convert the 
 * JSON to a 2D array.  The jsonTo2DArray() function is dependant on the 
 * getDataTypes() function being previously run.
 */
function geMonthlyPsData() {
  let runTime = 0;
  let log = [];
  let logType = "[LOG]";
  let tableNames = ss.getSheetByName(GLOBAL.psMonthlyImportTablesSheet).getDataRange().getValues();
  for(let i=1;i<tableNames.length;i++){
    let startTime= new Date();
    let csvString = '';
    let batchSize = 10000;
    let numberOfRowsProcessed = 0;
    let rowsToProcess;
    let hasNext;
    let tableName = tableNames[i][0];
    console.log(`Preparing Data for load into ${tableName}`);
    let query = `SELECT COUNT(*) AS rowsToProcess FROM ${tableName}`;

    let sheet = ss.getSheetByName(tableName);
    let fieldData = sheet.getDataRange().getValues();
   
    
    /**
     * TODO: Get PS DATA
     * you must get your data from Powerschool here with the above query
     * Our API is delivering the data as JSON and the payload
     * is stored in JSON.message wich is an array of JSON data
     * we are doing this because JSON.parse() is much quicker than
     * dealing directly with queried data from JDBC Class
     */
    let options = {
      query: query
      //Add any other fields your API needs
    }
    let url = 'YOUR API URL';
    let response = UrlFetchApp.fetch(url,options);
    let content = JSON.parse(response.getContentText());
    if(content.status){
      rowsToProcess = parseInt(content.message[0].ROWSTOPROCESS);
      console.log(`There are ${rowsToProcess} rows to be imported.`);
    }
    else{
      console.log(`Could not get the number of rows to import from ${tableName}`);
      log.push(`Could not get the number of rows to import from ${tableName}\n`);
      logType = "[ERROR]";
      break;
    }
    
    if(rowsToProcess>0){
      
      do{
        postData.query = sheet.getRange(sheet.getLastRow(),1,1,1).getValue();
        if(rowsToProcess > batchSize){
          postData.query = postData.query + `\nORDER BY ${fieldData[1][3]}\nOFFSET ${numberOfRowsProcessed} ROWS FETCH NEXT ${batchSize} ROWS ONLY`;
        }
        else{
          postData.query = postData.query + `\nORDER BY ${fieldData[1][3]}\nOFFSET ${numberOfRowsProcessed} ROWS FETCH NEXT ${rowsToProcess} ROWS ONLY`;
        }
       /**
     * TODO: Get PS DATA
     * you must get your data from Powerschool here with the above query
     * We are using our own API and delivering the data as JSON and the payload
     * is stored in JSON.message wich is an array of JSON data
     * we are doing this because JSON.parse() is much quicker than
     * dealing directly with queried data from JDBC Class
     * 
     * If using JDBC to get data, you need to save the data as an Array of JSON
     * the jsonTo2DArray function will save the data with the right data type,
     * and escapes special characters like ",',\r\n, etc.  It also saves any 
     * dates in the correct format.
     * 
     * Please note that JDBC is verrrry slow, which is why we created our own API 
     */
        let response = UrlFetchApp.fetch(url,options);
        let content = JSON.parse(response.getContentText());
        if(content.status){
          let psData = jsonTo2DArray(content.message,fieldData)
          for (var s = 0; s < psData.length; s++) {
            csvString += psData[s].join(",") + "\n";
          }
          console.log(`There are ${psData.length} rows being imported.`);
          numberOfRowsProcessed = numberOfRowsProcessed + psData.length;
          console.log(`There are ${rowsToProcess - numberOfRowsProcessed} rows to process still`);
          if(rowsToProcess - numberOfRowsProcessed > 0){
            hasNext = true;
          }
          else{
            hasNext = false;
            log.push(`--There were ${numberOfRowsProcessed} imported into the ${tableName} table.\n`)
          }
          //console.log(psData)
        }
        else{
          console.log(`Could not get the data from ${tableName}`);
          log.push(`Could not get the data from ${tableName}\n`);
          logType = "[ERROR]";
        }
        
      }
      while(hasNext)
      //creates the csv file
      let file = DriveApp.createFile(`${Utilities.formatDate(new Date(),"IST","yyyy-MM-dd")}BQ_ImportedFile_${tableName}.csv`, csvString, MimeType.CSV);
      
      saveItemInFolder(file,folder)
      let gziped = Utilities.gzip(file.getBlob(),`${file.getName()}.gzip`);
      //adds the csv to a gzip archive
      let gzipFile = DriveApp.createFile(gziped.copyBlob());
      saveItemInFolder(gzipFile,folder);
      //loads the gzip file to bigQuery
      bqLoadCsv(GLOBAL.projectId,GLOBAL.datasetId,tableName,gzipFile.getId())
      
    }
    runTime = runTime + ((new Date() - startTime)/1000);
    console.log(`Data for ${tableName} uploaded in ${(new Date() - startTime)/1000} seconds`)

  }
  console.log(`${logType}:${log.toString()}`)
  log.push(`The script ran for ${runTime/60} minutes`)
  console.log(`The script has been running for a combined ${runTime/60} minutes`);
}
