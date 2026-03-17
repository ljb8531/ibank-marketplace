#!/usr/bin/env node
/**
 * Plugin Builder: 전체 플러그인 구조 유효성 검증
 * - 디렉토리 구조, 네이밍 규칙, 프론트매터 완전성 확인
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const CURSOR = '.cursor';

const errors = [];
const warnings = [];

function checkManifest() {
  const path = join(root, '.cursor-plugin', 'plugin.json');
  if (!existsSync(path)) {
    errors.push('매니페스트 없음: .cursor-plugin/plugin.json');
    return;
  }
  try {
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    const required = ['name', 'description', 'version', 'author'];
    for (const key of required) {
      if (!manifest[key]) errors.push(`plugin.json 필수 필드 누락: ${key}`);
    }
    if (manifest.author && typeof manifest.author === 'object' && !manifest.author.name) {
      errors.push('plugin.json author 객체에 name 필요');
    }
  } catch (e) {
    errors.push(`plugin.json 파싱 오류: ${e.message}`);
  }
}

function frontmatterHasNameDesc(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return { name: false, description: false };
  const fm = match[1];
  return {
    name: /^name:\s*.+$/m.test(fm),
    description: /^description:\s*.+$/m.test(fm),
  };
}

function walkMd(dir, rel = '') {
  const entries = readdirSync(join(root, dir), { withFileTypes: true });
  for (const e of entries) {
    const full = join(root, dir, e.name);
    const relPath = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walkMd(join(dir, e.name), relPath);
    else if (e.name.endsWith('.md')) {
      const content = readFileSync(full, 'utf8');
      const { name, description } = frontmatterHasNameDesc(content);
      const reportPath = `${dir}/${e.name}`;
      if (!name) errors.push(`${reportPath}: YAML frontmatter에 name 없음`);
      if (!description) errors.push(`${reportPath}: YAML frontmatter에 description 없음`);
    }
  }
}

function checkKebab(name) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}

function checkSkillFolderName() {
  const skillsDir = join(root, CURSOR, 'skills');
  if (!existsSync(skillsDir)) return;
  const dirs = readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const d of dirs) {
    if (!checkKebab(d.name)) warnings.push(`${CURSOR}/skills/${d.name}: 폴더명은 kebab-case여야 함`);
    const skillPath = join(skillsDir, d.name, 'SKILL.md');
    if (!existsSync(skillPath)) errors.push(`${CURSOR}/skills/${d.name}/SKILL.md 없음`);
    else {
      const content = readFileSync(skillPath, 'utf8');
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      if (nameMatch && nameMatch[1].trim() !== d.name) {
        errors.push(`${CURSOR}/skills/${d.name}: SKILL.md의 name("${nameMatch[1].trim()}")이 폴더명과 불일치`);
      }
    }
  }
}

checkManifest();
walkMd(`${CURSOR}/agents`);
walkMd(`${CURSOR}/skills`);
walkMd(`${CURSOR}/commands`);
walkMd(`${CURSOR}/rules`);
checkSkillFolderName();

if (errors.length) {
  console.error('검증 실패:\n' + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
if (warnings.length) {
  console.warn('경고:\n' + warnings.map((w) => '  - ' + w).join('\n'));
}
console.log('구조 검증 통과.');
