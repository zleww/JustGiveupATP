// Removes the previous build's hashed files so old versions do not pile up in the repo.
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
rmSync(fileURLToPath(new URL("../../landing-assets", import.meta.url)), { recursive: true, force: true });
