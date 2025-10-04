import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS headers for all requests
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

// ✅ Root
app.get("/", (req, res) => {
  res.send("✅ Stream Proxy Running. Use /proxy?url=YOUR_URL");
});

// ✅ Proxy route
app.get("/proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing url parameter");

  const referers = ["https://liveboxpro.com", "https://ppv.to", "https://cloudvos.in"];
  const origins  = ["https://liveboxpro.com", "https://ppv.to", "https://cloudvos.in"];
  const ua       = req.query.ua || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

  let response;

  // ✅ Try multiple referers / origins
  for (let i = 0; i < referers.length; i++) {
    try {
      response = await fetch(targetUrl, {
        headers: {
          Referer: referers[i],
          Origin: origins[i],
          "User-Agent": ua
        }
      });
      if (response.ok) break;
    } catch (err) {
      console.warn(`Attempt with referer ${referers[i]} failed: ${err.message}`);
    }
  }

  if (!response || !response.ok) return res.status(500).send("All proxy attempts failed");

  // 🎯 Handle .m3u8 playlists
  if (targetUrl.includes(".m3u8")) {
    let body = await response.text();

    // ✅ Rewrite all http(s) URLs to proxy route (segments, keys, variants)
    body = body.replace(
      /(https?:\/\/[^\s",]+)/g,
      (match) => `${req.protocol}://${req.headers.host}/proxy?url=${encodeURIComponent(match)}`
    );

    res.set("Content-Type", "application/vnd.apple.mpegurl");
    return res.send(body);
  } else {
    // ✅ Segment / key → binary stream
    res.set("Content-Type", response.headers.get("content-type") || "video/mp2t");
    return response.body.pipe(res);
  }
});

app.listen(PORT, () => {
  console.log(`✅ HLS Proxy Running on port ${PORT}`);
});
