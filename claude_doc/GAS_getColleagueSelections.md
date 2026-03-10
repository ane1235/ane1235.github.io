# GAS `getColleagueSelections` Action 구현 코드

> 작성일: 2026-03-10
> 용도: Google Apps Script 편집기에 추가할 코드
> 상태: 구현 완료, 배포 대기 (사용자가 GAS 편집기에서 수동 등록)

---

## I. 설치 방법

### 1. doGet() 함수에 case 추가

기존 `doGet()` 함수 내부의 `switch` 또는 `if-else` 분기에 아래 case를 추가한다.

```javascript
// doGet() 내부, 기존 case들 아래에 추가
if (action === 'getColleagueSelections') {
  return getColleagueSelections_();
}
```

### 2. 아래 함수를 코드 파일 하단에 추가

```javascript
/**
 * 모든 ANE 직원의 강좌 선택 현황을 반환한다.
 * 프론트엔드에서 동료 수강자 레이블 표시에 사용된다.
 *
 * 응답 형식: { success: true, data: [ { name, sn2, selections: [...] }, ... ] }
 */
function getColleagueSelections_() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // 1) ANE 탭: 직원 명단 (A열=사번, B열=이름)
    var aneSheet = ss.getSheetByName('ANE');
    var aneData = aneSheet.getDataRange().getValues();

    // 2) Selections 시트: 저장된 선택 데이터
    var selSheet = ss.getSheetByName('Selections');
    var selData = selSheet.getDataRange().getValues();

    // 3) Selections를 사번 기준 Map으로 변환
    var selMap = {};
    for (var i = 0; i < selData.length; i++) {
      var sn2 = String(selData[i][0]).trim();
      if (!sn2) continue;
      var raw = selData[i][1];
      try {
        selMap[sn2] = JSON.parse(raw);
      } catch (e) {
        selMap[sn2] = [];
      }
    }

    // 4) ANE 명단 + Selections 매칭 → 결과 구성
    var result = [];
    for (var j = 1; j < aneData.length; j++) {   // j=1: 헤더 행 건너뜀
      var sn2 = String(aneData[j][0]).trim();
      var name = String(aneData[j][1]).trim();
      if (!sn2 || !name) continue;
      result.push({
        name: name,
        sn2: sn2,
        selections: selMap[sn2] || []
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 3. 배포 업데이트

- Apps Script 편집기 상단 **배포 > 배포 관리** 클릭
- 기존 배포의 **연필 아이콘(수정)** 클릭
- 버전을 **새 버전**으로 선택 후 **배포** 클릭
- URL은 기존과 동일하게 유지됨

---

## II. 사전 확인 사항

| 확인 항목 | 예상 값 | 비고 |
|-----------|---------|------|
| `SPREADSHEET_ID` 상수 존재 | O | 기존 코드에 이미 정의되어 있을 것 |
| ANE 시트 이름 | `ANE` | 기존 login에서 사용 중 |
| ANE 시트 구조 | A=사번, B=이름 | 1행 헤더 가정 |
| Selections 시트 이름 | `Selections` | 기존 save/getSelections에서 사용 중 |
| Selections 시트 구조 | A=사번, B=JSON배열문자열 | 기존 저장 형식 확인 필요 |

> **만약 Selections 시트 구조가 위와 다르다면**, B열 접근 부분(`selData[i][1]`)을 실제 열 인덱스에 맞게 수정해야 한다.

---

## III. 프론트엔드 호출 방식

```javascript
// js/colleagues.js에서 이렇게 호출할 예정
callApi({ action: 'getColleagueSelections' })
  .then(function(result) {
    if (result.success) {
      // result.data = [ { name, sn2, selections: [...] }, ... ]
      state.colleagues = result.data;
    }
  });
```
