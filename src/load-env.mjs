import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));

if (
  process.env.FORGERELAY_SKIP_ENV_FILE !== "true" &&
  existsSync(envPath)
) {
  process.loadEnvFile(envPath);
}
