# Meeting Context Hub - 구현 계획

## 프로젝트 개요

팀용 웹 애플리케이션: 회의록 PRD/Action Items 요약 + 컨텍스트 자동 태깅 → 옵시디언 저장

**참고**: MVP는 Supabase 사용, 향후 노션 DB로 교체 가능하도록 저장소 레이어 추상화

---

## 진행 상황

### Phase 1: 프로젝트 셋업 ✅ 완료
- [x] Next.js 프로젝트 생성 (App Router, TypeScript, Tailwind)
- [x] Supabase 클라이언트 설정 (client.ts, server.ts, middleware.ts)
- [x] 환경변수 설정 (.env.local.example)
- [x] DB 마이그레이션 스크립트 작성
- [x] 인증 (Supabase Auth) 구현 - 로그인/회원가입 페이지

### Phase 2: 핵심 인프라 ✅ 완료
- [x] Claude SDK 래퍼 구현 (lib/ai/claude.ts)
- [x] 저장소 인터페이스 정의 (repositories/)
- [x] Zod 타입 스키마 정의 (repositories/types/)
- [x] Supabase 저장소 구현체 (storage/supabase/)
- [x] Obsidian 저장소 구현체 (storage/obsidian/)
- [x] 프롬프트 정의 (lib/ai/prompts/)

### Phase 3: 회의록 요약 기능 ✅ 완료
- [x] 회의록 입력 UI (MeetingForm)
- [x] PRD 추출 프롬프트 및 API
- [x] Action Items 추출 프롬프트 및 API
- [x] 옵시디언 마크다운 생성/저장
- [x] DB 저장
- [x] 상세 페이지 (PRDSummary, ActionItemList)

### Phase 4: 컨텍스트 그룹핑 기능 ✅ 완료
- [x] 컨텍스트 입력 UI (ContextForm)
- [x] 자동 태깅 프롬프트 및 API
- [x] 태그 생성/재활용 로직
- [x] 옵시디언 저장 (frontmatter 포함)
- [x] DB 저장
- [x] 상세 페이지 (ContextCard)

### Phase 5: 외부 연동 🔄 기본 구조만 완료
- [x] Slack API 클라이언트 기본 구조 (lib/external/slack.ts)
- [x] Notion API 클라이언트 기본 구조 (lib/external/notion.ts)
- [ ] Slack 연동 UI 및 API 라우트
- [ ] Notion 연동 UI 및 API 라우트
- [ ] 연동 설정 페이지

### Phase 6: 검색/트래킹 ✅ 완료
- [x] Q&A 검색 기능 (Claude 활용)
- [x] 검색 UI (SearchForm)
- [x] 대시보드 UI

### .claude/ 설정 ✅ 완료
- [x] ai-context 구조 (meeting-domain, integrations)
- [x] Skills (clarify, vs-design, verify, mch-wrap)
- [x] Hooks (clarify-prompt.sh, settings.json)

---

## 다음 작업 태스크

### 우선순위 1: 필수 설정
1. **Supabase 프로젝트 생성 및 연결**
   - Supabase 대시보드에서 프로젝트 생성
   - 환경변수 설정 (.env.local)
   - DB 마이그레이션 적용

2. **Claude API 키 설정**
   - ANTHROPIC_API_KEY 환경변수 설정

3. **Obsidian Vault 경로 설정**
   - OBSIDIAN_VAULT_PATH 환경변수 설정
   - meetings/, contexts/ 폴더 생성

### 우선순위 2: 기능 개선
4. **Slack 연동 완성**
   - Slack App 생성 및 Bot Token 발급
   - /api/sync/slack 라우트 구현
   - 채널 선택 UI
   - 메시지 가져오기 → 컨텍스트 변환

5. **Notion 연동 완성**
   - Notion Integration 생성
   - /api/sync/notion 라우트 구현
   - 페이지 검색 UI
   - 페이지 내용 가져오기 → 컨텍스트 변환

6. **연동 설정 페이지**
   - /settings 페이지 생성
   - Slack/Notion 연결 상태 표시
   - API 키 설정 UI (선택적)

### 우선순위 3: UX 개선
7. **페이지네이션**
   - 대시보드 무한 스크롤 또는 페이지네이션 UI
   - API 쿼리 파라미터 활용

8. **태그 관리**
   - 태그 목록 페이지
   - 태그 편집/삭제 기능
   - 태그별 필터링

9. **검색 개선**
   - 실시간 검색 (debounce)
   - 검색 히스토리
   - 필터 (날짜, 출처, 태그)

### 우선순위 4: 팀 기능
10. **팀/워크스페이스**
    - 팀 생성/초대 기능
    - 팀별 데이터 격리
    - 공유 태그 관리

---

## 환경변수 체크리스트

```env
# 필수
NEXT_PUBLIC_SUPABASE_URL=        # ⬜ 설정 필요
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # ⬜ 설정 필요
SUPABASE_SERVICE_ROLE_KEY=       # ⬜ 설정 필요
ANTHROPIC_API_KEY=               # ⬜ 설정 필요
OBSIDIAN_VAULT_PATH=             # ⬜ 설정 필요

# 선택 (외부 연동)
SLACK_BOT_TOKEN=                 # ⬜ 선택
NOTION_API_KEY=                  # ⬜ 선택
```

---

## 테스트 체크리스트

### 회의록 요약
- [ ] 회의록 입력 → PRD 요약 생성 확인
- [ ] Action Items 추출 확인
- [ ] Obsidian 파일 생성 확인
- [ ] 태그 자동 생성/재활용 확인

### 컨텍스트 그룹핑
- [ ] 컨텍스트 입력 → 태그 추출 확인
- [ ] 기존 태그 재활용 확인
- [ ] Obsidian 파일 생성 확인

### 검색
- [ ] Q&A 검색 → 관련 정보 기반 답변 확인
- [ ] 출처 표시 확인

### 팀 사용
- [ ] 다른 계정으로 로그인 → 데이터 격리 확인

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| UI | shadcn/ui, Lucide Icons |
| Backend | Next.js API Routes, Server Actions |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Claude API (Anthropic SDK) |
| 저장소 | Obsidian (로컬 파일) |
| 검증 | Zod |

---

## 참고 문서

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Anthropic SDK](https://docs.anthropic.com/en/api/client-sdks)
- [shadcn/ui](https://ui.shadcn.com/)
