import { constants } from 'node:fs';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..');
const environmentsDir = path.join(projectRoot, 'src', 'environments');
const templatePath = path.join(environmentsDir, 'environment.example.ts');

const targets = [
  { filename: 'environment.ts', production: true },
  { filename: 'environment.development.ts', production: false },
];

function normalizeTemplate(template, production) {
  return template.replace(/production:\s*(true|false)/, `production: ${String(production)}`);
}

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureEnvironments() {
  await mkdir(environmentsDir, { recursive: true });

  const templateExists = await exists(templatePath);
  if (!templateExists) {
    throw new Error(`Missing template file: ${templatePath}`);
  }

  const template = await readFile(templatePath, 'utf-8');

  for (const target of targets) {
    const targetPath = path.join(environmentsDir, target.filename);
    if (await exists(targetPath)) {
      continue;
    }

    const content = normalizeTemplate(template, target.production);
    await writeFile(targetPath, content, 'utf-8');
    console.log(`Created ${path.relative(projectRoot, targetPath)}`);
  }
}

ensureEnvironments().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
