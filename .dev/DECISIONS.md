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

