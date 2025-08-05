// Google Apps Script để xử lý form submissions với CORS support
// Deploy this as a web app in Google Apps Script

function doPost(e) {
    try {
      // Parse the incoming data
      const data = JSON.parse(e.postData.contents);
      const { name, userType, timestamp, userAgent, screenResolution, timezone } = data;
      
      // Get the active spreadsheet (replace with your actual spreadsheet ID)
      const spreadsheet = SpreadsheetApp.openById('1WH2hPy8rttJ6wcC5PY9bqmJsyN3xp3BG9WNDoCzoAWA');
      const sheet = spreadsheet.getSheetByName('Form Submissions');
      
      // Add the data to the sheet
      sheet.appendRow([
        timestamp || new Date().toISOString(),
        name,
        userType,
        new Date().toISOString(),
        userAgent || '',
        screenResolution || '',
        timezone || ''
      ]);
      
      // Return success response
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          message: 'Data saved successfully',
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
      console.error('Error processing form submission:', error);
      
      // Return error response
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          error: error.toString(),
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  function doGet(e) {
    // Simple test endpoint
    return ContentService
      .createTextOutput(JSON.stringify({ 
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        message: 'Google Apps Script is working correctly'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Function to set up the spreadsheet headers
  function setupSpreadsheet() {
    const spreadsheet = SpreadsheetApp.openById('1WH2hPy8rttJ6wcC5PY9bqmJsyN3xp3BG9WNDoCzoAWA');
    const sheet = spreadsheet.getSheetByName('Form Submissions');
    
    // Set headers with additional columns
    sheet.getRange(1, 1, 1, 7).setValues([
      ['Timestamp', 'Name', 'User Type', 'Submission Date', 'User Agent', 'Screen Resolution', 'Timezone']
    ]);
    
    // Format headers
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    sheet.getRange(1, 1, 1, 7).setBackground('#4285f4');
    sheet.getRange(1, 1, 1, 7).setFontColor('white');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 7);
  }
  
  // Function to test the connection
  function testConnection() {
    try {
      const spreadsheet = SpreadsheetApp.openById('1WH2hPy8rttJ6wcC5PY9bqmJsyN3xp3BG9WNDoCzoAWA');
      const sheet = spreadsheet.getSheetByName('Form Submissions');
      
      return {
        success: true,
        message: 'Connection to spreadsheet successful',
        sheetName: sheet.getName(),
        lastRow: sheet.getLastRow(),
        lastColumn: sheet.getLastColumn()
      };
    } catch (error) {
      return {
        success: false,
        error: error.toString()
      };
    }
  }