# mini-board

게시판 서비스 (Next.js + NestJS + MySQL + Elasticsearch)

## 실행 방법

### DevContainer
1. DevContainer로 프로젝트 열기
2. MySQL, Elasticsearch는 docker-compose로 자동 실행
3. devcontainer 내부에서는 `MYSQL_HOST=mysql`, `MYSQL_PORT=3306`, `ELASTICSEARCH_NODE=http://elasticsearch:9200` 사용

### 로컬 실행
```bash
# 백엔드 (MySQL, Elasticsearch 실행 필요)
cd backend && yarn start:dev

# 프론트엔드
cd frontend && yarn dev
```

- 백엔드: http://localhost:3001
- 프론트엔드: http://localhost:3000
- 관리자: admin / 1234

## 기술 스택
- Frontend: Next.js 16, React 19, Tailwind CSS
- Backend: NestJS 11, TypeORM, MySQL
- Search: Elasticsearch (nori 형태소 분석기)
- Auth: JWT + Refresh Token
