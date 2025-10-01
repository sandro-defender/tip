import { writeFileSync } from "fs";
import { D1Database } from "@cloudflare/d1";

// D1 binding name
const db = new D1Database({ binding: "tip-data" });

// შეცვალე table_name შენს ცხრილზე
const TABLES = ["table_name"]; // თუ რამდენიმე table გაქვს, დააყენე აქ

async function backup() {
  const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
  let sql = `-- D1 backup generated on ${new Date().toISOString()}\n\n`;

  for (const table of TABLES) {
    const res = await db.prepare(`SELECT * FROM ${table}`).all();
    for (const row of res.results) {
      const columns = Object.keys(row).map(c => `\`${c}\``).join(", ");
      const values = Object.values(row)
        .map(v => (v === null ? "NULL" : `'${v.toString().replace(/'/g, "''")}'`))
        .join(", ");
      sql += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
    }
    sql += "\n";
  }

  const fileName = `backup/d1/tip-data-${TIMESTAMP}.sql`;
  writeFileSync(fileName, sql);
  console.log(`Backup saved to ${fileName}`);
}

backup().catch(console.error);
