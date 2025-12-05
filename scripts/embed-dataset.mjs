import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const TEMPLATE_PATH = join(process.cwd(), "index.template.html");
const OUTPUT_PATH = join(process.cwd(), "index.html");
const ARCHIVE_PATH = join(process.cwd(), "build", "dictionary.lz");
const MARKER = "%%DICTIONARY_DATA%%";

const template = readFileSync(TEMPLATE_PATH, "utf8");
const archive = readFileSync(ARCHIVE_PATH, "utf8").trim();

if (!template.includes(MARKER)) {
  throw new Error(`템플릿에서 ${MARKER} 문자열을 찾을 수 없습니다.`);
}

if (!archive) {
  throw new Error("사전 압축 데이터가 비어 있습니다.");
}

const output = template.replace(MARKER, archive);
writeFileSync(OUTPUT_PATH, output, "utf8");

console.log(
  `Embedded dictionary payload (${archive.length.toLocaleString()} chars) into index.html`
);

