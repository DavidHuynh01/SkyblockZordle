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
        const adds = i.UpdateExpression.replace(/^ADD\s+/, "").split(",");
        for (const part of adds) {
          const [nameTok, valTok] = part.trim().split(/\s+/);
          const attr = i.ExpressionAttributeNames[nameTok];
          cur[attr] = Number(cur[attr] || 0) + Number(i.ExpressionAttributeValues[valTok]);
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
