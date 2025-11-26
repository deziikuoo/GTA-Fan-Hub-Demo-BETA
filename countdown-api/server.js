const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

const releaseTimes = {
  // North America (NTSC-U)
  "Eastern": new Date("November 19, 2026 12:00:00 EST"),     // Midnight Eastern Time
  "Central": new Date("November 19, 2026 12:00:00 CST"),     // Midnight Central Time
  "Mountain": new Date("November 19, 2026 12:00:00 MST"),    // Midnight Mountain Time
  "Pacific": new Date("November 19, 2026 12:00:00 PST"),     // Midnight Pacific Time
  "Alaska": new Date("November 19, 2026 12:00:00 AKST"),      // Midnight Alaska Time
  "Eastern Canada": new Date("November 19, 2026 12:00:00 EST"), // Midnight Eastern Time
  "Pacific Canada": new Date("November 19, 2026 12:00:00 PST"), // Midnight Pacific Time

  // Europe (PAL)
  "UK": new Date("November 19, 2026 12:00:00 GMT"),          // Midnight UK Time
  "Central Europe": new Date("November 19, 2026 12:00:00 CET"), // Midnight Central European Time
  "Eastern Europe": new Date("November 19, 2026 12:00:00 EET"), // Midnight Eastern European Time

  // Asia (NTSC-J)
  "Japan": new Date("November 19, 2026 12:00:00 JST"),       // Midnight Japan Standard Time
  "Korea": new Date("November 19, 2026 12:00:00 KST"),        // Midnight Korea Standard Time
  "China": new Date("November 19, 2026 12:00:00 CST"),        // Midnight China Standard Time
  "Hong Kong": new Date("November 19, 2026 12:00:00 HKT"),    // Midnight Hong Kong Time
  "Taiwan": new Date("November 19, 2026 12:00:00 CST"),       // Midnight Taiwan Standard Time

  // Oceania (PAL)
  "Australia": new Date("November 19, 2026 12:00:00 AEDT"),   // Midnight Australian Eastern Daylight Time
  "New Zealand": new Date("November 19, 2026 12:00:00 NZDT"), // Midnight New Zealand Daylight Time

  // South America
  "Brazil": new Date("November 19, 2026 12:00:00 BRT"),      // Midnight Brasília Time
  "Argentina": new Date("November 19, 2026 12:00:00 ART")    // Midnight Argentina Time
};

app.get('/api/release-times', (req, res) => {
  res.json(releaseTimes);
});

// Endpoint to get the current server time
app.get('/api/server-time', (req, res) => {
    const serverTime = new Date().toISOString();
  res.json({ server_time: new Date().toISOString() });
  console.log("Fetched Server Time:", new Date(serverTime).toISOString());
});

app.get('/api/target-date', (req, res) => {
  const userRegion = 'Pacific';
  const targetDate = releaseTimes[userRegion] || releaseTimes['Eastern'];
  res.json({ target_date: targetDate.toISOString() });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});