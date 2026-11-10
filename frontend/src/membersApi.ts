import { apiFetch } from "./api";

/* 社員の管理画面用。「非表示」は、データを消さずに retired の印を付ける（論理削除） */

export type ManagedMember = {
  memberId: string;
  memberName: string;
  // API は文字列 "true" で返す（印がなければ項目なし）
  retired?: string;
};

export const isRetired = (member: ManagedMember) =>
  member.retired === "true";

/* 非表示の人も含めた一覧 */
export async function listAllMembers(): Promise<ManagedMember[]> {

  const response = await apiFetch("/members?includeRetired=true");

  if (!response.ok) {
    throw new Error("社員の一覧を取得できませんでした");
  }

  return (await response.json()) as ManagedMember[];
}

/* 非表示にする（retired=true）・表示に戻す（retired=false） */
export async function setMemberRetired(
  memberId: string,
  retired: boolean
): Promise<void> {

  const response = await apiFetch(
    `/members/${encodeURIComponent(memberId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retired }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "更新できませんでした。もう一度お試しください"
    );
  }
}
