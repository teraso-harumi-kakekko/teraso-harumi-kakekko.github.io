# X（旧Twitter）週次告知のしくみ

## 現在の運用：月1回の「まとめて予約投稿」（無料）★いまはこちら

XのAPI無料枠が2026年2月に廃止されたため、**Xの標準機能「予約投稿」（無料）**で運用します。

- 月1回、Claude Codeのセッションで **「予約投稿して」** と言うだけ
- Claudeが翌月分（4〜5週分）の文面を作り、Chrome上のx.comで予約投稿に登録（文面はあなたが確認してOKを出してから）
- 公開タイミングは毎週木曜19:00、文面は `post_template.txt`、お休み週は `skip_dates.txt` で管理（下のAPI方式と共通）
- 詳細手順はプロジェクト内のスキル `.claude/skills/x-yoyaku/SKILL.md` に記載

---

## 【休止中】GitHub Actions＋X APIによる完全自動投稿

以下は完全自動化する場合の方式です。X APIが従量課金制（リンク入り投稿 約$0.20/件）に
なったため現在は**休止中**（ワークフローは無効化済み）。再開したい場合は、APIキーを取得して
Secretsを登録し、Actionsページで「Enable workflow」を押せばそのまま使えます。

毎週木曜19:00（日本時間）に、次の土曜日の開催告知をXへ自動投稿します。
GitHub Actionsで動くため、パソコンを起動しておく必要はありません。

## しくみの全体像

```
毎週木曜19:00 → GitHub Actionsが起動
              → scripts/post_weekly.py が次の土曜日の日付を計算
              → scripts/post_template.txt の {date} に日付を埋め込み
              → XのAPIで投稿（skip_dates.txt にある週はスキップ）
```

| ファイル | 役割 |
|---|---|
| `.github/workflows/weekly-x-post.yml` | スケジュール定義（曜日・時刻の変更はここ） |
| `scripts/post_weekly.py` | 投稿処理本体 |
| `scripts/post_template.txt` | 投稿文面（自由に編集OK。`{date}`が日付に変わります） |
| `scripts/skip_dates.txt` | お休みの土曜日リスト（その週は投稿しない） |

---

## 初回セットアップ（1回だけ・約15分）

自動投稿には、XのAPIキー（4つの文字列）が必要です。
**キーの取得と登録はアカウントの持ち主しかできない操作**なので、以下をご自身で行ってください。

### 1. X Developerアカウントの登録（無料）

1. 教室用に使うXアカウントでログインした状態で https://developer.x.com/ を開く
2. 「Sign up for Free Account」からFreeプランに登録
   （用途を聞かれたら「教室の開催告知を週1回自動投稿するため」等でOK）
3. FreeプランでOKです（月500件まで投稿可能。週1投稿なら十分）

### 2. アプリの権限設定とキーの取得

1. ダッシュボードで自動作成されたProject内のAppを開く
2. **「User authentication settings」→「Set up」**：
   - App permissions: **Read and write** を選択
   - Type of App: **Web App, Automated App or Bot**
   - Callback URI / Website URL: `https://teraso-harumi-kakekko.github.io/` を入力して保存
3. **「Keys and tokens」タブ**で以下の4つを取得（メモ帳などに一時保存）：
   - **API Key** と **API Key Secret**（「Consumer Keys」の「Regenerate」で表示）
   - **Access Token** と **Access Token Secret**（「Generate」。権限が「Read and Write」になっていることを確認。
     ※権限設定を後から変えた場合は、トークンをRegenerateし直してください）

### 3. GitHubにキーを登録（Secrets）

ブラウザで登録する場合：
https://github.com/teraso-harumi-kakekko/teraso-harumi-kakekko.github.io/settings/secrets/actions
「New repository secret」から、次の4つを **この名前のとおり** 登録してください。

| Name | 入れる値 |
|---|---|
| `X_API_KEY` | API Key |
| `X_API_SECRET` | API Key Secret |
| `X_ACCESS_TOKEN` | Access Token |
| `X_ACCESS_TOKEN_SECRET` | Access Token Secret |

ターミナル（GitHub CLI）で登録する場合（1行ずつ実行し、値を貼り付けてEnter）：

```bash
gh secret set X_API_KEY --repo teraso-harumi-kakekko/teraso-harumi-kakekko.github.io
```

```bash
gh secret set X_API_SECRET --repo teraso-harumi-kakekko/teraso-harumi-kakekko.github.io
```

```bash
gh secret set X_ACCESS_TOKEN --repo teraso-harumi-kakekko/teraso-harumi-kakekko.github.io
```

```bash
gh secret set X_ACCESS_TOKEN_SECRET --repo teraso-harumi-kakekko/teraso-harumi-kakekko.github.io
```

### 4. テスト実行

1. https://github.com/teraso-harumi-kakekko/teraso-harumi-kakekko.github.io/actions を開く
2. 左の「週次X告知投稿」→ 右の「Run workflow」
3. まず **dry_run: チェックあり** で実行 → ログに投稿文面が表示されるので確認
4. 問題なければ **dry_run: チェックなし** で実行 → 実際にXへ1件投稿されます

これ以降は毎週木曜19:00に自動で投稿されます。

---

## ふだんの運用

- **文面を変えたい** → `scripts/post_template.txt` を編集してプッシュ（`{date}` は残す）
- **お休みの週** → `scripts/skip_dates.txt` にその土曜日を `2026-12-26` の形式で追記
- **曜日・時刻を変えたい** → `weekly-x-post.yml` のcronを変更（UTC指定なのでJSTから9時間引く）
  - 例：金曜 朝8:00 JST → `0 23 * * 4`（木曜23:00 UTC）
  - 例：水曜 19:00 JST → `0 10 * * 3`
- **投稿が長すぎるとエラーになります**（Xの上限280。全角はほぼ2文字換算）。dry_runで文字数を確認できます

## 注意点

- 雨天中止の判断は自動投稿ではできません。**中止連絡は従来どおり当日朝のLINE**で行ってください（文面にもその旨を入れてあります）
- GitHub Actionsのスケジュールは数分〜数十分遅れることがあります（無料版の仕様）
- APIキーは絶対にファイルやチャットに貼らず、Secrets登録だけに使ってください
- **GitHubの仕様で、リポジトリに60日間なにも更新（プッシュ）がないと自動実行が停止します**。
  停止前にGitHubからメールが届くので、その場合は
  [Actionsページ](https://github.com/teraso-harumi-kakekko/teraso-harumi-kakekko.github.io/actions/workflows/weekly-x-post.yml)
  の「Enable workflow」を押せば再開します。お知らせ更新などでサイトを時々更新していれば止まりません
