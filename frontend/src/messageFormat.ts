/*
 * 電話先（企業名）の扱い
 *
 * バックエンドには「電話先」専用の項目がないため、
 * 伝言内容の1行目に「【電話先】企業名」として保存する。
 * 画面側で取り出して表示する。
 */

const PREFIX = "【電話先】";

export function composeBody(
  company: string,
  body: string
): string {

  const name = company.trim();

  if (!name) {
    return body;
  }

  return `${PREFIX}${name}\n${body}`;
}

export function splitBody(text: string): {
  company: string;
  body: string;
} {

  const match = text.match(
    /^【電話先】([^\r\n]*)(?:\r?\n)?/
  );

  if (!match) {
    return { company: "", body: text };
  }

  return {
    company: match[1].trim(),
    body: text.slice(match[0].length),
  };
}
