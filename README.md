# Meeting Context Hub

멀티모달 입력(텍스트/이미지/음성/파일/회의록)을 AI로 처리하여 Obsidian에 저장하는 CLI 도구.
태그 + 임베딩 기반 의미론적 검색으로 연관 컨텍스트를 찾아줍니다.

## Features

- 📝 **텍스트** - 메모, 아이디어 저장
- 🖼️ **이미지** - Claude Vision으로 분석 및 태그 추출
- 🎤 **음성** - Whisper로 텍스트 변환
- 📄 **파일** - txt, md, csv, json 지원
- 📋 **회의록** - PRD 형식 요약 + Action Items 자동 추출
- 🔍 **의미론적 검색** - 임베딩 기반 유사 문서 검색
- 🏷️ **자동 태깅** - AI가 관련 태그 자동 생성
- 📊 **Obsidian 통합** - Graph View, Dataview 쿼리 지원

## Installation

### Prerequisites

- Node.js >= 20.0.0
- [Obsidian](https://obsidian.md/) (선택, 저장소로 사용)

### Install

```bash
# Clone
git clone https://github.com/mag123c/meeting-context-hub.git
cd meeting-context-hub

# Install dependencies
pnpm install

# Build
pnpm build

# Global install (optional)
npm link
```

## Configuration

### API Keys 설정

**방법 1: macOS 키체인 (권장)**

```bash
mch config set ANTHROPIC_API_KEY sk-ant-xxx
mch config set OPENAI_API_KEY sk-xxx
```

**방법 2: 환경변수**

```bash
cp .env.local.example .env.local
# .env.local 파일 편집
```

### Obsidian Vault 설정

```bash
# 기본값: ~/Library/Mobile Documents/iCloud~md~obsidian/Documents
mch config set OBSIDIAN_VAULT_PATH /path/to/your/vault

# 저장 폴더 (기본값: mch)
mch config set MCH_FOLDER mch
```

### 설정 확인

```bash
mch config show   # 현재 설정 확인
mch config check  # API 키 상태 확인
```

## Usage

### 컨텍스트 추가

```bash
# 텍스트
mch add -t "오늘 회의에서 결정된 사항들..."

# 이미지 (Claude Vision 분석)
mch add -i ./screenshot.png

# 음성 (Whisper 변환)
mch add -a ./recording.m4a

# 파일
mch add -f ./notes.md

# 대화형 모드
mch add
```

### 회의록 요약

```bash
mch add -m ./meeting-transcript.txt
```

**출력 형식:**
- 📋 회의 요약
- 🎯 핵심 결정사항
- ✅ Action Items (담당자, 기한)
- 💡 주요 논의 포인트
- ❓ 미해결 이슈
- 📅 다음 단계

### 검색

```bash
# 의미론적 검색 (기본)
mch search "프로젝트 일정"

# 정확한 텍스트 매칭
mch search "API" --exact

# 유사 문서 찾기
mch search --similar <context-id>

# 태그로 필터
mch search --tag "회의"
```

### 목록 조회

```bash
# 전체 목록
mch list

# 태그 필터
mch list --tag "회의"

# 타입 필터
mch list --type image

# 페이지네이션
mch list -l 10 -o 20
```

## Obsidian Integration

### 파일 구조

컨텍스트는 `{vault}/{mch-folder}/` 에 저장됩니다:

```
~/Obsidian/Vault/mch/
├── 회의록-요약-시딩캠페인_a1b2c3d4.md
├── CLI-테스트-이미지분석_e5f6g7h8.md
└── 📊 Dataview 쿼리 예시.md
```

### Frontmatter

```yaml
---
id: a1b2c3d4-...
type: text
summary: 요약 내용
tags:
  - 회의
  - 프로젝트
embedding: [0.1, 0.2, ...]
createdAt: 2024-01-01T00:00:00.000Z
---
```

### Dataview 쿼리 예시

```dataview
TABLE type AS "타입", summary AS "요약"
FROM ""
WHERE id
SORT createdAt DESC
```

### Graph View

태그 기반으로 연결된 노트들을 시각화할 수 있습니다.

## Supported Formats

| 타입 | 확장자 | 처리 방식 |
|------|--------|-----------|
| 텍스트 | - | 직접 입력 |
| 이미지 | jpg, png, gif, webp | Claude Vision |
| 음성 | mp3, m4a, wav, webm | Whisper API |
| 파일 | txt, md, csv, json | 텍스트 추출 |
| 회의록 | txt, md | PRD 요약 |

## Development

```bash
# 개발 모드
pnpm dev

# 빌드
pnpm build

# 린트
pnpm lint
pnpm lint:fix
```

## Tech Stack

- **CLI**: Commander.js, Inquirer, Chalk, Ora
- **AI**: Claude API (Anthropic), Whisper & Embedding (OpenAI)
- **Storage**: Obsidian (gray-matter for frontmatter)
- **Validation**: Zod

## License

MIT
