# Google Sheets Database Setup

Since we are running a serverless application, we will use **Google Apps Script** to receive the form data and save it into a Google Sheet.

Follow these steps to set up your backend:

## 1. Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com).
2. Create a new blank spreadsheet.
3. Name it **"Fun Run Database"**.
   *(Note: You do not need to create columns manually. The script will handle it.)*

## 2. Create the Google Apps Script
1. In your Google Sheet, click on **Extensions** > **Apps Script**.
2. Delete any code in the `Code.gs` file and paste the following script:

```javascript
var SHEET_NAME = "Registrations";

function setupSheet(doc) {
  var sheet = doc.getSheetByName(SHEET_NAME);
  
  // If sheet doesn't exist, create it
  if (!sheet) {
    sheet = doc.insertSheet(SHEET_NAME);
    // Delete default Sheet1 if it's empty and we just created a new one
    var defaultSheet = doc.getSheetByName("Sheet1");
    if (defaultSheet && defaultSheet.getLastRow() === 0) {
      doc.deleteSheet(defaultSheet);
    }
  }
  
  // Define required headers
  var headers = [
    "Timestamp",
    "Full Name", 
    "Barangay", 
    "Birthdate", 
    "Age", 
    "T-shirt Size"
  ];
  
  // Check if headers exist
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    // If sheet is empty, set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = setupSheet(doc);

    var nextRow = sheet.getLastRow() + 1;

    // Parse the incoming data
    // We expect the data to be sent as JSON string in the body
    var postData = JSON.parse(e.postData.contents);
    
    var newRow = [
      new Date(), // Timestamp
      postData.fullName,
      postData.barangay,
      postData.birthdate,
      postData.age,
      postData.tshirtSize
    ];

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": nextRow }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Handler for GET requests - needed to avoid "script function not found: doGet" errors
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ "status": "active", "message": "Fun Run API is running" }))
    .setMimeType(ContentService.MimeType.JSON);
}

```

3. Save the project (click the disk icon or Ctrl+S).

## 3. Deploy the Script (CRITICAL STEP)
1. Click on the blue **Deploy** button > **New deployment**.
2. Click the gear icon (Select type) > **Web app**.
3. Fill in the details:
   - **Description**: Fun Run API
   - **Execute as**: `Me` (your email)
   - **Who has access**: `Anyone` **<-- IMPORTANT: You must select "Anyone"**
4. Click **Deploy**.
5. You might be asked to authorize the script. Click **Review permissions**, choose your account, click **Advanced** > **Go to (Script Name) (unsafe)** > **Allow**.
6. Copy the **Web App URL** (it ends with `/exec`).

## 4. Connect to Frontend
1. Open `src/components/RegistrationForm.vue`.
2. Locate the `GOOGLE_SCRIPT_URL` constant at the top of the script.
3. Replace the empty string with your copied **Web App URL**.

```typescript
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
```

---

## Troubleshooting

### Error: "403 Forbidden" or "Access Denied"
This error happens if the **"Who has access"** setting is incorrect. To fix it:
1. Go to your Apps Script editor.
2. Click **Deploy** > **Manage deployments**.
3. Click the **Edit** (pencil icon) on your active deployment.
4. Change **Who has access** to **Anyone**.
5. Click **Deploy**.
6. **Note:** The URL should stay the same. If it changes, update it in your code.
