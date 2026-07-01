const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_dlHo5kwWms2D@ep-noisy-poetry-aqmcjv6t-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  await client.connect();

  // Fetch all users
  const usersRes = await client.query(`
    SELECT u.id, u.email, r.name as role_name 
    FROM "User" u 
    LEFT JOIN "Role" r ON u."roleId" = r.id
  `);

  for (const user of usersRes.rows) {
    const userId = user.id;
    const userRole = user.role_name || "JOUEUR";
    const isStaff = userRole !== "JOUEUR";

    console.log(`\nTesting user: ${user.email} (${userRole})`);

    try {
      let clubId = "";
      let playerProfile = null;
      let physicalTestTemplate = null;

      if (isStaff) {
        // Query staff
        const staffRes = await client.query('SELECT * FROM "Staff" WHERE "userId" = $1', [userId]);
        const staff = staffRes.rows[0] || null;
        physicalTestTemplate = staff?.physicalTestTemplate || null;

        const clubRes = await client.query(`
          SELECT * FROM "Club" 
          WHERE "presidentId" = $1 
          OR id = $2
        `, [userId, staff?.clubId || ""]);
        const club = clubRes.rows[0] || null;
        clubId = club?.id || staff?.clubId || "";
      } else {
        const playerRes = await client.query(`
          SELECT p.*, u.name as user_name, u.email as user_email, tc.name as category_name
          FROM "Player" p
          JOIN "User" u ON p."userId" = u.id
          LEFT JOIN "TeamCategory" tc ON p."teamCategoryId" = tc.id
          WHERE p."userId" = $1
        `, [userId]);
        playerProfile = playerRes.rows[0] || null;
        clubId = playerProfile?.clubId || "";

        if (clubId) {
          const staffRes = await client.query('SELECT "physicalTestTemplate" FROM "Staff" WHERE "clubId" = $1', [clubId]);
          const staffList = staffRes.rows;
          const staffTemplate = staffList.find((s) => s.physicalTestTemplate !== null);
          physicalTestTemplate = staffTemplate?.physicalTestTemplate || null;
        }
      }

      if (!clubId) {
        console.log("-> No club associated.");
        continue;
      }

      // Fetch categories, players, and tests
      let categories = [];
      let players = [];
      let physicalTestsData = [];

      if (userRole === "ENTRAINEUR_PRINCIPAL" || userRole === "ENTRAINEUR_ADJOINT") {
        // Get staff categories
        const staffRes = await client.query('SELECT id FROM "Staff" WHERE "userId" = $1', [userId]);
        const staffId = staffRes.rows[0]?.id;
        
        let categoryIds = [];
        if (staffId) {
          const relationRes = await client.query('SELECT "B" as category_id FROM "_StaffCategories" WHERE "A" = $1', [staffId]);
          categoryIds = relationRes.rows.map(r => r.category_id);
        }

        const catRes = await client.query('SELECT * FROM "TeamCategory" WHERE id = ANY($1) ORDER BY name ASC', [categoryIds]);
        categories = catRes.rows;

        const playersRes = await client.query(`
          SELECT p.*, u.name as user_name, tc.name as category_name
          FROM "Player" p
          JOIN "User" u ON p."userId" = u.id
          LEFT JOIN "TeamCategory" tc ON p."teamCategoryId" = tc.id
          WHERE p."clubId" = $1 AND p."teamCategoryId" = ANY($2)
          ORDER BY u.name ASC
        `, [clubId, categoryIds]);
        players = playersRes.rows;

        const testsRes = await client.query(`
          SELECT t.*, u.name as player_name, tc.name as player_category_name, p."teamCategoryId"
          FROM "PhysicalTest" t
          JOIN "Player" p ON t."playerId" = p.id
          JOIN "User" u ON p."userId" = u.id
          LEFT JOIN "TeamCategory" tc ON p."teamCategoryId" = tc.id
          WHERE p."clubId" = $1 AND p."teamCategoryId" = ANY($2)
          ORDER BY t."createdAt" DESC
        `, [clubId, categoryIds]);
        physicalTestsData = testsRes.rows;
      } else {
        const catRes = await client.query('SELECT * FROM "TeamCategory" WHERE "clubId" = $1 ORDER BY name ASC', [clubId]);
        categories = catRes.rows;

        if (isStaff) {
          const playersRes = await client.query(`
            SELECT p.*, u.name as user_name, tc.name as category_name
            FROM "Player" p
            JOIN "User" u ON p."userId" = u.id
            LEFT JOIN "TeamCategory" tc ON p."teamCategoryId" = tc.id
            WHERE p."clubId" = $1
            ORDER BY u.name ASC
          `, [clubId]);
          players = playersRes.rows;

          const testsRes = await client.query(`
            SELECT t.*, u.name as player_name, tc.name as player_category_name, p."teamCategoryId"
            FROM "PhysicalTest" t
            JOIN "Player" p ON t."playerId" = p.id
            JOIN "User" u ON p."userId" = u.id
            LEFT JOIN "TeamCategory" tc ON p."teamCategoryId" = tc.id
            WHERE p."clubId" = $1
            ORDER BY t."createdAt" DESC
          `, [clubId]);
          physicalTestsData = testsRes.rows;
        } else {
          players = [];
          if (playerProfile) {
            const testsRes = await client.query(`
              SELECT t.*, u.name as player_name, tc.name as player_category_name, p."teamCategoryId"
              FROM "PhysicalTest" t
              JOIN "Player" p ON t."playerId" = p.id
              JOIN "User" u ON p."userId" = u.id
              LEFT JOIN "TeamCategory" tc ON p."teamCategoryId" = tc.id
              WHERE t."playerId" = $1
              ORDER BY t."createdAt" DESC
            `, [playerProfile.id]);
            physicalTestsData = testsRes.rows;
          }
        }
      }

      // Mapping
      const clientCategories = categories.map((c) => ({
        id: c.id,
        name: c.name
      }));

      const clientPlayers = players.map((p) => ({
        id: p.id,
        name: p.user_name || "Joueur sans nom",
        teamCategoryId: p.teamCategoryId,
        teamCategoryName: p.category_name || "Sans équipe"
      }));

      const clientTests = physicalTestsData.map((t) => ({
        id: t.id,
        playerId: t.playerId,
        playerName: t.player_name || playerProfile?.user_name || "Joueur",
        playerCategoryName: t.player_category_name || playerProfile?.category_name || "Sans équipe",
        playerCategoryId: t.teamCategoryId || playerProfile?.teamCategoryId || null,
        vma: t.vma,
        vo2Max: t.vo2Max,
        sprint10m: t.sprint10m,
        sprint30m: t.sprint30m,
        cmj: t.cmj,
        sj: t.sj,
        illinois: t.illinois,
        fat: t.fat,
        customValues: t.customValues,
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString()
      }));

      console.log(`-> Success. Categories: ${clientCategories.length}, Players: ${clientPlayers.length}, Tests: ${clientTests.length}`);
    } catch (err) {
      console.error(`-> FAILED with error:`, err);
    }
  }

  await client.end();
}

main().catch(console.error);
