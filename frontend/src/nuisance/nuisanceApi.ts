/*
 * 迷惑番号リスト：仮データ版
 *
 * いまは AWS に接続せず、このブラウザの localStorage に保存します。
 * 関数はすべて async(Promise を返す)にしてあるので、
 * 後で AWS の API に置き換えるときは、この中身だけ fetch に変えれば
 * 画面側(pages)は変更せずに済みます。
 */

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

/* 日本時間の「2026/10/08 11:57:00」形式(伝言の受電日時と同じ形式) */
export function nowJst(): string {

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return (
    `${get("year")}/${get("month")}/${get("day")} ` +
    `${get("hour")}:${get("minute")}:${get("second")}`
  );
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

/*
 * ==========================================
 * ここから下が「API」。後で AWS に置き換える部分
 * ==========================================
 */

export async function listNuisance(): Promise<NuisanceNumber[]> {
  return sortByLastCalled(load());
}

export async function findNuisance(
  rawPhone: string
): Promise<NuisanceNumber | null> {

  const key = normalizePhone(rawPhone);

  return load().find((n) => n.phoneNumber === key) ?? null;
}

export async function createNuisance(input: {
  phoneNumber: string;
  companyName: string;
  memo: string;
  recordCall: boolean;
  receiverName: string;
}): Promise<void> {

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

export async function updateNuisance(
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

export async function deleteNuisance(
  phoneNumber: string
): Promise<void> {

  save(load().filter((n) => n.phoneNumber !== phoneNumber));
}

export async function addCallLog(
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
