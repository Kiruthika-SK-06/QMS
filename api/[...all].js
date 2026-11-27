import app from "../backend/server.js";

export default function handler(req, res) {
  // Reconstruct original API path if routed through Vercel catch-all
  if (Array.isArray(req.query?.all)) {
    req.url = "/api/" + req.query.all.join("/");
  } else if (typeof req.query?.all === "string") {
    req.url = "/api/" + req.query.all;
  }
  return app(req, res);
}
