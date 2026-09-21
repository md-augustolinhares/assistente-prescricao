import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Limpando "ACM" dos registros de TemplateItem...');

  const templateItems = await prisma.templateItem.findMany();
  let updatedCount = 0;

  for (const item of templateItems) {
    let needsUpdate = false;
    let newBaseText = item.baseText;
    let newVariants = item.variants;

    // Clean baseText
    if (newBaseText.endsWith(' - ACM')) {
      newBaseText = newBaseText.replace(' - ACM', '').trim();
      needsUpdate = true;
    } else if (newBaseText.endsWith(' ACM')) {
      newBaseText = newBaseText.replace(/ ACM$/, '').trim();
      needsUpdate = true;
    }

    // Clean variants array
    try {
      if (item.variants && item.variants.trim() !== '') {
        const variantsArr = JSON.parse(item.variants);
        if (Array.isArray(variantsArr)) {
          const cleanedVariants = variantsArr.map((v) => {
            if (typeof v === 'string') {
              let cleanV = v;
              if (cleanV.endsWith(' - ACM')) cleanV = cleanV.replace(' - ACM', '').trim();
              if (cleanV.endsWith(' ACM')) cleanV = cleanV.replace(/ ACM$/, '').trim();
              return cleanV;
            }
            return v;
          });

          const cleanedVariantsStr = JSON.stringify(cleanedVariants);
          if (cleanedVariantsStr !== item.variants) {
            newVariants = cleanedVariantsStr;
            needsUpdate = true;
          }
        }
      }
    } catch (e) {
      console.warn(`Erro ao fazer parse do JSON variants do item ${item.id}:`, e);
    }

    if (needsUpdate) {
      await prisma.templateItem.update({
        where: { id: item.id },
        data: {
          baseText: newBaseText,
          variants: newVariants,
        },
      });
      console.log(`- Atualizado item ${item.id} (${item.baseText} -> ${newBaseText})`);
      updatedCount++;
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
