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

// ✅ Root route
app.get("/", (req, res) => {
  res.send("✅ Advanced HLS Proxy Running. Use /proxy?url=YOUR_URL");
});

// ✅ Proxy route
app.get("/proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing url parameter");

  // Multiple headers fallback
  const referers = ["https://liveboxpro.com"];
  const origins  = ["https://liveboxpro.com"];
  const ua       = req.query.ua || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

  let response;
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

  // ✅ If .m3u8 → rewrite playlist
  if (targetUrl.includes(".m3u8")) {
    let body = await response.text();

    // Rewrite all URLs to proxy route
    body = body.replace(
      /(https?:\/\/[^\s",]+)/g,
      (match) => `${req.protocol}://${req.headers.host}/proxy?url=${encodeURIComponent(match)}`
    );

    res.set("Content-Type", "application/vnd.apple.mpegurl");
    return res.send(body);
  }

  // ✅ If AES key → proxy
  if (targetUrl.includes(".key")) {
    res.set("Content-Type", "application/octet-stream");
    return response.body.pipe(res);
  }

  // ✅ Segment / ts file
  res.set("Content-Type", response.headers.get("content-type") || "video/mp2t");
  response.body.pipe(res);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Advanced HLS Proxy Running on port ${PORT}`);
});
