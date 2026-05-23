#!/usr/bin/env bash
# 파일 업로드 공격: 1) PHP 웹쉘 .php, 2) .jpg 위장한 텍스트 파일
# 기대 동작:
#  - PHP: mime_not_allowed / extension_not_allowed
#  - 위장: magic_number_mismatch

: "${BASE:?BASE 환경변수를 설정하세요}"
: "${CSRF:?CSRF 토큰을 설정하세요}"
: "${COOKIE_JAR:=cookies.txt}"

TMP=$(mktemp -d)

echo "<?php system(\$_GET['cmd']); ?>" > "$TMP/shell.php"
echo "공격용 텍스트 입니다" > "$TMP/fake.jpg"

echo "🔴 공격 1: PHP 웹쉘 업로드"
curl -i -X POST "$BASE/api/upload" \
  -b "$COOKIE_JAR" -H "x-csrf-token: $CSRF" \
  -F "file=@$TMP/shell.php;type=application/x-php"

echo ""
echo "🔴 공격 2: 확장자만 .jpg 인 텍스트 파일"
curl -i -X POST "$BASE/api/upload" \
  -b "$COOKIE_JAR" -H "x-csrf-token: $CSRF" \
  -F "file=@$TMP/fake.jpg;type=image/jpeg"

echo ""
echo "🟢 기대: 모두 400 — mime/extension/magic_number 검사로 차단"
rm -rf "$TMP"
