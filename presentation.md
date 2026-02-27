# 편의점 재고 확인 시스템 - 발표 자료

---

## 슬라이드 1: 표지

### 편의점 재고 확인 시스템

바코드 스캔 + AI로 재고 확인 시간을 혁신적으로 단축

- 개발자: ING EA (잉이어)
- 배포: https://items-managment-fqso.vercel.app
- GitHub: https://github.com/wrtn-edu-sch-bootcamp/20235695-personal_project

---

## 슬라이드 2: 문제 정의

### 현재 편의점 재고 확인의 문제점

1. 종이 검수표를 눈으로 보면서 물품을 하나씩 대조
2. 시간이 오래 걸리고, 실수가 발생하기 쉬움
3. 재고 확인 중 다른 업무(계산, 진열 등)를 할 수 없음
4. 순서대로 확인해야 해서 비효율적

### 목표

- 재고 확인 시간 대폭 절약
- 수작업 실수 방지
- 고객 대기 시간 감소

---

## 슬라이드 3: 해결 방법 (워크플로우)

### 해결 방법 - 2단계 자동화

**1단계: 검수표 디지털화**

- 종이 검수표 사진 촬영 → OCR 자동 텍스트 추출
- 또는 CSV/엑셀 파일 직접 업로드
- → 상품명, 바코드, 수량이 DB에 자동 저장

**2단계: 바코드 스캔 + 자동 대조**

- 스마트폰 카메라로 상품 바코드 스캔 (순서 무관!)
- → 바코드로 DB 자동 조회 & 매칭
- → 실물 수량 입력
- → 검수표 수량 vs 실물 수량 자동 비교
  - ✅ 일치 → 확인 완료
  - ⚠️ 불일치 → 즉시 경고 + 차이 표시

---

## 슬라이드 4: 주요 기능

### 주요 기능 8가지

| # | 기능 | 설명 |
|---|------|------|
| 1 | 📄 검수표 업로드 | 사진(OCR) 또는 CSV 파일 |
| 2 | 📱 바코드 스캔 | 스마트폰 카메라로 실시간 인식 |
| 3 | 🔢 수량 입력 | 바코드 스캔 후 실물 수량 기록 |
| 4 | ⚡ 자동 대조 | 검수표 vs 실물 수량 자동 비교 |
| 5 | 📊 진행률 대시보드 | 확인 완료 비율 실시간 표시 |
| 6 | 🤖 AI 챗봇 | "콜라 몇 개 있어?" 자연어 질의 |
| 7 | 💬 Slack 연동 | /재고 명령어로 메신저에서 조회 |
| 8 | 📚 학습 복습 모드 | 30분 간격 AI 복습 알림 |

---

## 슬라이드 5: 기술 스택 + 선택 이유

### 기술 스택 & 선택 이유

| 영역 | 기술 | 왜 이 기술을 선택했는가? |
|------|------|--------------------------|
| 프론트엔드 | Next.js 14 (App Router) | App Router로 서버/클라이언트 컴포넌트 분리, SSR로 SEO와 성능 최적화, API Routes 내장으로 별도 백엔드 서버 불필요 |
| PWA | next-pwa | 설치 없이 스마트폰 홈 화면에 추가 가능, 오프라인 캐싱 지원, 네이티브 앱처럼 사용 가능 |
| UI | Tailwind CSS + shadcn/ui | 유틸리티 기반으로 빠른 스타일링, shadcn/ui는 복사-붙여넣기 방식의 고품질 컴포넌트 (의존성 최소화) |
| 바코드 스캔 | html5-qrcode | 네이티브 앱 없이 웹 브라우저 카메라로 바코드 인식, 무료 오픈소스 |
| OCR | Tesseract.js | 서버 없이 브라우저에서 직접 이미지→텍스트 변환, 무료 오픈소스 |
| AI / LLM | OpenAI GPT (gpt-4o-mini) | 자연어로 재고 질의 가능, Prompt Engineering으로 맥락 이해, gpt-4o-mini는 비용 효율적이면서 충분한 성능 제공 |
| 메신저 연동 | Slack API | 편의점 현장에서 PC 없이 Slack으로 즉시 재고 조회, Slash Command로 간편한 인터페이스 |
| 자동화 | n8n | 코드 없이 워크플로우 구축, 일일 리포트 자동 전송, 불일치 발생 시 즉시 Slack 알림 |
| 백엔드/DB | Supabase (PostgreSQL) | PostgreSQL 기반으로 안정적, 실시간 구독 지원, Auth/Storage 내장, 무료 티어로 비용 부담 없음 |
| 호스팅 | Vercel | Next.js 공식 호스팅, Git push만 하면 자동 배포(CI/CD), 글로벌 CDN, 무료 티어 제공 |
| 언어 | TypeScript | 정적 타입으로 런타임 에러 사전 방지, IDE 자동완성으로 개발 생산성 향상 |

**총 비용: 대부분 무료 (OpenAI API만 사용량 기반 과금)**

---

## 슬라이드 6: 시스템 아키텍처

### 시스템 아키텍처

```
┌──────────────────────────────────────────────────┐
│                사용자 (스마트폰/PC)                 │
│         PWA로 설치 가능, 브라우저에서 접속           │
└───────────┬──────────────────────┬────────────────┘
            │                      │
     웹 페이지 요청            API 호출
            │                      │
┌───────────▼──────────────────────▼────────────────┐
│              Next.js 14 (Vercel)                   │
│                                                    │
│  [페이지 7개]              [API 4개]                │
│  / (홈 - 세션 목록)        /api/chat (AI 챗봇)      │
│  /upload (검수표 업로드)   /api/reports (리포트)     │
│  /scan/[id] (바코드 스캔)  /api/slack/command       │
│  /session/[id] (세션 상세) /api/study/reminder      │
│  /sessions (세션 목록)                              │
│  /study (학습 모드)                                 │
│  /study/subjects (과목 관리)                        │
└───────────┬──────────────────────┬────────────────┘
            │                      │
     DB 쿼리/저장             LLM 호출
            │                      │
┌───────────▼───────┐  ┌──────────▼──────────┐
│    Supabase       │  │   OpenAI GPT API    │
│   (PostgreSQL)    │  │   (gpt-4o-mini)     │
│                   │  │                     │
│ 테이블 5개:        │  │ • 재고 챗봇 응답     │
│ • inventory_      │  │ • 학습 복습 내용 생성 │
│   sessions        │  │ • Slack 질의 응답    │
│ • inventory_items │  └─────────────────────┘
│ • student_subjects│
│ • study_sessions  │  ┌─────────────────────┐
│ • study_reminders │  │    Slack API        │
└───────────────────┘  │  /재고 명령어 처리   │
                       └─────────────────────┘
```

---

## 슬라이드 7: DB 설계

### 데이터베이스 설계 (Supabase PostgreSQL)

**재고 시스템**

```
inventory_sessions (재고 확인 세션)
├── id (UUID, PK)
├── name (세션명)
├── status (in_progress / completed)
├── total_items (전체 품목 수)
├── checked_items (확인 완료 수)
└── created_at
        │
        │ 1:N
        ▼
inventory_items (재고 품목)
├── id (UUID, PK)
├── session_id (FK → sessions)
├── barcode (바코드 번호)
├── product_name (상품명)
├── expected_quantity (검수표 수량)
├── actual_quantity (실물 수량)
└── status (pending / matched / mismatched)
```

**학습 시스템**

```
student_subjects (과목)
├── id, subject_name, description
        │ 1:N
        ▼
study_sessions (복습 세션)
├── id, subject_id(FK), status
├── last_reminder_at, reminder_count
        │ 1:N
        ▼
study_reminders (복습 내용)
├── id, session_id(FK), subject_name
├── content (AI 생성 복습 내용)
└── confirmed_at
```

---

## 슬라이드 8: AI 활용 (Prompt Engineering)

### AI 활용 - Prompt Engineering

**1. InvenBot (재고 챗봇)**

- System Prompt: "당신은 편의점 재고 관리 도우미입니다. 현재 재고 데이터를 기반으로 답변하세요."
- 실시간 재고 데이터를 Context로 주입
- 사용자: "콜라 몇 개 있어?"
- AI: "코카콜라 500ml은 검수표 24개, 실물 확인 22개로 2개 부족합니다."

**2. 학습 복습 AI 튜터**

- System Prompt: "학생들의 복습을 돕는 AI 튜터입니다. 핵심 개념 1-2개를 간결하게 설명하고, 실생활 예시와 질문 1개를 포함하세요."
- 입력: "운영체제"
- 출력: "📚 프로세스와 스레드 - 프로세스는 실행 중인 프로그램, 스레드는 프로세스 내 실행 단위입니다. 💡 멀티스레딩의 장점은 무엇일까요?"

**3. Slack 연동**

- /재고 라면 재고 알려줘 → 동일한 LLM 파이프라인 활용

---

## 슬라이드 9: n8n 자동화 워크플로우

### n8n 자동화 워크플로우

**워크플로우 1: 일일 재고 리포트**

```
매일 오후 6시 실행 → 재고 리포트 API 호출 → 리포트 메시지 생성 → Slack 채널에 전송
```

- Vercel의 /api/reports API를 GET 호출
- 전체 세션 수, 확인률, 불일치 품목 자동 요약
- 매일 자동 실행 (Schedule Trigger)

**워크플로우 2: 불일치 즉시 알림**

```
Webhook 수신 → 불일치만 필터 → 알림 메시지 생성 → Slack 즉시 알림
```

- 바코드 스캔 시 불일치 발생 → 앱이 n8n Webhook으로 데이터 전송
- 상품명, 바코드, 검수표 수량, 실물 수량, 차이 포함
- Slack 채널에 실시간 알림

---

## 슬라이드 10: 데모 시나리오

### 라이브 데모 시나리오

1️⃣ **검수표 업로드**
   - CSV 파일 업로드 → 품목 목록 자동 생성

2️⃣ **바코드 스캔**
   - 스마트폰 카메라로 상품 스캔
   - 실물 수량 입력 → 자동 대조 결과 확인

3️⃣ **대시보드 확인**
   - 진행률, 일치/불일치 현황 실시간 확인

4️⃣ **AI 챗봇 질의**
   - "불일치 목록 알려줘" 입력 → 즉시 응답

5️⃣ **학습 복습 모드**
   - 과목 선택 → AI 복습 내용 생성 → 30분 타이머

**라이브 URL: https://items-managment-fqso.vercel.app**

---

## 슬라이드 11: 프로젝트 구조

### 프로젝트 구조

```
src/
├── app/                      # Next.js App Router 페이지
│   ├── page.tsx              # 홈 (세션 목록)
│   ├── upload/               # 검수표 업로드
│   ├── scan/[sessionId]/     # 바코드 스캔
│   ├── session/[sessionId]/  # 세션 상세
│   ├── sessions/             # 전체 세션 목록
│   ├── study/                # 학습 복습 모드
│   │   └── subjects/         # 과목 관리
│   └── api/                  # API 엔드포인트
│       ├── chat/             # AI 챗봇
│       ├── reports/          # 리포트 생성
│       ├── slack/command/    # Slack 연동
│       └── study/reminder/   # 복습 알림 생성
├── components/               # 재사용 UI 컴포넌트
├── lib/                      # 유틸리티 (Supabase, OpenAI, 브랜드)
├── hooks/                    # 커스텀 React 훅
└── types/                    # TypeScript 타입 정의
```

---

## 슬라이드 12: 핵심 차별점 & 마무리

### 핵심 차별점

1. **웹 기반 PWA** → 앱 설치 없이 스마트폰에서 바로 사용
2. **바코드 순서 무관** → 눈앞에 보이는 상품부터 자유롭게 스캔
3. **AI 챗봇** → 자연어로 재고 현황 즉시 질의
4. **Slack 연동** → 현장에서 메신저로 바로 조회
5. **n8n 자동화** → 일일 리포트, 불일치 알림 자동 전송
6. **학습 모드** → 알바 자투리 시간에 공부까지

### 기대 효과

- 재고 확인 시간: 1시간 → 15~20분 (약 70% 절약)
- 수작업 실수: 대폭 감소
- 불일치 대응: 즉시 파악 → 빠른 조치

### 감사합니다

- GitHub: https://github.com/wrtn-edu-sch-bootcamp/20235695-personal_project
- Live: https://items-managment-fqso.vercel.app
