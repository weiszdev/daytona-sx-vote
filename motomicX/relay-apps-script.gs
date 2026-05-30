/**
 * MotoMic Live Timing — Data Relay (Google Apps Script)
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com and create a new project.
 * 2. Paste this entire file into Code.gs (replace any default code).
 * 3. Click Deploy > New deployment.
 * 4. Choose "Web app" as the type.
 * 5. Set "Execute as" to "Me" and "Who has access" to "Anyone".
 * 6. Click Deploy and copy the web app URL.
 * 7. Paste that URL into:
 *    - The RELAY_URL constant in motomic-live-timing.user.js (sender)
 *    - The ?relay= parameter or RELAY_URL default in live.html (consumer)
 *
 * HOW IT WORKS:
 * - The Tampermonkey userscript POSTs rider data JSON every 5 seconds.
 * - This script stores it in Script Properties (no spreadsheet needed).
 * - The live.html page GETs the stored data as JSON every 5 seconds.
 */

/**
 * Handle GET requests — return stored live timing data as JSON.
 */
function doGet(e) {
  var props = PropertiesService.getScriptProperties();
  var data = props.getProperty("MOTOMIC_LIVE_DATA");

  if (!data) {
    data = JSON.stringify({
      riders: [],
      eventTitle: "",
      clock: "",
      timestamp: null,
      lastUpdated: null,
    });
  }

  return ContentService.createTextOutput(data).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Handle POST requests — store incoming rider data.
 */
function doPost(e) {
  try {
    var payload;

    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({ status: "error", message: "No data received" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Add server-side timestamp
    payload.lastUpdated = new Date().toISOString();

    var props = PropertiesService.getScriptProperties();
    props.setProperty("MOTOMIC_LIVE_DATA", JSON.stringify(payload));

    return ContentService.createTextOutput(
      JSON.stringify({ status: "ok", lastUpdated: payload.lastUpdated })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
