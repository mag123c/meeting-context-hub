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

