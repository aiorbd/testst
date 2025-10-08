import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

// ✅ Root
app.get("/", (req, res) => {
  res.send("✅ Advanced HLS Proxy Running. Use /proxy?url=YOUR_URL");
});

// ✅ Proxy route
app.get("/proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing url parameter");

  const upstreams = [
    { referer: "https://liveboxpro.com", origin: "https://liveboxpro.com" },
    { referer: "https://ppv.to", origin: "https://ppv.to" },
    { referer: "https://cloudvos.in", origin: "https://cloudvos.in" },
    { referer: "https://sportzfy.me/", origin: "" }
  ];

  const ua = req.query.ua || "ExoPlayerLib/2.19.1 (Linux;Android 13) ExoPlayer/2.19.1";

  let response;
  let success = false;

  for (const up of upstreams) {
    try {
      response = await fetch(targetUrl, {
        headers: {
          Referer: up.referer,
          Origin: up.origin,
          "User-Agent": ua
        }
      });
      if (response.ok) {
        success = true;
        break;
      } else {
        console.warn(`❌ Failed with referer ${up.referer}: ${response.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ Error with referer ${up.referer}: ${err.message}`);
    }
  }

  if (!success) return res.status(502).send("❌ All proxy attempts failed");

  const contentType = response.headers.get("content-type") || "";

  // ✅ Playlist (.m3u8)
  if (targetUrl.includes(".m3u8") || contentType.includes("application/vnd.apple.mpegurl")) {
    let body = await response.text();

    // Rewrite URLs to proxy
    body = body.replace(/(https?:\/\/[^\s",]+)/g, (match) =>
      `${req.protocol}://${req.headers.host}/proxy?url=${encodeURIComponent(match)}`
    );

    res.set("Content-Type", "application/vnd.apple.mpegurl");
    return res.send(body);
  }

  // ✅ AES Key
  if (targetUrl.includes(".key") || contentType.includes("application/octet-stream")) {
    res.set("Content-Type", "application/octet-stream");
    return response.body.pipe(res);
  }

  // ✅ TS Segment
  res.set("Content-Type", contentType || "video/mp2t");
  response.body.pipe(res);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Proxy running at http://localhost:${PORT}/proxy`);
});
