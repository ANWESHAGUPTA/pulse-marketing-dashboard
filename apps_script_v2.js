// ============================================================
// TalentFlow AI Insights Generator v2
// Paste this into Google Apps Script (Extensions → Apps Script)
// ============================================================

// STEP 1: Replace this with your actual Claude API key
const CLAUDE_API_KEY = "YOUR_API_KEY_HERE";

function generateWeeklyInsights() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // --- Pull data from your sheets ---
  
  // Engagement Funnel
  const funnelSheet = ss.getSheetByName("Engagement Funnel");
  const funnelData = funnelSheet.getDataRange().getValues();
  const funnelRows = funnelData.slice(1);
  
  let funnelSummary = "ENGAGEMENT FUNNEL:\n";
  funnelRows.forEach(row => {
    funnelSummary += `- ${row[1]}: ${row[2]} events (${row[3]}% of pageviews, ${row[4]}% drop from previous step)\n`;
  });
  
  // CTA Performance
  const ctaSheet = ss.getSheetByName("CTA Performance");
  const ctaData = ctaSheet.getDataRange().getValues();
  const ctaRows = ctaData.slice(1);
  
  let ctaSummary = "\nCTA PERFORMANCE:\n";
  ctaRows.forEach(row => {
    ctaSummary += `- ${row[0]} (${row[1]}): ${row[3]} clicks (${row[5]}% of total)\n`;
  });
  
  // Feature Engagement
  const featSheet = ss.getSheetByName("Feature Engagement");
  const featData = featSheet.getDataRange().getValues();
  const featRows = featData.slice(1);
  
  let featSummary = "\nFEATURE ENGAGEMENT:\n";
  featRows.forEach(row => {
    featSummary += `- ${row[0]}: ${row[1]} clicks (${row[3]}% of total)\n`;
  });
  
  // Device Performance
  const devSheet = ss.getSheetByName("Device Performance");
  const devData = devSheet.getDataRange().getValues();
  const devRows = devData.slice(1);
  
  let devSummary = "\nDEVICE PERFORMANCE:\n";
  devRows.forEach(row => {
    devSummary += `- ${row[0]}: ${row[1]} page views, ${row[4]} CTA clicks, ${row[6]}% CTA rate, ${row[5]}s avg engagement\n`;
  });
  
  // Country Performance
  const ctrySheet = ss.getSheetByName("Country Performance");
  const ctryData = ctrySheet.getDataRange().getValues();
  const ctryRows = ctryData.slice(1);
  
  let ctrySummary = "\nCOUNTRY PERFORMANCE:\n";
  ctryRows.forEach(row => {
    ctrySummary += `- ${row[0]}: ${row[1]} page views, ${row[2]} CTA clicks, ${row[4]}% CTA rate\n`;
  });
  
  // --- Build the prompt ---
  const fullData = funnelSummary + ctaSummary + featSummary + devSummary + ctrySummary;
  
  const prompt = `You are a senior marketing analyst for TalentFlow, a B2B SaaS talent assessment platform (similar to TestGorilla). 

Here is this week's marketing analytics data from our landing page:

${fullData}

Based on this data, generate exactly 5 actionable weekly insights.

IMPORTANT: Respond ONLY in this exact format with no extra text. Each insight must be on exactly 4 lines separated by | (pipe character):

insight_number|key_metric|finding|recommendation

Example format:
1|32% drop-off|Visitors abandon page before reaching bottom CTA|Move bottom CTA to right after pricing section

Generate exactly 5 rows in this format. No headers, no extra text, no blank lines. Just 5 rows of pipe-separated data. Use specific numbers from the data. Each field should be one concise sentence.`;

  // --- Call Claude API ---
  const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    payload: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        { role: "user", content: prompt }
      ]
    })
  });
  
  const result = JSON.parse(response.getContentText());
  const rawInsights = result.content[0].text.trim();
  
  // --- Parse and write to sheet ---
  let insightSheet = ss.getSheetByName("AI Weekly Insights");
  if (insightSheet) {
    ss.deleteSheet(insightSheet);
  }
  insightSheet = ss.insertSheet("AI Weekly Insights");
  
  // Headers
  insightSheet.getRange("A1").setValue("Insight #");
  insightSheet.getRange("B1").setValue("Key Metric");
  insightSheet.getRange("C1").setValue("Finding");
  insightSheet.getRange("D1").setValue("Recommendation");
  insightSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#E8553D").setFontColor("#FFFFFF");
  
  // Parse the pipe-separated response
  const lines = rawInsights.split("\n").filter(line => line.trim() !== "");
  
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split("|");
    if (parts.length >= 4) {
      const row = i + 2;
      insightSheet.getRange(row, 1).setValue(parts[0].trim());
      insightSheet.getRange(row, 2).setValue(parts[1].trim());
      insightSheet.getRange(row, 3).setValue(parts[2].trim());
      insightSheet.getRange(row, 4).setValue(parts[3].trim());
    }
  }
  
  // Add generation timestamp
  const today = new Date();
  const nextRow = lines.length + 3;
  insightSheet.getRange(nextRow, 1).setValue("Generated: " + Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"));
  insightSheet.getRange(nextRow, 1).setFontColor("#888888").setFontSize(9);
  
  // Format columns
  insightSheet.setColumnWidth(1, 80);
  insightSheet.setColumnWidth(2, 180);
  insightSheet.setColumnWidth(3, 400);
  insightSheet.setColumnWidth(4, 400);
  insightSheet.getRange("A2:D6").setWrap(true);
  
  // Alternate row colors
  for (let i = 2; i <= 6; i++) {
    if (i % 2 === 0) {
      insightSheet.getRange(i, 1, 1, 4).setBackground("#FFF5F3");
    }
  }
  
  // --- Update AI Log ---
  let logSheet = ss.getSheetByName("AI Log");
  if (!logSheet) {
    logSheet = ss.insertSheet("AI Log");
    logSheet.getRange("A1").setValue("Timestamp");
    logSheet.getRange("B1").setValue("Data Sent");
    logSheet.getRange("C1").setValue("Insights Generated");
    logSheet.getRange("A1:C1").setFontWeight("bold");
  }
  
  const lastRow = logSheet.getLastRow() + 1;
  logSheet.getRange(lastRow, 1).setValue(today);
  logSheet.getRange(lastRow, 2).setValue(fullData);
  logSheet.getRange(lastRow, 3).setValue(rawInsights);
  
  SpreadsheetApp.getUi().alert("AI Insights generated successfully! Check the 'AI Weekly Insights' sheet.");
}

// --- Menu button so you can run it from the sheet ---
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🤖 AI Insights")
    .addItem("Generate Weekly Insights", "generateWeeklyInsights")
    .addToUi();
}
