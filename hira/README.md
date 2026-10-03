# HIRA 의료 MCP 작업 공간

- 기준 위치: `ane1235/ane1235.github.io/hira`
- `ane1235/blog` 사용 중단. 이전할 이번 작업 파일은 0개로 확인.
- Ubuntu Codex, ChatGPT 클라우드 대화, 별도 Work Cloud 작업의 실조회 성공.
- **현재 클라우드 ChatGPT·Codex Work Cloud 및 Ubuntu Codex 설치·실조회 검증 완료.**
- 구형 `/codex/cloud`는 필수 사용 경로에서 제외. 해당 경로의 MCP 미노출 기록은 참고용으로 보존.

- 2026-10-04 업데이트 후 재검증: Work Cloud 2개 조회 성공, 최신 커밋의 Legacy 새 작업도 미노출 유지. 서버 빌드 변경 여부 미확인.

[통합 설치·검증 보고서](report.md) · [검증 요약](verification.json) · [고정 버전](versions.json)

## 클라우드 진단
전용 HIRA 환경의 준비·유지 관리 스크립트:

```bash
bash hira/scripts/cloud-setup.sh
```

진단용 MCP는 외부 네트워크와 인증키를 사용하지 않음. 진단 성공은 의료 실조회 성공을 의미하지 않음.

## 운영 코드 재현
`versions.json`의 upstream 커밋을 기준으로 `patches/`의 패치를 적용하면 기존 Ubuntu 운영 수정 내용을 재현할 수 있음. 각 원본 저장소의 라이선스 동봉.

- 병원 비급여 원본: https://github.com/la1av1a/hospital-fee-mcp
- 한국 공공의료 원본: https://github.com/NSLC7779/dk-korea-health-mcp

API 키·.env·개인 인증 설정은 공개 저장소에 저장하지 않음. GitHub Pages는 문서 호스팅용이며 MCP 서버는 Ubuntu에서 실행됨.
