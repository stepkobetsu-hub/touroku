# CODEX_TASK_20260927_student_registration_master_autofill.md

## 目的
現行の生徒・保護者登録フォーム
https://stepkobetsu-hub.github.io/touroku/touroku.html
から新規生徒を登録したとき、Google Sheet「★生徒マスタ202606-」の「☆マスタ」へ必要項目を自動設定する。

## 重要
- 現行本番フォームは `stepkobetsu-hub/touroku/touroku.html`。
- 現行フォームの送信先GAS URLは、既存本番URLを維持すること。
- 保存先は Google Sheet「★生徒マスタ202606-」の「☆マスタ」。
- 既存データを壊さないこと。
- 既存の登録項目・確認画面・送信処理を維持すること。
- 新規登録時だけ、下記の列を追加自動設定する。
- 既存行を一括書換えしないこと。
- L列・AZ列は登録後に人が手動で書き換え可能なままにすること。
- J列は「値」ではなく、各新規行に行番号に合わせた数式を入れること。これにより4月1日の年度切替で自動進級する。

## フォーム画面の変更
`touroku.html` のSTEP1「生徒情報」の枠内で、一番上（生徒氏名より上）に以下を追加する。

### 通塾教室（必須）
プルダウン：
- 神領
- 大手
- その他

未選択では次へ進めないようにする。
確認画面にも「通塾教室」を表示する。
POSTデータに `campus`（または既存命名規則に合わせた明確なキー）として含める。

## ☆マスタへ新規登録時に自動設定する列

### A列：生徒番号
- 新規登録行の直前までに存在するA列の最大生徒番号を確認し、その最大値+1を設定する。
- 単純に「直前行+1」ではなく、途中に空行・並び替えがあっても重複しないよう、A列の有効な数値の最大値+1を使用する。
- 例：現在最大が1332なら、新規登録は1333。
- 同時登録でも重複しないよう `LockService` 等で排他制御する。

### B列：在籍フラグ
- 数値 `1` を設定する。

### C列：入塾日
- 登録日を日付として設定する。
- タイムゾーンは Asia/Tokyo。
- 表示形式は既存列に合わせる（例 2026/9/27）。

### D列：タイムスタンプ
- 現行処理を維持。

### H列：通塾教室
- フォームで選択した「神領」「大手」「その他」をそのまま保存する。

### I列：生年月日
- 現行処理を維持。

### J列：自動学年
I列の生年月日を参照し、その年度の4月2日時点の年齢で学年を計算する数式を、登録行番号に合わせて設定する。
例として行334なら次の式：

```
=IF(I334="","",IFERROR(IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")<6,"未就学",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=6,"小１",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=7,"小２",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=8,"小３",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=9,"小４",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=10,"小５",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=11,"小６",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=12,"中１",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=13,"中２",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=14,"中３",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=15,"高１",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=16,"高２",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=17,"高３",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=18,"大１",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=19,"大２",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=20,"大３",IF(DATEDIF(I334,DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,2),"Y")=21,"大４","既卒"))))))))))))))))),"要確認"))
```

- 実際の登録行が335なら I335、336なら I336 というように行番号を動的に埋める。
- 数式は `setFormula()` 等で設定する。
- K列の「フォームで選んだ学年」は現行どおり保存する。J列は自動計算学年として別に維持する。

### L列：生徒用パスワード
- F列のフリガナからローマ字化し、先頭4文字を小文字で設定。
- 例：
  - ヤマダタロウ → yama
  - ハットリトウマ → hatt
- 既存のローマ字化実装があれば再利用。
- 登録後に手動変更できる通常セルとして保存する（数式ではなく値でもよい）。
- 4文字未満になる特殊ケースは、得られた文字数だけでよい。空欄にはしないよう可能な限り変換する。

### AZ列：生徒QRデータ
- `STEP-` + A列の生徒番号。
- 例：A=1331 → `STEP-1331`
- 登録後に手動変更可能な通常セルとして保存する。

## 既存列
以下の現行保存は壊さない。
- E 生徒氏名
- F フリガナ
- G 性別
- I 生年月日
- K 学年（フォーム選択値）
- P 在学学校
- Q 保護者氏名
- R 保護者フリガナ
- S 続柄
- T 郵便番号
- U/V/W 住所
- X メール
- Y 携帯
- Z 自宅電話
その他、既存処理がある列も維持する。

## GASバックエンド
現行フォームがPOSTしているApps Script側の `registerStudent(data)` を更新する。
現在の処理は「☆マスタ」へD/E/F/G/I/K/P...を書き込む構成なので、そこへA/B/C/H/J/L/AZを追加する。

### 必須要件
1. `LockService.getScriptLock()` で採番から書込み完了まで排他制御。
2. A列は数値の最大値+1。
3. nextRowは既存のD列最終使用行判定を維持してよい。
4. J列は行番号に応じた数式。
5. L/AZは手動上書き可能。
6. 登録成功レスポンスには、可能なら `studentId`, `password`, `qrData`, `row` を返す。ただし画面に表示する必要はない。
7. 本番デプロイは既存WebアプリURLを維持して新バージョンへ更新。

## 検証
本番データを壊さないよう、可能ならテスト用行またはダミー登録で確認し、終了後に不要テストデータを削除する。

最低限確認：
- 通塾教室未選択で送信不可。
- 神領を選ぶとH列=神領。
- 大手を選ぶとH列=大手。
- その他を選ぶとH列=その他。
- A列が最大値+1。
- B列=1。
- C列=当日。
- J列に対象行のI列を参照する数式。
- L列がヤマダタロウ→yama、ハットリトウマ→hatt。
- AZ列がSTEP-生徒番号。
- 既存の氏名・保護者・住所・連絡先保存が維持。
- 次年度にJ列の数式で学年が自動進級する。
- 同時送信でもA列の重複が起きない。

## GitHub
- フロントエンド正本：`stepkobetsu-hub/touroku`
- `touroku.html` を更新しmainへ反映。
- GAS正本コードをGitHubで管理していない場合は、今回の完成版GASコードも `gas/registration_backend.gs` など分かりやすい名前でリポジトリへ保存して、次回以降の正本が追えるようにする。
- READMEまたは作業メモへ、今回追加したA/B/C/H/J/L/AZ自動設定を記録する。

## 完了報告
完了時は次を報告する。
- 変更ファイル
- GitHub commit
- 本番GASデプロイの更新有無
- 既存URLを維持したか
- テスト結果
- 生徒マスタで確認した列値
