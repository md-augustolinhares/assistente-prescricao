# 🏥 Assistente de Prescrição Médica

> **Status:** Em Produção | **Arquitetura:** Serverless Google Cloud / Firebase (Plano Spark 100% Gratuito) | **Tipo:** Ferramenta Clínica (HealthTech) / Case de Portfólio

Uma aplicação web moderna, ultra-rápida e responsiva desenvolvida para agilizar a elaboração de prescrições hospitalares em enfermarias clínicas, unidades de internação e prontos-socorros.

Este projeto nasce de uma **dor clínica real**: substituir fluxos manuais e lentos baseados em copiar e colar células no Excel ou editores genéricos por um sistema estruturado, desenhado sob medida para a ergonomia e velocidade do médico plantonista.

---

## 🎯 O Problema & A Solução de Produto

Em plantões de emergência e enfermarias, a transcrição e formatação da prescrição médica diária consome tempo precioso. O uso de planilhas gera atrito mecânico, erros de formatação na impressão e risco de perdas acidentais.

**A Solução:** Um sistema centrado na **redução de carga cognitiva e clique-mínimo**:
- Modelos clínicos pré-configurados prontos para uso.
- Modularidade para alternar apresentações de medicamentos em segundos mantendo o aprazamento intacto.
- Gestão multi-instituições com cabeçalhos e brasões dinâmicos.
- Totalmente *White-Label*: nenhum dado sensível de instituição ou de pacientes é comitado no código.

> **Autonomia Clínica Preservada:** O sistema atua na formatação e estruturação ágil do documento. **Nenhum modelo de IA sugere doses, diagnósticos ou condutas.** Toda a decisão clínica parte exclusivamente do médico, que assina e carimba o documento final impresso.

---

## 🚀 Funcionalidades Principais (Highlights)

- ⚡ **Velocidade e Ergonomia:** Interface focada em produtividade. Criação e edição de prescrições completas com o mínimo de cliques.
- 📋 **Modelos Clínicos Estruturados (Framework FAST-HUG):**
  - Desenvolvidos com base na mnemônica FAST-HUG adaptada para enfermarias, checando analgesia, profilaxia de úlcera de estresse, profilaxia de TEV/TVP, controle glicêmico, hidratação e dieta.
  - Editor visual para ajustar medicamentos de cada modelo base.
- 🔄 **Modularidade e Variações Rápidas:**
  - Troca dinâmica de apresentações (ex: alternar `SF 0,9% 500ml` vs `100ml`) preservando via e posologia.
  - Seletor de aprazamento clínico: `Horário Fixo`, `ACM` (A critério médico), `SN` (Se necessário) ou `Condicional`.
- 🏛️ **Gestão Multi-Instituições (Novo):**
  - Cadastre e alterne entre diferentes hospitais, prefeituras ou clínicas onde você atende.
  - Upload de brasão/logotipo (PNG/JPG) convertido automaticamente para Base64 e salvo no banco de dados.
  - Cada plantão pode ser associado ao seu respectivo hospital.
- 🖨️ **Motor de Impressão Pixel-Perfect (HTML/CSS):**
  - Layout nativo para folha **A4 Paisagem**, seguindo os padrões oficiais de prontuários médicos hospitalares.
  - **Impressão em Lote (Batch Print):** Imprima as fichas de todos os pacientes do plantão ativo de uma só vez.
- 📥 **Exportação Excel no Navegador:**
  - Gera planilhas `.xlsx` formatadas idênticas ao documento físico, com o brasão institucional embutido, processado 100% no cliente via `exceljs` (sem servidores intermediários).
- 💾 **Auto-Save Inteligente no Cloud Firestore:**
  - Persistência instantânea com debounce. Os itens da prescrição são armazenados diretamente no documento, reduzindo o tráfego a **1 única gravação por salvamento**.
- 🔒 **Segurança & Privacidade:**
  - Autenticação simples com senha para acesso rápido em computadores compartilhados de hospital.
  - Regras de segurança no Firestore (`request.auth != null`), impedindo qualquer acesso não autorizado.
  - Zero dependência de terceiros: hospedado e gerenciado integralmente no Google Cloud.

---

## 🛠️ Stack Tecnológica & Arquitetura

O projeto adota uma arquitetura Serverless estática e desacoplada, garantindo **custo R$ 0,00 perpétuo** no Plano Spark do Firebase e tempo de carregamento de milissegundos via CDN global:

- **Frontend:** [Next.js](https://nextjs.org/) (App Router, Turbopack, Static Export com `output: 'export'`)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Design & UI:** [Tailwind CSS](https://tailwindcss.com/)
- **Banco de Dados:** [Cloud Firestore](https://firebase.google.com/docs/firestore) (Google Cloud Platform)
- **Autenticação:** [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Hospedagem & CDN:** [Firebase Hosting](https://firebase.google.com/docs/hosting) (com SSL/HTTPS gratuito e suporte a domínio personalizado)
- **Planilhas:** [ExcelJS](https://github.com/exceljs/exceljs) (processamento de arquivos e imagens em Blob no cliente)

---

## 💻 Como Executar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 20 ou superior)
- NPM
- Um projeto criado no [Firebase Console](https://console.firebase.google.com/) com Firestore e Authentication ativados.

### 1. Clonar o repositório
```bash
git clone https://github.com/md-augustolinhares/assistente-prescricao.git
cd assistente-prescricao
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```

Preencha o `.env.local` com as chaves do seu aplicativo web no Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="sua-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="seu-projeto"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="seu-projeto.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="seu-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="seu-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_FIREBASE_DEFAULT_EMAIL="seu-email@dominio.com"
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🚀 Como Compilar e Fazer Deploy no Firebase Hosting

O projeto é exportado como arquivos estáticos puros (`out/`):

### 1. Gerar o build estático
```bash
npm run build
```

### 2. Publicar no Firebase Hosting
Conecte o CLI ao seu usuário Google (caso ainda não esteja logado):
```bash
npx firebase-tools login
```

E publique a aplicação com um único comando:
```bash
npx firebase-tools deploy --only hosting
```

A aplicação estará online imediatamente em `https://<seu-projeto>.web.app` e no seu domínio próprio customizado.

---

## 📄 Licença
Este projeto é de código aberto para fins de portfólio e educacionais sob a licença [MIT](LICENSE).
