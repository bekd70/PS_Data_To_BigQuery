/**
 * creates tables in BigQuery.
 * The function is dependant on the getDataTypes() function
 * already having been run
 */
function createBqTables() {
  let tableNames = ss.getSheetByName(GLOBAL.initializeTableSheet).getDataRange().getValues();
  for(let i=1;i<tableNames.length;i++){
    let tableName = tableNames[i][0];
    let tableId = tableNames[i][0];
    console.log(tableName)
    let table = {
      tableReference: {
        projectId: GLOBAL.projectId,
        datasetId: GLOBAL.datasetId,
        tableId
      },
      schema: {
        fields:[]
      },
      defaultCollation:'und:ci'
    };
    
    let sheet = ss.getSheetByName(tableName);
    let tableData = sheet.getRange(2,1,sheet.getLastRow()-2,12).getValues();
    for(let j=0;j<tableData.length-1;j++){
      let row = tableData[j];
      let bgFieldName = row[3];
      let dataType = row[7];
      let dataLength = row[8];
      let mode;
      if(row[11] === 'Y'){
        mode = 'NULLABLE'
      }
      else{
        mode = "REQUIRED"
      }
      let field = {
        name: bgFieldName
      }
      switch(dataType) {
        case 'VARCHAR2':
          field.type = 'STRING';
          field.maxLength = dataLength;
          field.mode = mode;
          break;
        case 'CLOB':
          field.type = 'STRING';
          field.maxLength = dataLength;
          field.mode = mode;
          break;
        case 'DATE':
          field.type = 'DATE';
          field.mode = mode;
          break;
        case 'TIMESTAMP(6)':
          field.type = 'DATETIME';
          field.mode = mode;
          break;
        case 'NUMBER':
          field.type = 'INTEGER';
          field.mode = mode;
          break;
        case 'FLOAT':
          field.type = 'FLOAT';
          break;

        default:
          field.type = 'STRING';
          field.mode = mode;
          break;
      }
      table.schema.fields.push(field);
    }
    console.log(JSON.stringify(table));
    let tableCreated = BigQuery.Tables.insert(JSON.stringify(table),GLOBAL.projectId,GLOBAL.datasetId)
    console.log(JSON.stringify(tableCreated));
    
  }
}