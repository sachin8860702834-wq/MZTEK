#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const DEFAULT_MAX_BYTES = 250 * 1024 * 1024;

function parseArgs(argv) {
  const args = {
    source: "E:\\MZTEK",
    out: "E:\\MZTEK\\_snapshots",
    zip: false,
    maxBytes: DEFAULT_MAX_BYTES,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith("--")) continue;
    const key = current.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) continue;
    i += 1;

    if (key === "source") args.source = next;
    if (key === "out") args.out = next;
    if (key === "zip") args.zip = String(next).toLowerCase() === "true";
    if (key === "max-bytes") {
      const parsed = Number(next);
      if (Number.isFinite(parsed) && parsed > 0) args.maxBytes = parsed;
    }
  }

  return args;
}

function timestampId() {
  const now = new Date();
  const pad = (v) => String(v).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function normalizeForMatch(filePath) {
  return filePath.replaceAll("\\", "/").toLowerCase();
}

function isSecretFileByName(normalizedPath) {
  const base = path.basename(normalizedPath);
  if (base === ".env") return true;
  if (base.startsWith(".env.") && base !== ".env.example") return true;
  if (base.endsWith(".key") || base.endsWith(".pem") || base.endsWith(".p12") || base.endsWith(".pfx")) return true;
  return false;
}

function isExcludedPath(normalizedPath) {
  const excludes = [
    "/node_modules/",
    "/.git/",
    "/.next/",
    "/dist/",
    "/coverage/",
    "/tmp/",
    "/temp/",
    "/cache/",
    "/.cache/",
    "/.mztek/secure/",
    "/_snapshots/",
  ];

  return excludes.some((segment) => normalizedPath.includes(segment));
}

function likelyTextBuffer(buffer) {
  const sampleSize = Math.min(buffer.length, 1024);
  let suspicious = 0;
  for (let i = 0; i < sampleSize; i += 1) {
    const b = buffer[i];
    if (b === 0) return false;
    if (b < 7 || (b > 13 && b < 32)) suspicious += 1;
  }
  return suspicious / Math.max(1, sampleSize) < 0.05;
}

function hasSecretContent(text) {
  const patterns = [
    /api[_-]?key\s*=/i,
    /token\s*=/i,
    /secret\s*=/i,
    /begin\s+private\s+key/i,
  ];
  return patterns.some((p) => p.test(text));
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function walkFiles(rootPath) {
  const files = [];
  const stack = [rootPath];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const normalized = normalizeForMatch(fullPath);
      if (isExcludedPath(normalized)) continue;
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      files.push(fullPath);
    }
  }
  return files;
}

async function classifyFile(fullPath) {
  const normalized = normalizeForMatch(fullPath);
  if (isSecretFileByName(normalized)) {
    return { allowed: false, reason: "secret_filename" };
  }

  const buffer = await fs.readFile(fullPath);
  if (!likelyTextBuffer(buffer)) return { allowed: true, size: buffer.length };
  const text = buffer.toString("utf8");
  if (hasSecretContent(text)) {
    return { allowed: false, reason: "secret_content" };
  }

  return { allowed: true, size: buffer.length };
}

async function copyFilePreserve(srcFile, srcRoot, dstRoot) {
  const relativePath = path.relative(srcRoot, srcFile);
  const targetPath = path.join(dstRoot, relativePath);
  await ensureDir(path.dirname(targetPath));
  await fs.copyFile(srcFile, targetPath);
  return relativePath;
}

function hashPath(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function excludedPatterns() {
  return [
    "**/node_modules/**",
    "**/.git/**",
    "**/.next/**",
    "**/dist/**",
    "**/coverage/**",
    "**/tmp/**",
    "**/temp/**",
    "**/cache/**",
    "**/.cache/**",
    "**/.mztek/secure/**",
    ".env",
    ".env.* (except .env.example)",
    "*.key",
    "*.pem",
    "*.p12",
    "*.pfx",
    "**/_snapshots/**",
  ];
}

async function main() {
  const args = parseArgs(process.argv);
  const source = path.resolve(args.source);
  const outputRoot = path.resolve(args.out);
  const stamp = timestampId();
  const snapshotDir = path.join(outputRoot, `mztek-local-${stamp}`);
  const manifestPath = path.join(snapshotDir, "manifest.json");

  const sourceStat = await fs.stat(source).catch(() => null);
  if (!sourceStat || !sourceStat.isDirectory()) {
    throw new Error(`Source directory not found: ${source}`);
  }

  if (snapshotDir.startsWith(source) && source.startsWith(snapshotDir)) {
    throw new Error("Invalid paths: source and snapshot paths overlap recursively.");
  }

  await ensureDir(outputRoot);
  const existing = await fs.stat(snapshotDir).catch(() => null);
  if (existing) throw new Error(`Snapshot destination already exists: ${snapshotDir}`);
  await ensureDir(snapshotDir);

  const allFiles = await walkFiles(source);
  const skippedSecrets = [];
  const largest = [];
  let includedFiles = 0;
  let totalBytes = 0;

  for (const filePath of allFiles) {
    const relativePath = path.relative(source, filePath).replaceAll("\\", "/");
    const classification = await classifyFile(filePath);
    if (!classification.allowed) {
      skippedSecrets.push({
        pathHash: hashPath(relativePath),
        reason: classification.reason,
      });
      continue;
    }

    const copiedRelative = await copyFilePreserve(filePath, source, snapshotDir);
    const bytes = classification.size ?? 0;
    includedFiles += 1;
    totalBytes += bytes;
    largest.push({
      path: copiedRelative.replaceAll("\\", "/"),
      bytes,
    });
  }

  largest.sort((a, b) => b.bytes - a.bytes);
  const largestFiles = largest.slice(0, 20);

  const flags = [];
  if (totalBytes > args.maxBytes) flags.push("OVERSIZED_SNAPSHOT");

  const verifyChecks = [
    "node_modules",
    ".git",
    ".next",
    "dist",
    "coverage",
    ".mztek/secure",
  ];
  for (const check of verifyChecks) {
    const exists = await fs.stat(path.join(snapshotDir, check)).then(() => true).catch(() => false);
    if (exists) flags.push(`EXCLUSION_VERIFICATION_FAILED:${check}`);
  }

  const manifest = {
    timestamp: new Date().toISOString(),
    source,
    snapshotDir,
    includedFiles,
    totalBytes,
    excludedPatterns: excludedPatterns(),
    skippedSecrets,
    largestFiles,
    flags,
    zipRequested: args.zip,
    zipCreated: false,
  };

  if (args.zip) {
    if (process.platform === "win32") {
      const zipPath = `${snapshotDir}.zip`;
      const cmd = [
        "-NoProfile",
        "-Command",
        `Compress-Archive -Path "${snapshotDir}\\*" -DestinationPath "${zipPath}" -Force`,
      ];
      const result = spawnSync("powershell", cmd, { stdio: "pipe", encoding: "utf8" });
      if (result.status === 0) {
        manifest.zipCreated = true;
        manifest.zipPath = zipPath;
      } else {
        manifest.flags.push("ZIP_CREATION_FAILED");
      }
    } else {
      manifest.flags.push("ZIP_NOT_SUPPORTED_ON_PLATFORM");
    }
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  const summary = {
    snapshotDir,
    manifestPath,
    includedFiles,
    totalBytes,
    skippedSecrets: skippedSecrets.length,
    flags,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`snapshot-local failed: ${error.message}\n`);
  process.exit(1);
});
