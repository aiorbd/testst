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

  // Dynamic upstream headers
  const upstreams = [
    {
      referer: "https://liveboxpro.com",
      origin: "https://liveboxpro.com"
    },
    {
      referer: "https://ppv.to",
      origin: "https://ppv.to"
    },
    {
      referer: "https://cloudvos.in",
      origin: "https://cloudvos.in"
    },
    {
      referer: "https://sportzfy.me/",
      origin: ""
    }
  ];

  const ua = req.query.ua || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

  let response;
  let success = false;

  // ✅ Try all upstream headers
  for (let up of upstreams) {
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
        console.warn(`Failed with referer ${up.referer}: ${response.status}`);
      }
    } catch (err) {
      console.warn(`Error with referer ${up.referer}: ${err.message}`);
    }
  }

  if (!success) return res.status(500).send("All proxy attempts failed");

  // ✅ If playlist (.m3u8)
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

  // ✅ If AES key
  if (targetUrl.includes(".key")) {
    res.set("Content-Type", "application/octet-stream");
    return response.body.pipe(res);
  }

  // ✅ If segment / ts
  res.set("Content-Type", response.headers.get("content-type") || "video/mp2t");
  response.body.pipe(res);
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Advanced HLS Proxy Running on port ${PORT}`);
});
