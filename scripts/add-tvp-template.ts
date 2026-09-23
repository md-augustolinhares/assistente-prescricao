import { prisma } from '../src/lib/prisma';
import { renderItemDescription } from '../src/lib/prescription-utils';

async function main() {
  console.log('Iniciando cadastro do modelo de Tratamento de TVP...');

  const templateName = 'Tratamento de TVP';
  const templateDescription =
    'Modelo padrão para pacientes de enfermaria clínica com o acréscimo de terapia direcionada (dose plena) para o tratamento de TVP.';

  // Verifica se já existe um template com esse nome
  let template = await prisma.template.findFirst({
    where: { name: templateName },
  });

  if (!template) {
    template = await prisma.template.create({
      data: {
        name: templateName,
        description: templateDescription,
      },
    });
    console.log(`Template criado com id: ${template.id}`);
  } else {
    console.log(`Template já existente encontrado (id: ${template.id}). Atualizando itens...`);
    // Remove itens antigos desse template para sincronizar
    await prisma.templateItem.deleteMany({
      where: { templateId: template.id },
    });
  }

  const itemsData = [
    {
      position: 1,
      baseText: 'Dieta Geral',
      route: '',
      frequency: '',
      conditionText: '',
      category: 'DIETA',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'ACM',
      variants: [
        'Dieta Branda',
        'Dieta Leve',
        'Dieta Pastosa',
        'Dieta Zero',
        'Dieta Hipossódica',
        'Dieta para Diabético',
      ],
      isEditable: true,
    },
    {
      position: 2,
      baseText: 'SF 0,9% 500ML',
      route: 'EV',
      frequency: '12/12H',
      conditionText: '',
      category: 'HIDRATACAO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'ACM',
      variants: [
        'SF 0,9% 500ML EV 8/8H ACM',
        'SF 0,9% 250ML',
        'SF 0,9% 1000ML',
        'SGF 5% 1000ML + NaCl 20% 20ML + KCl 19,1% 10ML',
      ],
      isEditable: true,
    },
    {
      position: 3,
      baseText: 'Dipirona 1AMP+AD 10ML',
      route: 'EV',
      frequency: '6/6H',
      conditionText: 'se febre ou dor',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'SN',
      variants: [],
      isEditable: false,
    },
    {
      position: 4,
      baseText: 'Cetoprofeno 1AMP + 100ML SF 0,9%',
      route: 'EV',
      frequency: '12/12H',
      conditionText: '',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'ACM',
      variants: [],
      isEditable: false,
    },
    {
      position: 5,
      baseText: 'Tramadol 1AMP + 100ML SF 0,9% + 1 AMP de Plasil',
      route: 'EV',
      frequency: '6/6H',
      conditionText: 'SE DOR FORTE',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'SN',
      variants: [],
      isEditable: false,
    },
    {
      position: 6,
      baseText: 'Bromoprida 1 AMP + SF 0,9% 100ML',
      route: 'EV',
      frequency: '8/8H',
      conditionText: 'SE NÁUSEAS OU VÔMITOS',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'SN',
      variants: [],
      isEditable: false,
    },
    {
      position: 7,
      baseText: 'Insulina Regular SC conforme Dextro:',
      route: '',
      frequency: '',
      conditionText: '',
      category: 'PROTOCOLO',
      isProtocol: true,
      protocolDetail:
        '180-200:2UI  201-250:4UI  251-300:6UI  301-350:8UI  351-400:10UI  >=401:12UI',
      enabledByDefault: true,
      defaultScheduleType: 'HORARIO',
      variants: [],
      isEditable: false,
    },
    {
      position: 8,
      baseText: 'Glicose 50% 4AMP',
      route: 'EV',
      frequency: '',
      conditionText: 'se dextro < 70',
      category: 'PROTOCOLO',
      isProtocol: true,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'CONDICIONAL',
      variants: [],
      isEditable: false,
    },
    {
      position: 9,
      baseText: 'Captopril 50MG 1 CP',
      route: 'VO',
      frequency: '',
      conditionText: 'se PAS > 160 ou PAD > 100mmHG',
      category: 'PROTOCOLO',
      isProtocol: true,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'CONDICIONAL',
      variants: [],
      isEditable: false,
    },
    {
      position: 10,
      baseText: 'Escopolamina 1 AMP + 100ML DE SF 0,9%',
      route: 'EV',
      frequency: '8/8H',
      conditionText: '',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'ACM',
      variants: [],
      isEditable: false,
    },
    {
      position: 11,
      baseText: 'CCG + Sinais Vitais e Dextro',
      route: '',
      frequency: '6/6H',
      conditionText: '',
      category: 'CUIDADO',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'HORARIO',
      variants: [],
      isEditable: false,
    },
    {
      position: 12,
      baseText: 'CN DE O2',
      route: '',
      frequency: '',
      conditionText: 'SE SATO2 < 88% - COMUNICAR MÉDICO RESPONSÁVEL',
      category: 'CONDICIONAL',
      isProtocol: false,
      protocolDetail: null,
      enabledByDefault: true,
      defaultScheduleType: 'CONDICIONAL',
      variants: [
        'CN DE O2 SE SATO2 < 92% - COMUNICAR MÉDICO RESPONSÁVEL',
      ],
      isEditable: true,
    },
    {
      position: 13,
      baseText: 'Enoxaparina 1 mg/kg',
      route: 'SC',
      frequency: '12/12H',
      conditionText: '',
      category: 'MEDICAMENTO',
      isProtocol: false,
      protocolDetail:
        'Tratamento de TVP (Dose plena). Enoxaparina é preferência para pacientes gerais (ajustar arredondando dose). Para obesos ou disfunção renal, avaliar HNF.',
      enabledByDefault: true,
      defaultScheduleType: 'HORARIO',
      variants: [
        'Heparina Não Fracionada (HNF) 25.000UI/5mL - diluir 5 mL em SF 0,9% 245mL (Dose de ataque: 80 U/kg EV; Manutenção: 18 U/kg/h EV em BIC)',
      ],
      isEditable: true,
    },
  ];

  for (const item of itemsData) {
    const fullDescription = renderItemDescription({
      baseText: item.baseText,
      route: item.route,
      frequency: item.frequency,
      scheduleType: item.defaultScheduleType,
      conditionText: item.conditionText,
    });

    await prisma.templateItem.create({
      data: {
        templateId: template.id,
        position: item.position,
        description: fullDescription,
        baseText: item.baseText,
        route: item.route,
        frequency: item.frequency,
        conditionText: item.conditionText,
        category: item.category,
        isProtocol: item.isProtocol,
        protocolDetail: item.protocolDetail,
        enabledByDefault: item.enabledByDefault,
        defaultScheduleType: item.defaultScheduleType,
        variants: JSON.stringify(item.variants),
        isEditable: item.isEditable,
      },
    });
  }

  console.log('Modelo de TVP cadastrado com sucesso com 13 itens!');
}

main()
  .catch((e) => {
    console.error('Erro ao cadastrar modelo de TVP:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
