/**
 * Génère un cookie de session signé pour le développement local, sans passer par l'écran de connexion.
 * Le jeton n'est pas un vrai jeton Sanctum : utile tant que le back n'exige pas d'authentification (B1).
 *
 *   npm run dev:session                     → admin (compte `admin`, sans licence : seul admin possible, D1)
 *   npm run dev:session lucas BC113512      → joueur
 *   npm run dev:session jean.dupont         → compte sans joueur (joueur sans licence)
 *
 * Forme longue, en appelant le script directement :
 *   npx tsx scripts/dev-session.ts --username lucas --licence BC113512
 *
 * Les arguments positionnels servent sous PowerShell : le shim npm y avale le `--`,
 * et npm prend alors `--username` pour l'une de ses propres options.
 *
 * Coller ensuite la valeur dans un cookie `bball_session` sur http://localhost:3000.
 */
import { parseArgs } from "node:util";
import { SESSION_COOKIE_NAME } from "../lib/sessionCookie";
import { signSessionToken } from "../lib/sessionToken";
import { resolveUserRole } from "../models/resolveUserRole";

process.loadEnvFile(".env.local");

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    username: { type: "string" },
    licence: { type: "string" },
    token: { type: "string", default: "dev-token" },
  },
});

async function main() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET manquant ou trop court dans .env.local");

  const username = values.username ?? positionals[0] ?? "admin";
  const licence = values.licence ?? positionals[1] ?? null;

  const value = await signSessionToken({ username, licence, token: values.token }, secret);

  const role = resolveUserRole({ username, licence });
  const label = role === "admin" ? "admin" : licence ? `joueur (licence ${licence})` : "compte sans joueur";
  process.stdout.write(`Session ${label} pour « ${username} »\n\n`);

  process.stdout.write(`${SESSION_COOKIE_NAME}=${value}\n\n`);
  process.stdout.write(`Dans la console du navigateur (http://localhost:3000) :\n`);
  process.stdout.write(`document.cookie = "${SESSION_COOKIE_NAME}=${value}; path=/";\n`);
}

void main();
