/*
 * Markdown の資料（見出し・表・箇条書き・コード）を、Excel に変換する。
 * 使い方: node md2xlsx.js <入力.md> <出力.xlsx>
 *  ・「## 見出し」ごとに、1つのシート
 *  ・先頭（最初の ## より前）は、「概要」シート
 *  ・表は、見出し行つきの罫線の表にする
 */
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const [, , inFile, outFile] = process.argv;
const FONT = "Meiryo UI";

const text = fs.readFileSync(inFile, "utf8").replace(/\r\n/g, "\n");
const lines = text.split("\n");

// ---------- 解析 ----------
const clean = (s) =>
  s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .trim();

const sections = []; // {name, blocks: []}
let current = { name: "概要", blocks: [] };
let title = "";
let i = 0;

while (i < lines.length) {
  const line = lines[i];

  if (/^# /.test(line)) {
    title = clean(line.slice(2));
    i++;
    continue;
  }

  if (/^## /.test(line)) {
    sections.push(current);
    current = { name: clean(line.slice(3)), blocks: [] };
    i++;
    continue;
  }

  if (/^### /.test(line)) {
    current.blocks.push({ type: "h3", text: clean(line.slice(4)) });
    i++;
    continue;
  }

  if (/^```/.test(line)) {
    const code = [];
    i++;
    while (i < lines.length && !/^```/.test(lines[i])) {
      code.push(lines[i]);
      i++;
    }
    i++;
    current.blocks.push({ type: "code", lines: code });
    continue;
  }

  if (/^\|/.test(line)) {
    const rows = [];
    while (i < lines.length && /^\|/.test(lines[i])) {
      const cells = lines[i]
        .replace(/^\|/, "")
        .replace(/\|\s*$/, "")
        .split("|")
        .map((c) => clean(c));
      rows.push(cells);
      i++;
    }
    // 2行目の区切り行（---）を除く
    const body = rows.filter(
      (r, idx) => !(idx === 1 && r.every((c) => /^:?-{2,}:?$/.test(c)))
    );
    current.blocks.push({ type: "table", rows: body });
    continue;
  }

  if (/^\s*[-*] /.test(line) || /^\s*\d+\. /.test(line)) {
    const items = [];
    while (
      i < lines.length &&
      (/^\s*[-*] /.test(lines[i]) ||
        /^\s*\d+\. /.test(lines[i]) ||
        (/^\s{2,}\S/.test(lines[i]) && items.length))
    ) {
      const l = lines[i];
      if (/^\s*[-*] /.test(l) || /^\s*\d+\. /.test(l)) {
        const indent = l.match(/^\s*/)[0].length;
        let t = l.replace(/^\s*([-*]|\d+\.)\s+/, "");
        t = t.replace(/^\[ \]\s*/, "☐ ").replace(/^\[x\]\s*/i, "☑ ");
        items.push({ indent, text: clean(t), ordered: /^\s*\d+\./.test(l), no: (l.match(/^\s*(\d+)\./) || [])[1] });
      } else {
        items[items.length - 1].text += " " + clean(l);
      }
      i++;
    }
    current.blocks.push({ type: "list", items });
    continue;
  }

  if (/^\s*$/.test(line) || /^---+$/.test(line)) {
    i++;
    continue;
  }

  // 段落（連続する行を1つにまとめる）
  const para = [];
  while (
    i < lines.length &&
    !/^\s*$/.test(lines[i]) &&
    !/^(#|\||```|\s*[-*] |\s*\d+\. )/.test(lines[i])
  ) {
    para.push(clean(lines[i]));
    i++;
  }
  current.blocks.push({ type: "para", text: para.join(" ") });
}
sections.push(current);

// ---------- Excel ----------
const wb = new ExcelJS.Workbook();
wb.creator = "伝言メモ";
wb.created = new Date();

const GREEN = "FF005B49";
const PALE = "FFDCEBE8";
const thin = { style: "thin", color: { argb: "FFBCD3CF" } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

const safeName = (n, used) => {
  let s = n.replace(/[\[\]:*?/\\]/g, "").slice(0, 28) || "シート";
  let k = s;
  let c = 2;
  while (used.has(k)) k = s.slice(0, 26) + "_" + c++;
  used.add(k);
  return k;
};

const widthOf = (s) => {
  let w = 0;
  for (const ch of String(s)) w += /[ -~｡-ﾟ]/.test(ch) ? 1 : 2;
  return w;
};

const resultFill = (v) => {
  if (/^NG/.test(v)) return "FFF8D7DA";
  if (/^OK/.test(v)) return "FFD9F2E6";
  if (/^未実施/.test(v) || /^未確認/.test(v) || /要確認/.test(v)) return "FFFFF3CD";
  return null;
};

const used = new Set();

for (const sec of sections) {
  if (sec.name === "概要" && sec.blocks.length === 0 && !title) continue;

  const ws = wb.addWorksheet(safeName(sec.name, used), {
    views: [{ showGridLines: false }],
  });

  const colMax = [];
  const note = (col, v) => {
    colMax[col] = Math.max(colMax[col] || 8, Math.min(widthOf(v) + 2, 60));
  };

  // 先に、表の列の幅を決める（文章の行の高さを、正しく見積もるため）
  for (const b of sec.blocks) {
    if (b.type !== "table") continue;
    for (const row of b.rows) row.forEach((v, ci) => note(ci + 1, v));
  }

  let r = 1;
  const lastColOfSheet = () =>
    Math.max(
      3,
      ...sec.blocks.filter((b) => b.type === "table").map((b) => b.rows[0].length)
    );
  const hasTable = sec.blocks.some((b) => b.type === "table");
  const span = hasTable ? lastColOfSheet() : 1;
  if (!hasTable) colMax[1] = 110;
  const totalWidth = () => { let t = 0; for (let c = 1; c <= span; c++) t += colMax[c] || 14; return t; };
  const merge = (rr) => { if (span > 1) ws.mergeCells(rr, 1, rr, span); };

  if (sec.name === "概要") {
    const t = ws.getCell(r, 1);
    t.value = title;
    t.font = { name: FONT, size: 16, bold: true, color: { argb: GREEN } };
    merge(r);
    r += 2;
  } else {
    const t = ws.getCell(r, 1);
    t.value = sec.name;
    t.font = { name: FONT, size: 14, bold: true, color: { argb: GREEN } };
    merge(r);
    r += 2;
  }

  let firstTableHeaderRow = null;

  for (const b of sec.blocks) {
    if (b.type === "h3") {
      const c = ws.getCell(r, 1);
      c.value = b.text;
      c.font = { name: FONT, size: 12, bold: true };
      merge(r);
      r += 1;
    } else if (b.type === "para") {
      const c = ws.getCell(r, 1);
      c.value = b.text;
      c.font = { name: FONT, size: 10 };
      c.alignment = { wrapText: true, vertical: "top" };
      merge(r);
      ws.getRow(r).height = Math.max(18, Math.ceil(widthOf(b.text) / (totalWidth() * 0.95)) * 16);
      r += 2;
    } else if (b.type === "list") {
      for (const it of b.items) {
        const c = ws.getCell(r, 1);
        const bullet = it.ordered ? `${it.no}. ` : /^[☐☑]/.test(it.text) ? "" : "・";
        c.value = " ".repeat(Math.floor(it.indent / 2) * 2) + bullet + it.text;
        c.font = { name: FONT, size: 10 };
        c.alignment = { wrapText: true, vertical: "top" };
        merge(r);
        ws.getRow(r).height = Math.max(18, Math.ceil(widthOf(c.value) / (totalWidth() * 0.95)) * 16);
        r += 1;
      }
      r += 1;
    } else if (b.type === "code") {
      for (const l of b.lines) {
        const c = ws.getCell(r, 1);
        c.value = l;
        c.font = { name: "Consolas", size: 10 };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
        merge(r);
        r += 1;
      }
      r += 1;
    } else if (b.type === "table") {
      const header = b.rows[0];
      const resultCol = header.findIndex((h) => /^結果/.test(h));
      b.rows.forEach((row, ri) => {
        row.forEach((val, ci) => {
          const c = ws.getCell(r, ci + 1);
          c.value = val;
          c.border = border;
          c.alignment = { wrapText: true, vertical: "top" };
          if (ri === 0) {
            c.font = { name: FONT, size: 10, bold: true, color: { argb: "FFFFFFFF" } };
            c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
            c.alignment = { wrapText: true, vertical: "middle" };
          } else {
            c.font = { name: FONT, size: 10 };
            if (ci === 0) c.font = { name: FONT, size: 10, bold: true };
            const isResult = ci === resultCol || /^結果/.test(header[ci] || "") || /^状態/.test(header[ci] || "");
            const f = isResult ? resultFill(val) : null;
            if (f) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: f } };
          }
          note(ci + 1, val);
        });
        const longest = Math.max(...row.map((v, ci) => Math.ceil(widthOf(v) / Math.max(8, (colMax[ci + 1] || 20) - 2))));
        ws.getRow(r).height = Math.max(20, longest * 16 + 4);
        if (ri === 0) {
          ws.getRow(r).height = 22;
          if (firstTableHeaderRow === null) firstTableHeaderRow = r;
        }
        r += 1;
      });
      r += 1;
    }
  }

  // 列の幅
  for (let c = 1; c <= span; c++) ws.getColumn(c).width = colMax[c] || 14;

  // 表が1つだけのシートは、見出し行を固定する
  const tables = sec.blocks.filter((b) => b.type === "table").length;
  if (tables === 1 && firstTableHeaderRow) {
    ws.views = [{ showGridLines: false, state: "frozen", ySplit: firstTableHeaderRow }];
  }

  // 印刷（横向き、幅を1ページに）
  ws.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
}

wb.xlsx.writeFile(outFile).then(() => {
  console.log("wrote", outFile, "sheets:", wb.worksheets.map((w) => w.name).join(", "));
});
