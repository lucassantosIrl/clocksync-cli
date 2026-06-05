import axios, { type AxiosInstance } from "axios";

export const RATE_LIMIT_DELAY_MS = 200;

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

  return axios.create({
    baseURL: `https://${options.jiraDomain}.atlassian.net/rest/api/2`,
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    }
  });
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
