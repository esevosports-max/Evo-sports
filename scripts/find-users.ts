import { db } from "../src/lib/db";

async function main() {
  const users = await db.user.findMany({
    take: 20,
    select: {
      email: true,
      role: {
        select: {
          name: true
        }
      }
    }
  });
  console.log("Users:", JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => db.$disconnect());
