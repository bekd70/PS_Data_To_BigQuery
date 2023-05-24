/**
 * goes through each table on the Table Names sheet
 * Get's the individual sheet
 * loops through the fields to create an sql select statement
 * adds the sql statement to the bottom of the sheet
 */
function createSqlStatements() {
  let tableNames = ss.getSheetByName(GLOBAL.initializeTableSheet).getDataRange().getValues();
  let sql;
  for(let i=1;i<tableNames.length;i++){
    let tableName = tableNames[i][0];
    let tableSheet = ss.getSheetByName(tableName);
    let fieldData = tableSheet.getDataRange().getValues();
    sql = 'Select ';
    for(let j=1;j<fieldData.length;j++){
      let row = fieldData[j];
      let psField = row[0];
      let bqField = row[3];
      let dataType = row[7];
      let dataLength = row[8];
      if(j<fieldData.length-1){
        if(dataType === 'CLOB'){
          sql = sql + `CAST(${psField} AS VARCHAR2(${dataLength})) AS ${bqField}, `;
        }
        else{
          sql = sql + `${psField} AS ${bqField}, `;
        }
      }
      else{
        if(dataType === 'CLOB'){
          sql = sql + `CAST(${psField} AS VARCHAR2(${dataLength})) AS ${bqField}\n`;
        }
        else{
          sql = sql + `${psField} AS ${bqField}\n`;
        }
      }
    }
    sql = sql + `FROM ${tableName}`;
    tableSheet.getRange(fieldData.length+1,1,2,1).setValues([["Query"],[sql]]);
    console.log(`The query for ${tableName} is:\n${sql}`);
  }

}
