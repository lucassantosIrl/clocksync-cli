import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export interface ClockifyProjectConfig {
  workspaceId?: string;
  userId?: string;
  defaultProjectId?: string;
  defaultProjectName?: string;
  idleProjectId?: string;
  idleProjectName?: string;
}

export interface JiraConfig {
  accountId?: string;
}

export interface AppConfig {
  clockify: ClockifyProjectConfig;
  jira: JiraConfig;
}

export interface ProjectSelection {
  id?: string;
  name?: string;
}

const CONFIG_PATH = path.join(homedir(), ".clocksync.json");

function getEmptyConfig(): AppConfig {
  return {
    clockify: {},
    jira: {},
  };
}

function parseOptionalStringSection(
  section: unknown,
  sectionName: string,
  fields: readonly string[]
): Record<string, string> {
  if (section === undefined) {
    return {};
  }

  if (!section || typeof section !== "object") {
    throw new Error(
      `Nao foi possivel ler ${CONFIG_PATH}: campo "${sectionName}" invalido.`
    );
  }

  const normalized = section as Record<string, unknown>;
  const result: Record<string, string> = {};

  for (const field of fields) {
    const value = normalized[field];
    if (value === undefined) {
      continue;
    }

    if (typeof value !== "string") {
      throw new Error(
        `Nao foi possivel ler ${CONFIG_PATH}: campo "${sectionName}.${field}" deve ser string.`
      );
    }

    result[field] = value;
  }

  return result;
}

function parseConfig(rawValue: string): AppConfig {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch (error) {
    throw new Error(
      `Nao foi possivel ler ${CONFIG_PATH}: JSON invalido. ` +
        `Detalhe: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Nao foi possivel ler ${CONFIG_PATH}: formato de config invalido.`);
  }

  const parsedConfig = parsed as { clockify?: unknown; jira?: unknown };
  const clockifyFields = parseOptionalStringSection(
    parsedConfig.clockify,
    "clockify",
    [
      "workspaceId",
      "userId",
      "defaultProjectId",
      "defaultProjectName",
      "idleProjectId",
      "idleProjectName",
    ]
  );
  const jiraFields = parseOptionalStringSection(parsedConfig.jira, "jira", ["accountId"]);

  return {
    clockify: clockifyFields as ClockifyProjectConfig,
    jira: jiraFields as JiraConfig,
  };
}

function saveConfig(config: AppConfig): void {
  writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export function getConfig(): AppConfig {
  if (!existsSync(CONFIG_PATH)) {
    return getEmptyConfig();
  }

  const rawFile = readFileSync(CONFIG_PATH, "utf8").trim();
  if (rawFile === "") {
    return getEmptyConfig();
  }

  return parseConfig(rawFile);
}

export function setProject(field: "default" | "idle", id: string, name: string): void {
  const config = getConfig();

  if (!id.trim()) {
    throw new Error("ID do projeto nao pode ser vazio.");
  }

  if (!name.trim()) {
    throw new Error("Nome do projeto nao pode ser vazio.");
  }

  if (field === "default") {
    config.clockify.defaultProjectId = id.trim();
    config.clockify.defaultProjectName = name.trim();
  } else {
    config.clockify.idleProjectId = id.trim();
    config.clockify.idleProjectName = name.trim();
  }

  saveConfig(config);
}

export function getDefaultProject(): ProjectSelection {
  const config = getConfig();
  return {
    id: config.clockify.defaultProjectId,
    name: config.clockify.defaultProjectName,
  };
}

export function setDefaultProject(id: string, name: string): void {
  setProject("default", id, name);
}

export function getIdleProject(): ProjectSelection {
  const config = getConfig();
  return {
    id: config.clockify.idleProjectId,
    name: config.clockify.idleProjectName,
  };
}

export function setIdleProject(id: string, name: string): void {
  setProject("idle", id, name);
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function getClockifyIdentity(): { workspaceId?: string; userId?: string } {
  const config = getConfig();
  return {
    workspaceId: config.clockify.workspaceId,
    userId: config.clockify.userId,
  };
}

export function setClockifyIdentity(workspaceId: string, userId: string): void {
  const config = getConfig();

  if (!workspaceId.trim()) {
    throw new Error("ID do workspace Clockify nao pode ser vazio.");
  }

  if (!userId.trim()) {
    throw new Error("ID do usuario Clockify nao pode ser vazio.");
  }

  config.clockify.workspaceId = workspaceId.trim();
  config.clockify.userId = userId.trim();
  saveConfig(config);
}

export function getJiraAccountId(): { accountId?: string } {
  const config = getConfig();
  return {
    accountId: config.jira.accountId,
  };
}

export function setJiraAccountId(accountId: string): void {
  const config = getConfig();

  if (!accountId.trim()) {
    throw new Error("Account ID do Jira nao pode ser vazio.");
  }

  config.jira.accountId = accountId.trim();
  saveConfig(config);
}

export function resetConfig(): void {
  rmSync(CONFIG_PATH, { force: true });
}
