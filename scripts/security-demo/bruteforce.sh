#!/usr/bin/env bash
# BruteForce 공격: 동일 이메일로 6회 잘못된 비밀번호 시도
# 기대 동작: 6번째 요청부터 429 Too Many Requests + Retry-After

: "${BASE:?BASE 환경변수를 설정하세요}"
: "${CSRF:?CSRF 토큰을 설정하세요 (브라우저에서 / 한 번 방문하여 받아오세요)}"
: "${COOKIE_JAR:=cookies.txt}"
: "${VICTIM_EMAIL:=victim@example.com}"

for i in 1 2 3 4 5 6 7; do
  echo "🔴 시도 #$i — 잘못된 비밀번호"
  STATUS=$(curl -s -o /tmp/bf.json -w "%{http_code}" -X POST "$BASE/api/auth/login" \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -H "x-csrf-token: $CSRF" \
    -d "{\"email\":\"$VICTIM_EMAIL\",\"password\":\"wrong-password-$i\"}")
  echo "  status: $STATUS, body: $(cat /tmp/bf.json)"
done

echo ""
echo "🟢 기대: 1~5 → 401, 6+ → 429 + retryAfterSeconds 필드"
echo "    DB의 login_attempts 테이블에 실패 기록이 남아있고,"
echo "    /admin 페이지의 'BruteForce 모니터링' 섹션에서 확인 가능."
