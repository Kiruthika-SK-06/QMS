/**
 * Real-Time Server-Sent Events (SSE) Engine for QMS
 * Broadcasts instant updates across Course Coordinators, QMS Coordinator, and Trust Head.
 */

const clients = new Set();

/**
 * Handle new SSE subscriber connections
 */
export function handleRealtimeStream(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });

  const connectionEvent = JSON.stringify({
    type: "REALTIME_CONNECTED",
    message: "🚀 QMS Real-Time Event Stream Connected",
    timestamp: new Date().toISOString()
  });
  res.write(`data: ${connectionEvent}\n\n`);

  clients.add(res);

  req.on("close", () => {
    clients.delete(res);
  });
}

/**
 * Broadcast an event to all connected active clients
 */
export function broadcastRealtimeEvent(type, payload = {}) {
  const eventData = JSON.stringify({
    type,
    payload,
    timestamp: new Date().toISOString()
  });
  const message = `data: ${eventData}\n\n`;

  for (const client of clients) {
    try {
      client.write(message);
    } catch {
      clients.delete(client);
    }
  }
}

/**
 * Keep connections alive with periodic heartbeat
 */
setInterval(() => {
  if (clients.size > 0) {
    const ping = `data: ${JSON.stringify({ type: "HEARTBEAT", timestamp: new Date().toISOString() })}\n\n`;
    for (const client of clients) {
      try {
        client.write(ping);
      } catch {
        clients.delete(client);
      }
    }
  }
}, 25000);
