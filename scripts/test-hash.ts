import bcrypt from 'bcryptjs';

const hash = "$2b$10$seta3ng8WaIHU8n.Lr3q5u2NibSPWzQwLzEEUC4laaHc.6a7dYHKy";
const pwd = "plantao123";

async function run() {
  const match = await bcrypt.compare(pwd, hash);
  console.log('Match?', match);
}

run();
