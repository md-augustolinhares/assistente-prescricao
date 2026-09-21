import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Deduplicando variants no DB...');

  const templateItems = await prisma.templateItem.findMany();
  let updatedCount = 0;

  for (const item of templateItems) {
    if (item.variants && item.variants !== '[]' && item.variants !== '') {
      let needsUpdate = false;
      try {
        const variantsArr = JSON.parse(item.variants);
        if (Array.isArray(variantsArr)) {
          const uniqueVariants = [...new Set(variantsArr)];
          if (uniqueVariants.length !== variantsArr.length) {
            needsUpdate = true;
          }

          if (needsUpdate) {
            const cleanedVariantsStr = JSON.stringify(uniqueVariants);
            await prisma.templateItem.update({
              where: { id: item.id },
              data: { variants: cleanedVariantsStr },
            });
            console.log(`- Atualizado item ${item.id}: ${item.variants} -> ${cleanedVariantsStr}`);
            updatedCount++;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  console.log(`\nConcluído. ${updatedCount} itens atualizados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
