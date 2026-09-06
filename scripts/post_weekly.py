#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""晴海かけっこ教室：週次のX(旧Twitter)告知投稿スクリプト

- 次の土曜日の日付を計算し、post_template.txt の {date} に埋め込んで投稿する
- skip_dates.txt に書かれた日付（お休みの土曜）は投稿をスキップする
- 環境変数 DRY_RUN=1 のときは投稿せず、文面と文字数だけ表示する

必要な環境変数（GitHub Secretsから渡される）:
  X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET
"""
import datetime
import os
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
# 日本標準時（夏時間がないため固定オフセットで正確）
JST = datetime.timezone(datetime.timedelta(hours=9), name="JST")
POST_URL = "https://api.twitter.com/2/tweets"

# Xの文字数カウントで「1文字」扱いになるコードポイント範囲（それ以外は2文字扱い）
_WEIGHT1 = (
    (0x0000, 0x10FF),
    (0x2000, 0x200D),
    (0x2010, 0x201F),
    (0x2032, 0x2037),
)


def weighted_length(text: str) -> int:
    """Xの重み付き文字数（上限280）を概算する。URLは一律23文字扱い。"""
    total = 0
    for part in re.split(r"(https?://\S+)", text):
        if part.startswith(("http://", "https://")):
            total += 23
            continue
        for ch in part:
            cp = ord(ch)
            total += 1 if any(lo <= cp <= hi for lo, hi in _WEIGHT1) else 2
    return total


def next_saturday(now: datetime.datetime) -> datetime.date:
    """次に開催される土曜日を返す（土曜10時以降に実行された場合は翌週の土曜）。"""
    days = (5 - now.weekday()) % 7  # Monday=0 ... Saturday=5
    if days == 0 and now.hour >= 10:
        days = 7
    return (now + datetime.timedelta(days=days)).date()


def load_skip_dates() -> set:
    path = BASE / "skip_dates.txt"
    dates = set()
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.split("#", 1)[0].strip()
            if line:
                dates.add(line)
    return dates


def main() -> int:
    now = datetime.datetime.now(JST)
    target = next_saturday(now)
    assert target.weekday() == 5, "計算結果が土曜日ではありません"

    iso = target.isoformat()
    if iso in load_skip_dates():
        print(f"[SKIP] {iso} は skip_dates.txt に含まれているため投稿しません。")
        return 0

    template = (BASE / "post_template.txt").read_text(encoding="utf-8")
    date_label = f"{target.month}月{target.day}日(土)"
    text = template.replace("{date}", date_label).strip() + "\n"
    text = text.rstrip("\n")

    length = weighted_length(text)
    print("----- 投稿文面 -----")
    print(text)
    print("--------------------")
    print(f"重み付き文字数: {length}/280")

    if length > 280:
        print("[ERROR] 文字数が280を超えています。post_template.txt を短くしてください。")
        return 1

    if os.environ.get("DRY_RUN") == "1":
        print("[DRY RUN] お試し実行のため、実際には投稿していません。")
        return 0

    keys = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"]
    missing = [k for k in keys if not os.environ.get(k)]
    if missing:
        print(f"[ERROR] Secretsが未設定です: {', '.join(missing)}")
        print("リポジトリの Settings > Secrets and variables > Actions で登録してください。")
        return 1

    from requests_oauthlib import OAuth1Session

    session = OAuth1Session(
        os.environ["X_API_KEY"],
        client_secret=os.environ["X_API_SECRET"],
        resource_owner_key=os.environ["X_ACCESS_TOKEN"],
        resource_owner_secret=os.environ["X_ACCESS_TOKEN_SECRET"],
    )
    resp = session.post(POST_URL, json={"text": text})
    if resp.status_code != 201:
        print(f"[ERROR] 投稿に失敗しました: HTTP {resp.status_code}")
        print(resp.text)
        return 1

    tweet_id = resp.json().get("data", {}).get("id", "?")
    print(f"[OK] 投稿しました (id: {tweet_id})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
