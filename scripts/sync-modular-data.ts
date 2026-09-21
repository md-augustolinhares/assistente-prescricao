import { prisma } from '../src/lib/prisma';
import { renderItemDescription } from '../src/lib/prescription-utils';

async function main() {
  console.log('Sincronizando dados modulares em TemplateItem e PrescriptionItem...');

  const templateItems = await prisma.templateItem.findMany();
  console.log(`Encontrados ${templateItems.length} TemplateItems.`);

  for (const item of templateItems) {
    let baseText = item.description;
    let route = '';
    let frequency = '';
    let conditionText = '';

    const desc = item.description;

    if (desc.includes('Dieta')) {
      baseText = desc;
    } else if (desc.includes('SF 0,9%') || desc.includes('SGF')) {
      baseText = 'SF 0,9% 500ML';
      route = 'EV';
      frequency = '12/12H';
    } else if (desc.toLowerCase().includes('dipirona')) {
      baseText = 'Dipirona 1AMP+AD 10ML';
      route = 'EV';
      frequency = '6/6H';
      conditionText = 'se febre ou dor';
    } else if (desc.toLowerCase().includes('cetoprofeno')) {
      baseText = 'Cetoprofeno 1AMP+ 100ML SF0,9%';
      route = 'EV';
      frequency = '12/12H';
    } else if (desc.toLowerCase().includes('tramadol')) {
      baseText = 'Tramadol 1AMP + 100ML DE S.F 0,9% + 1 AMP. DE PLASIL';
      route = 'EV';
      frequency = '6/6H';
      conditionText = 'SE DOR FORTE';
    } else if (desc.toLowerCase().includes('bromoprida')) {
      baseText = 'Bromoprida 1 AMP + SF0,9% 100ML';
      route = 'EV';
      frequency = '8/8H';
      conditionText = 'SE NAUSEAS OU VOMITOS';
    } else if (desc.toLowerCase().includes('insulina')) {
      baseText = 'Insulina Regular';
      route = 'SC';
      frequency = 'conforme Dextro:';
    } else if (desc.toLowerCase().includes('glicose')) {
      baseText = 'Glicose 50% 4AMP';
      route = 'EV';
      conditionText = 'se necessário Dextro<70';
    } else if (desc.toLowerCase().includes('captopril')) {
      baseText = 'Captopril 50MG 1 CP';
      route = 'VO';
      conditionText = 'se PAS> 160 ou PAD>100mmHG';
    } else if (desc.toLowerCase().includes('escopolamina')) {
      baseText = 'Escopolamina 1 AMP. + 100ML DE SF 0,9%';
      route = 'EV';
      frequency = '8/8H';
    } else if (desc.toLowerCase().includes('ccg')) {
      baseText = 'CCG + Sinais Vitais e Dextro';
      frequency = '6/6H';
    } else if (desc.toLowerCase().includes('cn de o2')) {
      baseText = 'CN DE O2';
      conditionText = 'SE SATO2 <88% - COMUNICAR MÉDICO RESPONSÁVEL';
    } else if (desc.toLowerCase().includes('diazepam')) {
      baseText = 'Diazepam 10MG 1CP';
      route = 'VO';
      frequency = '12/12HRS';
      conditionText = 'S/N (agitação psicomotora, agressividade)';
    } else if (desc.toLowerCase().includes('prometazina')) {
      baseText = 'Prometazina 01AMP';
      route = 'IM';
    } else if (desc.toLowerCase().includes('haloperidol')) {
      baseText = 'Haloperidol 01AMP';
      route = 'IM';
    } else if (desc.toLowerCase().includes('hidrocortisona') && desc.includes('500')) {
      baseText = 'Hidrocortisona 500 MG 1AMP';
      route = 'EV';
      frequency = 'AGORA';
    } else if (desc.toLowerCase().includes('hidrocortizona') && desc.includes('100')) {
      baseText = 'Hidrocortizona 100 MG 2AMP';
      route = 'EV';
      frequency = '8/8H';
    } else if (desc.toLowerCase().includes('salbutamol')) {
      baseText = 'Salbutamol 100MCG 10 PUFFS';
      route = 'VI';
      conditionText = 'REPETIR 20/20MIN ATÉ 3 VEZES S/N';
    } else if (desc.toLowerCase().includes('terbutalina')) {
      baseText = 'Terbutalina ½ AMP';
      route = 'SC';
      frequency = '12/12H';
    }

    const calculatedDesc = renderItemDescription({
      baseText,
      route,
      frequency,
      scheduleType: item.defaultScheduleType,
      conditionText,
    });

    await prisma.templateItem.update({
      where: { id: item.id },
      data: {
        baseText,
        route,
        frequency,
        conditionText,
        description: calculatedDesc || item.description,
      },
    });
  }

  // Atualizar PrescriptionItem também
  const prescriptionItems = await prisma.prescriptionItem.findMany({
    include: { templateItem: true },
  });
  console.log(`Encontrados ${prescriptionItems.length} PrescriptionItems.`);

  for (const pItem of prescriptionItems) {
    const tItem = pItem.templateItem;
    const baseText = tItem?.baseText || pItem.description;
    const route = tItem?.route || '';
    const frequency = tItem?.frequency || '';
    const conditionText = tItem?.conditionText || '';

    const calculatedDesc = renderItemDescription({
      baseText,
      route,
      frequency,
      scheduleType: pItem.scheduleType,
      conditionText,
    });

    await prisma.prescriptionItem.update({
      where: { id: pItem.id },
      data: {
        baseText,
        route,
        frequency,
        conditionText,
        description: calculatedDesc || pItem.description,
      },
    });
  }

  console.log('Sincronização concluída com sucesso!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
