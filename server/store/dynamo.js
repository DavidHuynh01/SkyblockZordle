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
import { nextStreak, mergeTop, publicTop, TOP_LIMIT } from "../streaks.js";

const scoreKey = (date, userId) => ({ pk: `DATE#${date}`, sk: `USER#${userId}` });
const gameKey = (date, userId) => ({ pk: `GAME#${date}`, sk: `USER#${userId}` });
const userKey = (userId) => ({ pk: `USER#${userId}`, sk: "PROFILE" });
const STATS_KEY = { pk: "STATS", sk: "GLOBAL" };
const dayKey = (date) => ({ pk: "STATS", sk: `DAY#${date}` });
// A single item holding the top-N streaks. Ranking by streak would otherwise
// need a Scan or a secondary index, both of which cost capacity; this row is
// only rewritten when somebody beats their own record.
const STREAKS_KEY = { pk: "STATS", sk: "STREAKS" };

export function defaultClient() {
  return DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  });
}

export function createDynamoStore({ client = defaultClient(), tableName } = {}) {
  if (!tableName) throw new Error("tableName is required");

  // Builds an "ADD a :a, b :b" update, skipping zero deltas.
  async function bumpCounters(deltas, key = STATS_KEY) {
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
        Key: key,
        UpdateExpression: `ADD ${parts.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );
  }

  return {
    // Counts a user the first time we see them, so "total players" is a real
    // number rather than a table scan.
    async upsertUser(user) {
      const fields = { ...user, lastLogin: Date.now() };
      try {
        await client.send(
          new PutCommand({
            TableName: tableName,
            Item: { ...userKey(user.id), ...fields, createdAt: Date.now() },
            ConditionExpression: "attribute_not_exists(pk)",
          })
        );
        await bumpCounters({ users: 1 });
      } catch (err) {
        if (err?.name !== "ConditionalCheckFailedException") throw err;
        // Returning player: patch the profile fields only. A whole-item Put
        // here would wipe everything else the row carries — createdAt and the
        // player's streak — on every login.
        const names = {};
        const values = {};
        const sets = [];
        for (const [attr, value] of Object.entries(fields)) {
          names[`#${attr}`] = attr;
          values[`:${attr}`] = value ?? null;
          sets.push(`#${attr} = :${attr}`);
        }
        await client.send(
          new UpdateCommand({
            TableName: tableName,
            Key: userKey(user.id),
            UpdateExpression: `SET ${sets.join(", ")}`,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
          })
        );
      }
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
      const guesses = Number(it.guesses || 0);
      if (guesses === 1) await bumpCounters({ players: 1 }, dayKey(date));
      return { guesses, startedAt: Number(it.startedAt || now), solved: Boolean(it.solved) };
    },

    async markSolved({ date, userId, now = Date.now() }) {
      await bumpCounters({ solved: 1 }, dayKey(date));
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

    // Credits a solve towards the player's streak. Called only for signed-in
    // winners, so the streak board follows the same login rule as the rest of
    // the leaderboard.
    async recordStreak({ userId, name, avatar = null, puzzleNumber, now = Date.now() }) {
      const prev = await client.send(
        new GetCommand({ TableName: tableName, Key: userKey(userId) })
      );
      const s = nextStreak(prev?.Item, puzzleNumber);
      if (!s.changed) return { streak: s.streak, maxStreak: s.maxStreak };

      await client.send(
        new UpdateCommand({
          TableName: tableName,
          Key: userKey(userId),
          UpdateExpression: "SET #st = :st, #mx = :mx, #lp = :lp",
          ExpressionAttributeNames: { "#st": "streak", "#mx": "maxStreak", "#lp": "lastSolvedPuzzle" },
          ExpressionAttributeValues: { ":st": s.streak, ":mx": s.maxStreak, ":lp": s.lastSolvedPuzzle },
        })
      );

      if (s.improved) {
        const cur = await client.send(
          new GetCommand({ TableName: tableName, Key: STREAKS_KEY })
        );
        const top = mergeTop(cur?.Item?.top, {
          userId,
          name,
          avatar,
          maxStreak: s.maxStreak,
          at: now,
        });
        await client.send(
          new PutCommand({ TableName: tableName, Item: { ...STREAKS_KEY, top } })
        );
      }
      return { streak: s.streak, maxStreak: s.maxStreak };
    },

    async topStreaks(limit = TOP_LIMIT) {
      const res = await client.send(new GetCommand({ TableName: tableName, Key: STREAKS_KEY }));
      return publicTop(res?.Item?.top, limit);
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
      const [counters, day] = await Promise.all([
        client.send(new GetCommand({ TableName: tableName, Key: STATS_KEY })),
        client.send(new GetCommand({ TableName: tableName, Key: dayKey(dateKey) })),
      ]);
      const c = counters?.Item || {};
      const d = day?.Item || {};
      const dist = {};
      for (let g = 1; g <= 8; g++) dist[g] = Number(c[`d${g}`] || 0);
      const played = Number(c.played || 0);
      const wins = Number(c.wins || 0);
      return {
        played,
        wins,
        winPercent: played ? Math.round((wins / played) * 100) : 0,
        dist,
        totalUsers: Number(c.users || 0),
        todayPlayers: Number(d.players || 0),
        todaySolved: Number(d.solved || 0),
      };
    },
  };
}
