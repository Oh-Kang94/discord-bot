# 1. 공식 Node.js 이미지 기반으로 설정
FROM node:18-slim

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 필요한 파일들을 컨테이너로 복사
COPY package.json package-lock.json tsconfig.json ./

# 4. 의존성 설치
RUN npm install

# 5. 소스 코드 복사
COPY src ./src

# 6. TypeScript 컴파일 및 빌드
RUN npm run build

# 7. 환경 변수를 설정 (예: .env 파일)
COPY .env .env

# 8. 실행 명령어 (prod용)
CMD ["npm", "run", "start:prod"]

# 컨테이너가 사용할 포트 (필요한 경우)
EXPOSE 3000
