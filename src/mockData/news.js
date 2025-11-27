// Mock news data for demo
// Comprehensive collection of GTA 6 news articles for the demo
export const mockNewsArticles = [
  {
    _id: "news1",
    title: "GTA 6 Release Date Confirmed: November 19, 2026",
    description: "Rockstar Games has officially confirmed that Grand Theft Auto 6 will be released on November 19, 2026. Fans around the world are counting down the days!",
    content: "After years of anticipation, Rockstar Games has finally announced the official release date for Grand Theft Auto 6. The game will launch on November 19, 2026, for PlayStation 5, Xbox Series X/S, and PC. The announcement came during a special event where the developers showcased new gameplay footage and revealed more details about the game's story and characters.",
    author: "Sarah Johnson",
    enclosure: {
      url: "/images/HeaderImages/Bros.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news1",
    pubDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    source: "GTA News Hub",
    sourceType: "rss",
  },
  {
    _id: "news2",
    title: "New Character Details: Lucia's Backstory Revealed",
    description: "Rockstar has shared more information about Lucia, one of the two main protagonists in GTA 6. Learn about her background and motivations.",
    content: "In a recent interview, the developers at Rockstar Games revealed more details about Lucia, one of the two main characters in Grand Theft Auto 6. According to the developers, Lucia is a complex character with a rich backstory that will be explored throughout the game. Players will get to experience her journey from her early days to becoming a key figure in the game's narrative.",
    author: "Michael Chen",
    enclosure: {
      url: "/images/HeaderImages/LuciaPool.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news2",
    pubDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    source: "Gaming News",
    sourceType: "rss",
  },
  {
    _id: "news3",
    title: "Vice City Map Size: Bigger Than Ever Before",
    description: "The map in GTA 6 will be the largest in the series' history, featuring a detailed recreation of Vice City and surrounding areas.",
    content: "Rockstar Games has confirmed that the map in Grand Theft Auto 6 will be significantly larger than any previous game in the series. The map includes a detailed recreation of Vice City, along with surrounding areas, beaches, and countryside. The developers have spent years crafting every detail to ensure an immersive experience for players.",
    author: "David Martinez",
    enclosure: {
      url: "/images/HeaderImages/draco.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news3",
    pubDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    source: "GameSpot",
    sourceType: "rss",
  },
  {
    _id: "news4",
    title: "GTA 6 Graphics Engine: Next-Gen Visuals",
    description: "The new graphics engine in GTA 6 promises to deliver stunning visuals and realistic physics that push the boundaries of gaming.",
    content: "Rockstar Games has developed a brand new graphics engine specifically for Grand Theft Auto 6. The engine features advanced ray tracing, improved lighting systems, and realistic physics that make the game world feel more alive than ever. Early previews have shown incredible attention to detail in everything from character animations to environmental effects.",
    author: "Emily Rodriguez",
    enclosure: {
      url: "/images/HeaderImages/RaulBoat.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news4",
    pubDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    source: "IGN",
    sourceType: "rss",
  },
  {
    _id: "news5",
    title: "Multiplayer Features: What to Expect in GTA 6 Online",
    description: "Rockstar has hinted at new multiplayer features coming to GTA 6, building on the success of GTA Online.",
    content: "While details are still limited, Rockstar Games has confirmed that Grand Theft Auto 6 will include an expanded multiplayer experience. Building on the success of GTA Online, the new multiplayer mode will feature new activities, missions, and ways to interact with other players. More details are expected to be revealed closer to launch.",
    author: "James Wilson",
    enclosure: {
      url: "/images/HeaderImages/Stripaz.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news5",
    pubDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    source: "Kotaku",
    sourceType: "rss",
  },
  {
    _id: "news6",
    title: "Jason Character Deep Dive: The Second Protagonist",
    description: "Get to know Jason, the male protagonist of GTA 6, and how his story intertwines with Lucia's in this epic crime saga.",
    content: "Jason, the second main character in Grand Theft Auto 6, has been revealed as a key figure in the game's narrative. According to Rockstar, Jason's story is deeply connected to Lucia's, and players will experience their relationship evolve throughout the game. The dynamic between these two characters is said to be one of the most compelling aspects of GTA 6's story.",
    author: "Alex Thompson",
    enclosure: {
      url: "/images/HeaderImages/Bros.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news6",
    pubDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    source: "Polygon",
    sourceType: "rss",
  },
  {
    _id: "news7",
    title: "GTA 6 Vehicle Customization: More Options Than Ever",
    description: "Rockstar promises the most extensive vehicle customization system in the series, with hundreds of options for players to personalize their rides.",
    content: "Vehicle customization in Grand Theft Auto 6 will be more extensive than ever before. Players can expect hundreds of customization options, from paint jobs and rims to performance upgrades and unique modifications. The system has been completely redesigned to give players more creative freedom in making their vehicles truly unique.",
    author: "Rachel Green",
    link: "https://example.com/news7",
    pubDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    source: "Game Informer",
    sourceType: "rss",
  },
  {
    _id: "news8",
    title: "Leonida State: Exploring the New Setting",
    description: "GTA 6 takes place in the state of Leonida, featuring Vice City and surrounding areas. Here's what we know about the new location.",
    content: "Grand Theft Auto 6 is set in the fictional state of Leonida, which is based on Florida. The game features a detailed recreation of Vice City, along with surrounding areas including beaches, swamps, and urban environments. The developers have worked to capture the unique atmosphere and culture of the region, making it feel authentic and immersive.",
    author: "Chris Anderson",
    enclosure: {
      url: "/images/HeaderImages/LuciaPool.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news8",
    pubDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    source: "Eurogamer",
    sourceType: "rss",
  },
  {
    _id: "news9",
    title: "GTA 6 Soundtrack: Music That Defines Vice City",
    description: "Rockstar has announced an extensive soundtrack featuring music from multiple eras, perfectly capturing the vibe of Vice City.",
    content: "The soundtrack for Grand Theft Auto 6 will feature an extensive collection of music from various genres and eras. Rockstar has worked with numerous artists and record labels to create a soundtrack that perfectly captures the essence of Vice City. Players can expect to hear everything from classic hits to modern tracks as they explore the game world.",
    author: "Lisa Park",
    link: "https://example.com/news9",
    pubDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
    source: "The Verge",
    sourceType: "rss",
  },
  {
    _id: "news10",
    title: "Weapon System Overhaul: More Realistic Combat",
    description: "GTA 6 features a completely redesigned weapon system with more realistic handling, recoil, and weapon variety.",
    content: "The weapon system in Grand Theft Auto 6 has been completely overhauled to provide a more realistic and satisfying combat experience. Players can expect improved weapon handling, realistic recoil patterns, and a wider variety of weapons to choose from. The developers have worked closely with firearms experts to ensure authenticity.",
    author: "Mark Davis",
    enclosure: {
      url: "/images/HeaderImages/draco.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news10",
    pubDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    source: "VG247",
    sourceType: "rss",
  },
  {
    _id: "news11",
    title: "GTA 6 Pre-Order Bonuses Revealed",
    description: "Rockstar has announced exclusive pre-order bonuses including special vehicles, weapons, and in-game currency for GTA 6 Online.",
    content: "Players who pre-order Grand Theft Auto 6 will receive exclusive bonuses including special vehicles, unique weapons, and bonus in-game currency for GTA 6 Online. The pre-order packages are available in multiple tiers, with the premium edition offering the most exclusive content. Pre-orders are now available at participating retailers.",
    author: "Jennifer Lee",
    link: "https://example.com/news11",
    pubDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), // 11 days ago
    source: "GamesRadar",
    sourceType: "rss",
  },
  {
    _id: "news12",
    title: "Dynamic Weather System: Storms and Sunshine",
    description: "GTA 6 features a dynamic weather system that affects gameplay, with realistic storms, hurricanes, and changing weather patterns.",
    content: "The weather system in Grand Theft Auto 6 is more dynamic than ever before. Players will experience realistic weather patterns including sunny days, thunderstorms, and even hurricanes that can affect gameplay. The weather system is tied to the game's physics engine, making driving and other activities more challenging during adverse conditions.",
    author: "Robert Kim",
    enclosure: {
      url: "/images/HeaderImages/RaulBoat.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news12",
    pubDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    source: "PC Gamer",
    sourceType: "rss",
  },
  {
    _id: "news13",
    title: "GTA 6 Mission Structure: Non-Linear Storytelling",
    description: "Rockstar has implemented a more flexible mission structure, allowing players to approach objectives in multiple ways.",
    content: "The mission structure in Grand Theft Auto 6 has been redesigned to offer more player freedom. Missions can be approached in multiple ways, with different outcomes based on player choices. This non-linear approach to storytelling gives players more agency in how they experience the game's narrative.",
    author: "Amanda White",
    link: "https://example.com/news13",
    pubDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // 13 days ago
    source: "Destructoid",
    sourceType: "rss",
  },
  {
    _id: "news14",
    title: "GTA 6 Online: New Heist System Revealed",
    description: "The multiplayer component will feature an expanded heist system with more complex planning and execution phases.",
    content: "GTA 6 Online will feature an expanded heist system that builds on the success of GTA Online's heists. Players can expect more complex heists with multiple planning phases, various approaches, and dynamic outcomes. The new system allows for more player cooperation and strategic planning.",
    author: "Daniel Brown",
    enclosure: {
      url: "/images/HeaderImages/Stripaz.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news14",
    pubDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    source: "Rock Paper Shotgun",
    sourceType: "rss",
  },
  {
    _id: "news15",
    title: "Character Switching: Seamless Transitions",
    description: "The character switching mechanic in GTA 6 has been improved, allowing for seamless transitions between Lucia and Jason.",
    content: "Players can switch between Lucia and Jason at almost any time in Grand Theft Auto 6. The character switching mechanic has been improved to provide seamless transitions, with the camera smoothly moving between characters. Each character has their own unique missions, activities, and storylines that players can explore.",
    author: "Nicole Taylor",
    link: "https://example.com/news15",
    pubDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    source: "Game Rant",
    sourceType: "rss",
  },
  {
    _id: "news16",
    title: "GTA 6 Performance: 60 FPS on Next-Gen Consoles",
    description: "Rockstar confirms that GTA 6 will run at 60 frames per second on PlayStation 5 and Xbox Series X/S.",
    content: "Rockstar Games has confirmed that Grand Theft Auto 6 will run at 60 frames per second on PlayStation 5 and Xbox Series X/S. The game will also support various display modes including performance and quality modes, allowing players to choose between higher frame rates or better visual fidelity. PC players can expect even more customization options.",
    author: "Kevin Moore",
    link: "https://example.com/news16",
    pubDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), // 16 days ago
    source: "TechRadar",
    sourceType: "rss",
  },
  {
    _id: "news17",
    title: "GTA 6 Radio Stations: Full Lineup Announced",
    description: "Rockstar has revealed the complete list of radio stations that will be available in GTA 6, featuring diverse music genres.",
    content: "The complete lineup of radio stations for Grand Theft Auto 6 has been announced. Players can tune into various stations featuring different genres including hip-hop, rock, electronic, country, and more. Each station has been carefully curated to match the vibe of Vice City and the surrounding areas.",
    author: "Stephanie Clark",
    enclosure: {
      url: "/images/HeaderImages/Bros.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news17",
    pubDate: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000), // 17 days ago
    source: "NME",
    sourceType: "rss",
  },
  {
    _id: "news18",
    title: "GTA 6 Wildlife: Animals Roam the Streets",
    description: "The game world will feature various wildlife including alligators, birds, and other animals that add to the immersive experience.",
    content: "Grand Theft Auto 6 will feature wildlife throughout the game world, including alligators in swamps, birds in the sky, and various other animals. These creatures are not just for show - they can interact with players and the environment, adding another layer of realism to the game world.",
    author: "Brian Foster",
    link: "https://example.com/news18",
    pubDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
    source: "Giant Bomb",
    sourceType: "rss",
  },
  {
    _id: "news19",
    title: "GTA 6 Economy System: Earn Money Your Way",
    description: "Players can earn money through various activities including missions, side jobs, investments, and criminal enterprises.",
    content: "The economy system in Grand Theft Auto 6 offers multiple ways for players to earn money. Beyond traditional missions, players can engage in side activities, invest in businesses, run criminal enterprises, and more. The system is designed to give players freedom in how they want to build their wealth in the game.",
    author: "Michelle Adams",
    enclosure: {
      url: "/images/HeaderImages/LuciaPool.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news19",
    pubDate: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000), // 19 days ago
    source: "Forbes Gaming",
    sourceType: "rss",
  },
  {
    _id: "news20",
    title: "GTA 6 Trailer Breaks YouTube Records",
    description: "The first official GTA 6 trailer has become the most viewed video game trailer in YouTube history, surpassing 100 million views in just 24 hours.",
    content: "The first official trailer for Grand Theft Auto 6 has broken YouTube records, becoming the most viewed video game trailer in the platform's history. The trailer reached over 100 million views in just 24 hours, demonstrating the massive anticipation for the game. Fans around the world have been analyzing every frame for clues about the game's story and features.",
    author: "Ryan Johnson",
    enclosure: {
      url: "/src/assets/mockuser_videos/GTA6Trailer1_OG.mp4",
      type: "video/mp4",
    },
    link: "https://example.com/news20",
    pubDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    source: "YouTube Gaming",
    sourceType: "rss",
  },
  {
    _id: "news21",
    title: "GTA 6 PC Requirements: What You'll Need",
    description: "Rockstar has released the minimum and recommended PC system requirements for GTA 6, including details on storage and graphics cards.",
    content: "Rockstar Games has released the official PC system requirements for Grand Theft Auto 6. The minimum requirements include a modern CPU, 16GB of RAM, and a DirectX 12 compatible graphics card. The recommended specs are significantly higher, requiring a high-end GPU and 32GB of RAM for optimal performance at higher settings.",
    author: "Tom Harris",
    link: "https://example.com/news21",
    pubDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
    source: "PCWorld",
    sourceType: "rss",
  },
  {
    _id: "news22",
    title: "GTA 6 Side Activities: Endless Things to Do",
    description: "Beyond the main story, GTA 6 offers countless side activities including sports, mini-games, and exploration opportunities.",
    content: "Grand Theft Auto 6 features an extensive list of side activities beyond the main story. Players can engage in various sports, play mini-games, explore hidden locations, complete side missions, and discover secrets throughout the game world. These activities provide hours of additional gameplay and help make the world feel alive and interactive.",
    author: "Jessica Martinez",
    enclosure: {
      url: "/images/HeaderImages/draco.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news22",
    pubDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
    source: "GameRevolution",
    sourceType: "rss",
  },
  {
    _id: "news23",
    title: "GTA 6 Development: 7 Years in the Making",
    description: "Rockstar Games has been working on GTA 6 for over 7 years, making it one of the longest development cycles in gaming history.",
    content: "Grand Theft Auto 6 has been in development for over 7 years, making it one of the longest development cycles in gaming history. The extended development time has allowed Rockstar to create an incredibly detailed and immersive game world. The developers have taken their time to ensure every aspect of the game meets their high standards.",
    author: "Patrick O'Brien",
    link: "https://example.com/news23",
    pubDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), // 23 days ago
    source: "The Guardian",
    sourceType: "rss",
  },
  {
    _id: "news24",
    title: "GTA 6 Collectibles: Hidden Items Throughout the Map",
    description: "Players can discover various collectibles scattered throughout the game world, each with their own rewards and story connections.",
    content: "Grand Theft Auto 6 features numerous collectibles hidden throughout the game world. These items range from rare weapons and vehicles to story-related artifacts that provide additional context to the game's narrative. Finding all collectibles will reward players with special unlocks and achievements.",
    author: "Laura Smith",
    enclosure: {
      url: "/images/HeaderImages/RaulBoat.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news24",
    pubDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000), // 24 days ago
    source: "TrueAchievements",
    sourceType: "rss",
  },
  {
    _id: "news25",
    title: "GTA 6 Photo Mode: Capture Your Adventures",
    description: "A new photo mode allows players to capture stunning screenshots of their adventures in Vice City and share them with the community.",
    content: "Grand Theft Auto 6 includes a comprehensive photo mode that allows players to capture stunning screenshots of their adventures. The photo mode features various filters, camera angles, and editing options. Players can share their photos with the community through the game's social features.",
    author: "Carlos Rivera",
    link: "https://example.com/news25",
    pubDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    source: "Digital Trends",
    sourceType: "rss",
  },
  {
    _id: "news26",
    title: "GTA 6 Accessibility Features: Inclusive Gaming",
    description: "Rockstar has implemented extensive accessibility features to make GTA 6 playable for gamers with disabilities.",
    content: "Rockstar Games has implemented extensive accessibility features in Grand Theft Auto 6 to ensure the game is playable for gamers with disabilities. These features include customizable controls, visual and audio assistance options, and various difficulty settings. The developers have worked with accessibility consultants to ensure the features are comprehensive and effective.",
    author: "Ashley Turner",
    link: "https://example.com/news26",
    pubDate: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000), // 26 days ago
    source: "Can I Play That?",
    sourceType: "rss",
  },
  {
    _id: "news27",
    title: "GTA 6 Comparison: How It Stacks Against GTA 5",
    description: "A detailed comparison between GTA 6 and GTA 5, highlighting the improvements and new features in the latest installment.",
    content: "Grand Theft Auto 6 represents a significant leap forward from GTA 5 in almost every aspect. The graphics are dramatically improved, the map is larger, the story is more complex, and the gameplay mechanics have been refined. While GTA 5 was groundbreaking in its time, GTA 6 takes everything to the next level with modern technology and years of development experience.",
    author: "Matthew Lewis",
    enclosure: {
      url: "/images/HeaderImages/Stripaz.jpg",
      type: "image/jpeg",
    },
    link: "https://example.com/news27",
    pubDate: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000), // 27 days ago
    source: "GameByte",
    sourceType: "rss",
  },
  {
    _id: "news28",
    title: "GTA 6 Fan Theories: What the Community Thinks",
    description: "Fans have been speculating about GTA 6's story, characters, and features. Here are some of the most popular theories circulating online.",
    content: "The GTA community has been buzzing with theories about Grand Theft Auto 6 since the first trailer dropped. From predictions about the story to speculation about hidden features, fans have been analyzing every detail. Some theories suggest connections to previous GTA games, while others predict completely new gameplay mechanics.",
    author: "Sophie Anderson",
    link: "https://example.com/news28",
    pubDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 28 days ago
    source: "Reddit Gaming",
    sourceType: "rss",
  },
  {
    _id: "news29",
    title: "GTA 6 Special Edition: What's Included",
    description: "Rockstar has announced special edition versions of GTA 6 with exclusive content, collectibles, and bonus items.",
    content: "Rockstar Games has announced special edition versions of Grand Theft Auto 6 that include exclusive content and collectibles. The special editions feature unique in-game items, physical collectibles, art books, and more. Pre-orders for these special editions are available now at select retailers.",
    author: "Nathan Wright",
    link: "https://example.com/news29",
    pubDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), // 29 days ago
    source: "GameStop",
    sourceType: "rss",
  },
  {
    _id: "news30",
    title: "GTA 6 Developer Interview: Behind the Scenes",
    description: "An exclusive interview with the developers of GTA 6, discussing the challenges and triumphs of creating this ambitious game.",
    content: "In an exclusive interview, the developers at Rockstar Games discussed the challenges and triumphs of creating Grand Theft Auto 6. They shared insights into the development process, the technology behind the game, and their vision for the future of the series. The interview provides a fascinating look behind the scenes of one of the most anticipated games in history.",
    author: "Emma Thompson",
    enclosure: {
      url: "/src/assets/mockuser_videos/GTA6trailer1_Edited.mp4",
      type: "video/mp4",
    },
    link: "https://example.com/news30",
    pubDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    source: "Game Developer Magazine",
    sourceType: "rss",
  },
];

// Helper to get paginated news
export function getNewsArticles(page = 1, limit = 10, sortField = "pubDate", sortOrder = "desc", query = null, sourceType = null) {
  let filtered = [...mockNewsArticles];
  
  // Filter by sourceType if provided
  if (sourceType) {
    filtered = filtered.filter(article => article.sourceType === sourceType);
  }
  
  // Filter by query if provided (search in title, description, and content)
  if (query && query.trim()) {
    const searchTerm = query.toLowerCase().trim();
    filtered = filtered.filter(article => 
      article.title?.toLowerCase().includes(searchTerm) ||
      article.description?.toLowerCase().includes(searchTerm) ||
      article.content?.toLowerCase().includes(searchTerm) ||
      article.author?.toLowerCase().includes(searchTerm) ||
      article.source?.toLowerCase().includes(searchTerm)
    );
  }
  
  // Sort
  filtered.sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    // Handle Date objects
    if (aVal instanceof Date) aVal = aVal.getTime();
    if (bVal instanceof Date) bVal = bVal.getTime();
    
    const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    return sortOrder === "desc" ? -comparison : comparison;
  });
  
  // Paginate
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    articles: filtered.slice(start, end),
    total: filtered.length,
    totalArticles: filtered.length, // Also include totalArticles for compatibility
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
  };
}

// Helper to get article by ID
export function getNewsArticleById(id) {
  return mockNewsArticles.find((article) => article._id === id);
}

