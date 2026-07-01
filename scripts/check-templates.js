const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_dlHo5kwWms2D@ep-noisy-poetry-aqmcjv6t-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  await client.connect();
  
  const res = await client.query("SELECT id, \"userId\", \"clubId\", \"physicalTestTemplate\" FROM \"Staff\"");
  console.log("Staff templates:", JSON.stringify(res.rows, null, 2));

  const clubRes = await client.query("SELECT id, name FROM \"Club\"");
  console.log("Clubs:", JSON.stringify(clubRes.rows, null, 2));

  await client.end();
}

main().catch(console.error);
