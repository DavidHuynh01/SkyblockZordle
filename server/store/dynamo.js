// DynamoDB store (AWS deployment). Single table, two item shapes:
//
//   score    pk = "DATE#<date>"  sk = "CLIENT#<clientId>"
//   counters pk = "STATS"        sk = "GLOBAL"   (played, wins, d1..d8)
//
// Global stats come from the counters item rather than a table Scan, so cost
// stays flat as the table grows. Counters are only incremented when a score is
// newly created; a re-submission (same player, same day) adjusts the deltas.
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const scoreKey = (date, userId) => ({ pk: `DATE#${date}`, sk: `USER#${userId}` });
const gameKey = (date, userId) => ({ pk: `GAME#${date}`, sk: `USER#${userId}` });
const userKey = (userId) => ({ pk: `USER#${userId}`, sk: "PROFILE" });
const STATS_KEY = { pk: "STATS", sk: "GLOBAL" };

export function defaultClient() {
  return DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  });
}

export function createDynamoStore({ client = defaultClient(), tableName } = {}) {
  if (!tableName) throw new Error("tableName is required");

  // Builds an "ADD a :a, b :b" update, skipping zero deltas.
  async function bumpCounters(deltas) {
    const names = {};
    const values = {};
    const parts = [];
    for (const [attr, delta] of Object.entries(deltas)) {
      if (!delta) continue;
      names[`#${attr}`] = attr;
      values[`:${attr}`] = delta;
      parts.push(`#${attr} :${attr}`);
    }
    if (!parts.length) return;
    await client.send(
      new UpdateCommand({
        TableName: tableName,
        Key: STATS_KEY,
        UpdateExpression: `ADD ${parts.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );
  }

  return {
    async upsertUser(user) {
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: { ...userKey(user.id), ...user, lastLogin: Date.now() },
        })
      );
    },

    // Server-side game state: the player's guess count for a day lives here,
    // so a score can never be whatever the browser claims it is.
    async recordGuess({ date, userId, now = Date.now() }) {
      const res = await client.send(
        new UpdateCommand({
          TableName: tableName,
          Key: gameKey(date, userId),
          UpdateExpression:
            "ADD #g :one SET #s = if_not_exists(#s, :now)",
          ExpressionAttributeNames: { "#g": "guesses", "#s": "startedAt" },
          ExpressionAttributeValues: { ":one": 1, ":now": now },
          ReturnValues: "ALL_NEW",
        })
      );
      const it = res.Attributes || {};
      return {
        guesses: Number(it.guesses || 0),
        startedAt: Number(it.startedAt || now),
        solved: Boolean(it.solved),
      };
    },

    async markSolved({ date, userId, now = Date.now() }) {
      await client.send(
        new UpdateCommand({
          TableName: tableName,
          Key: gameKey(date, userId),
          UpdateExpression: "SET solved = :t, solvedAt = :now",
          ExpressionAttributeValues: { ":t": true, ":now": now },
        })
      );
    },

    async addScore(entry) {
      const item = { ...scoreKey(entry.date, entry.userId), ...entry };
      try {
        await client.send(
          new PutCommand({
            TableName: tableName,
            Item: item,
            ConditionExpression: "attribute_not_exists(pk)",
          })
        );
        await bumpCounters({
          played: 1,
          wins: entry.won ? 1 : 0,
          [`d${entry.guesses}`]: entry.won ? 1 : 0,
        });
      } catch (err) {
        if (err?.name !== "ConditionalCheckFailedException") throw err;
        // Already played today: replace the row and correct the counters.
        const prev = await client.send(
          new GetCommand({ TableName: tableName, Key: scoreKey(entry.date, entry.userId) })
        );
        const old = prev?.Item;
        await client.send(new PutCommand({ TableName: tableName, Item: item }));
        const deltas = { wins: (entry.won ? 1 : 0) - (old?.won ? 1 : 0) };
        if (old?.won) deltas[`d${old.guesses}`] = (deltas[`d${old.guesses}`] || 0) - 1;
        if (entry.won) deltas[`d${entry.guesses}`] = (deltas[`d${entry.guesses}`] || 0) + 1;
        await bumpCounters(deltas);
      }
    },

    async leaderboard(dateKey, limit = 50) {
      const res = await client.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "pk = :pk",
          FilterExpression: "#won = :won",
          ExpressionAttributeNames: { "#won": "won" },
          ExpressionAttributeValues: { ":pk": `DATE#${dateKey}`, ":won": true },
        })
      );
      return (res.Items || [])
        .sort(
          (a, b) =>
            a.guesses - b.guesses ||
            (a.timeMs || 0) - (b.timeMs || 0) ||
            a.createdAt - b.createdAt
        )
        .slice(0, limit)
        .map((s, i) => ({
          rank: i + 1,
          name: s.name,
          avatar: s.avatar || null,
          guesses: s.guesses,
          timeMs: s.timeMs || 0,
        }));
    },

    async globalStats(dateKey) {
      const [counters, today] = await Promise.all([
        client.send(new GetCommand({ TableName: tableName, Key: STATS_KEY })),
        client.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "pk = :pk",
            ExpressionAttributeValues: { ":pk": `DATE#${dateKey}` },
          })
        ),
      ]);
      const c = counters?.Item || {};
      const items = today.Items || [];
      const dist = {};
      for (let g = 1; g <= 8; g++) dist[g] = Number(c[`d${g}`] || 0);
      const played = Number(c.played || 0);
      const wins = Number(c.wins || 0);
      return {
        played,
        wins,
        winPercent: played ? Math.round((wins / played) * 100) : 0,
        dist,
        todayPlayers: items.length,
        todaySolved: items.filter((s) => s.won).length,
      };
    },
  };
}
