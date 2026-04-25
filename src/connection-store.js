import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { MZTEK_DIR } from "./constants.js";

const SECURE_DIR = "secure";
const KEY_FILE = "connections.key";
const STATE_FILE = "connections.enc.json";

function secureDir(rootDir) {
  return path.join(path.resolve(rootDir), MZTEK_DIR, SECURE_DIR);
}

function keyPath(rootDir) {
  return path.join(secureDir(rootDir), KEY_FILE);
}

function statePath(rootDir) {
  return path.join(secureDir(rootDir), STATE_FILE);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultState() {
  return {
    github: {
      connected: false,
      authStatus: "not_connected",
      username: "",
      repoUrl: "",
      repoOwner: "",
      repoName: "",
      repoFullName: "",
      permissionStatus: "not_checked",
      validationStatus: "not_connected",
      validationMessage: "GitHub is not connected yet.",
      verifiedAt: "",
      token: "",
      deviceFlow: null
    },
    nvidia: {
      connected: false,
      authStatus: "not_connected",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      activeModel: "",
      availableModels: [],
      validationStatus: "not_connected",
      validationMessage: "NVIDIA is not connected yet.",
      verifiedAt: "",
      apiKey: ""
    }
  };
}

function ensureSecureDir(rootDir) {
  fs.mkdirSync(secureDir(rootDir), { recursive: true });
}

function loadKey(rootDir) {
  ensureSecureDir(rootDir);
  const filePath = keyPath(rootDir);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath);
  }

  const key = crypto.randomBytes(32);
  fs.writeFileSync(filePath, key);
  return key;
}

function encryptJson(rootDir, value) {
  const key = loadKey(rootDir);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertext.toString("base64")
  };
}

function decryptJson(rootDir, payload) {
  const key = loadKey(rootDir);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(payload.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final()
  ]);
  return JSON.parse(plaintext.toString("utf8"));
}

export function loadConnectionState(rootDir) {
  const filePath = statePath(rootDir);
  if (!fs.existsSync(filePath)) {
    return defaultState();
  }

  try {
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      ...defaultState(),
      ...decryptJson(rootDir, payload)
    };
  } catch {
    return defaultState();
  }
}

export function saveConnectionState(rootDir, state) {
  ensureSecureDir(rootDir);
  const filePath = statePath(rootDir);
  const payload = encryptJson(rootDir, state);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export function updateConnectionState(rootDir, updater) {
  const current = loadConnectionState(rootDir);
  const next = updater(clone(current));
  saveConnectionState(rootDir, next);
  return next;
}

export function clearGitHubConnection(rootDir) {
  return updateConnectionState(rootDir, (state) => {
    state.github = defaultState().github;
    return state;
  });
}

export function clearNvidiaConnection(rootDir) {
  return updateConnectionState(rootDir, (state) => {
    state.nvidia = defaultState().nvidia;
    return state;
  });
}

export function publicConnectionState(rootDir) {
  const state = loadConnectionState(rootDir);
  return {
    github: {
      connected: state.github.connected,
      authStatus: state.github.authStatus,
      username: state.github.username,
      repoUrl: state.github.repoUrl,
      repoOwner: state.github.repoOwner,
      repoName: state.github.repoName,
      repoFullName: state.github.repoFullName,
      permissionStatus: state.github.permissionStatus,
      validationStatus: state.github.validationStatus,
      validationMessage: state.github.validationMessage,
      verifiedAt: state.github.verifiedAt,
      deviceFlow: state.github.deviceFlow
        ? {
            verificationUri: state.github.deviceFlow.verificationUri,
            userCode: state.github.deviceFlow.userCode,
            interval: state.github.deviceFlow.interval,
            expiresAt: state.github.deviceFlow.expiresAt
          }
        : null
    },
    nvidia: {
      connected: state.nvidia.connected,
      authStatus: state.nvidia.authStatus,
      baseUrl: state.nvidia.baseUrl,
      activeModel: state.nvidia.activeModel,
      availableModels: state.nvidia.availableModels,
      validationStatus: state.nvidia.validationStatus,
      validationMessage: state.nvidia.validationMessage,
      verifiedAt: state.nvidia.verifiedAt
    }
  };
}
