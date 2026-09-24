import { config } from 'dotenv';
config({ path: '.env.local' });
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Iniciando faxina no Catálogo Geral...');

  const items = await prisma.catalogItem.findMany();

  // Group by name
  const groups: Record<string, typeof items> = {};
  for (const item of items) {
    if (!groups[item.name]) groups[item.name] = [];
    groups[item.name].push(item);
  }

  let deletedCount = 0;

  for (const [name, groupItems] of Object.entries(groups)) {
    if (groupItems.length > 1) {
      console.log(`\nAgrupando: ${name} (${groupItems.length} itens)`);
      
      // Select the first one as primary
      const primary = groupItems[0];
      const duplicates = groupItems.slice(1);
      
      // Extract all unique fullDescriptions (as variants)
      const variantsSet = new Set<string>();
      variantsSet.add(primary.fullDescription);
      
      for (const dup of duplicates) {
        variantsSet.add(dup.fullDescription);
      }
      
      const variantsArray = Array.from(variantsSet);
      
      // Update primary with all variants
      await prisma.catalogItem.update({
        where: { id: primary.id },
        data: {
          variants: JSON.stringify(variantsArray),
          fullDescription: variantsArray[0], // Keep first as default
        }
      });
      
      // Delete duplicates
      for (const dup of duplicates) {
        // Precisa garantir que PrescriptionItems apontando para dup apontem para o primary agora
        await prisma.prescriptionItem.updateMany({
          where: { catalogItemId: dup.id },
          data: { catalogItemId: primary.id }
        });
        
        await prisma.catalogItem.delete({ where: { id: dup.id } });
        deletedCount++;
      }
      
      console.log(` -> Principal mantido. Variantes agrupadas: ${variantsArray.length}. Duplicatas deletadas: ${duplicates.length}`);
    } else {
      // Just make sure its own fullDescription is in its variants if empty
      const single = groupItems[0];
      const existingVars = JSON.parse(single.variants || '[]');
      if (existingVars.length === 0) {
        await prisma.catalogItem.update({
          where: { id: single.id },
          data: {
            variants: JSON.stringify([single.fullDescription])
          }
        });
      }
    }
  }

  console.log(`\nLimpeza concluída! ${deletedCount} itens duplicados foram removidos e organizados em variantes.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
