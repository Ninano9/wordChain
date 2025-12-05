import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";
import lzString from "lz-string";

const SOURCE_DIR = join(process.cwd(), "temp_dict");
const OUTPUT_DIR = join(process.cwd(), "build");
const MIN_LENGTH = 2;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  cdataPropName: "cdata",
  textNodeName: "text",
  isArray: (name, jpath) => {
    const arrayNodes = [
      "channel.item",
      "item.word_info",
      "word_info.pos_info",
      "pos_info.comm_pattern_info",
      "comm_pattern_info.sense_info",
      "sense_info.definition",
    ];
    return arrayNodes.some((node) => jpath.endsWith(node));
  },
});

const report = (msg) => process.stdout.write(`${msg}\n`);

const extractText = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = extractText(entry);
      if (found) return found;
    }
    return "";
  }
  if (typeof value === "object") {
    return (
      extractText(value.cdata) ||
      extractText(value.text) ||
      extractText(value["#text"]) ||
      extractText(Object.values(value))
    );
  }
  return "";
};

const normalizeWord = (raw = "") => {
  const noVariants = raw.replace(/\d+$/g, "");
  const collapsed = noVariants.replace(/[-·\s'’"(){}\[\]]+/g, "");
  const letters = collapsed.match(/[가-힣]/g);
  if (!letters) return "";
  const word = letters.join("");
  return word.length >= MIN_LENGTH ? word : "";
};

const extractDefinition = (item) => {
  const queue = [item];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;

    if (current.definition) {
      const text = extractText(current.definition);
      if (text) return text.trim().slice(0, 160);
    }

    for (const value of Object.values(current)) {
      if (typeof value === "object") queue.push(value);
    }
  }
  return "";
};

const files = readdirSync(SOURCE_DIR)
  .filter((file) => file.endsWith(".xml"))
  .sort((a, b) => Number(a.replace(".xml", "")) - Number(b.replace(".xml", "")));

if (!files.length) {
  throw new Error(`XML 파일을 찾을 수 없습니다: ${SOURCE_DIR}`);
}

const entries = new Map();

files.forEach((file, index) => {
  const xml = readFileSync(join(SOURCE_DIR, file), "utf8");
  const parsed = parser.parse(xml);
  const items = parsed?.channel?.item;
  if (!items) return;
  const list = Array.isArray(items) ? items : [items];
  list.forEach((item) => {
    const wordValue =
      extractText(item?.word_info?.word) ||
      extractText(item?.word) ||
      extractText(item);
    const word = normalizeWord(wordValue);
    if (!word || entries.has(word)) return;
    const definition = extractDefinition(item);
    entries.set(word, definition);
  });
  if ((index + 1) % 5 === 0) {
    report(`processed ${index + 1}/${files.length} files`);
  }
});

const dataset = Array.from(entries.entries())
  .sort(([a], [b]) => (a > b ? 1 : -1))
  .map(([w, d]) => (d ? { w, d } : { w }));

report(`total words: ${dataset.length}`);

mkdirSync(OUTPUT_DIR, { recursive: true });

const payload = {
  generatedAt: new Date().toISOString(),
  total: dataset.length,
  words: dataset,
};

const jsonPath = join(OUTPUT_DIR, "dictionary.json");
writeFileSync(jsonPath, JSON.stringify(payload), "utf8");
report(`wrote ${jsonPath}`);

const compressed = lzString.compressToBase64(JSON.stringify(payload));
const archivePath = join(OUTPUT_DIR, "dictionary.lz");
writeFileSync(archivePath, compressed, "utf8");
report(`wrote ${archivePath} (${compressed.length} chars)`);

report("done.");

