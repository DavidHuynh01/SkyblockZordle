// Local development server. Thin Express wrapper around the shared API so it
// behaves exactly like the Lambda deployment.
import express from "express";
import cors from "cors";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createApi, handleRequest } from "./api.js";
import { loadConfig } from "./config.js";
import { createJsonStore } from "./store/json.js";
import { createDynamoStore } from "./store/dynamo.js";

const HERE = dirname(fileURLToPath(import.meta.url));

// Use DynamoDB when a table is configured, otherwise the local JSON file.
const store = process.env.TABLE_NAME
  ? createDynamoStore({ tableName: process.env.TABLE_NAME })
  : createJsonStore();
const api = createApi(store, await loadConfig());

const app = express();
app.use(cors());
app.use(express.json());

app.all("/api/*", async (req, res) => {
  try {
    const { status, body, headers } = await handleRequest(api, {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      headers: req.headers,
      ip: req.ip,
    });
    if (headers) res.set(headers);
    body === null ? res.status(status).end() : res.status(status).json(body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// Serve the built frontend if it exists (single-service local run).
const dist = join(HERE, "..", "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(join(dist, "index.html")));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`SkyblockZordle API on :${PORT} (${process.env.TABLE_NAME ? "DynamoDB" : "local JSON"})`)
);
