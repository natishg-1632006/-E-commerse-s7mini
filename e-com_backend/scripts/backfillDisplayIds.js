const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-1" });
const docClient = DynamoDBDocumentClient.from(client);

const generateDisplayId = (prefix, seed) => {
  if (!seed) return `${prefix}${Math.floor(100 + Math.random() * 900)}`;
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 9000) + 100;
  return `${prefix}${num}`;
};

const tablesToMigrate = [
  { table: "natish_orders", keyName: "orderid", prefix: "ORD" },
  { table: "natish_products", keyName: "productId", prefix: "PRD" },
  { table: "natish_categories", keyName: "categoryId", prefix: "CAT" },
  { table: "natish_user", keyName: "userId", prefix: "USR" },
  { table: "natish_inventory_v2", keyName: "productId", prefix: "INV" },
  { table: "natish_coupons", keyName: "couponCode", prefix: "CPN" },
  { table: "natish_reviews", keyName: "reviewId", prefix: "REV" },
  { table: "natish_brands", keyName: "brandId", prefix: "BRD" },
];

async function migrateTable(config) {
  const { table, keyName, prefix } = config;
  console.log(`Starting migration for table: ${table}...`);

  try {
    const scanResult = await docClient.send(new ScanCommand({ TableName: table }));
    const items = scanResult.Items || [];
    console.log(`Found ${items.length} items in ${table}.`);

    let updatedCount = 0;
    for (const item of items) {
      if (!item.displayId) {
        const keyValue = item[keyName];
        if (!keyValue) continue;
        const displayId = generateDisplayId(prefix, keyValue);

        await docClient.send(
          new UpdateCommand({
            TableName: table,
            Key: { [keyName]: keyValue },
            UpdateExpression: "SET displayId = :d",
            ExpressionAttributeValues: { ":d": displayId },
          })
        );
        updatedCount++;
        console.log(`  Updated ${table} [${keyName}=${keyValue}] -> displayId: ${displayId}`);
      }
    }
    console.log(`Finished ${table}: updated ${updatedCount} items.\n`);
  } catch (err) {
    console.warn(`Could not process table ${table}: ${err.message}\n`);
  }
}

async function run() {
  console.log("=== STARTING DYNAMODB DISPLAY_ID BACKFILL MIGRATION ===\n");
  for (const config of tablesToMigrate) {
    await migrateTable(config);
  }
  console.log("=== COMPLETED DISPLAY_ID BACKFILL MIGRATION ===");
}

run();
