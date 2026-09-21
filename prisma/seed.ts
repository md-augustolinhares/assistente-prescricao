import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Limpar tabelas existentes (cuidado ao rodar em produção!)
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.catalogItem.deleteMany();
  await prisma.templateItem.deleteMany();
  await prisma.template.deleteMany();

  // 1. Template: PRESCRIÇÃO GERAL
  const templateGeral = await prisma.template.create({
    data: {
      name: 'Prescrição Geral',
      description: 'Modelo padrão para pacientes de enfermaria clínica.',
    },
  });

  const itensGeral = [
    {
      position: 1,
      description: 'Dieta Geral',
      category: 'DIETA',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'ACM',
      variants: JSON.stringify([
        'Dieta Branda',
        'Dieta Leve',
        'Dieta Pastosa',
        'Dieta Zero',
        'Dieta Hipossódica',
        'Dieta para Diabético'
      ]),
      isEditable: true,
    },
    {
      position: 2,
      description: 'SF 0,9% 500ML EV 12/12H ACM',
      category: 'HIDRATACAO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'ACM',
      variants: JSON.stringify([
        'SF 0,9% 500ML EV 8/8H ACM',
        'SF 0,9% 500ML EV 6/6H ACM',
        'SF 0,9% 250ML EV 12/12H ACM',
        'SF 0,9% 1000ML EV 12/12H ACM',
        'SGF 5% 1000ML + NaCl 20% 20ML + KCl 19,1% 10ML EV 12/12H'
      ]),
      isEditable: true,
    },
    {
      position: 3,
      description: 'Dipirona 1AMP+AD 10ML EV 6/6H se febre ou dor',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'SN',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 4,
      description: 'Cetoprofeno 1AMP+ 100ML SF0,9% EV DE 12/12H ACM',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'ACM',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 5,
      description: 'Tramadol 1AMP EV + 100ML DE S.F 0,9% + 1 AMP. DE PLASIL DE 6/6H SE DOR FORTE',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'SN',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 6,
      description: 'Bromoprida 1 AMP + SF0,9% 100ML EV 8/8H SE NAUSEAS OU VOMITOS',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'SN',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 7,
      description: 'Insulina Regular SC conforme Dextro:',
      category: 'PROTOCOLO',
      isProtocol: true,
      protocolDetail: '180-200:2UI  201-250:4UI  251-300:6UI  301-350:8UI  351-400:10UI  >=401:12UI',
      enabledByDefault: true,
      defaultScheduleType: 'HORARIO',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 8,
      description: 'Glicose 50% 4AMP EV se necessário Dextro<70',
      category: 'PROTOCOLO',
      isProtocol: true,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'CONDICIONAL',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 9,
      description: 'Captopril 50MG 1 CP se PAS> 160 ou PAD>100mmHG',
      category: 'PROTOCOLO',
      isProtocol: true,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'CONDICIONAL',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 10,
      description: 'Escopolamina 1 AMP. + 100ML DE SF 0,9% DE 8/8H ACM',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'ACM',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 11,
      description: 'CCG + Sinais Vitais e Dextro DE 6/6H',
      category: 'CUIDADO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'HORARIO',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 12,
      description: 'CN DE O2 SE SATO2 <88% - COMUNICAR MÉDICO RESPONSÁVEL',
      category: 'CONDICIONAL',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'CONDICIONAL',
      variants: JSON.stringify(['CN DE O2 SE SATO2 <92% - COMUNICAR MÉDICO RESPONSÁVEL']),
      isEditable: true,
    }
  ];

  for (const item of itensGeral) {
    await prisma.templateItem.create({
      data: { ...item, templateId: templateGeral.id },
    });
  }

  // 2. Template: PSIQUIATRIA
  const templatePsiq = await prisma.template.create({
    data: {
      name: 'Prescrição Psiquiatria',
      description: 'Foco em internação psiquiátrica (VO/IM e contenção química).',
    },
  });

  const itensPsiq = [
    itensGeral[0], // Dieta Geral
    itensGeral[1], // SF 0,9%
    itensGeral[2], // Dipirona
    {
      position: 4,
      description: 'Diazepam 10MG 1CP VO 12/12HRS S/N (agitação psicomotora, agressividade)',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'SN',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 5,
      description: 'Prometazina 01AMP IM ACM',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'ACM',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 6,
      description: 'Haloperidol 01AMP IM ACM',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'ACM',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    itensGeral[5], // Bromoprida
    { ...itensGeral[6], position: 8 }, // Insulina
    { ...itensGeral[7], position: 9 }, // Glicose
    { ...itensGeral[8], position: 10 }, // Captopril
    { ...itensGeral[10], position: 11 }, // CCG
  ];

  for (const item of itensPsiq) {
    await prisma.templateItem.create({
      data: { ...item, templateId: templatePsiq.id },
    });
  }

  // 3. Template: BRONCOESPASMO
  const templateBronco = await prisma.template.create({
    data: {
      name: 'Prescrição Broncoespasmo',
      description: 'Foco em manejo de broncodilatação.',
    },
  });

  const itensBronco = [
    ...itensGeral, // Inclui todos os 12 itens gerais primeiro
    {
      position: 13,
      description: 'Hidrocortisona 500 MG 1AMP EV AGORA',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'HORARIO',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 14,
      description: 'Hidrocortizona 100 MG 2AMP EV 8/8H',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'HORARIO',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 15,
      description: 'Salbutamol 100MCG 10 PUFFS VI – REPETIR 20/20MIN ATÉ 3 VEZES S/N',
      category: 'MEDICAMENTO',
      isProtocol: true,
      protocolDetail: 'APÓS O RESGATE, MANTER 5PUFFS 4/4H',
      enabledByDefault: true,
      defaultScheduleType: 'SN',
      variants: JSON.stringify([]),
      isEditable: false,
    },
    {
      position: 16,
      description: 'Terbutalina ½ AMP SC 12/12H',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'HORARIO',
      variants: JSON.stringify([]),
      isEditable: false,
    }
  ];

  for (const item of itensBronco) {
    await prisma.templateItem.create({
      data: { ...item, templateId: templateBronco.id },
    });
  }

  // 4. Catálogo de Itens Especiais (Antibióticos, Eletrólitos, Anticoagulantes, etc)
  const itensCatalogo = [
    {
      name: 'Ceftriaxona 1g EV',
      fullDescription: 'CEFTRIAXONA 1G + 100ML SF 0,9% EV 12/12H',
      category: 'ANTIBIOTICO',
    },
    {
      name: 'Amoxicilina + Clavulanato 1g EV',
      fullDescription: 'AMOXICILINA + CLAVULANATO 1G + 100ML SF 0,9% EV 8/8H',
      category: 'ANTIBIOTICO',
    },
    {
      name: 'Ciprofloxacino 400mg EV',
      fullDescription: 'CIPROFLOXACINO 400MG SOLUÇÃO EV 12/12H',
      category: 'ANTIBIOTICO',
    },
    {
      name: 'Metronidazol 500mg EV',
      fullDescription: 'METRONIDAZOL 500MG BOLSA EV 8/8H',
      category: 'ANTIBIOTICO',
    },
    {
      name: 'Enoxaparina 40mg SC (Profilaxia TVP)',
      fullDescription: 'ENOXAPARINA 40MG SC 1X AO DIA (PROFILAXIA TVP)',
      category: 'ANTICOAGULANTE',
    },
    {
      name: 'Enoxaparina 1mg/kg SC (Terapêutica)',
      fullDescription: 'ENOXAPARINA 1MG/KG SC 12/12H (ANTICOAGULAÇÃO PLENA)',
      category: 'ANTICOAGULANTE',
    },
    {
      name: 'Correção de Potássio (KCl 19,1%)',
      fullDescription: 'KCL 19,1% 10ML + SF 0,9% 500ML EV CORRER EM 4 HORAS',
      category: 'ELETROLITO',
    },
    {
      name: 'Correção de Sódio (NaCl 20%)',
      fullDescription: 'NACL 20% 20ML + SF 0,9% 500ML EV CORRER EM 4 HORAS',
      category: 'ELETROLITO',
    },
    {
      name: 'Passagem de SVD + Diurese',
      fullDescription: 'PASSAGEM DE SONDA VESICAL DE DEMORA COM QUANTIFICAÇÃO DE DIURESE',
      category: 'SONDA',
    },
    {
      name: 'Clister Glicerinado 500ml',
      fullDescription: 'CLISTER GLICERINADO 500ML VIA RETAL SE NECESSÁRIO',
      category: 'OUTRO',
    },
  ];

  for (const catItem of itensCatalogo) {
    await prisma.catalogItem.create({
      data: catItem,
    });
  }

  console.log('Seed finalizado com sucesso! Templates e Catálogo criados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
