# clocki CLI

CLI em TypeScript para sincronizar e validar apontamentos entre Jira Tempo e Clockify.

## Requisitos

- Node.js 18+
- npm

## Instalacao

```bash
npm install
npm run build
```

### Instalar globalmente no sistema

Para invocar `clocki` diretamente de qualquer terminal:

```bash
npm run build
npm install -g .
```

Depois valide:

```bash
clocki --help
```

Observacao:
- Se o comando nao for encontrado, verifique se o binario global do npm esta no seu `PATH`.
- Como alternativa de desenvolvimento, voce pode executar com `npm run dev -- <comando>` ou `node dist/index.js <comando>`.

Para executar sem publicar o pacote:

```bash
node dist/index.js --help
```

Durante desenvolvimento:

```bash
npm run dev -- --help
```

## Configuracao

### 1) Variaveis de ambiente (`.env`)

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:

```dotenv
TEMPO_API_TOKEN=
JIRA_DOMAIN=
JIRA_EMAIL=
JIRA_API_TOKEN=
CLOCKIFY_API_KEY=
```

Se faltar qualquer variavel obrigatoria, o CLI encerra com erro explicando quais campos faltam.

Na primeira chamada a API do Tempo, o CLI obtem automaticamente o `accountId` via `GET /rest/api/2/myself` do Jira e persiste em `~/.clocksync.json`. Na primeira chamada a API do Clockify, obtem `workspaceId` e `userId` via `GET /api/v1/user`. Nao e necessario configura-los manualmente.

### 2) Configuracao local (`~/.clocksync.json`)

O comando `set` grava os projetos selecionados em `~/.clocksync.json`:

```json
{
  "jira": {
    "accountId": "557058:abc123"
  },
  "clockify": {
    "workspaceId": "id-do-workspace",
    "userId": "id-do-usuario",
    "defaultProjectId": "id-do-projeto",
    "defaultProjectName": "Nome do projeto",
    "idleProjectId": "id-opcional",
    "idleProjectName": "Nome opcional"
  }
}
```

`jira.accountId`, `clockify.workspaceId` e `clockify.userId` sao preenchidos automaticamente na primeira execucao de comandos que usam as APIs correspondentes. Os campos de projeto sao definidos via `clocki set`.

`defaultProjectId` e necessario para executar `sync`.

## Comandos

### `clocki sync [--current-week] [--current-month] [--month=YYYY-MM]`

Sincroniza worklogs do Jira Tempo para o Clockify.

- Sem flags: sincroniza somente o dia atual.
- `--current-week`: sincroniza da segunda ao domingo da semana atual.
- `--current-month`: sincroniza do primeiro ao ultimo dia do mes atual.
- `--month=YYYY-MM`: sincroniza o mes informado.
- As flags de periodo sao mutuamente exclusivas.
- Exige projeto padrao configurado (`clocki set --projectId=<id>`).

Exemplos:

```bash
clocki sync
clocki sync --current-week
clocki sync --current-month
clocki sync --month=2026-06
```

### `clocki validate [--current-week] [--current-month] [--month=YYYY-MM]`

Compara total de segundos por dia entre Tempo e Clockify no periodo.

- Sem flags: valida somente o dia atual.
- `--current-week`: valida da segunda ao domingo da semana atual.
- `--current-month`: valida o mes atual.
- `--month=YYYY-MM`: valida o mes informado.
- `exit code 0` quando tudo bate.
- `exit code 1` quando existem divergencias.

Exemplos:

```bash
clocki validate
clocki validate --current-week
clocki validate --current-month
clocki validate --month=2026-06
```

### `clocki set [--projectId=<id>] [--idleProjectId=<id>]`

Valida IDs contra a lista de projetos do Clockify e persiste em `~/.clocksync.json`.

- `--projectId=<id>` define projeto padrao usado no `sync`.
- `--idleProjectId=<id>` define projeto de ociosidade (persistido para uso futuro).
- E obrigatorio informar ao menos uma dessas flags.

Exemplos:

```bash
clocki set --projectId=66cbf0f97f6d123456789abc
clocki set --idleProjectId=66cbf0f97f6d123456789def
clocki set --projectId=66cbf0f97f6d123456789abc --idleProjectId=66cbf0f97f6d123456789def
```

### `clocki projects`

Lista projetos do workspace Clockify configurado (ID, nome e cor) e mostra exemplos para usar `set`.

Exemplo:

```bash
clocki projects
```

### `clocki config`

Remove o arquivo `~/.clocksync.json` atual e o recria automaticamente, buscando:
- `jira.accountId` via Jira `/myself`
- `clockify.workspaceId` e `clockify.userId` via Clockify `/user`

Observacao:
- Como o arquivo e recriado do zero, `defaultProjectId` e `idleProjectId` podem precisar ser configurados novamente com `clocki set`.

## Tratamento de erros

- Erros de comandos sao exibidos com mensagem amigavel no terminal.
- O processo finaliza com `exit code` apropriado (`0` em sucesso, `1` em falha de execucao ou validacao com divergencia).

