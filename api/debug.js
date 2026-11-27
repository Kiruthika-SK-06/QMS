export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    url: req.url,
    originalUrl: req.originalUrl,
    method: req.method,
    headers: req.headers,
    query: req.query
  });
}
