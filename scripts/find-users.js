const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({
    take: 10,
    select: {
      email: true,
      roleName: true,
    }
  });
  console.log("Users:", JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => db.$disconnect());
