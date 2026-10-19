import { API_ENV, IS_MOCK, apiFetch } from "./api";

/*
 * 伝言を登録する（確認画面を通らない、直接の登録で使う）。
 *
 * 既存の API は、失敗したときも HTTP 200 で、例外名などの文字列を返す。
 * そのため、「SUCCESS」が返ったときだけ、成功と見なす
 * （仮データのときは、API の代わりにブラウザ内で動くので、HTTP の成功だけを見る）。
 */
export async function postMessage(input: {
  messageBody: string;
  receiverName: string;
  destination: string;
}): Promise<void> {

  const response = await apiFetch("/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(input),
  });

  const text = (await response.text()).trim();

  if (!response.ok || (!IS_MOCK && text !== "SUCCESS")) {
    console.error("伝言の登録に失敗", response.status, text);
    throw new Error("伝言を登録できませんでした。もう一度お試しください");
  }
}

/* 登録のあとに、通知についてお知らせする文言（環境に合わせる） */
export function notifyText(): string {

  if (API_ENV === "prod") {
    return "Teamsへ通知しました。";
  }

  if (API_ENV === "test") {
    return "テスト用チャネル（99_テスト）へ通知しました。";
  }

  return "テストモードのため、Teamsには通知していません。";
}
