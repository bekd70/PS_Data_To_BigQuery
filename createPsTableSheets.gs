/**
 * creates individual sheets for each table and
 * adds all of the fields listed
 */
function createPsTableSheets() {
  let ps_Table_Names_Sheet = ss.getSheetByName(GLOBAL.initializeTableSheet);
  let dailyTableSheet = ss.getSheetByName(GLOBAL.psDailyImportTablesSheet);
  let monthlyTableSheet = ss.getSheetByName(GLOBAL.psMonthlyImportTablesSheet);
  let data = ps_Table_Names_Sheet.getDataRange().getValues();
  let fieldsData = ss.getSheetByName(GLOBAL.fieldsSheet).getDataRange().getValues();
  let templateSheet = ss.getSheetByName('Template');
  for(let i=1;i<data.length;i++){
    let sheetName = data[i][0];
    let importFrequency = data[i][2];
    let exportSheet = data[i][3];
    let sheet = ss.getSheetByName(sheetName);
    if(!sheet){
      sheet = ss.insertSheet(sheetName,ss.getSheets().length,{template: templateSheet});
      console.log(`${sheetName} added`)
      
      for(let j=1;j<fieldsData.length;j++){
        let row = fieldsData[j];

        if(row[0] === sheetName){
          sheet.appendRow([row[1],row[2],row[3],row[4],row[5],row[6],row[7]])
        }
        
      }
      if(importFrequency === 'DAILY'){
          dailyTableSheet.appendRow([sheetName,exportSheet])
      }
      else{
        monthlyTableSheet.appendRow([sheetName,exportSheet])
      }
      console.log(`Fields for ${sheetName} added`)
    }
  }
}
/**
 * DO NOT USE IN PRODUCTION
 * This can be used to delete the above table sheets that are created
 */
function deletePsTableSheets() {
  let ps_Table_Names_Sheet = ss.getSheetByName(GLOBAL.initializeTableSheet);
  let data = ps_Table_Names_Sheet.getDataRange().getValues()
  for(let i=1;i<data.length;i++){
    try{
      let sheetName = data[i][0];
      let sheet = ss.getSheetByName(sheetName);
      ss.deleteSheet(sheet);
    }
    catch(e){
      console.log("Couldn't find sheet")
    }
  }
}
