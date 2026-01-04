export async function checkBanStatus(
  db: D1Database,
  authorUUID: string,
  moduleUUID: string
): Promise<boolean> {
  const query = `
    SELECT 1 
    FROM (
      SELECT id FROM users WHERE id = ?
      UNION ALL
      SELECT id FROM modules WHERE id = ?
    ) 
    LIMIT 1;
  `;

  const result = await db
    .prepare(query)
    .bind(authorUUID, moduleUUID)
    .first();

  return result !== null;
}


export async function testDatabase(db: D1Database) {
  try {
    const connresult = await db.prepare("SELECT 1").first();
    console.log("Database connectivity test passed");
    const tableResult = await db.prepare("SELECT * FROM users").all();
    console.log("Database table test passed");
    return { success: true, connresult, tableResult };
  } catch (error) {
    console.error("Database connectivity test failed:", error);
    return { success: false, error };
  }
}
