const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_dlHo5kwWms2D@ep-noisy-poetry-aqmcjv6t-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  await client.connect();
  
  const res = await client.query("SELECT id, \"playerId\", vma, \"vo2Max\", date FROM \"PhysicalTest\"");
  console.log("Physical tests:", JSON.stringify(res.rows, null, 2));

  await client.end();
}

main().catch(console.error);
