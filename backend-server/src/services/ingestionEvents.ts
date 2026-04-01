/*
 * @Editor: zhanghang
 * @Description: 
 * @Date: 2026-04-01 11:45:09
 * @LastEditors: zhanghang
 * @LastEditTime: 2026-04-01 11:45:16
 */
import type { Response } from "express";

type IngestionEvent = {
  type: string;
  timestamp: string;
  file?: unknown;
  task?: unknown;
};

type Client = {
  response: Response;
  keepAlive: NodeJS.Timeout;
};

const clients = new Map<string, Set<Client>>();

function writeEvent(response: Response, event: IngestionEvent) {
  response.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function subscribeToIngestionEvents(userId: string, response: Response) {
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  response.flushHeaders();

  const client: Client = {
    response,
    keepAlive: setInterval(() => {
      response.write(": keep-alive\n\n");
    }, 15000),
  };

  const bucket = clients.get(userId) ?? new Set<Client>();
  bucket.add(client);
  clients.set(userId, bucket);

  writeEvent(response, {
    type: "stream.connected",
    timestamp: new Date().toISOString(),
  });

  response.on("close", () => {
    clearInterval(client.keepAlive);
    const current = clients.get(userId);
    if (!current) {
      return;
    }

    current.delete(client);
    if (current.size === 0) {
      clients.delete(userId);
    }
  });
}

export function publishIngestionEvent(userId: string, event: Omit<IngestionEvent, "timestamp">) {
  const bucket = clients.get(userId);
  if (!bucket || bucket.size === 0) {
    return;
  }

  const payload: IngestionEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  for (const client of bucket) {
    writeEvent(client.response, payload);
  }
}