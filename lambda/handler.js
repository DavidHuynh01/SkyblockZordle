// AWS Lambda entry point (Function URL, payload format 2.0).
// Shares all routing and game logic with the local Express server.
import { createApi, handleRequest } from "../server/api.js";
import { createDynamoStore } from "../server/store/dynamo.js";

const store = createDynamoStore({ tableName: process.env.TABLE_NAME });
const api = createApi(store);

const CORS = {
  "access-control-allow-origin": process.env.ALLOWED_ORIGIN || "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};

export async function handler(event) {
  const method = event?.requestContext?.http?.method || "GET";
  const path = event?.rawPath || "/";

  let body = {};
  if (event?.body) {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    try {
      body = JSON.parse(raw);
    } catch {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "invalid json" }) };
    }
  }

  try {
    const res = await handleRequest(api, {
      method,
      path,
      query: event?.queryStringParameters || {},
      body,
    });
    return {
      statusCode: res.status,
      headers: { "content-type": "application/json", ...CORS },
      body: res.body === null ? "" : JSON.stringify(res.body),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "server error" }) };
  }
}
