import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export interface ClockifyProjectConfig {
  defaultProjectId?: string;
  defaultProjectName?: string;
  idleProjectId?: string;
  idleProjectName?: string;
}

export interface AppConfig {
  clockify: ClockifyProjectConfig;
}

export interface ProjectSelection {
  id?: string;
  name?: string;
}

const CONFIG_PATH = path.join(homedir(), ".clocksync.json");

function getEmptyConfig(): AppConfig {
  return {
    clockify: {},
  };
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

  const parsedConfig = parsed as { clockify?: unknown };
  const clockify = parsedConfig.clockify;

  if (clockify === undefined) {
    return { clockify: {} };
  }

  if (!clockify || typeof clockify !== "object") {
    throw new Error(`Nao foi possivel ler ${CONFIG_PATH}: campo "clockify" invalido.`);
  }

  const normalized = clockify as Record<string, unknown>;

  const result: ClockifyProjectConfig = {};
  const optionalFields: Array<keyof ClockifyProjectConfig> = [
    "defaultProjectId",
    "defaultProjectName",
    "idleProjectId",
    "idleProjectName",
  ];

  for (const field of optionalFields) {
    const value = normalized[field];
    if (value === undefined) {
      continue;
    }

    if (typeof value !== "string") {
      throw new Error(
        `Nao foi possivel ler ${CONFIG_PATH}: campo "${field}" deve ser string.`
      );
    }

    result[field] = value;
  }

  return { clockify: result };
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
