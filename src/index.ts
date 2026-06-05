#!/usr/bin/env node

import { Command, CommanderError } from "commander";
import { runProjectsCommand } from "./commands/projects";
import { runSetCommand } from "./commands/set";
import { runSyncCommand } from "./commands/sync";
import { runValidateCommand } from "./commands/validate";

const program = new Command();

program
  .name("clocksync")
  .description("CLI para sincronizar apontamentos Jira Tempo e Clockify")
  .version("0.1.0");

function addPeriodOptions(command: Command): Command {
  return command
    .option("--current-week", "Usa o periodo da semana atual (segunda a domingo)")
    .option("--current-month", "Usa o periodo do mes atual")
    .option("--month <yyyy-mm>", "Usa o periodo do mes informado (YYYY-MM)");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return String(error);
}

function getExitCode(error: unknown): number {
  if (error instanceof CommanderError) {
    return error.exitCode;
  }

  if (typeof process.exitCode === "number" && process.exitCode > 0) {
    return process.exitCode;
  }

  return 1;
}

addPeriodOptions(
  program
    .command("sync")
    .description("Sincroniza worklogs do Jira Tempo para o Clockify")
).action(async (options: { currentWeek?: boolean; currentMonth?: boolean; month?: string }) => {
  await runSyncCommand(options);
});

addPeriodOptions(
  program
    .command("validate")
    .description("Valida divergencias de horas entre Jira Tempo e Clockify")
).action(async (options: { currentWeek?: boolean; currentMonth?: boolean; month?: string }) => {
  await runValidateCommand(options);
});

program
  .command("set")
  .description("Configura IDs de projetos no arquivo local ~/.clocksync.json")
  .option("--projectId <id>", "Define o projeto padrao para o comando sync")
  .option("--idleProjectId <id>", "Define o projeto de ociosidade (opcional)")
  .action(async (options: { projectId?: string; idleProjectId?: string }) => {
    await runSetCommand(options);
  });

program
  .command("projects")
  .description("Lista projetos disponiveis no workspace Clockify configurado")
  .action(async () => {
    await runProjectsCommand();
  });

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    process.exitCode = getExitCode(error);
    console.error(`\nErro: ${getErrorMessage(error)}`);
  }
}

void main();
