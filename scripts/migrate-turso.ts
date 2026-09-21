import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL is not defined.");
}

const client = createClient({
  url,
  authToken,
});

async function main() {
  console.log('Connecting to Turso to apply schema changes...');

  const statements = [
    `ALTER TABLE TemplateItem ADD COLUMN baseText TEXT NOT NULL DEFAULT '';`,
    `ALTER TABLE TemplateItem ADD COLUMN route TEXT DEFAULT '';`,
    `ALTER TABLE TemplateItem ADD COLUMN frequency TEXT DEFAULT '';`,
    `ALTER TABLE TemplateItem ADD COLUMN conditionText TEXT DEFAULT '';`,
    `ALTER TABLE PrescriptionItem ADD COLUMN baseText TEXT NOT NULL DEFAULT '';`,
    `ALTER TABLE PrescriptionItem ADD COLUMN route TEXT DEFAULT '';`,
    `ALTER TABLE PrescriptionItem ADD COLUMN frequency TEXT DEFAULT '';`,
    `ALTER TABLE PrescriptionItem ADD COLUMN conditionText TEXT DEFAULT '';`,
  ];

  for (const sql of statements) {
    try {
      console.log(`Executing: ${sql}`);
      await client.execute(sql);
      console.log('Success!');
    } catch (err: any) {
      console.warn(`Notice: ${err.message}`);
    }
  }

  console.log('Migration complete!');
}

main().catch(console.error);
