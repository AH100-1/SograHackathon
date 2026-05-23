# 🎁 사랑담은 — 로컬 선물 오마카세

> **SOGRA Hackathon 2026 · 경제 트랙** · ARGOS · 충남대학교

예산과 받는 사람 정보만 입력하면, AI가 **대전충청 소상공인 상품**으로
맞춤 선물 세트를 큐레이션해주는 플랫폼입니다.

카카오 선물하기에는 없는 동네 수제품·로컬 특산물을 Claude AI 가 조합하고,
소상공인의 정성 어린 스토리를 자동 생성합니다.

---

## ⚙️ 기술 스택

- **Frontend & Backend**: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui
- **DB & Auth**: Supabase (Postgres + RLS + Auth)
- **AI**: Anthropic Claude (`claude-opus-4-7`)
- **상태 관리**: Zustand (장바구니)
- **보안**: DOMPurify (XSS), double-submit cookie CSRF, Zod, 자체 BruteForce·SSRF·Upload 검사

---

## 🚀 시작하기

### 1. 환경변수 설정

`.env.example` 을 복사하여 `.env.local` 을 만들고 값을 채워주세요.

```bash
cp .env.example .env.local
```

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 (서버 전용) |
| `ANTHROPIC_API_KEY` | Anthropic API 키 |
| `ANTHROPIC_MODEL` | 기본 `claude-opus-4-7` |
| `ALLOWED_IMAGE_HOSTS` | SSRF allowlist (콤마 구분) |

### 2. Supabase 스키마/시드 적용

Supabase 콘솔의 SQL Editor 에서 아래 순서로 실행합니다.

1. `supabase/migrations/0001_init.sql` — 테이블 + RLS 정책 + 트리거
2. `supabase/seed.sql` — 데모용 가게 10개 + 상품 10개

> **Storage 버킷**: 파일 업로드 데모를 사용하려면 `uploads` 라는 공개 버킷을
> Supabase Storage 에서 생성해주세요.

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

http://localhost:3000 접속.

---

## 📄 페이지 구조

| 경로 | 설명 | 접근 권한 |
|---|---|---|
| `/` | 홈 + 선물 입력 폼 + 인기 상품 | 누구나 |
| `/products` | 전체 상품 목록 | 누구나 |
| `/product/[id]` | 상품 상세 + 리뷰 | 누구나 |
| `/recommend` | AI 추천 결과 (세트 3개) | 누구나 |
| `/cart` | 장바구니 + 결제 (CSRF 보호) | 로그인 필요 |
| `/orders/[id]` | 주문 완료 화면 | 본인만 |
| `/seller` | 가게 + 상품 등록 (SSRF 보호) | seller / admin |
| `/admin` | 통계 + 상품 승인 + BruteForce 로그 | admin 전용 |
| `/login`, `/signup` | 인증 | 누구나 |

---

## 🛡 보안 7종 적용 위치 매트릭스

| # | 공격 | 방어 위치 | 파일 |
|---|---|---|---|
| 1 | **XSS** | 리뷰·상품설명 입력 시 sanitize, 렌더 시 DOMPurify 정제본만 출력 | `lib/security/sanitize.ts`, `app/api/reviews/route.ts`, `components/review-section.tsx` |
| 2 | **CSRF** | double-submit cookie + `x-csrf-token` 헤더 검증 | `middleware.ts`, `lib/security/csrf.ts`, `lib/csrf-client.ts` |
| 3 | **SQL Injection** | Supabase ORM 자동 Prepared Statement + Zod 입력 검증 | `app/api/**/route.ts` (모든 라우트) |
| 4 | **SSRF** | 외부 이미지 URL 등록 시 호스트 화이트리스트 + 내부 IP 차단 | `lib/security/ssrf.ts`, `app/api/products/route.ts` |
| 5 | **BruteForce** | 동일 이메일 15분간 5회 실패 시 잠금 + 429 응답 | `lib/security/bruteforce.ts`, `app/api/auth/login/route.ts`, `login_attempts` 테이블 |
| 6 | **RBAC** | Next.js middleware + 라우트 핸들러 `requireRole` + Supabase RLS 이중 방어 | `middleware.ts`, `lib/security/rbac.ts`, `supabase/migrations/0001_init.sql` |
| 7 | **파일 업로드** | MIME + 확장자 + 매직넘버 검사 | `lib/security/upload.ts`, `app/api/upload/route.ts` |

---

## 🤖 AI 큐레이션 흐름

```
사용자 입력 (예산·대상·occasion·취향)
        ↓
Supabase: 예산의 80% 이하 상품 조회 (조합 여유)
        ↓
Claude Opus 4.7: JSON 응답으로 세트 3개 추천
  - title (감성 제목)
  - story (50자 스토리)
  - product_ids (DB의 id 만 사용)
        ↓
서버: 응답 검증 + 가격 재계산 + sanitize
        ↓
프론트: 세트 카드 3장 렌더링 + "세트 담기" 버튼
```

---

## 🎭 보안 공격 시연

`scripts/security-demo/` 디렉토리에 7개의 공격 시연 스크립트가 있습니다.

```bash
cd scripts/security-demo
./xss.sh         # XSS payload → DOMPurify 제거
./csrf.sh        # CSRF 토큰 없는 요청 → 403
./sqli.sh        # ' OR 1=1 -- → ORM 이스케이프
./ssrf.sh        # 169.254.169.254 → 차단
./bruteforce.sh  # 6회 실패 → 429
./rbac.sh        # buyer 가 /admin → redirect / 403
./upload.sh      # PHP 웹쉘 → 매직넘버 거부
```

자세한 실행 가이드: `scripts/security-demo/README.md`

---

## 📊 발표 데이터

- 국내 선물하기 시장 **5조 원**, 카카오톡 선물하기 점유율 **70% 이상** (2022, 카카오)
- 온라인 e쿠폰 거래액 **9조 8,820억 원** (2023), 연 20%+ 성장
- 소상공인 경영 애로 1위 **경쟁 심화 61%**, 3위 **상권 쇠퇴 33.5%** (중기부 2024)

---

*ARGOS · 충남대학교 · 2026.05.23–24*
