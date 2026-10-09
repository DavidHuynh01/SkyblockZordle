// Minimal in-memory stand-in for DynamoDBDocumentClient — enough of Put/Get/
// Update(ADD)/Query to exercise the store's logic without an AWS account.
export function createFakeClient() {
  const items = new Map();
  const key = (k) => `${k.pk}|${k.sk}`;

  return {
    items,
    async send(cmd) {
      const name = cmd.constructor.name;
      const i = cmd.input;

      if (name === "PutCommand") {
        if (i.ConditionExpression === "attribute_not_exists(pk)" && items.has(key(i.Item))) {
          const err = new Error("The conditional request failed");
          err.name = "ConditionalCheckFailedException";
          throw err;
        }
        items.set(key(i.Item), { ...i.Item });
        return {};
      }

      if (name === "GetCommand") return { Item: items.get(key(i.Key)) };

      if (name === "UpdateCommand") {
        const cur = items.get(key(i.Key)) || { ...i.Key };
        const names = i.ExpressionAttributeNames || {};
        const vals = i.ExpressionAttributeValues || {};
        const expr = i.UpdateExpression;
        const resolve = (tok) => (names[tok] !== undefined ? names[tok] : tok);

        const addPart = /ADD\s+(.*?)(?=\s+SET\s+|$)/is.exec(expr);
        if (addPart) {
          for (const part of addPart[1].split(",")) {
            const [nameTok, valTok] = part.trim().split(/\s+/);
            const attr = resolve(nameTok);
            cur[attr] = Number(cur[attr] || 0) + Number(vals[valTok]);
          }
        }

        const setPart = /SET\s+(.*?)(?=\s+ADD\s+|$)/is.exec(expr);
        if (setPart) {
          for (const part of setPart[1].split(",")) {
            const [lhs, rhs] = part.split("=").map((x) => x.trim());
            const attr = resolve(lhs);
            const inf = /^if_not_exists\(\s*([^,]+)\s*,\s*(:[\w]+)\s*\)$/.exec(rhs);
            if (inf) {
              const existing = resolve(inf[1].trim());
              if (cur[existing] === undefined) cur[attr] = vals[inf[2]];
            } else {
              cur[attr] = vals[rhs];
            }
          }
        }
        items.set(key(i.Key), cur);
        return { Attributes: cur };
      }

      if (name === "QueryCommand") {
        const pk = i.ExpressionAttributeValues[":pk"];
        let rows = [...items.values()].filter((it) => it.pk === pk);
        if (i.FilterExpression) rows = rows.filter((it) => it.won === i.ExpressionAttributeValues[":won"]);
        return { Items: rows };
      }

      throw new Error("unsupported command " + name);
    },
  };
}
