# 🛡 보안 공격 시연 스크립트

발표 시 실제 공격을 시도하고 시스템이 차단하는 모습을 보여주기 위한 스크립트들입니다.

## 사전 준비

```bash
# 1) 개발 서버 실행
npm run dev

# 2) 환경변수 (다른 터미널)
export BASE=http://localhost:3000

# 3) 로그인하여 인증 쿠키 + CSRF 토큰을 확보
# 브라우저로 /login 후, 쿠키를 jar 파일로 저장한 뒤
# CSRF 토큰 추출
export CSRF=$(grep sogra_csrf cookies.txt | awk '{print $7}')
```

## 7가지 공격 시연

| 번호 | 공격 | 스크립트 | 기대 결과 |
|---|---|---|---|
| 1 | XSS | `./xss.sh` | `<script>` 제거된 안전한 HTML 만 저장 |
| 2 | CSRF | `./csrf.sh` | 403 `missing_csrf_token` 응답 |
| 3 | SQL Injection | `./sqli.sh` | Supabase ORM이 escape, 결과 0건 |
| 4 | SSRF | `./ssrf.sh` | 400 `ssrf_blocked` 응답 |
| 5 | BruteForce | `./bruteforce.sh` | 6번째 시도부터 429 |
| 6 | RBAC | `./rbac.sh` | 일반 사용자는 /admin 접근 시 / 로 리다이렉트 |
| 7 | 파일 업로드 | `./upload.sh` | 400 `magic_number_mismatch` 등으로 거부 |
