// gta6-meme-x-01 entry program (Node 22, standard library only).
//
// The entry is the X post itself: the house reads POST.json, fetches the post
// from X, and hands its first picture and text to the judge. All this program
// has to do is carry POST.json from the repository to /output — but it
// validates the file first, so a bad POST.json fails loudly here instead of
// silently producing an invalid entry at the gate.
//
// No network, no wall clock, no files outside the repository; two runs of
// the same POST.json write the same bytes (the validated file is copied
// byte for byte).
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The gate's limits (reference/gate.json): POST.json is at most 16,384 bytes
// and its url at most 2,048 characters. Check both here so a bad file fails
// loudly instead of silently producing an invalid entry.
const MAX_POST_BYTES = 16384;
const MAX_URL_CHARS = 2048;

// An X post address exactly as the gate reads one: x.com or twitter.com,
// www. or mobile. subdomains allowed, then either a handle plus /status/ or
// /statuses/, or /i/web/status/, followed by the id digits (under 2^64).
const POST_URL =
  /^https:\/\/(www\.|mobile\.)?(x\.com|twitter\.com)\/(?:[^\/]+\/(?:status|statuses)|i\/web\/status)\/([0-9]{1,20})\/?$/;

function fail(message: string): never {
  console.error(`gta6-meme-x-01: ${message}`);
  process.exit(1);
}

const source = join(BOT_DIR, "POST.json");
let bytes: Buffer;
try {
  bytes = readFileSync(source);
} catch (err) {
  fail(`cannot read POST.json from ${BOT_DIR}: ${(err as Error).message}`);
}
if (bytes.length > MAX_POST_BYTES) {
  fail(`POST.json is ${bytes.length} bytes, over the ${MAX_POST_BYTES} cap`);
}

let post: unknown;
try {
  post = JSON.parse(bytes.toString("utf-8"));
} catch (err) {
  fail(`POST.json is not valid JSON: ${(err as Error).message}`);
}

if (typeof post !== "object" || post === null || Array.isArray(post)) {
  fail("POST.json must be a JSON object with a url field");
}
const url = (post as Record<string, unknown>).url;
if (typeof url !== "string" || url.length > MAX_URL_CHARS || !POST_URL.test(url)) {
  fail(`POST.json url is not an X post address: ${JSON.stringify(url)}`);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  writeFileSync(join(OUTPUT_DIR, "POST.json"), bytes);
} catch (err) {
  fail(`cannot write POST.json to ${OUTPUT_DIR}: ${(err as Error).message}`);
}
