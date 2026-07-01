const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_dlHo5kwWms2D@ep-noisy-poetry-aqmcjv6t-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  await client.connect();
  
  const usersRes = await client.query(`
    SELECT u.id, u.email, u.password, r.name as role_name 
    FROM "User" u 
    LEFT JOIN "Role" r ON u."roleId" = r.id 
    LIMIT 20
  `);
  console.log("Users and passwords:", JSON.stringify(usersRes.rows, null, 2));

  await client.end();
}

main().catch(console.error);
