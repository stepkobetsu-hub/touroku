# CODEX_TASK_20260927_deploy_registration_gas.md

## 目的
GitHub `stepkobetsu-hub/touroku` main の最新版を使い、現行の「生徒・保護者登録」Apps Script本番へバックエンド変更を反映し、既存WebアプリURLを変えずに再デプロイする。

## 現在の正本
- フロント: `touroku.html`
- GAS正本: `gas/registration_backend.gs`
- 最新修正コミット: `1d9a8b0fc7c76382314f78f4113c5426b14fb80d`
- フォーム本番: https://stepkobetsu-hub.github.io/touroku/touroku.html
- 現行フォームがPOSTしている既存GAS URL:
  https://script.google.com/macros/s/AKfycbzV8PZmAv4soUitOVYPDuVqPSAfXZeL_7i_FOWjaBRBlTxTWYJqhQOgbhbmZRlOsPhF/exec
- 保存先Google Sheet:
  `★生徒マスタ202606-`
  Spreadsheet ID: `1CIJkTlYUcUkbb8jBdFc6L8D5ubTGsxwNxFv01ten-Zk`
  使用シート: `☆マスタ`

## 必須作業
1. 現行GASプロジェクトを特定する。
   - 上記既存WebアプリURLのデプロイ元を優先して探す。
   - Google Drive / Apps Script / スプレッドシートの拡張機能→Apps Script 等、利用可能な経路で同一プロジェクトを確認する。
   - 新規GASプロジェクトを作らない。既存本番デプロイを更新する。

2. 現行GASのバックアップを取る。
   - 既存コード全文を退避する。
   - 可能ならGitHubへ `gas/backup-before-20260927/` 等で保存する。
   - Script Propertiesや秘密値はGitHubへ保存しない。

3. `gas/registration_backend.gs` の内容を現行GASへ反映する。
   - 現行 `registerStudent(data)` と関連ヘルパーを、GitHub最新版に合わせて更新する。
   - 既存の `doPost(e)` が `registerStudent(data)` を呼ぶ構成を壊さない。
   - 既存の他関数・別用途処理がある場合は削除しない。
   - フォーム送信で以下を保存できるようにする:
     - A列 = A列最大番号 + 1
     - B列 = 1
     - C列 = 登録日
     - D列 = 現行タイムスタンプ
     - E/F/G = 氏名/フリガナ/性別
     - H列 = 通塾教室（神領/大手/その他）
     - I列 = 生年月日
     - J列 = 年度連動の学年数式
     - K列 = フォームで選択した学年
     - L列 = フリガナのローマ字先頭4文字
     - P〜Z = 既存の学校/保護者/住所/連絡先
     - AZ列 = `STEP-` + 生徒番号

4. 生年月日形式の互換を必ず維持する。
   - フォーム側は現在 `yyyy/mm/dd` を送る。
   - GAS側は `yyyy/mm/dd` と `yyyy-mm-dd` の両方を受け付ける。
   - GitHub mainの `parseLocalDate_` 最新版をそのまま使用する。

5. A列採番は必ず排他制御する。
   - `LockService.getScriptLock()`
   - 採番から書込み完了までlockを保持。
   - A列の有効数値の最大値+1で採番。
   - 同時送信でも重複を起こさない。

6. J列は値ではなく数式を入れる。
   - 登録された実際の行番号を使用する。
   - I列の生年月日を参照。
   - 4月1日の年度切替で自動進級する現行式と同等の結果にする。
   - `setFormula()` で設定。

7. L列とAZ列は通常値として保存する。
   - L列例:
     - ヤマダタロウ → yama
     - ハットリトウマ → hatt
   - AZ列例:
     - 生徒番号1333 → STEP-1333
   - 後から手動変更可能な状態を維持。

8. 既存WebアプリURLを維持して再デプロイする。
   - 「新しいデプロイ」を作らず、既存デプロイを新バージョンへ更新する。
   - デプロイID / URLを変更しない。
   - 更新後も以下URLが同じであることを確認:
     https://script.google.com/macros/s/AKfycbzV8PZmAv4soUitOVYPDuVqPSAfXZeL_7i_FOWjaBRBlTxTWYJqhQOgbhbmZRlOsPhF/exec

## 本番テスト
本番データを壊さない方法で、最低1件のダミー登録を実施する。
可能なら氏名を「テスト登録」等、識別しやすくする。

確認項目:
- フォームで「通塾教室」が必須。
- 神領/大手/その他のいずれかがH列へ保存。
- A列が直前最大値+1。
- B列=1。
- C列=当日。
- I列=選択した生年月日。
- J列=その行番号のI列を参照した数式。
- K列=フォーム選択学年。
- L列=ローマ字4文字。
- AZ列=STEP-生徒番号。
- 既存の氏名・学校・保護者・住所・メール・電話も従来通り保存。
- GASレスポンスが成功。
- 既存本番URLがHTTP 200。

テスト完了後:
- ダミー行を完全に削除。
- A列採番がダミー削除後に不自然に飛ぶ場合は、実運用上問題ないか確認し、必要なら次回採番が正しいことを確認。
- 実データは変更しない。

## 注意
- 秘密値、Script Properties、APIキー、パスワードは表示・記録・GitHub保存しない。
- 既存フォームURL、既存GAS URL、既存Sheetを変更しない。
- 既存の他機能を削除しない。
- 本番デプロイ前に差分を確認する。

## 完了報告
完了時は以下を報告する:
- Apps Scriptプロジェクトを特定できたか
- Apps Scriptプロジェクト名/プロジェクトID（秘密値でない範囲）
- 反映したファイル/関数
- GASの新バージョン番号
- 既存デプロイID・URLを維持したか
- ダミー登録の結果（A/B/C/H/I/J/K/L/AZ）
- ダミー削除完了
- HTTP 200確認
- 問題があればその内容
