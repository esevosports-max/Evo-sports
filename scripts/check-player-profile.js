const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_dlHo5kwWms2D@ep-noisy-poetry-aqmcjv6t-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  await client.connect();
  
  const userRes = await client.query(`
    SELECT u.id, u.email, p.id as player_id, p."clubId", p."teamCategoryId", c.name as club_name
    FROM "User" u
    LEFT JOIN "Player" p ON u.id = p."userId"
    LEFT JOIN "Club" c ON p."clubId" = c.id
    WHERE u.email = 'anis@evo.com'
  `);
  console.log("Player profile:", JSON.stringify(userRes.rows, null, 2));

  await client.end();
}

main().catch(console.error);
