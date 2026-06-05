# clocksync CLI

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

Para invocar `clocksync` diretamente de qualquer terminal do macOS:

```bash
npm run build
npm install -g .
```

Depois valide:

```bash
clocksync --help
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
TEMPO_ACCOUNT_ID=
JIRA_DOMAIN=
JIRA_EMAIL=
JIRA_API_TOKEN=
CLOCKIFY_API_KEY=
CLOCKIFY_WORKSPACE_ID=
CLOCKIFY_USER_ID=
```

Se faltar qualquer variavel obrigatoria, o CLI encerra com erro explicando quais campos faltam.

### 2) Configuracao local (`~/.clocksync.json`)

O comando `set` grava os projetos selecionados em `~/.clocksync.json`:

```json
{
  "clockify": {
    "defaultProjectId": "id-do-projeto",
    "defaultProjectName": "Nome do projeto",
    "idleProjectId": "id-opcional",
    "idleProjectName": "Nome opcional"
  }
}
```

`defaultProjectId` e necessario para executar `sync`.

## Comandos

### `clocksync sync [--current-week] [--current-month] [--month=YYYY-MM]`

Sincroniza worklogs do Jira Tempo para o Clockify.

- Sem flags: sincroniza somente o dia atual.
- `--current-week`: sincroniza da segunda ao domingo da semana atual.
- `--current-month`: sincroniza do primeiro ao ultimo dia do mes atual.
- `--month=YYYY-MM`: sincroniza o mes informado.
- As flags de periodo sao mutuamente exclusivas.
- Exige projeto padrao configurado (`clocksync set --projectId=<id>`).

Exemplos:

```bash
clocksync sync
clocksync sync --current-week
clocksync sync --current-month
clocksync sync --month=2026-06
```

### `clocksync validate [--current-week] [--current-month] [--month=YYYY-MM]`

Compara total de segundos por dia entre Tempo e Clockify no periodo.

- Sem flags: valida somente o dia atual.
- `--current-week`: valida da segunda ao domingo da semana atual.
- `--current-month`: valida o mes atual.
- `--month=YYYY-MM`: valida o mes informado.
- `exit code 0` quando tudo bate.
- `exit code 1` quando existem divergencias.

Exemplos:

```bash
clocksync validate
clocksync validate --current-week
clocksync validate --current-month
clocksync validate --month=2026-06
```

### `clocksync set [--projectId=<id>] [--idleProjectId=<id>]`

Valida IDs contra a lista de projetos do Clockify e persiste em `~/.clocksync.json`.

- `--projectId=<id>` define projeto padrao usado no `sync`.
- `--idleProjectId=<id>` define projeto de ociosidade (persistido para uso futuro).
- E obrigatorio informar ao menos uma dessas flags.

Exemplos:

```bash
clocksync set --projectId=66cbf0f97f6d123456789abc
clocksync set --idleProjectId=66cbf0f97f6d123456789def
clocksync set --projectId=66cbf0f97f6d123456789abc --idleProjectId=66cbf0f97f6d123456789def
```

### `clocksync projects`

Lista projetos do workspace Clockify configurado (ID, nome e cor) e mostra exemplos para usar `set`.

Exemplo:

```bash
clocksync projects
```

## Tratamento de erros

- Erros de comandos sao exibidos com mensagem amigavel no terminal.
- O processo finaliza com `exit code` apropriado (`0` em sucesso, `1` em falha de execucao ou validacao com divergencia).

