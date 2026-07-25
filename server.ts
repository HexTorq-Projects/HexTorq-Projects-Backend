import "dotenv/config";
import dns from "dns";
import express from "express";
import cors from "cors";

// Many VPS providers assign an IPv6 address that isn't actually routed. Node's
// fetch() then tries the IPv6 address first (from DNS), hangs/fails, and
// surfaces as a bare "fetch failed" with no useful detail — this bit us
// calling out to Pay-Panda's API, which is hosted on this same VPS behind
// Cloudflare (so it resolves to both A and AAAA records). Prefer IPv4.
dns.setDefaultResultOrder("ipv4first");

import categories from "./routes/categories";
import projects from "./routes/projects";
import applicationAreas from "./routes/applicationAreas";
import stats from "./routes/stats";
import auth from "./routes/auth";
import enquiries from "./routes/enquiries";
import mail from "./routes/mail";
import orders from "./routes/orders";
import wishlist from "./routes/wishlist";
import referrals from "./routes/referrals";
import admin from "./routes/admin";

const app = express();

// CORS: comma-separated allow-list from env; if the list contains "*", allow all origins.
const cleanOrigin = (origin: string) => origin.trim().replace(/^['"]|['"]$/g, "");
const allowedOrigins = (process.env.CORS_ORIGIN ?? "*")
  .split(",")
  .map(cleanOrigin)
  .filter(Boolean);
const allowAllOrigins = allowedOrigins.includes("*");

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowAllOrigins || !origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/categories", categories);
app.use("/application-areas", applicationAreas);
app.use("/stats", stats);
app.use("/projects", projects);
app.use("/auth", auth);
app.use("/enquiries", enquiries);
app.use("/mail", mail);
app.use("/orders", orders);
app.use("/wishlist", wishlist);
app.use("/referrals", referrals);
app.use("/admin", admin);

const PORT = Number(process.env.PORT ?? 4001);
const frontendUrl = (process.env.FRONTEND_URL || "https://projects.hextorq.tech").replace(/\/+$/, "");
console.log(`FRONTEND_URL resolved to: ${frontendUrl}`);
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
