const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_dlHo5kwWms2D@ep-noisy-poetry-aqmcjv6t-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  await client.connect();
  
  const clubId = "cmqu6xjrc0002e8vch3bltju7";
  
  const catRes = await client.query('SELECT id, name FROM "TeamCategory" WHERE "clubId" = $1', [clubId]);
  console.log("Categories:", catRes.rows);

  const playersRes = await client.query(`
    SELECT p.id, u.name, u.email 
    FROM "Player" p 
    JOIN "User" u ON p."userId" = u.id 
    WHERE p."clubId" = $1
  `, [clubId]);
  console.log("Players:", playersRes.rows);

  const testsRes = await client.query(`
    SELECT t.id, u.name as player_name, t.vma, t.date 
    FROM "PhysicalTest" t 
    JOIN "Player" p ON t."playerId" = p.id 
    JOIN "User" u ON p."userId" = u.id 
    WHERE p."clubId" = $1
  `, [clubId]);
  console.log("Tests:", testsRes.rows);

  await client.end();
}

main().catch(console.error);
