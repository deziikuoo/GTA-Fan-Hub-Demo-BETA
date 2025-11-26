const CACHE_NAME = "news-cache-v3";
const MAX_SIZE_MB = 45;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ARTICLES_TO_DELETE = 3;
const BASE_URL = "http://localhost:3003";
const CACHE_EXTERNAL_MEDIA = false; // Set to false to disable external media caching

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
  );
});

// Global error handler for unhandled promise rejections
self.addEventListener("error", (event) => {
  console.log("Service Worker error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.log("Service Worker unhandled promise rejection:", event.reason);
  event.preventDefault(); // Prevent the default error handling
});

self.addEventListener("fetch", (event) => {
  if (!event.request.url.startsWith(`${BASE_URL}/api/news`)) return;

  const url = new URL(event.request.url);
  const isFirstPage =
    url.searchParams.get("page") === "1" || !url.searchParams.get("page");

  console.log(
    `[SW] Intercepting request: ${event.request.url}, isFirstPage: ${isFirstPage}`
  );

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      console.log(`[SW] Cached response found: ${!!cachedResponse}`);

      if (isFirstPage) {
        try {
          console.log(`[SW] Fetching from network for first page`);
          const networkResponse = await fetch(event.request);
          if (
            networkResponse.ok &&
            networkResponse.headers
              .get("content-type")
              ?.includes("application/json")
          ) {
            console.log(`[SW] Caching network response`);
            await manageCache(cache, networkResponse.clone(), event.request);
          }
          return networkResponse;
        } catch (error) {
          console.error("Network fetch failed for first page:", error);
          if (cachedResponse) {
            console.log(`[SW] Returning cached response due to network error`);
            return cachedResponse;
          }
          return new Response(JSON.stringify({ error: "Offline" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else {
        if (cachedResponse) {
          console.log(
            `[SW] Returning cached response for page ${url.searchParams.get(
              "page"
            )}`
          );
          return cachedResponse;
        }

        console.log(`[SW] No cache found, fetching from network`);
        const fetchPromise = fetch(event.request)
          .then(async (networkResponse) => {
            if (!networkResponse.ok) {
              return networkResponse;
            }
            if (
              networkResponse.headers
                .get("content-type")
                ?.includes("application/json")
            ) {
              console.log(
                `[SW] Caching network response for page ${url.searchParams.get(
                  "page"
                )}`
              );
              await manageCache(cache, networkResponse.clone(), event.request);
            }
            return networkResponse;
          })
          .catch((error) => {
            console.error("Fetch failed:", error);
            return new Response(JSON.stringify({ error: "Offline" }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            });
          });

        return fetchPromise;
      }
    })
  );
});

async function manageCache(cache, response, request) {
  try {
    const cacheEntries = await cache.keys();
    let totalSize = 0;

    for (const req of cacheEntries) {
      const resp = await cache.match(req);
      const text = await resp.text();
      totalSize += new Blob([text]).size;
    }

    const newResponseText = await response.clone().text();
    const newSize = new Blob([newResponseText]).size;
    totalSize += newSize;

    if (totalSize > MAX_SIZE_BYTES) {
      const sortedEntries = await Promise.all(
        cacheEntries.map(async (req) => {
          try {
            const resp = await cache.match(req);
            const json = await resp.json();
            const pubDate = json.articles?.[0]?.pubDate || "0";
            return { req, pubDate: new Date(pubDate).getTime() || 0 };
          } catch (error) {
            console.error("Error parsing cache entry:", error);
            return { req, pubDate: 0 };
          }
        })
      ).then((entries) => entries.sort((a, b) => a.pubDate - b.pubDate));

      for (
        let i = 0;
        i < Math.min(ARTICLES_TO_DELETE, sortedEntries.length);
        i++
      ) {
        await cache.delete(sortedEntries[i].req);
        totalSize -= new Blob([
          (await (await cache.match(sortedEntries[i].req))?.text()) || "",
        ]).size;
      }
    }

    let json;
    try {
      json = await response.clone().json();
    } catch (error) {
      console.error("Invalid JSON in response:", error);
      return;
    }

    // Only cache media if enabled and from allowed sources
    if (CACHE_EXTERNAL_MEDIA && json.articles && Array.isArray(json.articles)) {
      for (const article of json.articles) {
        if (article.enclosure?.url) {
          // Check if this is a Reddit image or other external resource
          const mediaUrl = new URL(article.enclosure.url);
          const isRedditImage =
            mediaUrl.hostname.includes("redd.it") ||
            mediaUrl.hostname.includes("i.redd.it") ||
            mediaUrl.hostname.includes("preview.redd.it");
          const isSameOrigin = mediaUrl.origin === self.location.origin;
          const isAllowedDomain =
            mediaUrl.hostname.includes("localhost") ||
            mediaUrl.hostname.includes("127.0.0.1");

          // Skip Reddit images and other external resources that cause CORS issues
          if (isRedditImage) {
            console.log(
              `Skipping Reddit image cache (CORS blocked): ${article.enclosure.url}`
            );
            continue;
          }

          if (isSameOrigin || isAllowedDomain) {
            fetch(article.enclosure.url, {
              mode: "cors",
              credentials: "omit",
            })
              .then((mediaResponse) => {
                if (mediaResponse.ok) {
                  cache.put(article.enclosure.url, mediaResponse);
                }
              })
              .catch((error) => {
                // Silently fail for CORS-blocked resources
                console.log(
                  `Skipping media cache for CORS-blocked resource: ${article.enclosure.url}`
                );
              });
          } else {
            console.log(
              `Skipping external media cache: ${article.enclosure.url}`
            );
          }
        }
      }
    } else if (!CACHE_EXTERNAL_MEDIA) {
      console.log("External media caching disabled");
    }

    await cache.put(request, response.clone());
  } catch (error) {
    console.error("Error in manageCache:", error);
  }
}
