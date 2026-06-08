import dotenv from "dotenv";

export interface EnvConfig {
  tempoApiToken: string;
  jiraDomain: string;
  jiraEmail: string;
  jiraApiToken: string;
  clockifyApiKey: string;
}

const REQUIRED_ENV_VARS = [
  "TEMPO_API_TOKEN",
  "JIRA_DOMAIN",
  "JIRA_EMAIL",
  "JIRA_API_TOKEN",
  "CLOCKIFY_API_KEY",
] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

function readRequiredVar(name: RequiredEnvVar): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }

  return value.trim();
}

export function loadEnvConfig(): EnvConfig {
  dotenv.config();

  const missingVars = REQUIRED_ENV_VARS.filter((name) => {
    const value = process.env[name];
    return !value || value.trim() === "";
  });

  if (missingVars.length > 0) {
    const varList = missingVars.join(", ");
    throw new Error(
      `Variaveis de ambiente obrigatorias ausentes: ${varList}. ` +
        "Preencha seu arquivo .env antes de executar o CLI."
    );
  }

  return {
    tempoApiToken: readRequiredVar("TEMPO_API_TOKEN"),
    jiraDomain: readRequiredVar("JIRA_DOMAIN"),
    jiraEmail: readRequiredVar("JIRA_EMAIL"),
    jiraApiToken: readRequiredVar("JIRA_API_TOKEN"),
    clockifyApiKey: readRequiredVar("CLOCKIFY_API_KEY"),
  };
}

export const env = loadEnvConfig();
