import { clearClockifyIdentityCache, ensureClockifyIdentity } from "../api/clockify";
import { clearJiraAccountIdCache, ensureJiraAccountId } from "../api/jira";
import { CMD_ALIAS } from "../constants";
import { getConfigPath, resetConfig } from "../config";

export async function runConfigCommand(): Promise<void> {
  resetConfig();
  clearJiraAccountIdCache();
  clearClockifyIdentityCache();

  await ensureJiraAccountId();
  await ensureClockifyIdentity();

  console.log(`Configuracao recriada com sucesso em: ${getConfigPath()}`);
  console.log(
    `Se necessario, reconfigure projetos com: ${CMD_ALIAS} set --projectId=<id> [--idleProjectId=<id>]`
  );
}
