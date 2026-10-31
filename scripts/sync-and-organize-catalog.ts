import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface CatalogUpdateSpec {
  id: string;
  name: string;
  category: string;
  fullDescription: string;
  variants: string[];
  mergedDuplicateIds?: string[];
}

interface NewCatalogItemSpec {
  id: string;
  name: string;
  category: string;
  fullDescription: string;
  variants: string[];
}

// 1. Atualizações, fusões de duplicatas, correções de categoria e enriquecimento de variantes dos itens existentes
const CATALOG_UPDATES: CatalogUpdateSpec[] = [
  // === ANTIBIÓTICOS ===
  {
    id: 'cmuahnv4m0029xi1zt45yqf55',
    name: 'Ceftriaxona 1g / 2g EV',
    category: 'ANTIBIOTICO',
    fullDescription: 'CEFTRIAXONA 1G 2AMP + 100ML SF 0,9% EV 24/24H',
    variants: [
      'CEFTRIAXONA 1G 2AMP + 100ML SF 0,9% EV 24/24H',
      'CEFTRIAXONA 2G + SF 0,9% 100ML EV 24/24H',
      'CEFTRIAXONA 1G 1AMP + 100ML SF 0,9% EV 12/12H',
      'CEFTRIAXONA 1G 1AMP + 100ML SF 0,9% EV 24/24H',
    ],
    mergedDuplicateIds: ['cmufouhew001hurycsnhnhzxc'],
  },
  {
    id: 'cmuahnv94002axi1zelyv59j0',
    name: 'Amoxicilina + Clavulanato EV / VO',
    category: 'ANTIBIOTICO',
    fullDescription: 'AMOXICILINA + CLAVULANATO 1G + 100ML SF 0,9% EV 8/8H',
    variants: [
      'AMOXICILINA + CLAVULANATO 1G + 100ML SF 0,9% EV 8/8H',
      'AMOXICILINA + CLAVULANATO 875/125MG 1CP VO 12/12H',
      'AMOXICILINA + CLAVULANATO 500/125MG 1CP VO 8/8H',
    ],
  },
  {
    id: 'cmuahnvdj002bxi1zr26desqn',
    name: 'Ciprofloxacino EV / VO',
    category: 'ANTIBIOTICO',
    fullDescription: 'CIPROFLOXACINO 400MG SOLUÇÃO EV 12/12H',
    variants: [
      'CIPROFLOXACINO 400MG SOLUÇÃO EV 12/12H',
      'CIPROFLOXACINO 500MG SOLUÇÃO EV 12/12H',
      'CIPROFLOXACINO 500MG 1CP VO 12/12H',
    ],
  },
  {
    id: 'cmuahnvi3002cxi1zaw80o36m',
    name: 'Metronidazol 500mg EV / VO',
    category: 'ANTIBIOTICO',
    fullDescription: 'METRONIDAZOL 500MG BOLSA EV 8/8H',
    variants: [
      'METRONIDAZOL 500MG BOLSA EV 8/8H',
      'METRONIDAZOL 500MG BOLSA EV 12/12H',
      'METRONIDAZOL 250MG 2CP (500MG) VO 8/8H',
    ],
  },
  {
    id: 'cmufouho1001iurycs43a2n9t',
    name: 'Levofloxacino 500mg / 750mg',
    category: 'ANTIBIOTICO',
    fullDescription: 'LEVOFLOXACINO 500MG BOLSA EV 24/24H',
    variants: [
      'LEVOFLOXACINO 500MG BOLSA EV 24/24H',
      'Levofloxacino 500mg EV 1x/dia',
      'LEVOFLOXACINO 500MG 1CP VO 24/24H',
      'LEVOFLOXACINO 750MG BOLSA EV 24/24H',
    ],
  },
  {
    id: 'cmufouhxi001juryclsh7mify',
    name: 'Cefepime 1g / 2g EV',
    category: 'ANTIBIOTICO',
    fullDescription: 'CEFEPIME 1G + 100ML SF 0,9% EV 8/8H',
    variants: [
      'CEFEPIME 1G + 100ML SF 0,9% EV 8/8H',
      'CEFEPIME 2G + 100ML SF 0,9% EV 8/8H',
      'CEFEPIME 1G + 100ML SF 0,9% EV 12/12H',
      'Cefepime 1g EV 8/8h (se risco para Pseudomonas)',
    ],
  },

  // === ANTICOAGULANTES ===
  {
    id: 'cmuahnvn2002dxi1zu0b88ywt',
    name: 'Enoxaparina 40mg SC (Profilaxia TVP)',
    category: 'ANTICOAGULANTE',
    fullDescription: 'ENOXAPARINA 40MG 1AMP SC 24/24H (PROFILAXIA TVP)',
    variants: [
      'ENOXAPARINA 40MG 1AMP SC 24/24H (PROFILAXIA TVP)',
      'ENOXAPARINA 40MG 1AMP SC 24/24H',
      'Enoxaparina 40 mg/0,4mL (Profilaxia TVP/TEP) SC 1X AO DIA',
      'ENOXAPARINA 20MG 1AMP SC 24/24H (SE CLCR < 30 ML/MIN)',
    ],
    mergedDuplicateIds: ['cmufoud0i0013urycapm4aezz'],
  },
  {
    id: 'cmuahnvrq002exi1z5n4i9qen',
    name: 'Enoxaparina 1mg/kg SC (Anticoagulação Plena)',
    category: 'ANTICOAGULANTE',
    fullDescription: 'ENOXAPARINA 40MG 2AMP (80MG) SC 12/12H (ANTICOAGULAÇÃO PLENA)',
    variants: [
      'ENOXAPARINA 40MG 2AMP (80MG) SC 12/12H (ANTICOAGULAÇÃO PLENA)',
      'ENOXAPARINA 60MG 1AMP SC 12/12H (ANTICOAGULAÇÃO PLENA)',
      'Enoxaparina 1 mg/kg SC 12/12H',
      'ENOXAPARINA 1MG/KG SC 24/24H (AJUSTE RENAL CLCR < 30)',
    ],
  },
  {
    id: 'cmufouda20014uryc3oskvhpp',
    name: 'Heparina Não Fracionada (HNF)',
    category: 'ANTICOAGULANTE',
    fullDescription: 'Heparina Não Fracionada (HNF) 25.000UI/5mL - diluir 5 mL em SF 0,9% 245mL (Dose de ataque: 80 U/kg EV; Manutenção: 18 U/kg/h EV em BIC)',
    variants: [
      'Heparina Não Fracionada (HNF) 25.000UI/5mL - diluir 5 mL em SF 0,9% 245mL (Dose de ataque: 80 U/kg EV; Manutenção: 18 U/kg/h EV em BIC)',
      'HEPARINA NÃO FRACIONADA (HNF) 5.000UI SC 8/8H (PROFILAXIA TVP)',
      'HEPARINA NÃO FRACIONADA (HNF) 5.000UI SC 12/12H (PROFILAXIA TVP)',
    ],
  },

  // === CUIDADOS E DIETAS ===
  {
    id: 'cmufou1fp000jurycktq2frtg',
    name: 'Cuidados Gerais e Sinais Vitais',
    category: 'CUIDADO',
    fullDescription: 'CCG + Sinais Vitais e Dextro 6/6H',
    variants: [
      'CCG + Sinais Vitais e Dextro 6/6H',
      'Cuidados Gerais + Sinais Vitais 6/6H',
      'Cuidados Gerais e Sinais Vitais 6/6H',
      'CCG + Sinais Vitais e Dextro 6/6H (AVISAR SE FEBRE > 38,5°C)',
      'CUIDADOS PALIATIVOS PROPORCIONAIS - MEDIDAS DE CONFORTO',
    ],
    mergedDuplicateIds: ['cmufouf9s001auryc8x81tn5t', 'cmufouixe001muryc6ncpeeid'],
  },
  {
    id: 'cmufotwe70000urycgrtfbhjw',
    name: 'Dieta (Oral / SNE / Zero)',
    category: 'CUIDADO',
    fullDescription: 'Dieta Geral',
    variants: [
      'Dieta Geral',
      'Dieta Branda',
      'Dieta Leve',
      'Dieta Leve conforme tolerância',
      'Dieta Pastosa',
      'Dieta Pastosa Assistida',
      'Dieta Hipossódica',
      'Dieta para Diabético',
      'Dieta Hipossódica para Diabético',
      'Dieta via SNE',
      'Dieta Enteral via SNE em BIC',
      'Dieta Zero',
      'Dieta Zero (se previsão de cateterismo em < 12h)',
    ],
  },
  {
    id: 'cmufoufiw001buryc6oppq2ra',
    name: 'Oxigênio Suplementar / VNI',
    category: 'CUIDADO',
    fullDescription: 'Oxigênio Suplementar (Cateter Nasal ou Máscara) CONTÍNUO SE SATO2 < 92%',
    variants: [
      'Oxigênio Suplementar (Cateter Nasal ou Máscara) CONTÍNUO SE SATO2 < 92%',
      'Oxigênio Suplementar (Cateter Nasal ou VNI) CONTÍNUO SE SATO2 < 88%',
      'Oxigênio Suplementar (Cateter Nasal ou VNI) MANTER SAT 88% - 92%',
      'Oxigênio Suplementar com VNI (Modo CPAP: 5 a 10 cmH2O) CONTÍNUO SE SATO2 < 90%',
    ],
    mergedDuplicateIds: ['cmufoultc001vuryc3rewxe2b'],
  },
  {
    id: 'cmufou1ox000kurycub7g9sqg',
    name: 'Cateter Nasal de O2 (Condicional)',
    category: 'CONDICIONAL',
    fullDescription: 'CN DE O2 SE SATO2 < 90% - COMUNICAR MÉDICO RESPONSÁVEL',
    variants: [
      'CN DE O2 SE SATO2 < 90% - COMUNICAR MÉDICO RESPONSÁVEL',
      'CN DE O2 SE SATO2 < 88% - COMUNICAR MÉDICO RESPONSÁVEL',
      'CN DE O2 SE SATO2 < 92% - COMUNICAR MÉDICO RESPONSÁVEL',
      'CN DE O2 MANTER SATURAÇÃO ALVO ENTRE 88% E 92%',
      'CN DE O2 a 2-3 L/min SE SATO2 < 90%',
    ],
  },

  // === HIDRATAÇÃO ===
  {
    id: 'cmufoty7f0007urycd2bk525s',
    name: 'Soro Fisiológico 0,9% (SF 0,9%)',
    category: 'HIDRATACAO',
    fullDescription: 'SF 0,9% 500ML EV 12/12H',
    variants: [
      'SF 0,9% 500ML EV 12/12H',
      'SF 0,9% 500ML EV 12/12H ACM',
      'SF 0,9% 500ML EV 8/8H',
      'SF 0,9% 500ML EV 8/8H ACM',
      'SF 0,9% 500ML EV 12/12H (CORRER LENTO)',
      'SF 0,9% 500ML EV AGORA',
      'SF 0,9% 250ML EV',
      'SF 0,9% 1000ML EV 24/24H',
    ],
  },
  {
    id: 'cmufotz83000buryc0brduach',
    name: 'Soro Glicofisiológico / Glicosado 5%',
    category: 'HIDRATACAO',
    fullDescription: 'SGF 5% 1000ML + NaCl 20% 20ML + KCl 19,1% 10ML',
    variants: [
      'SGF 5% 1000ML + NaCl 20% 20ML + KCl 19,1% 10ML',
      'SG 5% 1000ML EV 12/12H EM BIC (83ML/H)',
      'SG 5% 500ML EV 12/12H',
    ],
  },

  // === SONDAS E OUTROS ===
  {
    id: 'cmuahnw78002hxi1zn7fiww6w',
    name: 'Passagem de SVD + Diurese',
    category: 'SONDA',
    fullDescription: 'PASSAGEM DE SONDA VESICAL DE DEMORA COM QUANTIFICAÇÃO DE DIURESE',
    variants: [
      'PASSAGEM DE SONDA VESICAL DE DEMORA COM QUANTIFICAÇÃO DE DIURESE',
      'SONDA VESICAL DE DEMORA - QUANTIFICAR DIURESE',
      'SVD - QUANTIFICAR DIURESE 6/6H',
    ],
  },
  {
    id: 'cmuahnwbx002ixi1zc6nei5w6',
    name: 'Clister Glicerinado 500mL',
    category: 'OUTRO',
    fullDescription: 'CLISTER GLICERINADO 500ML VIA RETAL SE NECESSÁRIO',
    variants: [
      'CLISTER GLICERINADO 500ML VIA RETAL SE NECESSÁRIO',
      'CLISTER GLICERINADO 500ML VIA RETAL AGORA',
      'CLISTER GLICERINADO 500ML VIA RETAL ACM',
    ],
  },

  // === MEDICAMENTOS GERAIS (UNIFICADOS E ENRIQUECIDOS) ===
  {
    id: 'cmufoumt8001yurycqkhmiu4g',
    name: 'AAS (Ácido Acetilsalicílico) 100mg',
    category: 'MEDICAMENTO',
    fullDescription: 'AAS 100MG 1CP VO 24/24H (APÓS ALMOÇO)',
    variants: [
      'AAS 100MG 1CP VO 24/24H (APÓS ALMOÇO)',
      'AAS 100 mg - 1 comprimido 1x/dia (Manutenção)',
      'Ácido Acetilsalicílico (AAS) 100 mg - 3cp mastigar e engolir VO AGORA (DOSE DE ATAQUE)',
    ],
    mergedDuplicateIds: ['cmufoumk4001xurycwu8h2eud'],
  },
  {
    id: 'cmufou80r000qurycq2h1thb7',
    name: 'Hidrocortisona 100mg / 500mg EV',
    category: 'MEDICAMENTO',
    fullDescription: 'HIDROCORTISONA 100MG 2AMP (200MG) EV 8/8H',
    variants: [
      'HIDROCORTISONA 100MG 2AMP (200MG) EV 8/8H',
      'Hidrocortisona 500 MG 1AMP EV AGORA',
      'HIDROCORTISONA 100MG 1AMP EV 8/8H',
      'Hidrocortisona 100 mg/amp - 2AMP + SF 0,9% 100 mL EV AGORA',
      'Hidrocortisona 100 mg/fr - 2 frascos (200 mg) EV 1X AO DIA',
      'Hidrocortisona 100 mg/fr - 2 frascos (200 mg) EV AGORA (se intolerância VO)',
    ],
    mergedDuplicateIds: ['cmufou89r000rurycbm3ka7ec'],
  },
  {
    id: 'cmufou8jb000surycvprkmddb',
    name: 'Salbutamol Spray (Aerolin) 100mcg',
    category: 'MEDICAMENTO',
    fullDescription: 'Salbutamol Spray 100 mcg/jato - inalar 4 puffs VI 4/4H',
    variants: [
      'Salbutamol Spray 100 mcg/jato - inalar 4 puffs VI 4/4H',
      'Salbutamol Spray 100 mcg/jato - inalar 4 puffs VI 6/6H',
      'Salbutamol Spray 100 mcg/jato - inalar 6 puffs VI 6/6H',
      'Salbutamol Spray 100 mcg/jato - inalar 2 a 4 puffs VI 4/4H',
      'Salbutamol Spray 100 mcg/jato - inalar 4 a 8 puffs VI A CADA 20 MIN NA 1ª HORA',
      'Salbutamol 100MCG 10 PUFFS VI REPETIR 20/20MIN ATÉ 3 VEZES S/N',
      'Salbutamol 100MCG/JATO 8 PUFFS VI REPETIR 20/20MIN ATÉ 3 VEZES AGORA',
    ],
    mergedDuplicateIds: ['cmufoudru0015uryc10kix79r'],
  },
  {
    id: 'cmufouk24001quryc95urxqnd',
    name: 'Furosemida 20mg/2mL EV / 40mg VO',
    category: 'MEDICAMENTO',
    fullDescription: 'FUROSEMIDA 20MG/2ML - 2AMP (40MG) EM BOLUS EV 12/12H',
    variants: [
      'FUROSEMIDA 20MG/2ML - 2AMP (40MG) EM BOLUS EV 12/12H',
      'FUROSEMIDA 20MG/2ML - 1AMP (20MG) EV 12/12H',
      'FUROSEMIDA 20MG/2ML - 2AMP (40MG) EV 8/8H',
      'FUROSEMIDA 20MG/2ML - 4AMP (80MG) EM BOLUS EV 12/12H',
      'FUROSEMIDA 40MG EV AGORA',
      'Furosemida 20 mg/2mL - administrar 2 a 3 ampolas (40 a 60 mg) em bolus EV AGORA ACM',
      'FUROSEMIDA 40MG 1CP VO 24/24H (MANHÃ)',
    ],
  },
  {
    id: 'cmufotzhh000curycaw4ap4br',
    name: 'Dipirona EV / VO',
    category: 'MEDICAMENTO',
    fullDescription: 'Dipirona 1AMP + AD 10ML EV 6/6H se febre ou dor',
    variants: [
      'Dipirona 1AMP + AD 10ML EV 6/6H se febre ou dor',
      'Dipirona 1AMP + AD 10ML EV 6/6H',
      'Dipirona 1AMP + AD 10ML EV 6/6H ACM',
      'DIPIRONA 500MG/ML 40GTS VO 6/6H se febre ou dor',
      'DIPIRONA 500MG/ML 40GTS VO 6/6H',
      'DIPIRONA 500MG 1CP VO 6/6H se febre ou dor',
    ],
  },
  {
    id: 'cmufouc550010urycam3bud24',
    name: 'Escopolamina (Buscopan) Simples / Composto',
    category: 'MEDICAMENTO',
    fullDescription: 'Escopolamina 1 AMP + 100ML DE SF 0,9% EV 8/8H ACM',
    variants: [
      'Escopolamina 1 AMP + 100ML DE SF 0,9% EV 8/8H ACM',
      'Escopolamina 1 AMP + 100ML DE SF 0,9% EV 8/8H',
      'Escopolamina 1 AMP IM ACM',
      'DIPIRONA 1 AMP + Escopolamina 1 AMP + 100ML DE SF 0,9% EV AGORA',
      'DIPIRONA 1 AMP + Escopolamina 1 AMP + 100ML DE SF 0,9% EV 8/8H ACM',
    ],
  },
  {
    id: 'cmufou09x000furycf7pb84hl',
    name: 'Bromoprida 10mg EV / IM',
    category: 'MEDICAMENTO',
    fullDescription: 'Bromoprida 1 AMP + SF 0,9% 100ML EV 8/8H SE NÁUSEAS OU VÔMITOS',
    variants: [
      'Bromoprida 1 AMP + SF 0,9% 100ML EV 8/8H SE NÁUSEAS OU VÔMITOS',
      'Bromoprida 1 AMP + SF 0,9% 100ML EV 8/8H',
      'Bromoprida 1 AMP IM 8/8H ACM',
    ],
  },
  {
    id: 'cmufou00m000eurycqp9mgfjb',
    name: 'Tramadol 50mg / 100mg EV',
    category: 'MEDICAMENTO',
    fullDescription: 'Tramadol 1AMP + 100ML SF 0,9% + 1 AMP de Plasil EV 6/6H SE DOR FORTE',
    variants: [
      'Tramadol 1AMP + 100ML SF 0,9% + 1 AMP de Plasil EV 6/6H SE DOR FORTE',
      'Tramadol 1AMP + 100ML SF 0,9% + 1 AMP de Plasil EV 6/6H',
      'Tramadol 100MG 1AMP + 100ML SF 0,9% EV 8/8H ACM',
      'Tramadol 50MG 1AMP + 100ML SF 0,9% EV 8/8H ACM',
    ],
  },
  {
    id: 'cmufou3wk000nuryc566ojsg8',
    name: 'Diazepam 10mg VO / IM / EV',
    category: 'MEDICAMENTO',
    fullDescription: 'Diazepam 10MG 1CP VO 12/12HRS S/N (agitação psicomotora, agressividade)',
    variants: [
      'Diazepam 10MG 1CP VO 12/12HRS S/N (agitação psicomotora, agressividade)',
      'Diazepam 10MG 1CP VO À NOITE',
      'Diazepam 10MG 1CP VO 12/12HRS',
      'Diazepam 10MG 1CP VO ACM',
      'Diazepam 10MG 1AMP IM S/N',
      'Diazepam 10MG 1AMP IM 12/12HRS S/N (agitação psicomotora, agressividade)',
      'Diazepam 10MG 1AMP EV LENTO ACM (SE CRISE CONVULSIVA)',
    ],
  },
  {
    id: 'cmufou4f0000puryckf6699el',
    name: 'Haloperidol (Haldol) 5mg IM / VO',
    category: 'MEDICAMENTO',
    fullDescription: 'Haloperidol 01AMP IM ACM',
    variants: [
      'Haloperidol 01AMP IM ACM',
      'HALOPERIDOL 1AMP IM 12/12H',
      'HALOPERIDOL 5MG 1CP VO 12/12H',
      'HALOPERIDOL 5MG 1CP VO À NOITE',
    ],
  },
  {
    id: 'cmufou45l000ourycsokhh1t0',
    name: 'Prometazina (Fenergan) 50mg IM / 25mg VO',
    category: 'MEDICAMENTO',
    fullDescription: 'Prometazina 01AMP IM ACM',
    variants: [
      'Prometazina 01AMP IM ACM',
      'PROMETAZINA 50MG 1AMP IM 12/12H',
      'PROMETAZINA 25MG 1CP VO À NOITE',
    ],
  },
  {
    id: 'cmufoue0q0016uryca69tzz8r',
    name: 'Ipratrópio (Atrovent) Nebulização',
    category: 'MEDICAMENTO',
    fullDescription: 'Ipratrópio 0,25 mg/mL (40 gotas) + SF 0,9% 3mL (nebulização) VI 6/6H',
    variants: [
      'Ipratrópio 0,25 mg/mL (40 gotas) + SF 0,9% 3mL (nebulização) VI 6/6H',
      'Ipratrópio 0,25 mg/mL (40 gotas) + SF 0,9% 3mL (nebulização) VI 6/6H ACM',
      'Ipratrópio 0,25 mg/mL (40 gotas) + SF 0,9% 3mL (nebulização) VI 8/8H',
      'Ipratrópio 0,25 mg/mL (40 gotas) + SF 0,9% 3mL VI A CADA 20 MIN NA 1ª HORA',
    ],
  },
  {
    id: 'cmufouej80018uryc0hsrwolh',
    name: 'Prednisona 20mg VO',
    category: 'MEDICAMENTO',
    fullDescription: 'Prednisona 20 mg - 2 comprimidos (40mg) VO 1X AO DIA',
    variants: [
      'Prednisona 20 mg - 2 comprimidos (40mg) VO 1X AO DIA',
      'Prednisona 20 mg - 3 comprimidos (60mg) VO AGORA (Opção de escolha na exacerbação leve/moderada)',
      'PREDNISONA 20MG 1CP VO 1X AO DIA (MANHÃ)',
    ],
  },
  {
    id: 'cmufoupgz0028uryc6zat2u3k',
    name: 'Sinvastatina 20mg / 40mg VO',
    category: 'MEDICAMENTO',
    fullDescription: 'Sinvastatina 40 mg VO 1x/dia à noite',
    variants: [
      'Sinvastatina 40 mg VO 1x/dia à noite',
      'SINVASTATINA 20MG 2CP (40MG) VO 24/24H (NOITE)',
      'SINVASTATINA 20MG 1CP VO 24/24H (NOITE)',
    ],
  },
  {
    id: 'cmufoun2a001zuryc6mdjlwux',
    name: 'Clopidogrel 75mg VO',
    category: 'MEDICAMENTO',
    fullDescription: 'Clopidogrel 75 mg - 1 comprimido VO 24/24H (Manutenção)',
    variants: [
      'Clopidogrel 75 mg - 1 comprimido VO 24/24H (Manutenção)',
      'Clopidogrel 75 mg - 4 cp (300 mg) VO AGORA (DOSE DE ATAQUE)',
    ],
  },
];

// 2. Medicamentos recorrentes extraídos do histórico de prescrições do Turso e do plantão
const NEW_CATALOG_ITEMS: NewCatalogItemSpec[] = [
  // === MEDICAMENTOS GERAIS / EMERGÊNCIA / PSIQUIATRIA ===
  {
    id: 'cat_rec_omeprazol',
    name: 'Omeprazol 40mg EV / 20mg VO',
    category: 'MEDICAMENTO',
    fullDescription: 'OMEPRAZOL 40MG 1AMP EV 24/24H',
    variants: [
      'OMEPRAZOL 40MG 1AMP EV 24/24H',
      'OMEPRAZOL 40MG 1AMP EV 12/12H',
      'OMEPRAZOL 20MG 1CP VO 24/24H (EM JEJUM)',
      'OMEPRAZOL 40MG 2AMP (80MG) EV EM BOLUS AGORA (HDA)',
    ],
  },
  {
    id: 'cat_rec_ondansetrona',
    name: 'Ondansetrona (Zofran) 4mg / 8mg EV',
    category: 'MEDICAMENTO',
    fullDescription: 'ONDANSETRONA 1AMP + SF 0,9% 100ML EV 8/8H',
    variants: [
      'ONDANSETRONA 1AMP + SF 0,9% 100ML EV 8/8H',
      'ONDANSETRONA 4MG 1AMP + SF 0,9% 100ML EV 8/8H SE NÁUSEAS OU VÔMITOS',
      'ONDANSETRONA 8MG 1AMP + SF 0,9% 100ML EV 8/8H',
      'ONDANSETRONA 4MG 1AMP + SF 0,9% 100ML EV 8/8H ACM',
    ],
  },
  {
    id: 'cat_rec_acetilcisteina',
    name: 'Acetilcisteína (Fluimucil) EV / VO',
    category: 'MEDICAMENTO',
    fullDescription: 'ACETILCISTEINA 1AMP EV 24/24H',
    variants: [
      'ACETILCISTEINA 1AMP EV 24/24H',
      'ACETILCISTEÍNA 300MG (1AMP) + SF 0,9% 100ML EV 12/12H',
      'ACETILCISTEÍNA 300MG (1AMP) + SF 0,9% 100ML EV 8/8H',
      'ACETILCISTEÍNA XAROPE 600MG VO 1X AO DIA (NOITE)',
    ],
  },
  {
    id: 'cat_rec_dexametasona',
    name: 'Dexametasona (Decadron) EV / IM / VO',
    category: 'MEDICAMENTO',
    fullDescription: 'DEXAMETASONA 8MG 1AMP EV AGORA',
    variants: [
      'DEXAMETASONA 8MG 1AMP EV AGORA',
      'DEXAMETASONA 4MG 1AMP EV 8/8H',
      'DEXAMETASONA 4MG 1AMP EV 12/12H',
      'DEXAMETASONA 10MG 1AMP EV AGORA',
      'DEXAMETASONA 4MG 1CP VO 8/8H',
    ],
  },
  {
    id: 'cat_rec_fenitoina',
    name: 'Fenitoína (Hidantal) EV / VO',
    category: 'MEDICAMENTO',
    fullDescription: 'FENITOINA 2AMP + SF 0,9% 100ML EV 12/12H',
    variants: [
      'FENITOINA 2AMP + SF 0,9% 100ML EV 12/12H',
      'FENITOÍNA 50MG/ML 2AMP (100MG) + SF 0,9% 100ML EV 8/8H',
      'FENITOINA 50MG/ML 4AMP + SF 0,9% 250ML EV CORRER LENTO EM 1H ACM',
      'FENITOINA 50MG/ML 5AMP + SF 0,9% 250ML EV CORRER LENTO EM 1H ACM (HIDANTALIZAÇÃO)',
      'FENITOÍNA 100MG 1CP VO 8/8H',
    ],
  },
  {
    id: 'cat_rec_midazolam',
    name: 'Midazolam (Dormonid) IM / EV',
    category: 'MEDICAMENTO',
    fullDescription: 'MIDAZOLAM 5MG/ML 3ML IM ACM',
    variants: [
      'MIDAZOLAM 5MG/ML 3ML IM ACM',
      'MIDAZOLAM 15MG/ML 1ML IM ACM',
      'MIDAZOLAM 15MG/3ML 1AMP IM ACM',
    ],
  },
  {
    id: 'cat_rec_cetamina',
    name: 'Cetamina (Ketamin) 50mg/mL IM',
    category: 'MEDICAMENTO',
    fullDescription: 'CETAMINA 50MG/ML 3ML IM ACM',
    variants: [
      'CETAMINA 50MG/ML 3ML IM ACM',
      'CETAMINA 50MG/ML 4ML IM ACM',
      'CETAMINA 50MG/ML 2ML IM ACM',
    ],
  },
  {
    id: 'cat_rec_biperideno',
    name: 'Biperideno (Akineton) 5mg IM / 2mg VO',
    category: 'MEDICAMENTO',
    fullDescription: 'BIPERIDENO 5MG/ML 1AMP IM ACM',
    variants: [
      'BIPERIDENO 5MG/ML 1AMP IM ACM',
      'BIPERIDENO 5MG/ML 1AMP IM ACM (SE IMPREGNAÇÃO EXTRAPIRAMIDAL)',
      'BIPERIDENO 2MG 1CP VO 12/12H',
    ],
  },
  {
    id: 'cat_rec_morfina',
    name: 'Morfina (Dimorf) EV / BIC',
    category: 'MEDICAMENTO',
    fullDescription: 'MORFINA 10MG/ML 2AMP + 100ML SF 0,9% EV CONTÍNUO EM BIC 15ML/H',
    variants: [
      'MORFINA 10MG/ML 2AMP + 100ML SF 0,9% EV CONTÍNUO EM BIC 15ML/H',
      'MORFINA 10MG/ML 1AMP + AD 9ML EV - FAZER 2 A 4ML EV 4/4H SE DOR FORTE',
      'MORFINA 10MG/ML 1AMP + 100ML SF 0,9% EV CONTÍNUO EM BIC',
    ],
  },
  {
    id: 'cat_rec_lactulona',
    name: 'Lactulona Xarope VO',
    category: 'MEDICAMENTO',
    fullDescription: 'LACTULONA XAROPE 15ML VO 12/12H',
    variants: [
      'LACTULONA XAROPE 15ML VO 12/12H',
      'LACTULONA XAROPE 15ML VO 8/8H',
      'LACTULONA XAROPE 20ML VO 12/12H',
    ],
  },
  {
    id: 'cat_rec_nifedipino',
    name: 'Nifedipino (Adalat) 20mg / 10mg VO',
    category: 'MEDICAMENTO',
    fullDescription: 'NIFEDIPINO 20MG 1CP VO ACM',
    variants: [
      'NIFEDIPINO 20MG 1CP VO ACM',
      'NIFEDIPINO 20MG 1CP VO 12/12H',
      'NIFEDIPINO 10MG 1CP VO 8/8H',
    ],
  },
  {
    id: 'cat_rec_carvedilol',
    name: 'Carvedilol VO',
    category: 'MEDICAMENTO',
    fullDescription: 'CARVEDILOL 3,125MG 1CP VO 12/12H',
    variants: [
      'CARVEDILOL 3,125MG 1CP VO 12/12H',
      'CARVEDILOL 6,25MG 1CP VO 12/12H',
      'CARVEDILOL 12,5MG 1CP VO 12/12H',
      'CARVEDILOL 25MG 1CP VO 12/12H',
    ],
  },
  {
    id: 'cat_rec_acido_valproico',
    name: 'Ácido Valproico (Depakene) VO',
    category: 'MEDICAMENTO',
    fullDescription: 'ÁCIDO VALPROICO 250MG/CP 1CP VO 8/8H',
    variants: [
      'ÁCIDO VALPROICO 250MG/CP 1CP VO 8/8H',
      'ÁCIDO VALPROICO 500MG 1CP VO 12/12H',
      'ÁCIDO VALPROICO 500MG 1CP VO 8/8H',
    ],
  },
  {
    id: 'cat_rec_tiamina',
    name: 'Tiamina (Vitamina B1) 300mg VO / 100mg EV',
    category: 'MEDICAMENTO',
    fullDescription: 'TIAMINA 300MG 1CP VO 8/8H',
    variants: [
      'TIAMINA 300MG 1CP VO 8/8H',
      'TIAMINA 300MG 1CP VO 24/24H',
      'TIAMINA 100MG 1AMP EV/IM 24/24H',
    ],
  },
  {
    id: 'cat_rec_ivermectina',
    name: 'Ivermectina 6mg VO',
    category: 'MEDICAMENTO',
    fullDescription: 'IVERMECTINA 6MG 2CP VO DOSE ÚNICA',
    variants: [
      'IVERMECTINA 6MG 2CP VO DOSE ÚNICA',
      'IVERMECTINA 6MG 2CP VO 1X/DIA POR 2 DIAS',
    ],
  },

  // === ANTIBIÓTICOS RECORRENTES DOS PLANTÕES ===
  {
    id: 'cat_rec_claritromicina',
    name: 'Claritromicina 500mg EV / VO',
    category: 'ANTIBIOTICO',
    fullDescription: 'CLARITROMICINA 500MG 1AMP + 100ML SF 0,9% EV 12/12H',
    variants: [
      'CLARITROMICINA 500MG 1AMP + 100ML SF 0,9% EV 12/12H',
      'CLARITROMICINA 500MG 1CP VO 12/12H',
    ],
  },
  {
    id: 'cat_rec_azitromicina',
    name: 'Azitromicina 500mg VO / EV',
    category: 'ANTIBIOTICO',
    fullDescription: 'AZITROMICINA 500MG 1CP VO 24/24H',
    variants: [
      'AZITROMICINA 500MG 1CP VO 24/24H',
      'AZITROMICINA 500MG + SF 0,9% 250ML EV 24/24H',
    ],
  },
  {
    id: 'cat_rec_ampicilina',
    name: 'Ampicilina 1g / 2g EV',
    category: 'ANTIBIOTICO',
    fullDescription: 'AMPICILINA 1G 2AMP + 100ML SF 0,9% EV 6/6H',
    variants: [
      'AMPICILINA 1G 2AMP + 100ML SF 0,9% EV 6/6H',
      'AMPICILINA 1G 1AMP + 100ML SF 0,9% EV 6/6H',
    ],
  },
  {
    id: 'cat_rec_clindamicina',
    name: 'Clindamicina 600mg EV / 300mg VO',
    category: 'ANTIBIOTICO',
    fullDescription: 'CLINDAMICINA 600MG + 100ML SF 0,9% EV 8/8H',
    variants: [
      'CLINDAMICINA 600MG + 100ML SF 0,9% EV 8/8H',
      'CLINDAMICINA 600MG + 100ML SF 0,9% EV 6/6H',
      'CLINDAMICINA 300MG 1CP VO 12/12H',
      'CLINDAMICINA 300MG 1CP VO 8/8H',
    ],
  },
  {
    id: 'cat_rec_doxiciclina',
    name: 'Doxiciclina 100mg VO',
    category: 'ANTIBIOTICO',
    fullDescription: 'DOXICICLINA 100MG 1CP VO 12/12H',
    variants: [
      'DOXICICLINA 100MG 1CP VO 12/12H',
    ],
  },
  {
    id: 'cat_rec_tazocin',
    name: 'Piperacilina + Tazobactam (Tazocin) 4,5g EV',
    category: 'ANTIBIOTICO',
    fullDescription: 'PIPERACILINA + TAZOBACTAM 4,5G + 100ML SF 0,9% EV 6/6H',
    variants: [
      'PIPERACILINA + TAZOBACTAM 4,5G + 100ML SF 0,9% EV 6/6H',
      'PIPERACILINA + TAZOBACTAM 4,5G + 100ML SF 0,9% EV 8/8H',
      'PIPERACILINA + TAZOBACTAM 2,25G + 100ML SF 0,9% EV 6/6H (AJUSTE RENAL)',
    ],
  },

  // === HIDRATAÇÃO / CUIDADOS / SONDAS ADICIONAIS ===
  {
    id: 'cat_rec_ringer',
    name: 'Ringer Simples / Ringer Lactato 500mL',
    category: 'HIDRATACAO',
    fullDescription: 'RINGER SIMPLES 500ML EV 8/8H',
    variants: [
      'RINGER SIMPLES 500ML EV 8/8H',
      'RINGER SIMPLES 500ML EV 12/12H',
      'RINGER LACTATO 500ML EV 8/8H',
      'RINGER LACTATO 500ML EV 12/12H',
      'RINGER LACTATO 500ML EV AGORA',
    ],
  },
  {
    id: 'cat_rec_contencao',
    name: 'Contenção Mecânica no Leito',
    category: 'CUIDADO',
    fullDescription: 'CONTENÇÃO MECÂNICA EM LEITO S/N',
    variants: [
      'CONTENÇÃO MECÂNICA EM LEITO S/N',
      'CONTENÇÃO MECÂNICA EM LEITO SE NECESSÁRIO (AGITAÇÃO / RISCO DE QUEDA)',
    ],
  },
  {
    id: 'cat_rec_sne',
    name: 'Passagem de Sonda Nasoenteral (SNE / SNG)',
    category: 'SONDA',
    fullDescription: 'PASSAGEM DE SONDA NASOENTERAL (SNE) + RX DE CONTROLE PÓS-PASSAGEM',
    variants: [
      'PASSAGEM DE SONDA NASOENTERAL (SNE) + RX DE CONTROLE PÓS-PASSAGEM',
      'MANTER SONDA NASOENTERAL (SNE) PÉRVIA COM 20ML DE ÁGUA APÓS MEDICAÇÕES E DIETA',
      'PASSAGEM DE SONDA NASOGÁSTRICA (SNG) ABERTA EM DRENAGEM',
    ],
  },
];

async function main() {
  console.log('Iniciando sincronização, fusão de duplicatas e organização do Catálogo no Firestore...');

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const email = process.env.FIREBASE_AUTH_EMAIL || '';
  const password = process.env.FIREBASE_AUTH_PASSWORD || '';
  if (email && password) {
    await signInWithEmailAndPassword(auth, email, password);
  }
  const db = getFirestore(app);

  // Mapa de duplicateId -> canonicalId para atualizar prescrições existentes
  const duplicateToCanonical = new Map<string, string>();
  const now = new Date().toISOString();

  // 1. Aplicar atualizações e fusões de duplicatas
  let updatedCount = 0;
  let mergedCount = 0;

  for (const spec of CATALOG_UPDATES) {
    const uniqueVariants = Array.from(new Set([spec.fullDescription, ...spec.variants]));
    await setDoc(
      doc(db, 'catalog', spec.id),
      {
        id: spec.id,
        name: spec.name,
        category: spec.category,
        fullDescription: spec.fullDescription,
        variants: JSON.stringify(uniqueVariants),
        updatedAt: now,
      },
      { merge: true }
    );
    updatedCount++;

    if (spec.mergedDuplicateIds) {
      for (const dupId of spec.mergedDuplicateIds) {
        duplicateToCanonical.set(dupId, spec.id);
        await deleteDoc(doc(db, 'catalog', dupId));
        mergedCount++;
      }
    }
  }

  // 2. Inserir os novos medicamentos recorrentes do histórico do Turso
  let createdCount = 0;
  for (const newItem of NEW_CATALOG_ITEMS) {
    const uniqueVariants = Array.from(new Set([newItem.fullDescription, ...newItem.variants]));
    await setDoc(
      doc(db, 'catalog', newItem.id),
      {
        id: newItem.id,
        name: newItem.name,
        category: newItem.category,
        fullDescription: newItem.fullDescription,
        variants: JSON.stringify(uniqueVariants),
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
    createdCount++;
  }

  // 3. Higienizar qualquer outro item no catálogo que possa ter "#####" residual
  const catSnap = await getDocs(collection(db, 'catalog'));
  const catalogById = new Map<string, any>();
  for (const d of catSnap.docs) {
    const data = d.data();
    let changed = false;
    let fullDesc = String(data.fullDescription || '');
    if (fullDesc.includes('#####')) {
      fullDesc = fullDesc.split('#####')[0].trim();
      changed = true;
    }
    let vars: string[] = [];
    try {
      vars = JSON.parse(data.variants || '[]');
    } catch {
      vars = [fullDesc];
    }
    const cleanVars = Array.from(
      new Set(
        vars.map((v) => (v.includes('#####') ? v.split('#####')[0].trim() : v.trim())).filter(Boolean)
      )
    );
    if (JSON.stringify(cleanVars) !== data.variants) {
      changed = true;
    }
    if (changed) {
      await updateDoc(doc(db, 'catalog', d.id), {
        fullDescription: fullDesc,
        variants: JSON.stringify(cleanVars),
        updatedAt: now,
      });
    }
    catalogById.set(d.id, {
      ...data,
      id: d.id,
      fullDescription: fullDesc,
      variants: JSON.stringify(cleanVars),
    });
  }

  // 4. Atualizar prescrições existentes no Firestore que referenciam itens do catálogo
  // (corrige catalogItemId de duplicatas fundidas e adiciona templateItem.variants para habilitar "Trocar Apresentação")
  const prescSnap = await getDocs(collection(db, 'prescriptions'));
  let updatedPrescriptions = 0;

  for (const pDoc of prescSnap.docs) {
    const pData = pDoc.data();
    const items: any[] = pData.items || [];
    let modified = false;

    const nextItems = items.map((it) => {
      if (!it.catalogItemId) return it;

      const canonicalId = duplicateToCanonical.get(it.catalogItemId) || it.catalogItemId;
      const catItem = catalogById.get(canonicalId);

      if (canonicalId !== it.catalogItemId || (catItem && !it.templateItem)) {
        modified = true;
        return {
          ...it,
          catalogItemId: canonicalId,
          templateItem: catItem
            ? {
                id: canonicalId,
                category: catItem.category,
                isProtocol: false,
                protocolDetail: null,
                variants: catItem.variants || '[]',
                isEditable: true,
              }
            : it.templateItem || null,
        };
      }
      return it;
    });

    if (modified) {
      await updateDoc(doc(db, 'prescriptions', pDoc.id), {
        items: nextItems,
        updatedAt: now,
      });
      updatedPrescriptions++;
    }
  }

  // 5. Resumo final por categoria
  const finalSnap = await getDocs(collection(db, 'catalog'));
  const byCategory: Record<string, number> = {};
  finalSnap.docs.forEach((d) => {
    const cat = d.data().category || 'OUTRO';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  console.log('\n=== RESUMO DA MIGRAÇÃO E HIGIENIZAÇÃO ===');
  console.log(`- Itens existentes atualizados/enriquecidos: ${updatedCount}`);
  console.log(`- Duplicatas fundidas e removidas: ${mergedCount}`);
  console.log(`- Novos medicamentos recorrentes incluídos: ${createdCount}`);
  console.log(`- Prescrições atualizadas com variantes do catálogo: ${updatedPrescriptions}`);
  console.log(`- Total final de itens no Catálogo Firestore: ${finalSnap.size}`);
  console.log('- Distribuição por categoria:', byCategory);
}

main()
  .catch((err) => {
    console.error('Erro na migração:', err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
