# GH_Public_Load-PowerschoolData_toBigQuery
This utility will add Powerschool data to BigQuery.  The data structure was derived from a sheet by Paul Swanson at SAIS in Singapore.

Make a copy of [this sheet](https://docs.google.com/spreadsheets/d/1pLDjt1tvZbOuE6SQF6P63KMinj40n1A77ynHg3j24BE/copy)

## Prepare Constants on the lib.gs file in the const GLOBAL section
1. Copy the new Spreadsheet ID into the ssID
2. Copy your BigQuery Project ID into projectId
3. Copy your BigQuery Dataset ID into datasetId
4. Copy your Google Drive folder ID into dataImportsFolder

## initializeDataSheets
Run this function to prepare all the table sheets & fields, get the data types for each field, and create the SQL statements for each table.  It will also add table names to the dailyImport Sheet and monthlyImport Sheet depending on what is listed on the Tables Sheet.
### createPsTableSheets()
This function creates individual sheets for each entry in the Tables sheet. Once the sheet is created it adds the the PS fieldnames and BigQuery field names for each table to the sheet.
### getDataTypes()
This function gets the data types for each field and adds to the individual tableSheet.  Please note that you need add functionality to get the data from Powerschool.  I have provided the query.  We are using an in-house built API because the performanceis significantly better than using the GAS JDBC class to query an Oracle DB
### createSqlStatements()
This function creates the SQL statements for each table.  They Data type for each field is required so that we can CAST CLOB fields to varchar2.
### createBqTables()
This function creates all of the tables in BigQuery.  It looks at the data type and uses a BQ data type that is similar.
## Triggered Data functions
Both of the getDailyPsData() & geMonthlyPsData() functions get the number of rows in each table, if the number is over the batchSize of 10,000, it gets the data in batches of 10,000 records and stores it in a a comma seperated string.  once completed, The csv is added to a GZIP archive and uploaded to BiqQuery.  Please note that you need add functionality to get the data from Powerschool.  I have provided the query.  We are using an in-house built API because the performanceis significantly better than using the GAS JDBC class to query an Oracle DB. We found that if we were retriving more than 20,000 records using JDBC our scipt would time-out. 

You will need to add a dily Trigger for the getDailyPsData() function and a monthly trigger for the geMonthlyPsData()
