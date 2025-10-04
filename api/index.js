import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/", (req, res) => {
  res.send("✅ Stream Proxy is Running. Use /proxy endpoint.");
});

app.get("/proxy", async (req, res) => {
  const targetUrl = "https://laaaaaaaal.dupereasy.com/slh/Y29NR1RBV1JTSGdwQTBvcEdZTUdjL1VxdnYwWUVaNjAxME1zSDFjQVE5aFF2VlFnNWFOc0NTYnpOdHpheUJzZTNMSjc0Rkp1cU12TjhUYWdEVGRFUElFNjNRPT0/master.m3u8";

  try {
    const r = await fetch(targetUrl, {
      headers: {
        "Referer": "https://liveboxpro.com/",
        "Origin": "https://liveboxpro.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    if (!r.ok) {
      res.status(r.status).send("Stream fetch failed");
      return;
    }

    const body = await r.text();
    res.set("Content-Type", "application/vnd.apple.mpegurl");
    res.send(body);
  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

export default app;
