# HIRA 의료 MCP 작업 공간

- 기준 저장소: `ane1235/ane1235.github.io`
- 작업 디렉터리: `hira/`
- `ane1235/blog` 사용 중단. 해당 저장소의 의료 MCP 작업 파일은 2026-10-04 확인 결과 0개.
- 운영 MCP 서버: `hospital-fee-mcp`, `dk-korea-health-mcp`
- ChatGPT 클라우드 대화 및 Ubuntu Codex 실제 조회 성공. Legacy Codex Cloud 네이티브 도구 등록은 조사 중.
- 인증키, 개인 설정, 원시 대화 기록은 이 공개 저장소에 저장하지 않음.

## 클라우드 실행 준비

HIRA 전용 환경을 이 저장소에 연결하고 설정 스크립트에 다음을 사용한다.

```bash
bash hira/scripts/cloud-setup.sh
```

근무표용 Google OAuth 검사는 HIRA의 의존성이 아니므로 별도 환경에서 유지한다.
진단용 MCP는 외부 네트워크와 인증키를 사용하지 않으며 실제 의료 데이터 조회 성공을 대체하지 않는다.
