#!/usr/bin/env bash
# SSRF 공격: 상품 이미지 URL 에 내부 메타데이터/localhost 주소 입력
# 기대 동작: ssrf_blocked / host_not_allowed 응답

: "${BASE:?BASE 환경변수를 설정하세요}"
: "${CSRF:?CSRF 토큰을 설정하세요}"
: "${COOKIE_JAR:=cookies.txt}"
: "${STORE_ID:?시연용 STORE_ID 환경변수를 설정하세요}"

echo "🔴 공격 1: AWS 메타데이터 IP (169.254.169.254)"
curl -i -X POST "$BASE/api/products" \
  -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d "$(jq -n --arg sid "$STORE_ID" \
    '{store_id:$sid, name:"공격", price:1000, stock:1,
      image_url:"http://169.254.169.254/latest/meta-data/iam/security-credentials/",
      tags:[]}')"

echo ""
echo "🔴 공격 2: localhost 파일 (http://localhost:3000/.env)"
curl -i -X POST "$BASE/api/products" \
  -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d "$(jq -n --arg sid "$STORE_ID" \
    '{store_id:$sid, name:"공격", price:1000, stock:1,
      image_url:"http://localhost:3000/.env",
      tags:[]}')"

echo ""
echo "🔴 공격 3: 사설망 (192.168.x.x)"
curl -i -X POST "$BASE/api/products" \
  -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d "$(jq -n --arg sid "$STORE_ID" \
    '{store_id:$sid, name:"공격", price:1000, stock:1,
      image_url:"http://192.168.1.1/admin",
      tags:[]}')"

echo ""
echo "🟢 기대: 모두 400 + ssrf_blocked / host_not_allowed / internal_host_blocked"
