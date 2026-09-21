# 🏥 Assistente de Prescrição Médica

> **Status:** MVP Funcional | **Tipo:** Ferramenta Clínica (HealthTech) / Case de Portfólio

Uma aplicação web responsiva desenvolvida para agilizar a elaboração de prescrições hospitalares em enfermarias clínicas e prontos-socorros.

Este projeto nasce de uma **dor clínica real**: substituir fluxos manuais baseados em copiar e colar células no Excel ou editores de texto genéricos por um sistema estruturado, desenhado para a ergonomia do médico plantonista. 

---

## 🎯 O Problema & A Solução de Produto

Em plantões de emergência e enfermarias, a transcrição e formatação da prescrição médica diária consome tempo significativo. O uso de planilhas gera atrito mecânico e formatações inconsistentes na impressão.

**A Solução:** Um sistema focado na **redução de carga cognitiva e clique-mínimo**. O aplicativo traz modelos clínicos pré-configurados, gestão de variações (ex: alternar rapidamente a dosagem de uma hidratação sem reescrever a via e frequência) e uma arquitetura *White-Label*, permitindo ser implantado em qualquer instituição.

> **Autonomia Clínica Preservada:** O sistema atua exclusivamente na formatação e estruturação ágil do documento. **Nenhum modelo de IA sugere doses, diagnósticos ou condutas.** Toda a decisão clínica parte do médico, que assina e carimba o documento final.

---

## 🚀 Funcionalidades Principais (Highlights)

- ⚡ **Velocidade e Ergonomia:** Interface focada em produtividade. Criação de prescrições estruturadas com o mínimo de cliques.
- 📋 **Modelos Clínicos (Templates):**
  - **Prescrição Geral:** Enfermaria clínica padrão.
  - **Prescrição Psiquiátrica:** Foco em medicações VO/IM e manejo comportamental.
  - **Prescrição para Broncoespasmo:** Protocolos de broncodilatação e corticoterapia.
- 🔄 **Modularidade e Variações Dinâmicas:**
  - Ajuste rápido de apresentação (ex: `SF 0,9% 500ml` vs `100ml`) mantendo o aprazamento intacto.
  - Seleção de aprazamento clínico nativo: `ACM` (A critério médico), `Horário Fixo`, `SN` (Se necessário) ou `Condicional`.
- 🖨️ **Motor de Impressão Pixel-Perfect (HTML/CSS):** 
  - Layout nativo para papel **A4 Paisagem**, seguindo os padrões oficias de prontuários em papel.
  - **Impressão em Lote (Batch Print):** Imprima as folhas de todos os pacientes do plantão ativo com um único clique.
- 🔒 **Segurança, Privacidade & White-Label:**
  - **Zero dados sensíveis:** Nenhum dado institucional ou de paciente real transita pelos repositórios de código. O projeto é 100% genérico. Logomarcas e nomes de hospitais são injetados exclusivamente via **Variáveis de Ambiente** no deploy em produção.
  - **Ausência de dados reais de pacientes:** O sistema é uma ferramenta de rascunho de plantão. Não há integração de dados reais do paciente ou prontuário eletrônico. Nomes digitados não persistem em logs ou histórico do repositório.
  - Autenticação própria via JWT (Expiração de 36h) ideal para computadores compartilhados.

---

## 🛠️ Stack Tecnológica & Arquitetura

O projeto foi construído seguindo princípios de *Clean Code* e separação de responsabilidades (Front-end vs API vs Banco de Dados):

- **Core:** [Next.js](https://nextjs.org/) (App Router, React Server Components & API Routes)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Design & UI:** [Tailwind CSS](https://tailwindcss.com/)
- **ORM & Banco de Dados:** [Prisma ORM](https://www.prisma.io/) + [Turso](https://turso.tech/) (libSQL / SQLite Serverless na Edge)
- **Segurança:** [jose](https://github.com/panva/jose) (JWT seguro) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js) para hash de senhas
- **Engenharia com IA:** O desenvolvimento desta base arquitetural utilizou *Agentic Workflows* avançados, coordenando IAs especialistas (Frontend, Backend, Database e Code Reviewer) para escalar a produtividade do código.

---

## 💻 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js (versão 20 ou superior)
- NPM ou Yarn
- Conta no [Turso](https://turso.tech) (Plano Gratuito) para o banco de dados serverless.

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

Abra o arquivo `.env.local` e preencha os campos obrigatórios:
- `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`: Suas credenciais do Turso.
- `AUTH_PASSWORD_HASH`: Hash bcrypt da sua senha de acesso. *(Dica de geração: `node -e "console.log(require('bcryptjs').hashSync('SuaSenha', 10))"`)*
- `AUTH_SECRET`: Chave secreta longa e aleatória para assinar os tokens JWT.
- **Variáveis White-Label:** `INSTITUTION_NAME`, `INSTITUTION_SUBTITLE`, `INSTITUTION_LOGO_PATH` (Pode apontar para uma URL pública da sua logo).

### 4. Inicializar o Banco e Executar Seeds (Modelos Base)
Execute os scripts para popular o banco de dados com os templates clínicos iniciais:
```bash
npx prisma generate
npx tsx prisma/seed.ts
```

### 5. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador. 

---

## 📸 Screenshots (Demonstração)
*(Sugestão: Adicione aqui capturas de tela mostrando a interface de plantão, o painel de edição de prescrição e um PDF/Print do modelo final gerado)*

---

## 📄 Licença
Este projeto é de código aberto para fins de portfólio e educacionais sob a licença [MIT](LICENSE).
