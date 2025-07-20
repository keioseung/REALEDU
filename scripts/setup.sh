#!/bin/bash

echo "🚀 AI Mastery Hub 프로젝트 설정을 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수 정의
print_step() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Python 가상환경 설정
print_step "Python 가상환경 설정 중..."
cd backend
if [ ! -d "venv" ]; then
    python -m venv venv
    print_step "가상환경이 생성되었습니다."
else
    print_warning "가상환경이 이미 존재합니다."
fi

# 가상환경 활성화
source venv/bin/activate

# Python 의존성 설치
print_step "Python 의존성 설치 중..."
pip install -r requirements.txt

# 환경 변수 파일 생성
if [ ! -f ".env" ]; then
    print_step "환경 변수 파일 생성 중..."
    cp env.example .env
    print_warning "backend/.env 파일을 수정하여 데이터베이스 연결 정보를 설정하세요."
else
    print_warning "backend/.env 파일이 이미 존재합니다."
fi

cd ..

# Node.js 의존성 설치
print_step "Node.js 의존성 설치 중..."
cd frontend
npm install

# 프론트엔드 환경 변수 파일 생성
if [ ! -f ".env.local" ]; then
    print_step "프론트엔드 환경 변수 파일 생성 중..."
    cp env.local.example .env.local
else
    print_warning "frontend/.env.local 파일이 이미 존재합니다."
fi

cd ..

print_step "설정이 완료되었습니다!"
echo ""
echo "다음 단계를 따라 애플리케이션을 실행하세요:"
echo ""
echo "1. 백엔드 실행:"
echo "   cd backend"
echo "   source venv/bin/activate  # Windows: venv\\Scripts\\activate"
echo "   uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "2. 프론트엔드 실행 (새 터미널에서):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. 브라우저에서 접속:"
echo "   http://localhost:3000"
echo ""
print_warning "백엔드 API 문서: http://localhost:8000/docs" 