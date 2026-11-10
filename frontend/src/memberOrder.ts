/*
 * 伝言先の並び順。
 * 先にグループ（この配列の順）、そのあとに個人名（API の並び＝伝言先に使われた回数が多い順のまま）。
 * グループの名前は、Members の memberName と完全に同じ文字列で書く。
 */
export const GROUP_ORDER = ["総務", "経理", "人事", "営業"];

export type Member = {
  memberId: string;
  memberName: string;
};

const groupIndex = (name: string) => GROUP_ORDER.indexOf(name.trim());

export const isGroup = (member: Member) => groupIndex(member.memberName) >= 0;

/* 伝言先の選択肢：グループ（決めた順）→ 個人名（元の順） */
export function sortDestinations<T extends Member>(list: T[]): T[] {
  const groups = list
    .filter(isGroup)
    .sort((a, b) => groupIndex(a.memberName) - groupIndex(b.memberName));
  const people = list.filter((m) => !isGroup(m));
  return [...groups, ...people];
}
