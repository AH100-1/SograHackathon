#!/usr/bin/env bash
# CSRF 공격: x-csrf-token 헤더 없이 결제·리뷰 요청
# 기대 동작: 403 missing_csrf_token

: "${BASE:?BASE 환경변수를 설정하세요}"
: "${COOKIE_JAR:=cookies.txt}"

echo "🔴 공격 요청: csrf 헤더 없는 리뷰 POST"
curl -i -X POST "$BASE/api/reviews" \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -d '{"product_id":"22222222-2222-2222-2222-000000000001","content":"공격","rating":5}'

echo ""
echo "🟢 기대: HTTP/1.1 403 + {\"error\":\"missing_csrf_token\"}"
