# Project Decisions

설계 결정 누적 기록. `/clarify` 완료 시 자동 추가.

## Format

```markdown
## YYYY-MM-DD: {feature-name}
- **결정**: 무엇을 결정했는가
- **이유**: 왜 이 선택을 했는가
- **대안**: 고려했으나 선택하지 않은 옵션 (있으면)
- **참조**: .dev/specs/{feature-name}/PLAN.md
```

---

<!-- Decisions below this line -->

## 2026-02-05: local-whisper-transcription

- **결정**: OpenAI Whisper API → 로컬 Whisper(whisper-node) 전환 + VAD 기반 오디오 분할
- **이유**:
  - API 과금 제거 ($0.006/분 → 무료)
  - 오프라인 사용 가능
  - VAD로 묵음 구간에서 분할하여 단어 끊김 방지
- **대안**:
  - whisper.cpp 직접 바인딩 → whisper-node가 이미 제공하므로 선택
  - WebRTC VAD → 단순 RMS 기반 충분, 추가 의존성 불필요
- **구현 노트**:
  - TranscriptionFactory로 mode(local/api/auto) 지원
  - auto 모드는 local 우선, 실패 시 API fallback
  - 모델 저장: `~/.mch/models/whisper/ggml-{model}.bin`

## 2026-02-06: release-please-migration

- **결정**: semantic-release → Release Please (PR 기반 릴리즈)
- **이유**:
  - semantic-release가 직접 push하여 중복 release 커밋 발생 (v2.20.0 × 8회)
  - CHANGELOG 오염, CI 재트리거 악순환
  - Release Please는 PR 기반이라 merge 전 리뷰 가능, 중복 없음
- **대안**:
  - semantic-release + `[skip ci]` 강화 → 근본 해결 아님, push 방식 한계
  - GitHub Actions 자체 release workflow → 버전 계산/CHANGELOG 수동 관리 필요
- **구현 노트**:
  - 전환 시 v2.20.0 태그 SHA가 main에 없어 전체 히스토리 스캔 → 태그 re-anchor로 해결
  - squash merge 내 BREAKING CHANGE 텍스트로 v3.0.0 오판 → v2.21.0 수동 릴리즈로 bootstrap
  - auto-merge는 branch protection 설정 필요 (현재 미설정, 수동 merge)
  - `paths-ignore`: CHANGELOG.md, .release-please-manifest.json, package.json

## 2026-02-23: openai-whisper-large-wav-fix

- **결정**: `transcribeSingleBuffer`에서 수동 `Blob/File` 생성 → OpenAI SDK `toFile()` 유틸리티 사용
- **이유**:
  - 20MB 초과 WAV 파일 transcription 시 "400 Invalid file format" 에러 발생
  - Node.js 환경에서 `Blob/File` 생성 방식이 OpenAI SDK와 호환되지 않음
  - OpenAI SDK의 `toFile()`이 Node.js 환경에서 buffer 업로드의 표준 방식
- **대안**:
  - `fs.writeFileSync`로 임시 파일 작성 후 `createReadStream` → 불필요한 I/O 오버헤드
  - `FormData` 직접 구성 → SDK가 이미 추상화 제공
- **추가 수정**:
  - `parseWavMetadata`: RIFF 스펙 홀수 청크 패딩 바이트 처리 추가
  - 청크 처리 실패 에러 메시지 한국어화 (사용자 대상 안내 개선)

## 2026-02-23: transcription-split-error-structuring

- **결정**: 대용량 WAV 분할 변환 에러를 구조화된 에러 코드로 세분화 + 비-PCM WAV 조기 차단
- **이유**:
  - raw OpenAI API 에러가 사용자에게 그대로 노출 → worklog-hub에서 문자열 패턴 매칭 필요
  - 구조화된 에러 코드(`TRANSCRIPTION_SPLIT_FAILED`, `TRANSCRIPTION_UNSUPPORTED_WAV_FORMAT`)로 앱 측 안정적 연계
  - 비-PCM WAV(IEEE float 등)는 PCM 기반 splitter/VAD에서 무의미한 처리 → 진입부에서 조기 차단
- **대안**:
  - 기존 `TRANSCRIPTION_FAILED` 하나로 통합 유지 → 앱 측에서 메시지 파싱 필요, 불안정
  - OpenAI API 호출 시점에서만 검증 → 불필요한 API 호출 비용 발생
- **구현 노트**:
  - `splitWavBuffer`, `splitWavBufferWithVad`, `splitByVad` 3개 진입점 모두 비-PCM 검증
  - `splitWavBufferWithVad` → `splitByVad` 경로에서 `parseWavMetadata` 이중 호출 (defense-in-depth, 성능 영향 무시 가능)

## 2026-02-23: ai-json-parse-resilience

- **결정**: Claude API 응답의 malformed JSON에 대한 repair 로직 추가 + SyntaxError → AI_EXTRACTION_FAILED 에러코드 분류
- **이유**:
  - 긴 transcript STT 후 Claude API가 trailing comma, unclosed bracket 등 malformed JSON 반환 시 복구 없이 즉시 실패
  - SyntaxError가 `detectErrorCode` fallback으로 `NETWORK_ERROR`로 오분류 → 사용자에게 잘못된 복구 안내
- **대안**:
  - `jsonrepair` npm 패키지 사용 → 추가 의존성 불필요, 실제 발생 패턴이 trailing comma/unclosed bracket 한정
  - Zod `.safeParse` + 기본값 fallback → 파싱 자체 실패이므로 Zod 도달 전 문제
- **구현 노트**:
  - `parseJsonResponse`: 정상 파싱 → repair 시도 → truncated fallback (closing brace 없는 경우) 3단계
  - `repairJson`: trailing comma 제거 + unclosed bracket/brace 자동 닫기 (문자열 내부 bracket은 미처리, 실제 AI 응답에서 발생 가능성 극히 낮음)
  - `extract`/`translate` 양쪽 catch 블록에 SyntaxError 분기 추가

## 2026-02-25: decision-entity

- **결정**: `ctx.decisions: string[]`을 독립 Decision 엔티티로 확장, Decision 테이블을 source of truth로 설정
- **이유**:
  - Decision 간 관계(supersede), 상태(active/superseded/pending) 관리 불가
  - 프로젝트 레벨 독립 조회 불가 (Context를 거쳐야 함)
- **대안**:
  - Tagged JSON 컬럼 (기존 decisions TEXT에 구조화 JSON) → 크로스-컨텍스트 조회 불가
  - 독립 운영 (eventual consistency) → 장기적 데이터 불일치
  - Write-through 동기화 → 결합도 높고 취약
- **구현 노트**:
  - `ctx.decisions: string[]` 타입 유지 (하위호환), decisions 테이블에서 active content 파생
  - `getContext`: 단일 추가 쿼리, list 메서드: batch IN 쿼리 (N+1 방지)
  - 백필: `_migrations` 플래그 + `INSERT OR IGNORE` + 트랜잭션 (멱등)
  - `deleteContext`에서 decisions 먼저 삭제 (FK ON 없이 명시적 DELETE)
  - `applyDerivedDecisions`는 항상 테이블 기준 (`?? []`), JSON 컬럼 fallback 없음
  - Decision 생성 실패 시 메인 파이프라인 보호 (try/catch)
- **참조**: .dev/specs/decision-entity/PLAN.md

## 2026-03-13: non-wav-split-support

- **결정**: 비-WAV 대용량 파일(m4a, mp3 등) 20MB 초과 시, ffmpeg로 PCM WAV 변환 후 기존 splitter 사용
- **이유**:
  - 기존 splitter(VAD + overlap merge)가 WAV 전용 — 비-WAV 파일에서 RIFF 헤더 검증 실패
  - OpenAI API 25MB 제한으로 대용량 비-WAV 직접 전송도 불가
  - ffmpeg 변환 → 기존 코드 재사용 극대화, splitter/VAD 수정 불필요
- **대안**:
  - ffmpeg으로 시간 기반 청크 분할 → 복잡도 높고 VAD/overlap merge 미활용
  - fluent-ffmpeg npm → ffmpeg 바이너리 필요한 건 동일, 불필요한 래퍼
  - 비-WAV는 split 없이 직접 전송 → 25MB 초과 해결 불가
- **참조**: .dev/specs/non-wav-split-support/PLAN.md

## 2026-02-24: zod-schema-array-default

- **결정**: `ExtractedContextSchema` 5개 배열 필드(`decisions`, `actionItems`, `policies`, `openQuestions`, `tags`)에 `.default([])` 적용
- **이유**:
  - Claude API가 optional 배열 필드를 생략하면 Zod validation 실패 → `AI_EXTRACTION_FAILED`
  - LLM은 프롬프트 지시에도 불구하고 빈 배열 필드를 생략할 수 있음 — 스키마에서 방어가 근본 해결
- **대안**:
  - 프롬프트에 "반드시 모든 필드 포함" 강조 → LLM 보장 불가, 근본 해결 아님
  - `.optional()` 사용 후 수동 `?? []` → `.default([])`가 Zod 관용적이고 간결

