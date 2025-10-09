import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

// ✅ Root Endpoint
app.get("/", (req, res) => {
  res.send("✅ Modular HLS Proxy Active. Use /proxy?url=YOUR_URL");
});

// ✅ Proxy Route
app.get("/proxy", async (req, res) => {
  const streamUrl = req.query.url;
  if (!streamUrl) return res.status(400).send("❌ Missing url parameter");

  const userAgent = req.query.ua || "ReactNativeVideo/8.0.0 (Linux;Android/13) AndroidXMedia3/1.1.1";

  const upstreamHeaders = [
    { referer: "https://liveboxpro.com", origin: "https://liveboxpro.com" },
    { referer: "https://ppv.to", origin: "https://ppv.to" },
    { referer: "https://cloudvos.in", origin: "https://cloudvos.in" },
    { referer: "https://sportzfy.me/", origin: "" },
    { referer: "https://fancode.com/#", origin: "https://fancode.com" },
    { referer: "https://watchindia.tv", origin: "https://watchindia.tv" },
    { referer: "https://tv.drmx.live", origin: "https://tv.drmx.live" }
  ];

  let finalResponse;
  let success = false;

  for (const headers of upstreamHeaders) {
    try {
      const attempt = await fetch(streamUrl, {
        headers: {
          Referer: headers.referer,
          Origin: headers.origin,
          "User-Agent": userAgent
        }
      });

      if (attempt.ok) {
        finalResponse = attempt;
        success = true;
        console.log(`✅ Success with referer: ${headers.referer}`);
        break;
      } else {
        console.warn(`❌ Failed [${headers.referer}] → ${attempt.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ Error [${headers.referer}] → ${err.message}`);
    }
  }

  if (!success) return res.status(502).send("❌ All proxy attempts failed");

  const contentType = finalResponse.headers.get("content-type") || "";

  // ✅ Playlist (.m3u8)
  if (streamUrl.includes(".m3u8") || contentType.includes("application/vnd.apple.mpegurl")) {
    let playlist = await finalResponse.text();

    // Rewrite internal URLs to route through proxy
    playlist = playlist.replace(/(https?:\/\/[^\s",]+)/g, (match) =>
      `${req.protocol}://${req.headers.host}/proxy?url=${encodeURIComponent(match)}`
    );

    res.set("Content-Type", "application/vnd.apple.mpegurl");
    return res.send(playlist);
  }

  // ✅ AES Key
  if (streamUrl.includes(".key") || contentType.includes("application/octet-stream")) {
    res.set("Content-Type", "application/octet-stream");
    return finalResponse.body.pipe(res);
  }

  // ✅ TS Segment or Other Media
  res.set("Content-Type", contentType || "video/mp2t");
  finalResponse.body.pipe(res);
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Proxy running at http://localhost:${PORT}/proxy`);
});
