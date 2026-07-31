import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { budgets, budgetMembers, users } from "./schema";

async function main() {
  const [user] = await db
    .insert(users)
    .values({ email: "dev@budgetplan.app", name: "Dev User" })
    .onConflictDoNothing()
    .returning();

  const existingMembership = user
    ? await db
        .select()
        .from(budgetMembers)
        .where(eq(budgetMembers.userId, user.id))
        .limit(1)
    : [];

  if (user && existingMembership.length === 0) {
    const [budget] = await db
      .insert(budgets)
      .values({ name: "Default Budget" })
      .returning();

    await db.insert(budgetMembers).values({
      userId: user.id,
      budgetId: budget.id,
      role: "OWNER",
    });
  }

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
