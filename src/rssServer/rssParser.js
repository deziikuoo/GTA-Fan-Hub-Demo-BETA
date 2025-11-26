const Parser = require("rss-parser");
const cron = require("node-cron");

const parser = new Parser();

const feedUrls = [
  "https://www.ign.com/rss/v2/articles/feed?categories=news",
  "https://www.gamespot.com/feeds/",
  "https://kotaku.com/rss",
];

async function fetchRssFeeds() {
  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);
      const gta6News = feed.items.filter(isGTA6Related).map(processArticle);
      console.log(
        `Processed ${gta6News.length} GTA 6 related items from ${url}`
      );
      // TODO: Store processed items in database
    } catch (error) {
      console.error(`Error fetching feed from ${url}:`, error);
    }
  }
}

cron.schedule("0 * * * *", () => {
  console.log("Running RSS feed fetch...");
  fetchRssFeeds();
});

console.log("Starting RSS feed parser...");
fetchRssFeeds();

function isGTA6Related(item) {
  const keywords = [
    "GTA 6",
    "GTA6",
    "GrandTheftAuto6",
    "Grand Theft Auto 6",
    "Rockstar Games",
    "Rockstargames",
    "Rockstar",
    "Grandtheftauto",
    "Grand Theft Auto",
    "Grand Theft Auto V",
    "GTA V",
    "GTAV",
    "GTA5",
    "GTA 5",
    "GTA4",
    "GTA 4",
    "GTA III",
    "GTA3",
    "GTA 3",
    "GTA II",
    "GTA2",
    "GTA 2",
    "GTA",
    "Grand Theft Auto III",
    "Grand Theft Auto II",
    "Grand Theft Auto: Vice City",
    "Vice City",
    "Project Americas",
    "Rockstar North",
    "GTA VI",
    "Grand Theft Auto VI",
    "Leonida",
    "GTA6 Trailer",
    "Grand Theft Auto 6 Trailer",
    "Rockstar Games Trailer",
    "Rockstar North Trailer",
    "Project Americas Trailer",
    "Leonidas Trailer",
    "GTA Gameplay",
    "GTA 6 Gameplay",
    "Rockstar Games Gameplay",
    "Project Americas Gameplay",
    "Leonidas Gameplay",
    "GTA6 Gameplay",
    "GTA 6 Gameplay Trailer",
    "GTA6 Gameplay Trailer",
    "GTA Release Date",
    "GTA6 Release Date",
    "GTA 6 Release Date",
    "GTA six release date",
    "GTA six",
    "GTA 6 Leak",
    "Grand Theft Auto 6 Leak",
    "GTA 6 map",
    "GTA 6 leak",
    "GTA 6 leaked gameplay",
    "GTA 6 leaked trailer",
    "GTA 6 official trailer",
  ];

  const content =
    item.title.toLowerCase() + " " + item.description.toLowerCase();

  return keywords.some((keyword) => content.includes(keyword.toLowerCase()));
}
function processArticle(item) {
  return {
    title: item.title,
    description: item.contentSnippet || item.description,
    pubDate: new Date(item.pubDate),
    link: item.link,
    author: item.creator || item.author || "Unknown",
    source: item.source?.name || new URL(item.link).hostname,
  };
}
