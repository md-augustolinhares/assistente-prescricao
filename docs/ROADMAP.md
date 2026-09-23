# Assistente de Prescrição - Log de Progresso e Roadmap (Uso Interno do Modelo)

## 🎯 Progresso Atual (Dia 1)
O desenvolvimento inicial focou em construir a base do sistema de plantões e prescrições com alta fidelidade ao modelo físico (papel/excel) utilizado na instituição.

### Entregas Concluídas:
1. **Modelagem de Dados Inicial (Turso/Prisma):** Estrutura de plantões, prescrições, itens e catálogo base.
2. **Sistema de Variações (Modularidade):** Scripts de migração e front-end adaptado para permitir troca ágil de apresentações e dosagens (ex: SF 0,9% 500ml -> 1000ml) sem perder a formatação de via e frequência.
3. **Mecanismo de Impressão de Alta Fidelidade (HTML/CSS):** 
   - Renderização Pixel-Perfect para papel A4 Paisagem, replicando o formato oficial.
   - Funcionalidade de **Impressão em Lote** de todos os pacientes do plantão.
   - Fallback de contingência (Botão "Copiar p/ Excel").
4. **Deploy Automático no Vercel** com banco de dados funcional.
5. **Reordenação Visual de Modelos (Setas ⬆️/⬇️):** Botões nativos na tela de edição com reordenação atômica via batch transaction no banco.
6. **Módulo de Protocolos Clínicos:** Ingestão do primeiro modelo por patologia (Tratamento de TVP com dose plena de Enoxaparina e Heparina Não Fracionada).
7. **Isolamento de Segurança:** Pasta `docs/protocolos/` protegida via `.gitignore` para manter rascunhos clínicos isolados localmente.

---

## 🚀 Roadmap e Ideias Futuras (Planejamento)

### 1. Kits/Protocolos por Patologia (Sugestão do Usuário)
- **O que é:** Criar "modelos" focados em síndromes ou doenças específicas. Em vez de prescrever apenas um "Modelo Geral", o médico adiciona o "Kit Hipocalemia", "Kit Hiponatremia" ou "Dor Abdominal Aguda".
- **Implementação:** Alimentar o agente (RAG ou Contexto) com guias práticos e manuais de prescrição (ex: *Yellowbook*, protocolos do hospital) para ajudar na curadoria clínica desses modelos.

### 2. Sugestões Adicionais de Evolução do Sistema (Ideias do Agente)
- **Reordenação Visual de Modelos (Drag-and-drop / Setas):** Adicionar botões de subir e descer na tela de Edição de Modelos para dar 100% de autonomia na reordenação da lista sem necessidade de mexer no banco de dados.
- **Autenticação e Multi-usuário:** Se outros médicos forem utilizar a ferramenta, criar sistema de login onde cada profissional possa ter seu próprio repositório de "Prescrições Favoritas" e seus plantões isolados.
- **Suporte Offline (PWA):** Hospitais frequentemente sofrem com queda de Wi-Fi. Transformar o site num *Progressive Web App* para permitir prescrição e cache de tela offline.
- **Calculadora Pediátrica Integrada:** Um módulo opcional para pacientes pediátricos onde, ao inserir o peso da criança, o sistema sugira automaticamente a conversão de *mg/kg* para *ml* na descrição do item.
- **Alertas Clínicos Básicos (Fase 2):** Ao cruzar medicamentos de uma mesma prescrição, alertar o médico sobre interações medicamentosas graves ou superposição de drogas (ex: prescrever dois AINEs juntos).
- **Exportação de Relatórios de Plantão:** Um painel que gere um pequeno sumário do plantão (quantos pacientes atendidos, CID prevalente, etc.).

---
*Nota para o Agente em sessões futuras: Leia este documento antes de iniciar novos desenvolvimentos ou sugerir features para entender o contexto do que já foi consolidado e o que está no radar.*
