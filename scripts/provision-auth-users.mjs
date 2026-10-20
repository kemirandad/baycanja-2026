import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envText = await readFile(path.join(root, '.env.local'), 'utf8');
const apiKey = envText.match(/^NEXT_PUBLIC_FIREBASE_API_KEY=(.+)$/m)?.[1]?.trim();
if (!apiKey) throw new Error('Falta NEXT_PUBLIC_FIREBASE_API_KEY en .env.local.');

const accounts = [
  { username: 'admin', role: 'ADMIN' },
  { username: 'juez.canto1', role: 'CANTO' },
  { username: 'juez.canto2', role: 'CANTO' },
  { username: 'juez.canto3', role: 'CANTO' },
  { username: 'juez.baile1', role: 'BAILE' },
  { username: 'juez.baile2', role: 'BAILE' },
  { username: 'juez.baile3', role: 'BAILE' },
];

const generated = [];
const privateDir = path.join(root, 'private');
const outputPath = path.join(privateDir, 'baycanja-2026-credentials.json');
async function saveGenerated() {
  await mkdir(privateDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(generated, null, 2)}\n`);
}

for (const account of accounts) {
  const email = `${account.username}@baycanja-2026.test`;
  const password = randomBytes(24).toString('base64url');
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const result = await response.json();
  if (!response.ok) {
    await saveGenerated();
    const reason = result?.error?.message || `HTTP ${response.status}`;
    throw new Error(`No se pudo crear ${account.username}: ${reason}. Cuentas creadas hasta ahora guardadas en private/baycanja-2026-credentials.json.`);
  }
  generated.push({ ...account, email, password, uid: result.localId });
  await saveGenerated();
}

console.log(`Cuentas creadas. Credenciales guardadas en ${path.relative(root, outputPath)} (excluido de Git).`);
console.log('UIDs para crear documentos userRoles en Firestore:');
for (const { username, uid, role } of generated) console.log(`${username}\t${role}\t${uid}`);
