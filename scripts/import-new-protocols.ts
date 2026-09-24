import { prisma } from '../src/lib/prisma';
import { renderItemDescription } from '../src/lib/prescription-utils';

interface ProtocolItemInput {
  position: number;
  baseText: string;
  route?: string;
  frequency?: string;
  conditionText?: string;
  category: string;
  defaultScheduleType: 'HORARIO' | 'ACM' | 'SN' | 'CONDICIONAL';
  variants?: string[];
  isProtocol?: boolean;
  protocolDetail?: string | null;
  enabledByDefault?: boolean;
  isEditable?: boolean;
}

interface ProtocolInput {
  name: string;
  description: string;
  items: ProtocolItemInput[];
}

const protocols: ProtocolInput[] = [
  // 1. Asma Exacerbada
  {
    name: 'Asma Exacerbada',
    description:
      'Prescrição padrão para manejo da Asma Exacerbada no PS, focada em resgate broncodilatador, corticoterapia sistêmica e sulfato de magnésio em casos refratários.',
    items: [
      {
        position: 1,
        baseText: 'Dieta Zero',
        route: '',
        frequency: '',
        conditionText: '',
        category: 'DIETA',
        defaultScheduleType: 'HORARIO',
        variants: ['Dieta Geral'],
        isEditable: true,
      },
      {
        position: 2,
        baseText: 'Salbutamol Spray 100 mcg/jato - inalar 4 a 8 puffs com espaçador',
        route: 'INALATORIA',
        frequency: 'A CADA 20 MIN NA 1ª HORA',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'ACM',
        protocolDetail:
          'Após a 1ª hora: inalar 4 a 8 puffs a cada 1 a 4 horas conforme resposta clínica.',
        variants: [],
      },
      {
        position: 3,
        baseText: 'Ipratrópio 0,25 mg/mL (40 gotas) + SF 0,9% 3mL',
        route: 'INALATORIA',
        frequency: 'A CADA 20 MIN NA 1ª HORA',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'ACM',
        protocolDetail:
          'Após a 1ª hora: nebulizar a cada 1 a 4 horas até melhora clínica.',
        variants: [],
      },
      {
        position: 4,
        baseText: 'Hidrocortisona 100 mg/fr - 2 frascos (200 mg) + SF 0,9% 50 mL EV em 15 min',
        route: 'EV',
        frequency: 'AGORA',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'ACM',
        variants: [
          'Prednisona 20 mg - 3 comprimidos (60mg) VO AGORA (Opção de escolha na exacerbação leve/moderada)',
        ],
        isEditable: true,
      },
      {
        position: 5,
        baseText: 'Sulfato de Magnésio (MgSO4) 10% 10 mL + SF 0,9% 100 mL em 20-30 min',
        route: 'EV',
        frequency: 'AGORA',
        conditionText: 'SE QUADRO REFRATÁRIO OU RISCO DE VIDA',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'CONDICIONAL',
        variants: [],
      },
      {
        position: 6,
        baseText: 'Dipirona 1AMP+AD 10ML',
        route: 'EV',
        frequency: '6/6H',
        conditionText: 'se febre ou dor',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'SN',
        variants: [],
      },
      {
        position: 7,
        baseText: 'Bromoprida 1 AMP + SF 0,9% 100ML',
        route: 'EV',
        frequency: '8/8H',
        conditionText: 'SE NÁUSEAS OU VÔMITOS',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'SN',
        variants: [],
      },
      {
        position: 8,
        baseText: 'Monitorização Contínua e Sinais Vitais (PA, FC, FR, SatO2)',
        route: '',
        frequency: '6/6H',
        conditionText: '',
        category: 'CUIDADO',
        defaultScheduleType: 'HORARIO',
        variants: [],
      },
      {
        position: 9,
        baseText: 'Oxigênio Suplementar (Cateter Nasal ou Máscara)',
        route: '',
        frequency: 'CONTÍNUO',
        conditionText: 'SE SATO2 < 92%',
        category: 'CUIDADO',
        defaultScheduleType: 'CONDICIONAL',
        protocolDetail: 'SatO2 alvo entre 93-95%.',
        variants: [],
      },
    ],
  },

  // 2. DPOC Exacerbada
  {
    name: 'DPOC Exacerbada',
    description:
      'Prescrição padrão para manejo da DPOC Exacerbada, incluindo suporte broncodilatador, corticoterapia sistêmica e antibioticoterapia guiada por sintomas cardinais.',
    items: [
      {
        position: 1,
        baseText: 'Dieta Oral Leve',
        route: 'VO',
        frequency: '',
        conditionText: '',
        category: 'DIETA',
        defaultScheduleType: 'HORARIO',
        variants: ['Dieta Geral', 'Dieta Branda', 'Dieta Zero'],
        isEditable: true,
      },
      {
        position: 2,
        baseText: 'Salbutamol Spray 100 mcg/jato - inalar 2 a 4 puffs com espaçador',
        route: 'INALATORIA',
        frequency: '1/1H A 2/2H (ATÉ 3 DOSES INICIAIS)',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'ACM',
        protocolDetail:
          'Dose de ataque. Manutenção: inalar 1 a 2 puffs de 2/2h a 4/4h conforme resposta.',
        variants: [],
      },
      {
        position: 3,
        baseText: 'Ipratrópio 0,25 mg/mL (40 gotas) + SF 0,9% 3mL (nebulizar com ar comprimido)',
        route: 'INALATORIA',
        frequency: '1/1H (ATÉ 3 DOSES INICIAIS)',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'ACM',
        protocolDetail:
          'Manutenção: nebulizar a cada 2 a 4h (Máx 6 doses nas primeiras 12h). Utilizar ar comprimido na nebulização para evitar hiperóxia.',
        variants: [],
      },
      {
        position: 4,
        baseText: 'Prednisona 20 mg - 2 comprimidos (40mg)',
        route: 'VO',
        frequency: '1X AO DIA',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'HORARIO',
        protocolDetail: 'Duração padrão recomendada de 5 dias.',
        variants: [
          'Hidrocortisona 100 mg/fr - 2 frascos (200 mg) EV AGORA (se intolerância VO)',
        ],
        isEditable: true,
      },
      {
        position: 5,
        baseText: 'Ceftriaxona 1g + SF 0,9% 100 mL EV infundir em 30 min',
        route: 'EV',
        frequency: '12/12H',
        conditionText: 'SE EXACERBAÇÃO BACTERIANA (≥ 2 SINTOMAS CARDINAIS)',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'CONDICIONAL',
        protocolDetail:
          'Sintomas cardinais: aumento da dispneia, volume de escarro e/ou purulência.',
        variants: [
          'Levofloxacino 500mg EV 1x/dia',
          'Cefepime 1g EV 8/8h (se risco para Pseudomonas)',
        ],
        isEditable: true,
      },
      {
        position: 6,
        baseText: 'Enoxaparina 40 mg/0,4mL (Profilaxia TVP/TEP)',
        route: 'SC',
        frequency: '1X AO DIA',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'HORARIO',
        variants: [],
      },
      {
        position: 7,
        baseText: 'Dipirona 1AMP+AD 10ML',
        route: 'EV',
        frequency: '6/6H',
        conditionText: 'se febre ou dor',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'SN',
        variants: [],
      },
      {
        position: 8,
        baseText: 'Bromoprida 1 AMP + SF 0,9% 100ML',
        route: 'EV',
        frequency: '8/8H',
        conditionText: 'SE NÁUSEAS OU VÔMITOS',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'SN',
        variants: [],
      },
      {
        position: 9,
        baseText: 'Insulina Regular SC conforme Dextro:',
        route: 'SC',
        frequency: '6/6H',
        conditionText: '',
        category: 'PROTOCOLO',
        isProtocol: true,
        protocolDetail:
          '181-200:2UI | 201-250:4UI | 251-300:6UI | 301-350:8UI | 351-400:10UI | >=401:12UI',
        defaultScheduleType: 'HORARIO',
        variants: [],
      },
      {
        position: 10,
        baseText: 'Monitorização Contínua e Sinais Vitais (PA, FC, FR, SatO2)',
        route: '',
        frequency: '6/6H',
        conditionText: '',
        category: 'CUIDADO',
        defaultScheduleType: 'HORARIO',
        variants: [],
      },
      {
        position: 11,
        baseText: 'Oxigênio Suplementar (Cateter Nasal ou VNI)',
        route: '',
        frequency: 'CONTÍNUO',
        conditionText: 'SE SATO2 < 88%',
        category: 'CUIDADO',
        defaultScheduleType: 'CONDICIONAL',
        protocolDetail:
          'Alvo rigoroso: SatO2 entre 88% e 92% (PaO2 60-70 mmHg). Considerar VNI se acidose hipercapnica.',
        variants: [],
      },
    ],
  },

  // 3. Edema Agudo de Pulmão (EAP) / IC Descompensada
  {
    name: 'Edema Agudo de Pulmão (EAP)',
    description:
      'Prescrição padrão para manejo do Edema Agudo de Pulmão (Perfil B - Quente e Congesto), focada em vasodilatação, diurese e suporte ventilatório.',
    items: [
      {
        position: 1,
        baseText: 'Dieta Zero',
        route: '',
        frequency: '',
        conditionText: '',
        category: 'DIETA',
        defaultScheduleType: 'HORARIO',
        variants: ['Dieta Hipossódica (transição/estabilização)'],
        isEditable: true,
      },
      {
        position: 2,
        baseText: 'Manter acesso venoso periférico salinizado',
        route: 'EV',
        frequency: '',
        conditionText: '',
        category: 'CUIDADO',
        defaultScheduleType: 'HORARIO',
        variants: [],
      },
      {
        position: 3,
        baseText: 'Furosemida 20 mg/2mL - administrar 2 a 3 ampolas (40 a 60 mg) em bolus',
        route: 'EV',
        frequency: 'AGORA',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'ACM',
        protocolDetail:
          'Dose inicial: 0,5 a 1 mg/kg (ou 1 a 2x a dose oral diária se uso crônico). Avaliar diurese em 2h (alvo >= 400 mL).',
        variants: [],
      },
      {
        position: 4,
        baseText: 'Nitroprussiato de sódio 50 mg/2mL (diluir 2 mL em SG 5% 248 mL) - infundir em BIC a 2 mL/h',
        route: 'EV',
        frequency: 'CONTÍNUO',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'HORARIO',
        protocolDetail:
          'Titular 2 mL/h a cada 3-5 min (Máx: 45 mL/h). Meta: reduzir PAM em 15-20% mantendo PAS > 90 mmHg.',
        variants: [
          'Nitroglicerina (Tridil) 5 mg/mL (10 mL em SG 5% 240 mL a 3 mL/h) se EAP com etiologia isquêmica/coronariana',
        ],
        isEditable: true,
      },
      {
        position: 5,
        baseText: 'Enoxaparina 40 mg/0,4mL (Profilaxia TVP)',
        route: 'SC',
        frequency: '1X AO DIA',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'HORARIO',
        variants: [],
      },
      {
        position: 6,
        baseText: 'Dipirona 1AMP+AD 10ML',
        route: 'EV',
        frequency: '6/6H',
        conditionText: 'se febre ou dor',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'SN',
        variants: [],
      },
      {
        position: 7,
        baseText: 'Bromoprida 1 AMP + SF 0,9% 100ML',
        route: 'EV',
        frequency: '8/8H',
        conditionText: 'SE NÁUSEAS OU VÔMITOS',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'SN',
        variants: [],
      },
      {
        position: 8,
        baseText: 'Insulina Regular SC conforme Dextro:',
        route: 'SC',
        frequency: '6/6H',
        conditionText: '',
        category: 'PROTOCOLO',
        isProtocol: true,
        protocolDetail:
          '181-200:2UI | 201-250:4UI | 251-300:6UI | 301-350:8UI | 351-400:10UI | >=401:12UI',
        defaultScheduleType: 'HORARIO',
        variants: [],
      },
      {
        position: 9,
        baseText: 'Monitorização Contínua e Sinais Vitais (PA, FC, FR, SatO2)',
        route: '',
        frequency: '6/6H',
        conditionText: '',
        category: 'CUIDADO',
        defaultScheduleType: 'HORARIO',
        variants: [],
      },
      {
        position: 10,
        baseText: 'Registrar débito urinário via Sonda Vesical de Demora (SVD)',
        route: '',
        frequency: '1/1H',
        conditionText: '',
        category: 'CUIDADO',
        defaultScheduleType: 'HORARIO',
        variants: [],
      },
      {
        position: 11,
        baseText: 'Oxigênio Suplementar com VNI (Modo CPAP: 5 a 10 cmH2O)',
        route: '',
        frequency: 'CONTÍNUO',
        conditionText: 'SE SATO2 < 90%',
        category: 'CUIDADO',
        defaultScheduleType: 'CONDICIONAL',
        protocolDetail: 'SatO2 alvo > 90-94%.',
        variants: [],
      },
    ],
  },

  // 4. IAM sem Supra de ST (IAMCSST)
  {
    name: 'IAM sem Supra de ST (IAMSSST)',
    description:
      'Prescrição padrão para manejo de Síndrome Coronariana Aguda sem Supradesnivelamento de ST (MONAB adaptado para enfermaria/PS).',
    items: [
      {
        position: 1,
        baseText: 'Dieta Oral Branda',
        route: 'VO',
        frequency: '',
        conditionText: '',
        category: 'DIETA',
        defaultScheduleType: 'HORARIO',
        variants: ['Dieta Zero (se previsão de cateterismo em < 12h)'],
        isEditable: true,
      },
      {
        position: 2,
        baseText: 'Manter acesso venoso periférico salinizado',
        route: 'EV',
        frequency: '',
        conditionText: '',
        category: 'CUIDADO',
        defaultScheduleType: 'HORARIO',
        variants: [],
      },
      {
        position: 3,
        baseText: 'Ácido Acetilsalicílico (AAS) 100 mg - 3 comprimidos (300 mg) mastigar e engolir',
        route: 'VO',
        frequency: 'AGORA (DOSE DE ATAQUE)',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'ACM',
        variants: ['AAS 100 mg - 1 comprimido 1x/dia (Manutenção)'],
        isEditable: true,
      },
      {
        position: 4,
        baseText: 'Clopidogrel 75 mg - 4 comprimidos (300 mg)',
        route: 'VO',
        frequency: 'AGORA (DOSE DE ATAQUE)',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'ACM',
        protocolDetail: 'Não administrar se realização de Cateterismo (CATE) for em menos de 24h.',
        variants: ['Clopidogrel 75 mg - 1 comprimido 1x/dia (Manutenção)'],
        isEditable: true,
      },
      {
        position: 5,
        baseText: 'Enoxaparina 1 mg/kg',
        route: 'SC',
        frequency: '12/12H',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'HORARIO',
        protocolDetail:
          'Se idade ≥ 75 anos: 0,75 mg/kg SC 12/12h. Se ClCr < 30 mL/min: 1 mg/kg SC 1x/dia.',
        variants: [],
      },
      {
        position: 6,
        baseText: 'Dinitrato de Isossorbida 5 mg - 1 comprimido',
        route: 'SL',
        frequency: 'A CADA 5 MIN',
        conditionText: 'SE DOR TORÁCICA (MÁX 3 CP)',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'SN',
        protocolDetail:
          'Contraindicado se uso de inibidores da 5-PDE (tadalafila/sildenafila) nas últimas 24-48h ou se PAS < 110 mmHg.',
        variants: [],
      },
      {
        position: 7,
        baseText: 'Nitroglicerina (Tridil) 5 mg/mL (10 mL em SG 5% 240 mL) - infundir em BIC a 3 mL/h',
        route: 'EV',
        frequency: 'CONTÍNUO',
        conditionText: 'SE DOR TORÁCICA REFRATÁRIA AO NITRATO SL OU PA ELEVADA',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'CONDICIONAL',
        protocolDetail:
          'Incrementar 3 mL/h a cada 5 min conforme sintomas/PA (Máx: 45 mL/h). PA alvo: 130x90 mmHg.',
        variants: [],
      },
      {
        position: 8,
        baseText: 'Atenolol 25 mg - 1 comprimido',
        route: 'VO',
        frequency: '12/12H',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'HORARIO',
        protocolDetail:
          'Não administrar se risco para choque cardiogênico, FC < 50 bpm, hipotensão, IC descompensada, broncoespasmo ativo ou BAV avançado.',
        variants: [],
      },
      {
        position: 9,
        baseText: 'Enalapril 10 mg - 1 comprimido',
        route: 'VO',
        frequency: '12/12H',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'HORARIO',
        variants: ['Losartana 50 mg VO 12/12H (se tosse/intolerância a IECA)'],
        isEditable: true,
      },
      {
        position: 10,
        baseText: 'Rosuvastatina 40 mg - 1 comprimido',
        route: 'VO',
        frequency: '1X AO DIA',
        conditionText: '',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'HORARIO',
        variants: [
          'Atorvastatina 80 mg VO 1x/dia',
          'Sinvastatina 40 mg VO 1x/dia à noite',
        ],
        isEditable: true,
      },
      {
        position: 11,
        baseText: 'Dipirona 1AMP+AD 10ML',
        route: 'EV',
        frequency: '6/6H',
        conditionText: 'se febre ou dor não isquêmica',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'SN',
        variants: [],
      },
      {
        position: 12,
        baseText: 'Bromoprida 1 AMP + SF 0,9% 100ML',
        route: 'EV',
        frequency: '8/8H',
        conditionText: 'SE NÁUSEAS OU VÔMITOS',
        category: 'MEDICAMENTO',
        defaultScheduleType: 'SN',
        variants: [],
      },
      {
        position: 13,
        baseText: 'Insulina Regular SC conforme Dextro:',
        route: 'SC',
        frequency: '6/6H',
        conditionText: '',
        category: 'PROTOCOLO',
        isProtocol: true,
        protocolDetail:
          '181-200:2UI | 201-250:4UI | 251-300:6UI | 301-350:8UI | 351-400:10UI | >=401:12UI',
        defaultScheduleType: 'HORARIO',
        variants: [],
      },
      {
        position: 14,
        baseText: 'Monitorização Contínua e Sinais Vitais (PA, FC, FR, SatO2)',
        route: '',
        frequency: '6/6H',
        conditionText: '',
        category: 'CUIDADO',
        defaultScheduleType: 'HORARIO',
        variants: [],
      },
      {
        position: 15,
        baseText: 'CN DE O2 a 2-3 L/min',
        route: '',
        frequency: '',
        conditionText: 'SE SATO2 < 90%',
        category: 'CONDICIONAL',
        defaultScheduleType: 'CONDICIONAL',
        protocolDetail: 'Alvo SatO2 > 90%. Evitar hiperóxia indiscriminada.',
        variants: [],
      },
    ],
  },
];

async function main() {
  console.log('Iniciando importação de novos protocolos clínicos...');

  for (const proto of protocols) {
    let template = await prisma.template.findFirst({
      where: { name: proto.name },
    });

    if (!template) {
      template = await prisma.template.create({
        data: {
          name: proto.name,
          description: proto.description,
        },
      });
      console.log(`[+] Modelo criado: ${proto.name} (id: ${template.id})`);
    } else {
      console.log(`[*] Modelo existente encontrado: ${proto.name} (id: ${template.id}). Sincronizando itens...`);
      await prisma.template.update({
        where: { id: template.id },
        data: { description: proto.description },
      });
      await prisma.templateItem.deleteMany({
        where: { templateId: template.id },
      });
    }

    for (const item of proto.items) {
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
          route: item.route || '',
          frequency: item.frequency || '',
          conditionText: item.conditionText || '',
          category: item.category,
          isProtocol: item.isProtocol ?? false,
          protocolDetail: item.protocolDetail || null,
          enabledByDefault: item.enabledByDefault ?? true,
          defaultScheduleType: item.defaultScheduleType,
          variants: JSON.stringify(item.variants || []),
          isEditable: item.isEditable ?? false,
        },
      });
    }
    console.log(`    -> ${proto.items.length} itens cadastrados para "${proto.name}".`);
  }

  console.log('\nTodos os protocolos foram importados com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro na importação dos protocolos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
