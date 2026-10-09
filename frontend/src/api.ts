/*
 * API 呼び出しの入り口
 *
 * 接続先は次の3つ。画面の上部に色つきの帯で表示する。
 *   mock … ブラウザ内の仮データ（灰色）。通知は送られない
 *   test … テスト用 API（黄色）。通知は「99_テスト」に届く
 *   prod … 本番 API（赤）。実際の伝言が登録され、通知される
 *
 * npm run dev（ローカル開発）のとき
 *   既定は mock。テスト用 API に繋ぐには、frontend/.env.development.local に
 *     VITE_API_BASE_URL=<terraform-test の出力 api_url>
 *   と書く（Git には載らない）。本番の URL を書いても繋がらない（mock になる）。
 *
 * npm run build（本番ビルド）のときは、必ず本番 API に繋がる。
 */

import { nowJst } from "./nuisance/nuisanceApi";

const PROD_API_BASE =
  "https://kn3somrtp6.execute-api.ap-northeast-1.amazonaws.com";

export type ApiEnv = "mock" | "test" | "prod";

function resolveEnv(): { env: ApiEnv; base: string } {

  if (import.meta.env.PROD) {
    return { env: "prod", base: PROD_API_BASE };
  }

  const configured = String(
    import.meta.env.VITE_API_BASE_URL ?? ""
  ).replace(/\/+$/, "");

  if (!configured) {
    return { env: "mock", base: "" };
  }

  if (configured === PROD_API_BASE) {
    console.error(
      "開発中は本番 API に接続できません。仮データで動かします。"
    );
    return { env: "mock", base: "" };
  }

  return { env: "test", base: configured };
}

const resolved = resolveEnv();

export const API_ENV: ApiEnv = resolved.env;

export const IS_MOCK: boolean = API_ENV === "mock";

const API_BASE = resolved.base;

type MockMessage = {
  messageId: string;
  messageBody: string;
  receiverName: string;
  destination: string;
  registeredAt: string;
};

const STORAGE_KEY = "messages.mock.v1";

const MOCK_MEMBERS = [
  { memberId: "m1", memberName: "山田 太郎" },
  { memberId: "m2", memberName: "佐藤 花子" },
  { memberId: "m3", memberName: "鈴木 一郎" },
  { memberId: "m4", memberName: "高橋 美咲" },
];

const SEED: MockMessage[] = [
  {
    messageId: "seed-1",
    messageBody:
      "【電話先】株式会社サンプル商事\n採用代行サービスの件で連絡あり。\n折り返し希望。\nTEL：03-1234-5678",
    receiverName: "佐藤 花子",
    destination: "山田 太郎",
    registeredAt: "2026/10/08 10:15:00",
  },
  {
    messageId: "seed-2",
    messageBody: "資料の件で確認したいとのこと。\nTEL：06-1234-5678",
    receiverName: "山田 太郎",
    destination: "鈴木 一郎",
    registeredAt: "2026/10/07 16:40:00",
  },
  {
    messageId: "seed-3",
    messageBody:
      "【電話先】テスト工業株式会社\n来週の打ち合わせ日程の相談。",
    receiverName: "鈴木 一郎",
    destination: "高橋 美咲",
    registeredAt: "2026/10/06 09:05:00",
  },
];

function loadMessages(): MockMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as MockMessage[];
    }
  } catch {
    // 読めない場合は初期データを使う
  }
  return SEED.map((m) => ({ ...m }));
}

function saveMessages(list: MockMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // 保存できなくても動作は続ける
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function mockFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {

  await new Promise((resolve) => setTimeout(resolve, 150));

  const method = (init?.method ?? "GET").toUpperCase();
  const url = new URL(path, "http://mock.local");
  const pathname = url.pathname;

  if (method === "GET" && pathname === "/members") {
    return json(MOCK_MEMBERS);
  }

  if (method === "GET" && pathname === "/messages") {
    const list = loadMessages();
    list.sort((a, b) =>
      b.registeredAt.localeCompare(a.registeredAt)
    );
    return json(list);
  }

  if (method === "GET" && pathname.startsWith("/messages/")) {
    const id = decodeURIComponent(
      pathname.slice("/messages/".length)
    );
    const found = loadMessages().find(
      (m) => m.messageId === id
    );
    return found
      ? json(found)
      : json({ message: "伝言が見つかりません" }, 404);
  }

  if (method === "DELETE" && pathname === "/messages") {
    const id = url.searchParams.get("messageId");
    saveMessages(
      loadMessages().filter((m) => m.messageId !== id)
    );
    return json({ message: "deleted" });
  }

  if (method === "POST" && pathname === "/messages") {
    const body = JSON.parse(String(init?.body ?? "{}"));
    const list = loadMessages();
    list.push({
      messageId: `mock-${Date.now()}`,
      messageBody: String(body.messageBody ?? ""),
      receiverName: String(body.receiverName ?? ""),
      destination: String(body.destination ?? ""),
      registeredAt: nowJst(),
    });
    saveMessages(list);
    return json({ message: "created (mock)" });
  }

  return json({ message: "not found (mock)" }, 404);
}

export function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {

  if (IS_MOCK) {
    return mockFetch(path, init);
  }

  return fetch(`${API_BASE}${path}`, init);
}
