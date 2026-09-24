import { config } from 'dotenv';
config({ path: '.env.local' });
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Migrando itens do TemplateItem para o CatalogItem...');

  const templateItems = await prisma.templateItem.findMany();

  let addedCount = 0;

  for (const item of templateItems) {
    // Determine a Category
    let category = item.category || 'OUTRO';
    if (category === 'DIETA') category = 'CUIDADO'; // Mapped to CUIDADO in our UI

    // Collect all full descriptions we want to add
    const descriptionsToAdd = new Set<string>();

    if (item.baseText) {
      // Just use the description directly
      descriptionsToAdd.add(item.description);
    } else {
      descriptionsToAdd.add(item.description);
    }

    try {
      if (item.variants && item.variants !== '[]') {
        const variantsArr = JSON.parse(item.variants);
        if (Array.isArray(variantsArr)) {
          variantsArr.forEach((v) => descriptionsToAdd.add(v));
        }
      }
    } catch (e) {
      console.warn('Erro ao parsear variantes:', item.variants);
    }

    for (const desc of descriptionsToAdd) {
      if (!desc.trim()) continue;

      // Extract a short name. Generally, it's the first word or everything before a number/dosage.
      // e.g., "SF 0,9% 500ML EV 12/12H ACM" -> "SF 0,9%"
      // e.g., "Dipirona 1AMP+AD 10ML EV" -> "Dipirona"
      const nameMatch = desc.match(/^([A-Za-zÀ-ú\s]+)/);
      let shortName = nameMatch ? nameMatch[1].trim() : desc.substring(0, 15);
      
      // Ajuste fino para nomes clássicos
      if (desc.startsWith('SF 0,9%')) shortName = 'Soro Fisiológico 0,9%';
      else if (desc.startsWith('SGF 5%')) shortName = 'Soro Glicofisiológico';
      else if (desc.startsWith('SG 5%')) shortName = 'Soro Glicosado 5%';
      else if (desc.toUpperCase().includes('DIETA')) shortName = 'Dieta';
      else if (desc.toUpperCase().includes('CABECEIRA')) shortName = 'Cuidados de Enfermagem';
      
      // Uppercase first letter for aesthetics
      shortName = shortName.charAt(0).toUpperCase() + shortName.slice(1).toLowerCase();

      // Check if already exists exactly
      const existing = await prisma.catalogItem.findFirst({
        where: { fullDescription: desc }
      });

      if (!existing) {
        await prisma.catalogItem.create({
          data: {
            name: shortName,
            fullDescription: desc,
            category: category,
          }
        });
        addedCount++;
        console.log(`Adicionado: ${shortName} - ${desc}`);
      }
    }
  }

  console.log(`\nConcluído! ${addedCount} novos itens adicionados ao catálogo geral.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
