#!/usr/bin/env bash
# RBAC 우회 시도: buyer 권한의 사용자가 /admin 페이지와 admin API 호출
# 기대 동작:
#  - GET /admin → 307 redirect to /
#  - PATCH /api/admin/products/:id → 403 forbidden

: "${BASE:?BASE 환경변수를 설정하세요}"
: "${CSRF:?CSRF 토큰을 설정하세요}"
: "${COOKIE_JAR:=cookies.txt}"

echo "🔴 공격 1: buyer 계정으로 /admin 진입 (HTTP)"
curl -i -o /dev/null -w "status=%{http_code} -> %{redirect_url}\n" \
  -b "$COOKIE_JAR" "$BASE/admin"

echo ""
echo "🔴 공격 2: buyer 계정으로 상품 강제 승인 API 호출"
curl -i -X PATCH "$BASE/api/admin/products/22222222-2222-2222-2222-000000000001" \
  -b "$COOKIE_JAR" -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF" \
  -d '{"approve":true}'

echo ""
echo "🟢 기대: 1) 307 → /, 2) 403 forbidden"
echo "    Supabase RLS 정책으로 DB 레벨에서도 차단됨 (이중 방어)"
