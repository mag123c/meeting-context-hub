# Errors Directory

MCH의 통합 에러 처리 시스템.

## 에러 계층구조

```
MCHError (베이스)
├── NotFoundError
├── ValidationError
├── AIClientError
├── FileSystemError
└── ConfigError
```

## 각 에러 클래스

| 에러 | 코드 | 용도 |
|------|------|------|
| `MCHError` | - | 모든 커스텀 에러의 베이스 클래스 |
| `NotFoundError` | `NOT_FOUND` | 리소스를 찾을 수 없음 |
| `ValidationError` | `VALIDATION_ERROR` | 입력 검증 실패 |
| `AIClientError` | `AI_CLIENT_ERROR` | AI API 호출 실패 |
| `FileSystemError` | `FILE_SYSTEM_ERROR` | 파일 시스템 작업 실패 |
| `ConfigError` | `CONFIG_ERROR` | 설정 로드/검증 실패 |

## 사용 패턴

```typescript
import { NotFoundError, ValidationError } from "../errors/index.js";

if (!context) {
  throw new NotFoundError("Context", contextId);
}

if (!input.trim()) {
  throw new ValidationError("Content cannot be empty");
}
```

## 특징

- 모든 에러는 `code` 필드로 프로그래밍 방식 처리 가능
- `AIClientError`는 `provider` 필드로 어느 API 실패인지 추적
- `FileSystemError`는 `path` 필드로 문제 파일 경로 기록
