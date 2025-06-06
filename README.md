# AI Chat Hub Backend

## 환경 설정

1. Python 3.12 이상이 설치되어 있어야 합니다.

2. 가상환경 생성 및 활성화:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. 의존성 설치:
```bash
pip install -r requirements.txt
```

4. 환경 변수 설정:
프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 변수들을 설정합니다:

```env
# 서버 설정
HOST=0.0.0.0
PORT=8000
WORKERS=1
API_V1_STR=/api/v1

# 보안
SECRET_KEY=your-secret-key-here  # openssl rand -hex 32 로 생성 가능
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
REDIS_URL=redis://localhost:6379

# LLM API Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
```

SECRET_KEY는 다음 명령어로 생성할 수 있습니다:
```bash
# Windows PowerShell
openssl rand -hex 32

# Linux/Mac
openssl rand -hex 32
```

## 서버 실행

1. Redis 서버 설치 및 실행:
```bash
# Windows (WSL2 또는 Docker 사용 권장)
# WSL2의 경우:
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start

# Docker의 경우:
docker run --name redis -p 6379:6379 -d redis
```

2. 서버 실행:
```bash
python run_server.py
```

서버가 실행되면 다음 URL에서 API 문서를 확인할 수 있습니다:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 엔드포인트

### 인증
- POST `/api/v1/auth/token`: 로그인 및 토큰 발급
- GET `/api/v1/auth/me`: 현재 사용자 정보 조회

### 채팅
- POST `/api/v1/chat/{provider}`: 채팅 메시지 전송
- POST `/api/v1/chat/{provider}/stream`: 스트리밍 채팅 메시지 전송

### 대화 관리
- POST `/api/v1/conversations`: 새 대화 생성
- GET `/api/v1/conversations`: 대화 목록 조회
- GET `/api/v1/conversations/{conversation_id}`: 특정 대화 조회
- POST `/api/v1/conversations/{conversation_id}/messages`: 메시지 추가
- DELETE `/api/v1/conversations/{conversation_id}`: 대화 삭제

### 관리자
- GET `/api/v1/admin/status`: 시스템 상태 조회
- GET `/api/v1/admin/metrics`: 시스템 메트릭 조회
- POST `/api/v1/admin/config`: 시스템 설정 업데이트

## 개발 팁

1. API 테스트:
   - Swagger UI (http://localhost:8000/docs)를 사용하여 API를 테스트할 수 있습니다.
   - 먼저 `/auth/token` 엔드포인트로 로그인하여 토큰을 발급받으세요.
   - 발급받은 토큰을 Swagger UI의 Authorize 버튼을 클릭하여 입력하세요.

2. 로그 확인:
   - 서버 실행 시 자동으로 로그가 출력됩니다.
   - 에러가 발생하면 로그를 확인하여 문제를 파악할 수 있습니다.

3. 코드 변경:
   - `reload=True` 설정으로 인해 코드 변경 시 서버가 자동으로 재시작됩니다.
   - 변경사항이 즉시 반영됩니다. 