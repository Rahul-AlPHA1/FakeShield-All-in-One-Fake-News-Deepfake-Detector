import path from "path";
import { config } from "dotenv";

const rootDir = process.cwd();

config({ path: path.join(rootDir, ".env"), quiet: true });
config({ path: path.join(rootDir, ".env.local"), override: true, quiet: true });
