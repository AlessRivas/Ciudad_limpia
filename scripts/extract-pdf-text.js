// Minimal PDF text extractor (heuristic).
// - Finds FlateDecode streams and inflates them via Node's zlib.
// - Extracts readable text snippets from inflated content.
// This is not a full PDF parser, but works well for Google Docs PDFs.
//
// Usage:
//   node scripts/extract-pdf-text.js docs/fuentes/manual-modelo-2.0.pdf docs/fuentes/manual-modelo-2.0.txt
//
// Notes:
// - The output is "best effort" and may contain noise; it's intended for drafting docs.
// - Do not rely on it for legal-grade extraction.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function findAll(buf, needle) {
  const out = [];
  let i = 0;
  while (i < buf.length) {
    const idx = buf.indexOf(needle, i);
    if (idx === -1) break;
    out.push(idx);
    i = idx + Math.max(1, needle.length);
  }
  return out;
}

function sliceStreamData(buf, streamIdx) {
  // PDF stream is: "stream" EOL data "endstream"
  // Move to first byte after EOL.
  let i = streamIdx + "stream".length;
  // Consume \r\n or \n or \r
  if (buf[i] === 0x0d && buf[i + 1] === 0x0a) i += 2;
  else if (buf[i] === 0x0a) i += 1;
  else if (buf[i] === 0x0d) i += 1;

  const endIdx = buf.indexOf(Buffer.from("endstream"), i);
  if (endIdx === -1) return null;
  // Some PDFs end stream data with a newline before endstream.
  let end = endIdx;
  while (end > i && (buf[end - 1] === 0x0a || buf[end - 1] === 0x0d)) end -= 1;
  return buf.slice(i, end);
}

function tryInflate(data) {
  try {
    return zlib.inflateSync(data);
  } catch {
    return null;
  }
}

function decodeHexUtf16Title(hexBody) {
  // PDF outlines sometimes store titles as <FEFF....> (UTF-16BE).
  // hexBody is "FEFF0041..."
  if (!hexBody || hexBody.length < 4) return null;
  if (!hexBody.toUpperCase().startsWith("FEFF")) return null;
  const bytes = [];
  for (let i = 0; i + 1 < hexBody.length; i += 2) {
    const pair = hexBody.slice(i, i + 2);
    if (!/^[0-9A-Fa-f]{2}$/.test(pair)) return null;
    bytes.push(parseInt(pair, 16));
  }
  // Strip FE FF BOM from UTF-16BE bytes.
  const u16be = Buffer.from(bytes.slice(2));
  // Convert BE to LE for Node decoding.
  const swapped = Buffer.alloc(u16be.length);
  for (let i = 0; i + 1 < u16be.length; i += 2) {
    swapped[i] = u16be[i + 1];
    swapped[i + 1] = u16be[i];
  }
  return swapped.toString("utf16le").replace(/\s+/g, " ").trim();
}

function extractParenStrings(text) {
  // Extract strings like (hello world) with basic escape handling.
  const out = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "(") continue;
    let j = i + 1;
    let depth = 1;
    let s = "";
    while (j < text.length && depth > 0) {
      const ch = text[j];
      if (ch === "\\") {
        const next = text[j + 1] || "";
        // Common escapes
        if (next === "n") s += "\n";
        else if (next === "r") s += "\r";
        else if (next === "t") s += "\t";
        else if (next === "\\") s += "\\";
        else if (next === "(") s += "(";
        else if (next === ")") s += ")";
        else s += next;
        j += 2;
        continue;
      }
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      if (depth > 0) s += ch;
      j += 1;
    }
    if (s.length >= 3) out.push(s);
    i = j;
  }
  return out;
}

function extractReadableSequences(buf, minLen = 18) {
  // Pull sequences of printable chars from a Buffer.
  const out = [];
  let cur = "";
  const flush = () => {
    const trimmed = cur.replace(/\s+/g, " ").trim();
    if (trimmed.length >= minLen) out.push(trimmed);
    cur = "";
  };
  for (const b of buf) {
    const isPrintable = (b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13;
    if (isPrintable) cur += String.fromCharCode(b);
    else flush();
  }
  flush();
  return out;
}

function normalizeLines(lines) {
  const seen = new Set();
  const out = [];
  for (const line of lines) {
    const cleaned0 = line
      .replace(/\u0000/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned0) continue;

    const cleaned = fixMojibake(cleaned0);

    // Drop obvious PDF noise/operators.
    if (cleaned.startsWith("<<") || cleaned.includes("/Subtype") || cleaned.includes("/FlateDecode")) continue;
    if (/^\d+\s+\d+\s+obj\b/.test(cleaned)) continue;
    if (/^(endobj|stream|endstream|xref|trailer)\b/.test(cleaned)) continue;
    if (cleaned.includes("Google/Skia") || cleaned.includes("gTRC") || cleaned.includes("cprt") || cleaned.includes("mluc")) continue;
    if (/\b(?:cm|Tf|Tm|Td|Tj|TJ|Do|BDC|EMC|RG|rg|gs|re|W\*?|n|q|Q|BT|ET)\b/.test(cleaned)) continue;
    if (/<[0-9A-Fa-f]{4,}>/.test(cleaned)) continue;

    const letters = (cleaned.match(/\p{L}/gu) || []).length;
    const weird = (cleaned.match(/[^\p{L}\p{N}_\s.,;:()¿?¡!'"-]/gu) || []).length;
    const letterRatio = letters / cleaned.length;
    const weirdRatio = weird / cleaned.length;

    const hasLetters = letters > 0;
    const hasSpaces = cleaned.includes(" ");
    const looksNumbered = /^\d+(?:\.\d+)*\s+\S/.test(cleaned);
    const looksHeading = (cleaned.length >= 5 && cleaned.length <= 140) &&
      hasLetters &&
      weirdRatio <= 0.08 &&
      (hasSpaces || looksNumbered || /[.:]$/.test(cleaned));

    const looksBody = hasLetters && hasSpaces && cleaned.length >= 20;

    if (!looksHeading && !looksBody) continue;
    if (letterRatio < 0.18) continue;

    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
  }
  return out;
}

function fixMojibake(str) {
  // Common case: UTF-8 bytes misread as latin1 and then encoded again.
  // If the "fixed" string looks better (more letters, fewer mojibake markers), use it.
  if (!/[ÃÂ]/.test(str)) return str;
  const fixed = Buffer.from(str, "latin1").toString("utf8");
  if (!fixed || fixed === str) return str;

  const score = (s) => {
    const letters = (s.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).length;
    const mojibake = (s.match(/[ÃÂ]/g) || []).length;
    return letters - mojibake * 2;
  };

  return score(fixed) >= score(str) ? fixed : str;
}

function main() {
  const [pdfPath, outPath] = process.argv.slice(2);
  if (!pdfPath || !outPath) {
    console.error("Usage: node scripts/extract-pdf-text.js <input.pdf> <output.txt>");
    process.exit(2);
  }

  const input = fs.readFileSync(pdfPath);

  const flateHits = findAll(input, Buffer.from("/FlateDecode"));
  const streamNeedle = Buffer.from("stream");
  const endstreamNeedle = Buffer.from("endstream");

  const texts = [];

  // 1) Extract outline titles found in the raw PDF (not compressed).
  const rawStrings = extractReadableSequences(input, 12);
  for (const s of rawStrings) {
    const mHex = s.match(/<FEFF[0-9A-Fa-f]+>/g);
    if (mHex) {
      for (const token of mHex) {
        const hexBody = token.slice(1, -1);
        const decoded = decodeHexUtf16Title(hexBody);
        if (decoded && decoded.length >= 3) texts.push(decoded);
      }
    }
    const mTitle = s.match(/\/Title\s+\(([^)]+)\)/);
    if (mTitle && mTitle[1]) texts.push(mTitle[1].replace(/\s+/g, " ").trim());
  }

  // 2) Inflate likely content streams and extract readable text.
  for (const hit of flateHits) {
    // Find the next "stream" after this dictionary.
    const streamIdx = input.indexOf(streamNeedle, hit);
    if (streamIdx === -1) continue;
    const endIdx = input.indexOf(endstreamNeedle, streamIdx);
    if (endIdx === -1) continue;
    // Avoid jumping too far: if it's huge, it might be an image; still try but cap.
    if (endIdx - streamIdx > 5_000_000) continue;

    const streamData = sliceStreamData(input, streamIdx);
    if (!streamData || streamData.length < 20) continue;

    const inflated = tryInflate(streamData);
    if (!inflated || inflated.length < 40) continue;

    // Extract parenthesis strings (common for PDF text operators).
    const inflatedAscii = inflated.toString("latin1");
    for (const s of extractParenStrings(inflatedAscii)) {
      const cleaned = s.replace(/\s+/g, " ").trim();
      if (cleaned.length >= 8) texts.push(cleaned);
    }

    // Also pull readable sequences from inflated bytes.
    for (const seq of extractReadableSequences(inflated, 18)) {
      texts.push(seq);
    }
  }

  const lines = normalizeLines(texts);
  const header = [
    `# Extracted text (best effort)`,
    `# Source: ${path.basename(pdfPath)}`,
    `# Generated: ${new Date().toISOString()}`,
    ``,
  ].join("\n");

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, header + lines.join("\n"), "utf8");
  console.log(`Wrote ${lines.length} lines -> ${outPath}`);
}

main();
