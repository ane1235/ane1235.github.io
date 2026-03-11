/* KSCTVA 2026 — data.js V5.0 (전략 B: 구조화 객체) */
/* 학술대회 프로그램 데이터 — Self-Describing Data 구조 */
/* 모든 행에 type 필드가 있어 런타임 텍스트 파싱이 불필요 */

var APP_DATA = {
  /* 학회 기본 정보 */
  event: {
    VENUE: '연세대학교 백양누리 그랜드 볼룸',
    DATE_DAY1: '2026년 4월 11일 (토)',
    DATE_DAY2: '2026년 4월 12일 (일)'
  },

  /* 드롭다운 메뉴 매핑 */
  menuMap: {
    DAY1: [
      { label: '오전 세션 1,2 (10:30~12:00)', tab: 'Day1_A1' },
      { label: '오후 세션 3 (13:00~14:30)', tab: 'Day1_P1' },
      { label: '오후 세션 4,5 (14:50~16:20)', tab: 'Day1_P2' },
      { label: '오후 세션 6,7 (16:40~18:00)', tab: 'Day1_P3' }
    ],
    DAY2: [
      { label: '오전 세션 9,10 (10:50~12:20)', tab: 'Day2_A1' },
      { label: '오후 세션 11,12 (13:30~15:00)', tab: 'Day2_P1' },
      { label: '오후 세션 13,14 (15:20~16:50)', tab: 'Day2_P2' }
    ]
  },

  /* overview — 구조화된 프로그램 일정 */
  overview: {
    title: "KSCTVA 2026 춘계 학술대회",
    subtitle: "대한심폐혈관마취학회 2026년 춘계 학술대회 프로그램",
    days: [
      {
        label: "📅 Day 1 — 2026년 4월 11일 (토요일)",
        rooms: ["Room 1", "Room 2"],
        rows: [
          { type: "event", time: "10:00–10:30", text: "총회 및 개회식" },
          { type: "session", time: "10:30–12:00", cells: [
            { text: "Session 1\n흉부 수술 (Lung & Thorax) 마취", tab: "Day1_A1", sectionIdx: 0 },
            { text: "Session 2\n승모판막(MV) 질환", tab: "Day1_A1", sectionIdx: 1 }
          ]},
          { type: "event", time: "12:00–13:00", cells: [
            { text: "런천 세션 1", tab: "Day1_A1", sectionIdx: 0 },
            { text: "런천 세션 2", tab: "Day1_A1", sectionIdx: 1 }
          ]},
          { type: "session", time: "13:00–14:30", cells: [
            { text: "Session 3 (Room 1&2 공통) : Brain Care (영어 세션) ", tab: "Day1_P1" }
          ]},
          { type: "break", time: "14:30–14:50", text: "휴식" },
          { type: "session", time: "14:50–16:20", cells: [
            { text: "Session 4 (영어세션)\n일본-한국 심혈관외과학회 합동 세션 ", tab: "Day1_P2", sectionIdx: 0 },
            { text: "Session 5\n대동맥 판막(AV)", tab: "Day1_P2", sectionIdx: 1 }
          ]},
          { type: "break", time: "16:20–16:40", text: "휴식" },
          { type: "session", time: "16:40–18:00", cells: [
            { text: "Session 6\n주술기 혈액관리(PBM)", tab: "Day1_P3", sectionIdx: 0 },
            { text: "Session 7\n심장수술에서의 최신 혈역학 관리", tab: "Day1_P3", sectionIdx: 1 }
          ]}
        ]
      },
      {
        label: "📅 Day 2 — 2026년 4월 12일 (일요일)",
        rooms: ["Room 1", "Room 2"],
        rows: [
          { type: "session", time: "09:00–10:30", cells: [
            { text: "Session 8\n초록 발표 및 토론", tab: null }
          ]},
          { type: "break", time: "10:30–10:50", text: "휴식" },
          { type: "session", time: "10:50–12:20", cells: [
            { text: "Session 9\n대동맥 질환(Aorta)", tab: "Day2_A1", sectionIdx: 0 },
            { text: "Session 10\n선천성 심장질환 (Congenital)", tab: "Day2_A1", sectionIdx: 1 }
          ]},
          { type: "event", time: "12:30–13:30", cells: [
            { text: "런천 세션 3", tab: "Day2_A1", sectionIdx: 0 },
            { text: "런천 세션 4", tab: "Day2_A1", sectionIdx: 1 }
          ]},
          { type: "session", time: "13:30–15:00", cells: [
            { text: "Session 11\n관상동맥질환 (Coronary a. Ds.)", tab: "Day2_P1", sectionIdx: 0 },
            { text: "Session 12\n심부전 (Heart Failure)", tab: "Day2_P1", sectionIdx: 1 }
          ]},
          { type: "break", time: "15:00–15:20", text: "휴식" },
          { type: "session", time: "15:20–16:50", cells: [
            { text: "Session 13\n한국-일본 심혈관외과학회 합동 세션\n– 심혈관의학에서 AI ; 과장, 희망, 임상 현실", tab: "Day2_P2", sectionIdx: 0 },
            { text: "Session 14\n비 심장수술 마취 (Non-Cardiac Surgery)에서 고려할 심장질환 문제들", tab: "Day2_P2", sectionIdx: 1 }
          ]},
          { type: "event", time: "16:50–17:00", text: "폐회" }
        ]
      }
    ],
    footer: [
      "일시: 2026년 4월 11일(토)~12일(일) | 장소: 연세대학교 백양누리 그랜드 볼룸",
      "사전등록비 입금 계좌: 우리은행 1005-102-036776 (대한심폐혈관마취학회) | 문의: TEL 02-459-6265 | ksctva@ksctva.or.kr | www.ksctva.or.kr"
    ]
  },

  /* 세션별 데이터 — 구조화된 섹션-아이템 계층 */
  sessions: {
    "Day1_A1": {
      title: "📅 Day 1 — 2026년 4월 11일 (토요일)",
      sections: [
        {
          name: "Session 1 (Room 1): 흉부수술(Lung&Thorax) 마취",
          room: "Room 1",
          chair: "좌장 : 오영준 (연세의대), 안현주 (성균관의대)",
          items: [
            { id: "Day1_A1_R4", type: "lecture", time: "10:30–10:45", title: "흉부 수술에서 고난도 기도 관리", speaker: "이규호 (연세의대)", selectable: true },
            { id: "Day1_A1_R5", type: "lecture", time: "10:45–11:00", title: "흉부 수술 ERAS (수술 후 조기회복 프로토콜)", speaker: "오차현 (충남의대)", selectable: true },
            { id: "Day1_A1_R6", type: "lecture", time: "11:00–11:15", title: "흉부 수술 기계환기 전략 최신지견", speaker: "최대기 (울산의대)", selectable: true },
            { id: "Day1_A1_R7", type: "lecture", time: "11:15–11:30", title: "폐 이식수술 마취관리 최신지견", speaker: "정희준 (성균관의대)", selectable: true },
            { id: "Day1_A1_R8", type: "event", time: "11:30-12:00", title: "토론 (Discussion)", speaker: "", selectable: false },
            { id: "Day1_A1_R9", type: "event", time: "12:00-13:00", title: "런천 세션 1", speaker: "", selectable: false }
          ]
        },
        {
          name: "Session 2 (Room 2): 승모판막(MV) 질환",
          room: "Room 2",
          chair: "좌장 : 이종환 (성균관의대), 정동섭 (성균관의대 심혈관외과)",
          items: [
            { id: "Day1_A1_R13", type: "lecture", time: "10:30–10:45", title: "심실성 vs 심방성 MR : 진단적 특징과 임상적 함의", speaker: "서지원 (연세의대 심장내과)", selectable: true },
            { id: "Day1_A1_R14", type: "lecture", time: "10:45–11:00", title: "TMVR (경피적 대동맥판막 치환술) ; 무엇을 염려해야 하는가?", speaker: "김은경 (성균관의대 심장내과)", selectable: true },
            { id: "Day1_A1_R15", type: "lecture", time: "11:00–11:15", title: "MV Repair의 마지막 미개척지 : 초기형태(Forme Fruste), Barlow's Disease", speaker: "정동섭 (성균관의대 심혈관외과)", selectable: true },
            { id: "Day1_A1_R16", type: "lecture", time: "11:15–11:30", title: "MV Repair 수술의 마취관리", speaker: "고서희 (연세의대)", selectable: true },
            { id: "Day1_A1_R16", type: "event", time: "11:30–11:45", title: "토론 (Discussion)", speaker: "", selectable: false },
            { id: "Day1_A1_R17", type: "event", time: "12:00-13:00", title: "런천 세션 2", speaker: "", selectable: false }
          ]
        }
      ]
    },
    "Day1_P1": {
      title: "📅 Day 1 — 2026년 4월 11일 (토요일)",
      sections: [
        {
          name: "Session 3 (Room 1&2 공통) : Brain Care (영어 세션) ",
          room: "공통",
          chair: "좌장 : 전윤석 (서울의대), 박성용 (아주의대)",
          items: [
            { id: "Day1_P1_R4", type: "lecture", time: "13:00-13:20", title: "심장 마취를 위한 임상 EEG", speaker: "Christian Guay (유타 의대, 미국)", selectable: true },
            { id: "Day1_P1_R5", type: "lecture", time: "13:20-13:40", title: "심장수술 후 섬망의 최신지견 : 새로운 관점과 통찰", speaker: "David Mazer (토론토 의대, 캐나다)", selectable: true },
            { id: "Day1_P1_R6", type: "lecture", time: "13:40-14:00", title: "심장수술에서의 복합적인 뇌 모니터링", speaker: "Andre Denault (몬트리얼 의대, 캐나다)", selectable: true },
            { id: "Day1_P1_R7", type: "event", time: "14:00-14:30", title: "토론 (Discussion)", speaker: "패널 : 오차현 (충남의대), 박선경 (연세의대)", selectable: false },
            { id: "Day1_P1_R8", type: "break", time: "14:30-14:50", title: "휴식", speaker: "", selectable: false }
          ]
        }
      ]
    },
    "Day1_P2": {
      title: "📅 Day 1 — 2026년 4월 11일 (토요일)",
      sections: [
        {
          name: "Session 4 (Room 1) (영어세션) : 일본-한국 심혈관외과학회 합동 세션",
          room: "Room 1",
          chair: "좌장 : 켄이치 우에다 (가메다 병원), 심재광 (연세의대)",
          items: [
            { id: "Day1_P2_R4", type: "lecture", time: "14:50–15:05", title: "수술중 심초음파를 이용한 RV 기능 평가", speaker: "켄지 요시타니 (도쿄여대, 일본)", selectable: true },
            { id: "Day1_P2_R5", type: "lecture", time: "15:05–15:20", title: "RV 압력 파형과 임상적 의미", speaker: "타로 카리야 (도쿄대, 일본)", selectable: true },
            { id: "Day1_P2_R6", type: "lecture", time: "15:20–15:35", title: "CPB 후 심각한 RV 기능저하를 어떻게 관리할 것인가?", speaker: "정운경 (울산의대)", selectable: true },
            { id: "Day1_P2_R7", type: "lecture", time: "15:35–15:50", title: "폐동맥 내막절제술(Endarterectomy) 마취관리", speaker: "이종환 (성균관의대)", selectable: true },
            { id: "Day1_P2_R8", type: "event", time: "15:50-16:20", title: "토론 (Discussion)", speaker: "패널 : 주재우 (서울의대), 고서희 (연세의대)", selectable: false },
            { id: "Day1_P2_R9", type: "break", time: "16:20-16:40", title: "휴식", speaker: "", selectable: false }
          ]
        },
        {
          name: "Session 5 (Room 2): 대동맥 판막(AV)",
          room: "Room 2",
          chair: "좌장 : 임현경 (인하의대), 이승현 (연세의대 심혈관외과)",
          items: [
            { id: "Day1_P2_R13", type: "lecture", time: "14:50–15:05", title: "TAVI, 10년 이상의 경험 : 우리는 지금 어디에 있는가?", speaker: "홍성진 (연세의대 심장내과)", selectable: true },
            { id: "Day1_P2_R14", type: "lecture", time: "15:05–15:20", title: "TAVI 시술 마취관리의 최신 트렌드", speaker: "남재식 (울산의대)", selectable: true },
            { id: "Day1_P2_R15", type: "lecture", time: "15:20–15:35", title: "AVR 중 대동맥근부확장술 (Aortic Root Enlargement)", speaker: "이승현 (연세의대 심혈관외과)", selectable: true },
            { id: "Day1_P2_R16", type: "lecture", time: "15:35–15:50", title: "최소침습 대동맥 판막 수술 마취관리 고려사항", speaker: "김태경 (서울의대)", selectable: true },
            { id: "Day1_P2_R16", type: "event", time: "15:50-16:20", title: "토론 (Discussion)", speaker: "", selectable: false },
            { id: "Day1_P2_R17", type: "break", time: "16:20-16:40", title: "휴식", speaker: "", selectable: false }
          ]
        }
      ]
    },
    "Day1_P3": {
      title: "📅 Day 1 — 2026년 4월 11일 (토요일)",
      sections: [
        {
          name: "Session 6 (Room 1): 주술기 혈액관리(PBM)",
          room: "Room 1",
          chair: "좌장 : 김태엽 (건국의대), 정경운 (울산의대)",
          items: [
            { id: "Day1_P3_R4", type: "lecture", time: "16:40–16:55", title: "CPB에 의한 혈액희석 최소화를 위해 알아야할 것들", speaker: "조연정 (서울의대)", selectable: true },
            { id: "Day1_P3_R5", type: "lecture", time: "16:55–17:10", title: "PCC, Fibrinogen 농축제제 최신지견 : FARES-II, FIBRES 임상시험", speaker: "최윤지 (고려의대)", selectable: true },
            { id: "Day1_P3_R6", type: "lecture", time: "17:10–17:25", title: "PBM 구현에 대한 2025 WHO 지침 : 새로운 것과 중요한 것", speaker: "김태엽 (건국의대)", selectable: true },
            { id: "Day1_P3_R7", type: "lecture", time: "17:25–17:40", title: "엄격한 수혈관리보다 적극적 수혈이 더 이득이 될 환자는?", speaker: "김준현 (인제의대)", selectable: true },
            { id: "Day1_P3_R8", type: "event", time: "17:40-18:00", title: "토론 (Discussion)", speaker: "", selectable: false }
          ]
        },
        {
          name: "Session 7 (Room 2): 심장수술에서의 최신 혈역학 관리",
          room: "Room 2",
          chair: "좌장 : 곽영란 (연세의대), 홍성욱 (경북의대)",
          items: [
            { id: "Day1_P3_R13", type: "lecture", time: "16:40–16:55", title: "심장수술에서 Preload 평가 및 수액 반응성", speaker: "오아란 (성균관의대)", selectable: true },
            { id: "Day1_P3_R14", type: "lecture", time: "16:55–17:10", title: "CPB 중 목표지향적 (Goal-Directed) 관류 전략 ", speaker: "김정민 (전남의대)", selectable: true },
            { id: "Day1_P3_R15", type: "lecture", time: "17:10–17:25", title: "심근수축력 최적화 : 강심제(Inotropes)의 근거기반 사용", speaker: "배명일 (연세의대)", selectable: true },
            { id: "Day1_P3_R16", type: "lecture", time: "17:25–17:40", title: "CPB 후 혈관마비(Vasoplegia) 증후군 : 위험 예측 및 표적 치료", speaker: "함성연 (연세의대)", selectable: true },
            { id: "Day1_P3_R16", type: "event", time: "17:40–18:00", title: "토론 (Discussion)", speaker: "", selectable: false }
          ]
        }
      ]
    },
    "Day2_A1": {
      title: "📅 Day 2 — 2026년 4월 12일 (일요일)",
      sections: [
        {
          name: "Session 9 (Room 1): 대동맥 질환(Aorta)",
          room: "Room 1",
          chair: "좌장 : 임춘학 (고려의대), 우재희 (이화의대)",
          items: [
            { id: "Day2_A1_R4", type: "lecture", time: "10:50–11:05", title: "급성 Type A 대동맥 박리의 혈역학적 위기 : 의사결정과 관리", speaker: "장명수 (이화의대)", selectable: true },
            { id: "Day2_A1_R5", type: "lecture", time: "11:05–11:20", title: "TAAA의 외과적 관리", speaker: "주현철 (연세의대 심혈관외과)", selectable: true },
            { id: "Day2_A1_R6", type: "lecture", time: "11:20–11:35", title: "흉부대동맥 수술에서 좌심우회술( Lt Heart Bypass) vs 일반적 CPB", speaker: "소사라 (연세의대)", selectable: true },
            { id: "Day2_A1_R7", type: "lecture", time: "11:35–11:50", title: "척수 보호 전략 : 언제 어떻게 할 것인가?", speaker: "김혜빈 (고려의대)", selectable: true },
            { id: "Day2_A1_R8", type: "event", time: "11:50-12:20", title: "토론 (Discussion)", speaker: "", selectable: false },
            { id: "Day2_A1_R9", type: "event", time: "12:30-13:30", title: "런천 세션 3", speaker: "", selectable: false }
          ]
        },
        {
          name: "Session 10 (Room 2): 선천성 심장질환 (Congenital)",
          room: "Room 2",
          chair: "좌장 : 서울의대 김진태, 연세의대 정세용",
          items: [
            { id: "Day2_A1_R13", type: "lecture", time: "10:50–11:05", title: "소아 심도자술 ; 진단 & Intervention", speaker: "정세용 (연세의대)", selectable: true },
            { id: "Day2_A1_R14", type: "lecture", time: "11:05–11:20", title: "소아 심도자술 마취", speaker: "장영은 (서울의대)", selectable: true },
            { id: "Day2_A1_R15", type: "lecture", time: "11:20–11:35", title: "소아 체외순환보조 (Mechanical circulatory support)", speaker: "신유림 (연세의대)", selectable: true },
            { id: "Day2_A1_R16", type: "lecture", time: "11:35–11:50", title: "소아 VAD 수술 마취 전략", speaker: "송인경 (울산의대)", selectable: true },
            { id: "Day2_A1_R16", type: "event", time: "11:50–12:20", title: "토론 (Discussion)", speaker: "", selectable: false },
            { id: "Day2_A1_R17", type: "event", time: "12:30-13:30", title: "런천 세션 4", speaker: "", selectable: false }
          ]
        }
      ]
    },
    "Day2_P1": {
      title: "📅 Day 2 — 2026년 4월 12일 (일요일)",
      sections: [
        {
          name: "Session 11 (Room 1): 관상동맥질환 (Coronary a.)",
          room: "Room 1",
          chair: "좌장 : 황호영 (서울의대 심혈관외과), 송종욱 (연세의대)",
          items: [
            { id: "Day2_P1_R4", type: "lecture", time: "13:30–13:45", title: "CABG 중 빈맥성 부정맥 관리", speaker: "박진우 (서울의대)", selectable: true },
            { id: "Day2_P1_R5", type: "lecture", time: "13:45–14:00", title: "CABG 최신지견 : 최소침습, 하이브리드, 수술중 혈류측정", speaker: "황호영 (서울의대 심혈관외과)", selectable: true },
            { id: "Day2_P1_R6", type: "lecture", time: "14:00–14:15", title: "OPCAG 중 허혈성 위기 관리 전략", speaker: "송종욱 (연세의대)", selectable: true },
            { id: "Day2_P1_R7", type: "lecture", time: "14:15–14:30", title: "CABG에서 동반된 판막 병변의 딜레마", speaker: "김호진 (울산의대 심혈관외과)", selectable: true },
            { id: "Day2_P1_R8", type: "event", time: "14:30–15:00", title: "토론 (Discussion)", speaker: "", selectable: false },
            { id: "Day2_P1_R9", type: "break", time: "15:00-15:20", title: "휴식", speaker: "", selectable: false }
          ]
        },
        {
          name: "Session 12 (Room 2): 심부전",
          room: "Room 2",
          chair: "좌장 : 김진태 (셔울의대), 정세용 (연세의대)",
          items: [
            { id: "Day2_P1_R13", type: "lecture", time: "13:30–13:45", title: "국내 최초 Implella 시술 경험", speaker: "양정훈 (성균관의대 심장내과)", selectable: true },
            { id: "Day2_P1_R14", type: "lecture", time: "13:45–14:00", title: "가이드라인 기반 약물치료(GDMT) 중인 심부전 환자의 마취관리", speaker: "홍정민 (부산의대)", selectable: true },
            { id: "Day2_P1_R15", type: "lecture", time: "14:00–14:15", title: "심장 이식 수술 최신지견", speaker: "박성준 (연세의대 심혈관외과)", selectable: true },
            { id: "Day2_P1_R16", type: "lecture", time: "14:15–14:30", title: "심장 이식 수술 마취관리", speaker: "주재우 (서울의대)", selectable: true },
            { id: "Day2_P1_R16", type: "event", time: "14:30-15:00", title: "토론 (Discussion)", speaker: "", selectable: false },
            { id: "Day2_P1_R17", type: "break", time: "15:00-15:20", title: "휴식", speaker: "", selectable: false }
          ]
        }
      ]
    },
    "Day2_P2": {
      title: "📅 Day 2 — 2026년 4월 12일 (일요일)",
      sections: [
        {
          name: "Session 13 (Room 1): 한국-일본 심혈관외과학회 합동 세션 – 심혈관의학에서 AI, 과장, 희망, 임상 현실",
          room: "Room 1",
          chair: "좌장: 솅 왕 (수도의대, 북경, 중국), 김성협 (건국의대)",
          items: [
            { id: "Day2_P2_R4", type: "lecture", time: "15:20–15:35", title: "가설에서 출간까지 : AI가 심혈관의학 연구를 어떻게 바꾸었는가", speaker: "이상욱 (울산의대)", selectable: true },
            { id: "Day2_P2_R5", type: "lecture", time: "15:35–15:50", title: "주술기 위험 예측을 위한 AI, 그리고 심장수술 예후 최적화", speaker: "윤현규 (서울의대)", selectable: true },
            { id: "Day2_P2_R6", type: "lecture", time: "15:50–16:05", title: "임상 마취에서 디지털 트윈 기술의 적용 가치", speaker: "웨이펑 야오 (중산의대, 광저우, 중국)", selectable: true },
            { id: "Day2_P2_R7", type: "lecture", time: "16:05–16:20", title: "심뇌 기저질환 환자 주술기 관리에서 AI의 역할", speaker: "웨이 쌰오 (수도의대, 북경, 중국)", selectable: true },
            { id: "Day2_P2_R8", type: "event", time: "16:20-16:50", title: "토론 (Discussion)", speaker: "패널 : 김창현 (연세의대), 오아란 (성균관의대)", selectable: false },
            { id: "Day2_P2_R9", type: "event", time: "16:50-17:00", title: "폐회식", speaker: "", selectable: false }
          ]
        },
        {
          name: "Session 14 (Room 2): 비 심장수술 마취 (Non-Cardiac Surgery)에서 고려할 심장질환 문제들",
          room: "Room 2",
          chair: "좌장 : 김윤희 (충남의대), 황원정 (가톨릭의대)",
          items: [
            { id: "Day2_P2_R13", type: "lecture", time: "15:20–15:35", title: "NT-proBNP, Troponin-T 상승 : 수술을 연기해야 하는가?", speaker: "민정진 (성균관의대)", selectable: true },
            { id: "Day2_P2_R14", type: "lecture", time: "15:35–15:50", title: "MINS (비심장 수술 후 심근 손상)의 임상적 중요성", speaker: "조진선 (연세의대)", selectable: true },
            { id: "Day2_P2_R15", type: "lecture", time: "15:50–16:05", title: "ACE-inhibitor, ARB 중단 : 환자 맞춤형 접근?", speaker: "오충식 (건국의대)", selectable: true },
            { id: "Day2_P2_R16", type: "lecture", time: "16:05–16:20", title: "주술기 수액 요법, HES의 재조명", speaker: "남가람 (서울의대)", selectable: true },
            { id: "Day2_P2_R16", type: "event", time: "16:20-16:50", title: "토론 (Discussion)", speaker: "", selectable: false },
            { id: "Day2_P2_R17", type: "event", time: "16:50-17:00", title: "폐회식", speaker: "", selectable: false }
          ]
        }
      ]
    }
  }
};
