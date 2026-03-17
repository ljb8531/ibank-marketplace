#!/usr/bin/env node
/**
 * Plugin Builder: Skill/Agent md 파일 글자수 검증 (500자 미만 권장)
 * 사용: node scripts/count-chars.mjs [파일경로]
 * 훅에서: node scripts/count-chars.mjs ${file}
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const LIMIT = 500;

const fileArg = process.argv[2];
if (!fileArg) {
  console.error('사용법: node count-chars.mjs <파일경로>');
  process.exit(2);
}

const filePath = fileArg.startsWith(root) ? fileArg : join(process.cwd(), fileArg);
if (!existsSync(filePath)) {
  console.error(`파일 없음: ${filePath}`);
  process.exit(1);
}

const content = readFileSync(filePath, 'utf8');
const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
const count = withoutFrontmatter.replace(/\s+/g, ' ').trim().length;

if (count > LIMIT) {
  console.warn(`[500자 규칙] ${filePath}: 본문 ${count}자 (제한 ${LIMIT}자 초과). 세분화를 권장합니다.`);
  process.exit(1);
}
console.log(`OK: ${filePath} (본문 ${count}자)`);
