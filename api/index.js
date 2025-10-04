import express from "express";
import fetch from "node-fetch";

const app = express();

// ✅ CORS Fix
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

// ✅ Proxy
app.get("/proxy", async (req, res) => {
  const targetUrl = req.query.url || "YOUR_DEFAULT_STREAM_M3U8";

  try {
    const r = await fetch(targetUrl, {
      headers: {
        Referer: "https://liveboxpro.com/",
        Origin: "https://liveboxpro.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      },
    });

    if (!r.ok) {
      res.status(r.status).send("Stream fetch failed");
      return;
    }

    // যদি playlist (.m3u8) হয় → rewrite segment URLs
    if (targetUrl.endsWith(".m3u8")) {
      let body = await r.text();
      body = body.replace(
        /(https?:\/\/[^\s]+)/g,
        (match) => `https://testst-kappa.vercel.app/proxy?url=${encodeURIComponent(match)}`
      );
      res.set("Content-Type", "application/vnd.apple.mpegurl");
      res.send(body);
    } else {
      // segment files (.ts, .mp4 ইত্যাদি) binary stream হিসেবে পাঠাও
      res.set("Content-Type", r.headers.get("content-type") || "video/mp2t");
      r.body.pipe(res);
    }
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

export default app;
