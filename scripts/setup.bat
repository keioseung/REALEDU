@echo off
echo 🚀 AI Mastery Hub 프로젝트 설정을 시작합니다...

REM Python 가상환경 설정
echo ✅ Python 가상환경 설정 중...
cd backend
if not exist "venv" (
    python -m venv venv
    echo ✅ 가상환경이 생성되었습니다.
) else (
    echo ⚠️  가상환경이 이미 존재합니다.
)

REM 가상환경 활성화
call venv\Scripts\activate.bat

REM Python 의존성 설치
echo ✅ Python 의존성 설치 중...
pip install -r requirements.txt

REM 환경 변수 파일 생성
if not exist ".env" (
    echo ✅ 환경 변수 파일 생성 중...
    copy env.example .env
    echo ⚠️  backend/.env 파일을 수정하여 데이터베이스 연결 정보를 설정하세요.
) else (
    echo ⚠️  backend/.env 파일이 이미 존재합니다.
)

cd ..

REM Node.js 의존성 설치
echo ✅ Node.js 의존성 설치 중...
cd frontend
npm install

REM 프론트엔드 환경 변수 파일 생성
if not exist ".env.local" (
    echo ✅ 프론트엔드 환경 변수 파일 생성 중...
    copy env.local.example .env.local
) else (
    echo ⚠️  frontend/.env.local 파일이 이미 존재합니다.
)

cd ..

echo ✅ 설정이 완료되었습니다!
echo.
echo 다음 단계를 따라 애플리케이션을 실행하세요:
echo.
echo 1. 백엔드 실행:
echo    cd backend
echo    venv\Scripts\activate
echo    uvicorn main:app --reload --host 0.0.0.0 --port 8000
echo.
echo 2. 프론트엔드 실행 (새 명령 프롬프트에서):
echo    cd frontend
echo    npm run dev
echo.
echo 3. 브라우저에서 접속:
echo    http://localhost:3000
echo.
echo ⚠️  백엔드 API 문서: http://localhost:8000/docs
pause 