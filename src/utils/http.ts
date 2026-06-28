import axios, { type AxiosError, type AxiosInstance } from "axios";

export const RATE_LIMIT_DELAY_MS = 0;

export function delay(ms: number): Promise<void> {
  if (!Number.isFinite(ms) || ms < 0) {
    throw new Error("Delay invalido: informe um numero >= 0.");
  }

  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function delayBetweenCalls(): Promise<void> {
  return delay(RATE_LIMIT_DELAY_MS);
}

export function createTempoHttpClient(tempoApiToken: string): AxiosInstance {
  return axios.create({
    baseURL: "https://api.tempo.io/4",
    headers: {
      Authorization: `Bearer ${tempoApiToken}`,
      "Content-Type": "application/json"
    }
  });
}

export function createJiraHttpClient(options: {
  jiraDomain: string;
  jiraEmail: string;
  jiraApiToken: string;
}): AxiosInstance {
  const credentials = Buffer.from(`${options.jiraEmail}:${options.jiraApiToken}`).toString("base64");

  const client = axios.create({
    baseURL: `https://${options.jiraDomain}.atlassian.net/rest/api/2`,
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (isJiraAuthenticationFailure(error)) {
        return Promise.reject(
          new Error(
            [
              "Autenticacao no Jira falhou: o Jira retornou AUTHENTICATED_FAILED.",
              "Verifique JIRA_EMAIL e JIRA_API_TOKEN no .env.",
              "Use um API token da Atlassian Account para Basic Auth; cookie de sessao do Postman nao autentica o CLI."
            ].join("\n")
          )
        );
      }

      return Promise.reject(error);
    }
  );

  return client;
}

function isJiraAuthenticationFailure(error: unknown): error is AxiosError {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  const loginReason = error.response?.headers?.["x-seraph-loginreason"];

  return status === 401 || loginReason === "AUTHENTICATED_FAILED";
}

export function createClockifyHttpClient(clockifyApiKey: string): AxiosInstance {
  return axios.create({
    baseURL: "https://api.clockify.me/api/v1",
    headers: {
      "X-Api-Key": clockifyApiKey,
      "Content-Type": "application/json"
    }
  });
}
