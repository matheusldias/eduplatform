# EduPlatform — Portal de Treinamento Pizza Bis

Plataforma interna de ensino a distância para as equipes das lojas de uma rede de pizzarias. Centraliza o treinamento operacional em videoaulas, acompanha o progresso de cada colaborador e emite certificado de conclusão.

---

## O problema

O treinamento das equipes de loja era presencial e repetido a cada contratação, com alta rotatividade e qualidade variável conforme quem treinava. Não havia registro de quem tinha aprendido o quê, nem como comparar a evolução entre unidades.

## A solução

Um portal onde o treinamento é publicado uma vez e consumido sob demanda, com progresso rastreado por colaborador e por loja. A gestão enxerga quem completou cada trilha; o colaborador recebe certificado ao concluir.

---

## Funcionalidades

**Aluno**
- Catálogo de cursos por categoria e nível
- Player de vídeo com retomada do ponto onde parou
- Trilhas com módulos e aulas em sequência, com pré-requisito entre aulas
- Materiais de apoio anexos à aula
- Progresso individual por curso e certificado ao concluir

**Gestão**
- Criação e edição de cursos, módulos e aulas
- Painel administrativo com visão geral de adesão
- Progresso por aluno e **progresso consolidado por loja**, para comparar unidades
- Gestão de alunos e vínculo com a loja
- Emissão de certificado com código de verificação

---

## Arquitetura

```
React + Vite (SPA)
        │
        ▼
Base44 SDK  ──────────────────────────┐
        │                             │
        ▼                             ▼
Entidades (dados)            Funções backend (Deno)
 Course · Module · Lesson      issueCertificate
 Enrollment · Progress         getStudents
 Certificate · Store · User
```

**Stack:** React 18, Vite, TailwindCSS, shadcn/ui, React Query, React Router, Recharts, plataforma Base44 (dados, autenticação e funções serverless em Deno/TypeScript).

### Modelo de dados

O progresso é registrado em dois níveis, o que permite relatório granular sem recalcular nada no cliente:

- `Progress` — por aula: segundos assistidos, última posição, percentual e conclusão
- `Enrollment` — por curso: status, percentual agregado, aulas concluídas e última aula assistida

### Emissão de certificado

A emissão roda no backend, nunca no cliente, e é idempotente:

1. Valida o usuário autenticado
2. Confere que a matrícula está efetivamente `completed`
3. Devolve o certificado existente se já houver um — não emite duplicado
4. Só então gera o código de verificação e registra o certificado

Isso impede que um aluno emita certificado chamando a API diretamente sem ter concluído o curso.

---

## Papel da IA no desenvolvimento

Projeto construído em pair programming com IA, de ponta a ponta — modelagem das entidades, telas, funções de backend e relatórios. A plataforma também expõe integrações de IA (`InvokeLLM`, extração de dados de arquivo, geração de imagem) usadas na produção de conteúdo dos cursos.

---

## Rodando localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

| Variável | O que é |
|---|---|
| `VITE_BASE44_APP_ID` | ID da aplicação na Base44 |
| `VITE_BASE44_BACKEND_URL` | URL do backend da aplicação |

Nenhum segredo de servidor é lido no front: a autenticação acontece via token de sessão da plataforma.

---

## Estrutura

```
src/
  pages/           catálogo, player, progresso, administração, certificados
  components/      componentes de UI e de domínio
  api/             cliente e integrações da plataforma
  hooks/ lib/      hooks e utilitários
base44/
  entities/        modelo de dados (8 entidades)
  functions/       issueCertificate, getStudents (Deno/TypeScript)
```

---

## Autor

Matheus Lemos Dias — [LinkedIn](https://www.linkedin.com/in/matheuslemosdias)
