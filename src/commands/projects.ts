import { listProjects } from "../api/clockify";
import { CMD_ALIAS } from "../constants";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return String(error);
}

export async function runProjectsCommand(): Promise<void> {
  try {
    const projects = await listProjects();

    if (projects.length === 0) {
      console.log("Nenhum projeto encontrado no workspace configurado do Clockify.");
      console.log(`Use "${CMD_ALIAS} set --projectId=<id>" apos criar um projeto no Clockify.`);
      return;
    }

    console.log("Projetos do Clockify (ID | Nome | Cor):");
    for (const project of projects) {
      console.log(`${project.id} | ${project.name} | ${project.color ?? "-"}`);
    }

    console.log("");
    console.log("Para configurar o projeto padrao:");
    console.log(`  ${CMD_ALIAS} set --projectId=<id>`);
    console.log("Para configurar o projeto de ociosidade:");
    console.log(`  ${CMD_ALIAS} set --idleProjectId=<id>`);
  } catch (error) {
    throw new Error(`Falha ao listar projetos do Clockify: ${getErrorMessage(error)}`);
  }
}
