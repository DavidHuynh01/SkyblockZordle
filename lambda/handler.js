// AWS Lambda entry point (Function URL, payload format 2.0).
// Shares all routing and game logic with the local Express server.
import { createApi, handleRequest } from "../server/api.js";
import { createDynamoStore } from "../server/store/dynamo.js";

const store = createDynamoStore({ tableName: process.env.TABLE_NAME });
const api = createApi(store);

// CORS headers are added by the Function URL's own CORS config (see
// infra/template.yaml). Setting them here too would send duplicate
// Access-Control-Allow-Origin values and browsers reject that.
const JSON_HEADERS = { "content-type": "application/json" };

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
      return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "invalid json" }) };
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
      headers: JSON_HEADERS,
      body: res.body === null ? "" : JSON.stringify(res.body),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: "server error" }) };
  }
}
