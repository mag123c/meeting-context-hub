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

