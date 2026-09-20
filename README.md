# 🏥 Assistente de Prescrição Médica

Aplicação web moderna, responsiva e de alta performance desenvolvida para agilizar a elaboração de prescrições hospitalares em enfermarias clínicas durante plantões médicos.

Substitui fluxos manuais e lentos baseados em planilhas por uma interface intuitiva, com modelos clínicos pré-configurados (Geral, Psiquiatria, Broncodilatação), opções dinâmicas de aprazamento, catálogo de medicamentos especiais e impressão padronizada em folha A4 paisagem.

---

## ✨ Funcionalidades Principais

- **⚡ Alta Agilidade em Plantão:** Interface focada em produtividade com o mínimo de cliques necessário.
- **📑 Modelos Clínicos Pré-configurados:**
  - Prescrição Geral (enfermaria clínica padrão)
  - Prescrição Psiquiátrica (foco em medicações VO/IM e manejo comportamental)
  - Prescrição para Broncoespasmo (protocolos de broncodilatação e corticoterapia)
- **🎛️ Variantes Dinâmicas e Customização:**
  - Ajuste rápido de apresentação de hidratações (ex: SF 0,9% 500ml 12/12h vs 8/8h vs manutenção)
  - Variantes de dietas hospitalares (Geral, Branda, Pastosa, Zero, Hipossódica, etc.)
  - Seleção de aprazamento clínico por item: `ACM` (A critério médico), `Horário Fixo`, `SN` (Se necessário) ou `Condicional`
  - Protocolos clínicos integrados (insulinização conforme dextro, hipoglicemia e emergência hipertensiva)
- **📦 Catálogo de Medicamentos Especiais:** Cadastro e reutilização ágil de antibióticos, anticoagulantes e eletrólitos.
- **🖨️ Impressão Fiel A4 (Landscape):** Layout milimétrico pronto para assinatura e carimbo, com coluna de horários em branco para checagem da equipe de enfermagem.
- **🔒 Sessão Segura e Descentralizada:** Autenticação customizada via JWT com expiração de 36 horas, compatível com navegação em modo anônimo e computadores compartilhados de pronto-atendimento.
- **💾 Auto-Save:** Persistência automática em tempo real para proteção contra quedas de energia ou fechamentos acidentais de aba.

---

## 🛠️ Stack Tecnológica

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React Server Components & API Routes)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **ORM:** [Prisma ORM](https://www.prisma.io/)
- **Banco de Dados:** [Turso](https://turso.tech/) (libSQL / SQLite Serverless na Nuvem)
- **Autenticação:** [jose](https://github.com/panva/jose) (JWT seguro) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Deploy:** Vercel (Edge & Serverless Functions)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js (versão 20 ou superior)
- NPM ou Yarn
- Conta no [Turso](https://turso.tech) para banco de dados SQLite serverless

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
Copie o arquivo de exemplo e preencha com as suas configurações:
```bash
cp .env.example .env.local
```

Campos necessários:
- `TURSO_DATABASE_URL`: URL do seu banco Turso (`libsql://...`)
- `TURSO_AUTH_TOKEN`: Token de autenticação do Turso
- `AUTH_PASSWORD_HASH`: Hash bcrypt da senha de acesso ao plantão
- `AUTH_SECRET`: Chave secreta de pelo menos 32 caracteres para assinatura dos JWTs
- `INSTITUTION_NAME`: Nome da instituição de saúde para o cabeçalho impresso

> **Dica para gerar o hash da senha:**
> ```bash
> node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA_AQUI', 10))"
> ```

### 4. Sincronizar o Banco e Rodar Seeds
```bash
npx prisma generate
npx tsx prisma/seed.ts
```

### 5. Iniciar em desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador. A senha padrão configurada para ambiente local de testes é `plantao123`.

---

## 🏛️ Arquitetura e Portfólio

Este projeto foi desenhado sob princípios de isolamento de responsabilidades e código limpo (*Clean Architecture / Clean Code*):
- **Camada de Apresentação:** Componentes desacoplados com validações em tempo real.
- **Camada de Dados:** Schema normalizado cobrindo modelos (`Template`), itens (`TemplateItem`), plantões (`Shift`) e prescrições do paciente (`Prescription`).
- **Segurança & Conformidade:** Zero dados institucionais ou de pacientes versionados no código-fonte. Todo o cabeçalho e identidade visual são injetados dinamicamente via variáveis de ambiente.

---

## 📄 Licença
Este projeto é de uso pessoal e educacional sob licença MIT.
