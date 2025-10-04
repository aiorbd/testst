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

app.get("/", (req, res) => {
  res.send("✅ Stream Proxy is Running. Use /proxy endpoint.");
});

app.get("/proxy", async (req, res) => {
  const targetUrl =
    "https://laaaaaaaal.dupereasy.com/slh/Y29NR1RBV1JTSGdwQTBvcEdZTUdjL1VxdnYwWUVaNjAxME1zSDFjQVE5aFF2VlFnNWFOc0NTYnpOdHpheUJzZTNMSjc0Rkp1cU12TjhUYWdEVGRFUElFNjNRPT0/master.m3u8";

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

    const body = await r.text();
    res.set("Content-Type", "application/vnd.apple.mpegurl");

    // ✅ Add CORS here also
    res.set("Access-Control-Allow-Origin", "*");

    res.send(body);
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

export default app;
