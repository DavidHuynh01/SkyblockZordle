// Shared setup for the integration tests: a real DynamoDB (DynamoDB Local, from
// compose.yaml) and the production store code, with three guarantees:
//
//  - It can only ever talk to a local endpoint, with dummy credentials, so a
//    machine that has real AWS credentials can't touch real tables.
//  - The test table is built from infra/template.yaml, the same definition
//    production deploys, so the tests can't drift from the real table.
//  - Every test file gets its own freshly named table, so files can run in
//    parallel without seeing each other's data.
//
// What DynamoDB Local can't prove: IAM permissions, provisioned-capacity
// throttling, TTL deletion (it never expires items) and real network latency.
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import yaml from "js-yaml";
import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
  ListTablesCommand,
  UpdateTimeToLiveCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { createDynamoStore } from "../store/dynamo.js";

export const TEMPLATE = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "infra", "template.yaml");
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "dynamodb"]);

export function assertLocalEndpoint(url) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error(`not a URL: ${url}`);
  }
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`refusing to run integration tests against ${url}: only DynamoDB Local is allowed`);
  }
  return url;
}

// CloudFormation short-form tags (!Ref, !Sub, !If …) aren't standard YAML, so a
// plain parser rejects the template. Each tag is read as { "Fn": value }; the
// table definition doesn't use them, but other resources in the file do.
const CFN_TAGS = ["Ref", "Sub", "GetAtt", "If", "Equals", "Not", "And", "Or", "Join",
  "Select", "Split", "FindInMap", "Base64", "Cidr", "GetAZs", "ImportValue", "Condition"];
const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend(
  CFN_TAGS.flatMap((tag) =>
    ["scalar", "sequence", "mapping"].map(
      (kind) => new yaml.Type(`!${tag}`, { kind, construct: (data) => ({ [tag]: data }) })
    )
  )
);

// Table properties the test setup knows how to reproduce. Anything else (a new
// stream, encryption setting, …) fails loudly, so nobody adds it to the
// template and silently loses test coverage for it.
const HANDLED = new Set(["BillingMode", "ProvisionedThroughput", "AttributeDefinitions",
  "KeySchema", "GlobalSecondaryIndexes", "LocalSecondaryIndexes", "TimeToLiveSpecification"]);

export function tableSpecFromTemplate(text = readFileSync(TEMPLATE, "utf8")) {
  const resources = yaml.load(text, { schema: CFN_SCHEMA }).Resources || {};
  const tables = Object.values(resources).filter((r) => r.Type === "AWS::DynamoDB::Table");
  if (tables.length !== 1) throw new Error(`expected one DynamoDB table in the template, found ${tables.length}`);
  const p = tables[0].Properties;
  const unknown = Object.keys(p).filter((k) => !HANDLED.has(k));
  if (unknown.length) throw new Error(`test setup doesn't handle table properties: ${unknown.join(", ")}`);

  const create = {
    AttributeDefinitions: p.AttributeDefinitions,
    KeySchema: p.KeySchema,
    BillingMode: p.BillingMode || "PROVISIONED",
  };
  if (create.BillingMode === "PROVISIONED") create.ProvisionedThroughput = p.ProvisionedThroughput;
  if (p.GlobalSecondaryIndexes) create.GlobalSecondaryIndexes = p.GlobalSecondaryIndexes;
  if (p.LocalSecondaryIndexes) create.LocalSecondaryIndexes = p.LocalSecondaryIndexes;
  return { create, ttl: p.TimeToLiveSpecification || null };
}

export function localClient(endpoint = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000") {
  return new DynamoDBClient({
    endpoint: assertLocalEndpoint(endpoint),
    region: "us-east-1",
    // Never the machine's own credentials: DynamoDB Local accepts anything.
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  });
}

// DynamoDB Local takes a few seconds to start, in CI especially.
async function waitUntilReady(raw, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      return await raw.send(new ListTablesCommand({ Limit: 1 }));
    } catch (err) {
      if (Date.now() > deadline) {
        throw new Error(`DynamoDB Local isn't answering (start it with: docker compose up -d): ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

export async function openTestStore(name) {
  const raw = localClient();
  await waitUntilReady(raw);
  const tableName = `${name}-${randomUUID().slice(0, 8)}`;
  const { create, ttl } = tableSpecFromTemplate();
  await raw.send(new CreateTableCommand({ ...create, TableName: tableName }));
  if (ttl) await raw.send(new UpdateTimeToLiveCommand({ TableName: tableName, TimeToLiveSpecification: ttl }));

  const client = DynamoDBDocumentClient.from(raw, { marshallOptions: { removeUndefinedValues: true } });
  return {
    raw,
    client,
    tableName,
    store: createDynamoStore({ client, tableName }),
    drop: () => raw.send(new DeleteTableCommand({ TableName: tableName })),
  };
}
