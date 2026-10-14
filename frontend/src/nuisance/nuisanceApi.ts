/*
 * 迷惑番号リスト
 *
 * 接続先によって保存先が変わる（api.ts の IS_MOCK で判定）。
 *   仮データ（npm run dev の既定） … このブラウザの localStorage
 *   テスト／本番               … API（/nuisance …）。DynamoDB に保存し、全員で共有する
 *
 * 画面（pages）は、どちらの場合も同じ関数を呼ぶ。
 */

import { apiFetch, IS_MOCK } from "../api";
import { nowJst } from "../time";

export { nowJst };

export type CallLog = {
  calledAt: string;
  receiverName: string;
  note: string;
};

export type NuisanceNumber = {
  /* 数字だけに正規化した電話番号(これがキー) */
  phoneNumber: string;
  companyName: string;
  memo: string;
  registeredAt: string;
  logs: CallLog[];
};

export const MIN_PHONE_DIGITS = 8;
export const MAX_PHONE_DIGITS = 15;

const STORAGE_KEY = "nuisanceNumbers.mock.v1";

/* ここに出てくる番号・会社名は、すべて架空の仮データです */
const SEED: NuisanceNumber[] = [
  {
    phoneNumber: "0312345678",
    companyName: "株式会社サンプル商事（仮データ）",
    memo: "オフィス用品の営業。毎回、担当者名を聞いてくる",
    registeredAt: "2026/09/20 10:15:00",
    logs: [
      {
        calledAt: "2026/09/20 10:15:00",
        receiverName: "田中",
        note: "オフィス用品の案内。お断りした",
      },
      {
        calledAt: "2026/09/27 14:02:00",
        receiverName: "鈴木",
        note: "再度営業。お断りした",
      },
    ],
  },
  {
    phoneNumber: "0612345678",
    companyName: "サンプル通信（仮データ）",
    memo: "回線切り替えの営業",
    registeredAt: "2026/10/01 09:40:00",
    logs: [
      {
        calledAt: "2026/10/01 09:40:00",
        receiverName: "鈴木",
        note: "",
      },
    ],
  },
  {
    phoneNumber: "09012345678",
    companyName: "",
    memo: "無言のあとで切れる",
    registeredAt: "2026/10/05 16:30:00",
    logs: [],
  },
];

/*
 * ==========================================
 * 電話番号の表記ゆれ対策
 * 「03-1234-5678」「０３１２３４５６７８」「+81 3-1234-5678」を
 * すべて「0312345678」にそろえる
 * ==========================================
 */
export function normalizePhone(raw: string): string {

  const half = raw
    .replace(/[０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    )
    .replace(/＋/g, "+")
    .trim();

  let digits = half.replace(/\D/g, "");

  if (/^\+\s*81/.test(half) && digits.startsWith("81")) {
    digits = "0" + digits.slice(2);
  }

  return digits;
}

/* 表示用：数字だけの番号にハイフンを入れる(保存はしない) */
export function formatPhone(digits: string): string {

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {

    if (digits.startsWith("03") || digits.startsWith("06")) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    if (digits.startsWith("0120") || digits.startsWith("0800")) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return digits;
}

/* 登録フォームで保存している「自分の名前」を流用する */
export function getSavedReceiverName(): string {

  try {
    return localStorage.getItem("receiverName") ?? "";
  } catch {
    return "";
  }

}

export function lastCalledAt(item: NuisanceNumber): string {

  if (item.logs.length === 0) {
    return "記録なし";
  }

  return item.logs[item.logs.length - 1].calledAt;

}

function load(): NuisanceNumber[] {

  try {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {

      const parsed: unknown = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed as NuisanceNumber[];
      }

    }

  } catch {
    /* 読めない場合は仮データから始める */
  }

  return structuredClone(SEED);
}

function save(list: NuisanceNumber[]): void {

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* 保存できない環境では、画面を閉じるまでだけ有効 */
  }

}

/* 最終着信が新しい順 */
function sortByLastCalled(list: NuisanceNumber[]): NuisanceNumber[] {

  return [...list].sort((a, b) => {

    const left = a.logs.length ? lastCalledAt(a) : a.registeredAt;
    const right = b.logs.length ? lastCalledAt(b) : b.registeredAt;

    return right.localeCompare(left);

  });

}

export type CreateInput = {
  phoneNumber: string;
  companyName: string;
  memo: string;
  recordCall: boolean;
  receiverName: string;
};

/*
 * ==========================================
 * ここから下が「API」。後で AWS に置き換える部分
 * ==========================================
 */

async function mockList(): Promise<NuisanceNumber[]> {
  return sortByLastCalled(load());
}

async function mockFind(
  rawPhone: string
): Promise<NuisanceNumber | null> {

  const key = normalizePhone(rawPhone);

  return load().find((n) => n.phoneNumber === key) ?? null;
}

async function mockCreate(input: CreateInput): Promise<void> {

  const key = normalizePhone(input.phoneNumber);

  if (
    key.length < MIN_PHONE_DIGITS ||
    key.length > MAX_PHONE_DIGITS
  ) {
    throw new Error("電話番号の桁数を確認してください");
  }

  const list = load();

  if (list.some((n) => n.phoneNumber === key)) {
    throw new Error("この番号はすでに登録されています");
  }

  const now = nowJst();

  list.push({
    phoneNumber: key,
    companyName: input.companyName.trim(),
    memo: input.memo.trim(),
    registeredAt: now,
    logs: input.recordCall
      ? [
          {
            calledAt: now,
            receiverName: input.receiverName,
            note: "",
          },
        ]
      : [],
  });

  save(list);
}

async function mockUpdate(
  phoneNumber: string,
  patch: { companyName: string; memo: string }
): Promise<void> {

  const list = load().map((n) =>
    n.phoneNumber === phoneNumber
      ? {
          ...n,
          companyName: patch.companyName.trim(),
          memo: patch.memo.trim(),
        }
      : n
  );

  save(list);
}

async function mockDelete(
  phoneNumber: string
): Promise<void> {

  save(load().filter((n) => n.phoneNumber !== phoneNumber));
}

async function mockAddLog(
  phoneNumber: string,
  log: { receiverName: string; note: string }
): Promise<NuisanceNumber | null> {

  const list = load();

  const target = list.find((n) => n.phoneNumber === phoneNumber);

  if (!target) {
    return null;
  }

  target.logs.push({
    calledAt: nowJst(),
    receiverName: log.receiverName.trim(),
    note: log.note.trim(),
  });

  save(list);

  return target;
}

/*
 * ==========================================
 * API 版（テスト／本番）
 * ==========================================
 */

async function request(
  path: string,
  init?: RequestInit
): Promise<Response> {

  return apiFetch(path, {
    ...init,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function errorMessage(response: Response): Promise<string> {

  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      return body.message;
    }
  } catch {
    /* 本文が JSON でないときは下の文言を使う */
  }

  return "通信に失敗しました。もう一度お試しください";
}

async function failIfNotOk(response: Response): Promise<void> {

  if (!response.ok) {
    throw new Error(await errorMessage(response));
  }
}

function phonePath(phone: string): string {
  return `/nuisance/${encodeURIComponent(normalizePhone(phone))}`;
}

async function apiList(): Promise<NuisanceNumber[]> {

  const response = await request("/nuisance");
  await failIfNotOk(response);

  return sortByLastCalled((await response.json()) as NuisanceNumber[]);
}

async function apiFind(rawPhone: string): Promise<NuisanceNumber | null> {

  const response = await request(phonePath(rawPhone));

  if (response.status === 404) {
    return null;
  }

  await failIfNotOk(response);

  return (await response.json()) as NuisanceNumber;
}

async function apiCreate(input: CreateInput): Promise<void> {

  const key = normalizePhone(input.phoneNumber);

  if (key.length < MIN_PHONE_DIGITS || key.length > MAX_PHONE_DIGITS) {
    throw new Error("電話番号の桁数を確認してください");
  }

  const response = await request("/nuisance", {
    method: "POST",
    body: JSON.stringify({ ...input, phoneNumber: key }),
  });

  await failIfNotOk(response);
}

async function apiUpdate(
  phoneNumber: string,
  patch: { companyName: string; memo: string }
): Promise<void> {

  const response = await request(phonePath(phoneNumber), {
    method: "PUT",
    body: JSON.stringify(patch),
  });

  await failIfNotOk(response);
}

async function apiDelete(phoneNumber: string): Promise<void> {

  const response = await request(phonePath(phoneNumber), {
    method: "DELETE",
  });

  await failIfNotOk(response);
}

async function apiAddLog(
  phoneNumber: string,
  log: { receiverName: string; note: string }
): Promise<NuisanceNumber | null> {

  const response = await request(`${phonePath(phoneNumber)}/logs`, {
    method: "POST",
    body: JSON.stringify(log),
  });

  if (response.status === 404) {
    return null;
  }

  await failIfNotOk(response);

  return (await response.json()) as NuisanceNumber;
}

/*
 * ==========================================
 * 画面から呼ぶ関数（仮データか API かをここで切り替える）
 * ==========================================
 */

export const listNuisance = (): Promise<NuisanceNumber[]> =>
  IS_MOCK ? mockList() : apiList();

export const findNuisance = (
  rawPhone: string
): Promise<NuisanceNumber | null> =>
  IS_MOCK ? mockFind(rawPhone) : apiFind(rawPhone);

export const createNuisance = (input: CreateInput): Promise<void> =>
  IS_MOCK ? mockCreate(input) : apiCreate(input);

export const updateNuisance = (
  phoneNumber: string,
  patch: { companyName: string; memo: string }
): Promise<void> =>
  IS_MOCK ? mockUpdate(phoneNumber, patch) : apiUpdate(phoneNumber, patch);

export const deleteNuisance = (phoneNumber: string): Promise<void> =>
  IS_MOCK ? mockDelete(phoneNumber) : apiDelete(phoneNumber);

export const addCallLog = (
  phoneNumber: string,
  log: { receiverName: string; note: string }
): Promise<NuisanceNumber | null> =>
  IS_MOCK ? mockAddLog(phoneNumber, log) : apiAddLog(phoneNumber, log);
