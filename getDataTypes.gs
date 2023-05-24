/**
 * get data type information from Oracle for each table
 */
function getDataTypes() {
  let tableNames = ss.getSheetByName(GLOBAL.initializeTableSheet).getDataRange().getValues();
  for(let i=1;i<tableNames.length;i++){
    let tableName = tableNames[i][0];
    let sheet = ss.getSheetByName(tableName);
    let fieldData = sheet.getDataRange().getValues();
    let query = `SELECT 
                  COLUMN_NAME,
                  DATA_TYPE,
                  DATA_LENGTH,
                  DATA_PRECISION,
                  DATA_SCALE,
                  NULLABLE
              FROM ALL_TAB_COLUMNS
              WHERE OWNER = 'PS'
              AND TABLE_NAME = '${tableName}'`;
    
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
    let url = 'YOUR API URL'
 
    let response = UrlFetchApp.fetch(url,options);
    let content = JSON.parse(response.getContentText());
    
    
    for(let j=1;j<fieldData.length;j++){
      let psField = fieldData[j][0];
      for (let k=0;k<content.message.length;k++){
        let dataType,dataLength, dataPrecision, dataScale, nullable;
        let row = content.message[k];
        let dataInfo =[];
        if (psField.toUpperCase() === row.COLUMN_NAME){
          dataType = row.DATA_TYPE;
          dataLength = row.DATA_LENGTH;
          dataPrecision = row.DATA_PRECISION;
          dataScale = row.DATA_SCALE;
          nullable = row.NULLABLE;
          dataInfo.push([dataType,dataLength,dataPrecision,dataScale,nullable]);
          sheet.getRange(j+1,8,1,5).setValues(dataInfo);

        }
      }
    }
  }

}