#!/usr/bin/env bash
# SQL Injection 시도: 상품 검색 쿼리에 OR 1=1 삽입
# 기대 동작: Supabase ORM 의 Prepared Statement 가 이스케이프하여 결과 0건

: "${BASE:?BASE 환경변수를 설정하세요}"

PAYLOAD="' OR 1=1 --"
ENCODED=$(printf %s "$PAYLOAD" | jq -sRr @uri)

echo "🔴 공격 요청: 검색어 = $PAYLOAD"
echo ""
curl -i "$BASE/api/products?q=$ENCODED"

echo ""
echo "🟢 기대: 200 OK 이지만 결과는 빈 배열 (또는 정확히 매칭되는 상품만)."
echo "   서버 로그에 SQL 에러가 나오지 않습니다 — ORM 이 이스케이프 처리."
