# CS 공모전 스크랩

컴퓨터공학 관련 공모전을 자동으로 수집·저장하고 웹에서 검색·조회할 수 있는 풀스택 프로젝트입니다.

---

## 목차

- [프로젝트 구조](#프로젝트-구조)
- [기술 스택](#기술-스택)
- [사전 준비](#사전-준비)
- [설치 및 실행](#설치-및-실행)
- [크롤러 사용법](#크롤러-사용법)
- [API 명세](#api-명세)
- [DB 스키마](#db-스키마)
- [테스트 방법](#테스트-방법)
- [자주 생기는 문제](#자주-생기는-문제)
- [크롤러 선택자 수정 방법](#크롤러-선택자-수정-방법)

---

## 프로젝트 구조

```
contest-scraper/
├── backend/
│   ├── server.js                          # Express 서버 진입점 (포트 4000)
│   ├── package.json
│   ├── .env.example                       # 환경 변수 샘플
│   ├── data/
│   │   └── contests.db                    # SQLite DB (자동 생성됨)
│   └── src/
│       ├── db/
│       │   ├── schema.sql                 # 테이블 + 인덱스 정의
│       │   └── database.js               # DB 연결 및 스키마 자동 초기화
│       ├── routes/
│       │   └── contests.js               # REST 라우터
│       ├── controllers/
│       │   └── contestController.js      # CRUD 로직 + D-day 계산
│       ├── middleware/
│       │   └── errorHandler.js           # 전역 에러 핸들러
│       └── crawlers/
│           ├── utils.js                  # 공통 유틸 (날짜 파싱, DB 저장, HTTP 클라이언트)
│           ├── linkareer.js              # 링커리어 크롤러 (GraphQL API)
│           ├── campuspick.js             # 캠퍼스픽 크롤러 (HTML 스크래핑)
│           ├── wevity.js                 # 위비티 크롤러 (HTML 스크래핑)
│           ├── index.js                  # 크롤러 통합 러너
│           └── debug.js                  # 선택자 진단 도구
│
└── frontend/
    ├── index.html
    ├── vite.config.js                     # Vite 설정 + /api 프록시
    ├── package.json
    └── src/
        ├── api/
        │   └── contests.js               # axios API 클라이언트
        ├── components/
        │   ├── ContestCard.jsx           # 공모전 카드 (D-day 뱃지)
        │   ├── ContestForm.jsx           # 등록/수정 폼
        │   └── FilterBar.jsx             # 분야·상태 필터
        ├── pages/
        │   ├── Home.jsx                  # 목록 페이지
        │   └── Detail.jsx               # 상세/등록/수정 페이지
        ├── App.jsx                       # React Router 설정
        ├── index.css
        └── main.jsx                      # 앱 진입점
```

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 18, React Router v6, Vite, axios |
| 백엔드 | Node.js, Express 4, better-sqlite3 |
| DB | SQLite (파일 기반, 별도 설치 불필요) |
| 크롤링 | axios + cheerio (HTML), GraphQL (링커리어) |

---

## 사전 준비

- **Node.js 18 이상** 필요 ([nodejs.org](https://nodejs.org) 에서 LTS 버전 설치)
- 설치 확인:
  ```bash
  node -v   # v18.x.x 이상
  npm -v    # 9.x.x 이상
  ```

---

## 설치 및 실행

### 1단계 — 저장소 클론 (이미 했다면 생략)

```bash
git clone <repo-url>
cd web-crawling/contest-scraper
```

### 2단계 — 환경 변수 설정

```bash
cd backend
cp .env.example .env
```

`.env` 파일 내용 (기본값 그대로 써도 됩니다):

```
PORT=4000
```

### 3단계 — 의존성 설치

```bash
# 백엔드
cd backend
npm install

# 프론트엔드 (새 터미널)
cd frontend
npm install
```

### 4단계 — 서버 실행

**백엔드** (터미널 1):

```bash
cd backend
npm run dev       # nodemon으로 파일 변경 시 자동 재시작
# 또는
npm start         # 일반 실행
```

> `data/contests.db` 파일이 자동 생성되고 테이블이 초기화됩니다.

**프론트엔드** (터미널 2):

```bash
cd frontend
npm run dev
```

브라우저에서 [http://localhost:5173](http://localhost:5173) 접속

---

## 크롤러 사용법

### 전체 사이트 한 번에 크롤링

```bash
cd backend
npm run crawl
```

### 사이트별 개별 실행

```bash
npm run crawl:linkareer    # 링커리어 (GraphQL API 방식)
npm run crawl:campuspick   # 캠퍼스픽 (HTML 스크래핑)
npm run crawl:wevity       # 위비티 (HTML 스크래핑)
```

### 크롤러 동작 방식

```
실행
 └─ 각 사이트 크롤러 호출 (최대 5~10 페이지)
     └─ 공모전 데이터 수집
         └─ saveContests() 호출
             ├─ URL이 처음이면 → INSERT (신규)
             ├─ URL이 이미 있으면 → UPDATE (마감일·내용 갱신)
             └─ 필수 필드 누락 → SKIP
```

실행 후 출력 예시:

```
==================================================
[링커리어] 크롤링 시작...
  [링커리어] 1페이지 완료 (누적 20/143)
  [링커리어] 2페이지 완료 (누적 40/143)
  ...
[링커리어] 수집 완료 — 100건
[링커리어] DB 저장 완료 — 신규 87건 / 업데이트 13건 / 스킵 0건
==================================================
전체 완료
  신규: 215건
  업데이트: 34건
  스킵(필드 부족): 2건
```

### 중복 처리 방식

- `url` 컬럼이 `UNIQUE`로 설정되어 있어 같은 공모전이 두 번 들어가지 않습니다.
- 이미 있는 URL이 들어오면 이름·마감일·설명 등을 최신 값으로 자동 업데이트합니다.

---

## API 명세

백엔드 기본 URL: `http://localhost:4000`

### 공모전 목록 조회

```
GET /api/contests
```

| 쿼리 파라미터 | 설명 | 예시 |
|--------------|------|------|
| `search` | 이름·주최사·설명 검색 | `?search=해커톤` |
| `category` | 분야 필터 | `?category=개발` |
| `status` | `upcoming` (마감 전) / `ended` (마감) | `?status=upcoming` |

응답 예시:

```json
[
  {
    "id": 1,
    "name": "2026 공개SW 개발자대회",
    "organizer": "과학기술정보통신부",
    "deadline": "2026-09-30",
    "url": "https://example.com/contest/1",
    "category": "개발",
    "description": "...",
    "created_at": "2026-04-04",
    "updated_at": "2026-04-04",
    "days_left": 179
  }
]
```

> `days_left`: 양수 = 남은 일수, `0` = 오늘 마감, 음수 = 이미 마감

### 공모전 상세 조회

```
GET /api/contests/:id
```

### 공모전 등록

```
POST /api/contests
Content-Type: application/json

{
  "name": "공모전 이름",
  "organizer": "주최사",
  "deadline": "2026-12-31",
  "url": "https://...",
  "category": "개발",
  "description": "상세 설명 (선택)"
}
```

| 상태 코드 | 의미 |
|----------|------|
| `201` | 등록 성공 |
| `400` | 필수 필드 누락 또는 날짜 형식 오류 |
| `409` | URL 중복 |

### 공모전 수정

```
PUT /api/contests/:id
Content-Type: application/json

{ "deadline": "2026-11-30" }   // 바꿀 필드만 보내도 됩니다
```

### 공모전 삭제

```
DELETE /api/contests/:id
```

### 서버 상태 확인

```
GET /health
→ { "status": "ok" }
```

---

## DB 스키마

파일 위치: `backend/data/contests.db` (SQLite)

```sql
CREATE TABLE contests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,            -- 공모전 이름
  organizer   TEXT    NOT NULL,            -- 주최사
  deadline    TEXT    NOT NULL,            -- 마감일 (YYYY-MM-DD)
  url         TEXT    NOT NULL UNIQUE,     -- 원본 링크 (중복 방지 키)
  category    TEXT    NOT NULL,            -- 분야: 개발/디자인/기획/데이터/보안/기타
  description TEXT,                        -- 상세 정보 (선택)
  created_at  TEXT    NOT NULL DEFAULT (date('now')),
  updated_at  TEXT    NOT NULL DEFAULT (date('now'))
);
```

- `deadline`은 SQLite의 `date('now')` 함수와 직접 비교 가능한 `YYYY-MM-DD` 텍스트로 저장됩니다.
- `deadline`, `category`에 인덱스가 걸려 있어 필터 쿼리가 빠릅니다.

DB 직접 열어보기:

```bash
# SQLite CLI 설치 후
sqlite3 backend/data/contests.db

.tables                        -- 테이블 목록
SELECT * FROM contests LIMIT 5;
SELECT COUNT(*) FROM contests WHERE deadline >= date('now');  -- 현재 진행 중인 공모전 수
.quit
```

---

## 테스트 방법

### API 테스트 (curl)

```bash
# 1. 서버 상태 확인
curl http://localhost:4000/health

# 2. 전체 목록 조회
curl http://localhost:4000/api/contests

# 3. 마감 전 개발 공모전 검색
curl "http://localhost:4000/api/contests?category=개발&status=upcoming"

# 4. 키워드 검색
curl "http://localhost:4000/api/contests?search=해커톤"

# 5. 공모전 직접 등록
curl -X POST http://localhost:4000/api/contests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트 공모전",
    "organizer": "테스트 주최사",
    "deadline": "2026-12-31",
    "url": "https://example.com/test",
    "category": "개발",
    "description": "테스트용 공모전입니다."
  }'

# 6. 수정 (id=1 기준)
curl -X PUT http://localhost:4000/api/contests/1 \
  -H "Content-Type: application/json" \
  -d '{"deadline": "2026-11-30"}'

# 7. 삭제
curl -X DELETE http://localhost:4000/api/contests/1
```

### 크롤러 테스트

크롤러를 실제 실행하기 전에 1페이지만 수집해서 결과를 확인할 수 있습니다:

```bash
# 임시로 index.js의 maxPages를 1로 바꾸거나
# 아래처럼 node에서 직접 호출
node -e "
import('./src/crawlers/wevity.js').then(async m => {
  const res = await m.crawlWevity({ maxPages: 1 });
  console.log(JSON.stringify(res.slice(0, 3), null, 2));
});
"
```

### 날짜 파싱 단위 테스트

`parseDeadline()` 함수가 다양한 형식을 올바르게 변환하는지 확인:

```bash
node -e "
import('./src/crawlers/utils.js').then(({ parseDeadline }) => {
  const cases = [
    '2026.06.30',
    '2026년 6월 30일',
    '~2026/06/30',
    '26.06.30',
    'D-5  2026.06.30',
  ];
  cases.forEach(c => console.log(c, '->', parseDeadline(c.replace(/D[+-]\d+\s*/g, ''))));
});
"
```

기대 출력:

```
2026.06.30 -> 2026-06-30
2026년 6월 30일 -> 2026-06-30
~2026/06/30 -> 2026-06-30
26.06.30 -> 2026-06-30
D-5  2026.06.30 -> 2026-06-30
```

---

## 자주 생기는 문제

### `better-sqlite3` 빌드 오류 (Windows)

```
Error: Cannot find module '...better_sqlite3.node'
```

해결:

```bash
npm install --global --production windows-build-tools
# 또는 Visual Studio Build Tools 설치 후
npm rebuild better-sqlite3
```

### 크롤러가 데이터를 0건 가져올 때

사이트의 HTML 구조가 바뀐 것입니다. 진단 스크립트로 현재 구조를 확인하세요:

```bash
node src/crawlers/debug.js wevity
node src/crawlers/debug.js campuspick
```

출력된 선택자 정보를 바탕으로 해당 크롤러의 `parsePage()` 함수 안 선택자를 수정합니다.

### 링커리어 GraphQL 오류

```
Error: [{"message":"Unauthorized"}]
```

링커리어가 API 정책을 변경한 것입니다. 브라우저 개발자 도구(F12) → Network 탭에서 `graphql` 요청을 찾아 실제 쿼리 구조와 헤더를 확인하고 `linkareer.js`를 업데이트하세요.

### 포트 충돌

```
Error: listen EADDRINUSE :::4000
```

```bash
# 해당 포트를 사용 중인 프로세스 종료 (Windows)
netstat -ano | findstr :4000
taskkill /PID <PID번호> /F
```

---

## 크롤러 선택자 수정 방법

사이트 업데이트로 크롤러가 데이터를 못 가져올 때의 절차:

**1. 진단 스크립트 실행**

```bash
node src/crawlers/debug.js wevity
```

**2. 출력에서 선택자 확인**

```
=== 리스트 선택자 후보 ===
  "ul.list-body > li" → 20개 발견 ✔
  --- 첫 번째 항목 내부 태그 ---
    <a class="tit"> 2026 공개SW 개발자대회
    <span class="host"> 과학기술정보통신부
    <span class="day"> D-45  2026.06.30
```

**3. 크롤러 파일의 선택자 수정**

예시 (`wevity.js`):

```js
// 수정 전
const $a = $el.find('.tit a, .title a, h6 a').first();

// 수정 후 (실제 확인된 선택자로)
const $a = $el.find('.tit a').first();
```

**4. 1페이지만 테스트 후 전체 실행**

```bash
npm run crawl:wevity
```
