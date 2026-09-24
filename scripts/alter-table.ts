import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@libsql/client';

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  
  if (!url) throw new Error('Missing URL');

  const client = createClient({ url, authToken });
  
  console.log('Alterando tabela CatalogItem...');
  
  try {
    await client.execute('ALTER TABLE CatalogItem ADD COLUMN variants TEXT DEFAULT "[]"');
    console.log('Coluna variants adicionada com sucesso!');
  } catch (err: any) {
    if (err.message && err.message.includes('duplicate column name')) {
      console.log('A coluna variants já existe.');
    } else {
      console.error('Erro ao adicionar coluna:', err);
    }
  }
}

main();
