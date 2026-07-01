const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_dlHo5kwWms2D@ep-noisy-poetry-aqmcjv6t-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  await client.connect();
  
  const playerId = "cmqx2qyuk000d04l7f9laznnv";
  
  const playerRes = await client.query(`
    SELECT p.id, u.name, u.email, p."clubId"
    FROM "Player" p 
    JOIN "User" u ON p."userId" = u.id 
    WHERE p.id = $1
  `, [playerId]);
  console.log("Player for the test:", playerRes.rows);

  await client.end();
}

main().catch(console.error);
