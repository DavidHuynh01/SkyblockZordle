// The harness itself: it must only ever reach DynamoDB Local, and the test
// table must match the production definition in infra/template.yaml.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { assertLocalEndpoint, localClient, openTestStore, tableSpecFromTemplate } from "./helper.js";

const db = await openTestStore("table");
after(() => db.drop());

test("refuses any endpoint that isn't DynamoDB Local", () => {
  assert.throws(() => assertLocalEndpoint("https://dynamodb.us-east-1.amazonaws.com"), /only DynamoDB Local/);
  assert.throws(() => assertLocalEndpoint("http://localhost.evil.com:8000"), /only DynamoDB Local/);
  assert.throws(() => localClient("https://dynamodb.us-east-1.amazonaws.com"), /only DynamoDB Local/);
  assert.equal(assertLocalEndpoint("http://localhost:8000"), "http://localhost:8000");
  assert.equal(assertLocalEndpoint("http://dynamodb:8000"), "http://dynamodb:8000");
});

test("never uses the machine's own AWS credentials", async () => {
  const creds = await localClient().config.credentials();
  assert.equal(creds.accessKeyId, "local");
});

test("the table spec comes from the production template", () => {
  const { create } = tableSpecFromTemplate();
  assert.deepEqual(create.KeySchema, [
    { AttributeName: "pk", KeyType: "HASH" },
    { AttributeName: "sk", KeyType: "RANGE" },
  ]);
  assert.equal(create.BillingMode, "PROVISIONED");
});

test("a table property the setup doesn't understand fails loudly", () => {
  const template = `
Resources:
  T:
    Type: AWS::DynamoDB::Table
    Properties:
      KeySchema: [{ AttributeName: pk, KeyType: HASH }]
      StreamSpecification: { StreamViewType: NEW_IMAGE }
  Other:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "\${AWS::StackName}-x"
`;
  assert.throws(() => tableSpecFromTemplate(template), /StreamSpecification/);
});

test("the created table has the production key schema", async () => {
  const { Table } = await db.raw.send(new DescribeTableCommand({ TableName: db.tableName }));
  assert.deepEqual(Table.KeySchema, tableSpecFromTemplate().create.KeySchema);
});
