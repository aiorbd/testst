import express from "express";
import fetch from "node-fetch";

const app = express();

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
  if (!targetUrl) {
    res.status(400).send("Missing url parameter");
    return;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Referer: "https://liveboxpro.com/","https://ppv.to",
        Origin: "https://liveboxpro.com","https://ppv.to",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      res.status(response.status).send("Stream fetch failed");
      return;
    }

    // 🎯 If .m3u8 → rewrite URLs
    if (targetUrl.includes(".m3u8")) {
      let body = await response.text();

      // Rewrite all http(s) URLs (segments & key)
      body = body.replace(
        /(https?:\/\/[^\s",]+)/g,
        (match) => `https://${req.headers.host}/proxy?url=${encodeURIComponent(match)}`
      );

      res.set("Content-Type", "application/vnd.apple.mpegurl");
      res.send(body);
    } else {
      // Segment or key → binary stream
      res.set("Content-Type", response.headers.get("content-type") || "video/mp2t");
      response.body.pipe(res);
    }
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

export default app;
