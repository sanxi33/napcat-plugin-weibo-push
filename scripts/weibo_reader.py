#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
from html import unescape

import requests

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

MOBILE_UA = (
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Mobile Safari/537.36"
)


def build_session(cookie: str | None) -> requests.Session:
    s = requests.Session()
    s.headers.update(
        {
            "User-Agent": MOBILE_UA,
            "Accept": "application/json,text/plain,*/*",
            "Referer": "https://m.weibo.cn/",
        }
    )
    if cookie:
        s.headers["Cookie"] = cookie
    return s


def strip_html(text: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return unescape(text).strip()


def parse_uid_from_profile(url: str) -> str | None:
    m = re.search(r"/u/(\d+)", url)
    if m:
        return m.group(1)
    m = re.search(r"weibo\.com/(\d+)", url)
    if m:
        return m.group(1)
    return None


def resolve_uid_by_name(session: requests.Session, name: str) -> str | None:
    q = requests.utils.quote(name)
    url = f"https://m.weibo.cn/api/container/getIndex?containerid=100103type%3D1%26q%3D{q}"
    r = session.get(url, timeout=20)
    r.raise_for_status()
    data = r.json()
    cards = (data.get("data") or {}).get("cards") or []
    for card in cards:
        for item in card.get("card_group", []) or []:
            user = item.get("user") or {}
            uid = user.get("id")
            if uid:
                return str(uid)
    return None


def fetch_user_posts_m(session: requests.Session, uid: str, limit: int) -> dict:
    containerid = f"107603{uid}"
    page = 1
    posts = []
    user_info = {}

    while len(posts) < limit:
        url = (
            "https://m.weibo.cn/api/container/getIndex"
            f"?containerid={containerid}&page_type=03&page={page}"
        )
        r = session.get(url, timeout=20)
        r.raise_for_status()
        payload = r.json()
        if payload.get("ok") not in (1, True):
            raise requests.RequestException(f"m_api_not_ok: {payload.get('ok')}")
        data = payload.get("data") or {}

        if not user_info:
            user_info = data.get("userInfo") or {}

        cards = data.get("cards") or []
        if not cards:
            break

        new_count = 0
        for card in cards:
            if card.get("card_type") != 9:
                continue
            mblog = card.get("mblog") or {}
            if not mblog:
                continue
            post_id = str(mblog.get("id") or "")
            bid = mblog.get("bid") or ""
            posts.append(
                {
                    "id": post_id,
                    "bid": bid,
                    "created_at": mblog.get("created_at"),
                    "text_raw": strip_html(mblog.get("text") or ""),
                    "reposts_count": mblog.get("reposts_count"),
                    "comments_count": mblog.get("comments_count"),
                    "attitudes_count": mblog.get("attitudes_count"),
                    "source": mblog.get("source"),
                    "url": f"https://m.weibo.cn/detail/{post_id}" if post_id else None,
                }
            )
            new_count += 1
            if len(posts) >= limit:
                break

        if new_count == 0:
            break
        page += 1

    return {
        "user": {
            "uid": str(user_info.get("id") or uid),
            "screen_name": user_info.get("screen_name"),
            "description": user_info.get("description"),
            "followers_count": user_info.get("followers_count"),
            "follow_count": user_info.get("follow_count"),
        },
        "posts": posts[:limit],
    }


def fetch_user_posts_ajax(session: requests.Session, uid: str, limit: int) -> dict:
    cookie = session.headers.get("Cookie", "")
    xsrf = ""
    m = re.search(r"XSRF-TOKEN=([^;]+)", cookie)
    if m:
        xsrf = m.group(1)

    headers = {
        "Referer": f"https://weibo.com/u/{uid}",
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    }
    if xsrf:
        headers["x-xsrf-token"] = xsrf

    r = session.get(
        f"https://weibo.com/ajax/statuses/mymblog?uid={uid}&page=1&feature=0",
        headers=headers,
        timeout=20,
    )
    r.raise_for_status()
    payload = r.json()
    data = payload.get("data") or {}
    lst = data.get("list") or []

    user = (lst[0].get("user") if lst else {}) or {}
    posts = []
    for item in lst[:limit]:
        post_id = str(item.get("id") or "")
        bid = item.get("mblogid") or item.get("bid") or ""
        posts.append(
            {
                "id": post_id,
                "bid": bid,
                "created_at": item.get("created_at"),
                "text_raw": strip_html(item.get("text_raw") or item.get("text") or ""),
                "reposts_count": item.get("reposts_count"),
                "comments_count": item.get("comments_count"),
                "attitudes_count": item.get("attitudes_count"),
                "source": item.get("source"),
                "url": f"https://weibo.com/{uid}/{bid}" if bid else None,
                "isTop": item.get("isTop") == 1,
            }
        )

    return {
        "user": {
            "uid": str(user.get("id") or uid),
            "screen_name": user.get("screen_name"),
            "description": user.get("description"),
            "followers_count": user.get("followers_count"),
            "follow_count": user.get("follow_count"),
        },
        "posts": posts,
    }


def fetch_user_posts(session: requests.Session, uid: str, limit: int) -> dict:
    try:
        return fetch_user_posts_m(session, uid, limit)
    except Exception:
        return fetch_user_posts_ajax(session, uid, limit)


def main() -> int:
    p = argparse.ArgumentParser(description="Fetch recent Weibo posts from m.weibo.cn")
    p.add_argument("--uid", help="Weibo uid")
    p.add_argument("--profile-url", help="weibo profile url, e.g. https://weibo.com/u/123")
    p.add_argument("--name", help="screen name / nickname")
    p.add_argument("--limit", type=int, default=10)
    p.add_argument("--cookie", help="Cookie header string")
    args = p.parse_args()

    cookie = args.cookie or os.getenv("WEIBO_COOKIE")
    session = build_session(cookie)

    uid = args.uid
    if not uid and args.profile_url:
        uid = parse_uid_from_profile(args.profile_url)
    if not uid and args.name:
        uid = resolve_uid_by_name(session, args.name)

    if not uid:
        print("Need --uid or resolvable --profile-url/--name", file=sys.stderr)
        return 2

    try:
        result = fetch_user_posts(session, uid, max(1, args.limit))
    except requests.HTTPError as e:
        print(f"HTTP error: {e}", file=sys.stderr)
        return 1
    except requests.RequestException as e:
        print(f"Request error: {e}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}", file=sys.stderr)
        return 1

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
