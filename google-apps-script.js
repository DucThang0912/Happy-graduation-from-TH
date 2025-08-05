// Google Apps Script để xử lý form submissions
// Deploy this as a web app in Google Apps Script

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    const { name, userType, timestamp } = data;
    
    // Get the active spreadsheet (you'll need to create this)
    const spreadsheet = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID_HERE');
    const sheet = spreadsheet.getSheetByName('Form Submissions');
    
    // Add the data to the sheet
    sheet.appendRow([
      timestamp || new Date().toISOString(),
      name,
      userType,
      new Date().toISOString()
    ]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Data saved successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing form submission:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Simple test endpoint
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Server is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Function to set up the spreadsheet headers
function setupSpreadsheet() {
  const spreadsheet = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID_HERE');
  const sheet = spreadsheet.getSheetByName('Form Submissions');
  
  // Set headers
  sheet.getRange(1, 1, 1, 4).setValues([
    ['Timestamp', 'Name', 'User Type', 'Submission Date']
  ]);
  
  // Format headers
  sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  sheet.getRange(1, 1, 1, 4).setBackground('#4285f4');
  sheet.getRange(1, 1, 1, 4).setFontColor('white');
} 