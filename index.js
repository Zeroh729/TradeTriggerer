const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
var JSSoup = require('jssoup').default;
var request = require('request');
var map = require('./mapIds');
var utils = require('./utils')

// If modifying these scopes, delete credentials.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'credentials.json';

function requestTicker(ticker, callback){
  request('http://pseapi.com/api/Stock/'+ticker, function(err, res){
    if (err) { console.log('Error connecting to pseapi :', err); return; }
    json = JSON.parse(res.body)
    callback(map.id[ticker], json[json.length-1]);
  });
}

fs.readFile('client_secret.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), main);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return callback(err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}


function main(auth) {
  arr = ["JFC", "MEG"]
  for(i in arr){
    console.log(map.id[arr[i]])
    requestTicker(arr[i], function callback(ssid, val) {
      appendDada(auth, ssid, utils.format_mmddyyyy(val.date), val.open, val.high, val.low, val.close)
    })
  }
}

function appendDada(auth, spreadsheetId, date, open, high, low, close) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId,
    range: 'Sheet1!A2:E',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS', 
    includeValuesInResponse: 'FALSE',
    responseValueRenderOption: 'FORMATTED_VALUE',
    resource: {
      "majorDimension": "ROWS",
      "range": "Sheet1!A2:E",
      "values": [
        [
          date, open, high, low, close
        ]
      ]
    }
  }, (err, res) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log(res.status == 200 ? "Success" : "Status not 200");
  });
}