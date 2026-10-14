# Excel 版の資料

`docs/` の Markdown（`仕様書.md`・`テスト項目書.md`・`リリース手順書.md`）から作った Excel。

- **元は Markdown。** 内容を直すときは、Markdown を直してから、Excel を作り直す。Excel だけを直すと、次に作り直したときに消える。
- 見出し（`##`）ごとに、1つのシート。表は、見出し行つきの罫線の表。結果の列は、OK＝緑、NG＝赤、未実施・要確認＝黄色。
- Excel 上で、結果を書き込んで使う場合は、この Excel を「結果の記録用」にして、Markdown は、そのままにしてよい（作り直さない）。

## 作り直す手順

Node.js と、`exceljs`（Excel を作る部品）が要る。リポジトリには、`exceljs` を入れていない（画面・API の部品ではないため）。次のように、別のフォルダに入れて使う。

```
mkdir C:\dev\xlsx-tool
```

```
cd C:\dev\xlsx-tool
```

```
npm init -y
```

```
npm install exceljs
```

```
copy C:\dev\message-system\docs\tools\md2xlsx.js .
```

```
node md2xlsx.js C:\dev\message-system\docs\仕様書.md C:\dev\message-system\docs\excel\仕様書.xlsx
```
