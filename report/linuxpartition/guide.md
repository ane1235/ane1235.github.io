# Linux 파티션 확장 안내

GParted Live 실행 안내 · 2026-10-05

**EFI 512MiB → Linux 약 753.4GiB → Windows용 미할당 200GiB**

입력 단위: **204800MiB = 200GiB ≈ 214.75GB**

1. **GParted Live USB로 UEFI 부팅**
   - GParted 실행.
   - 작업 대상 파티션이 마운트되어 있다면 마운트 해제.

2. **Windows 관련 파티션 삭제 후 적용**
   - `nvme0n1p2` Microsoft 예약 영역, `nvme0n1p3` Windows, `nvme0n1p4` Windows 복구 영역 삭제.
   - **p1 EFI와 p5 Linux는 보존.** 삭제 목록 확인 후 **Apply** 실행.

3. **EFI를 512MiB로 확장**
   - `nvme0n1p1` 선택 → **Resize/Move**. 시작 위치는 유지하고 **New size: 512MiB**로 설정 후 적용.
   - **파티션과 내부 FAT32 파일시스템이 모두 확장되었는지 확인.**
   - **실패하면 여기서 중단.** EFI 복구·재구성, 파일 복원, UUID·`fstab`·부팅 항목 검증까지 완료한 후 계속.

4. **Linux 파티션을 왼쪽으로 이동 설정**
   - `nvme0n1p5` 선택 → **Resize/Move**. 기존 크기를 유지한 채 파티션 전체를 EFI 바로 뒤로 이동하도록 설정.
   - **Align to: MiB** 유지. **아직 Apply를 누르지 않고 다음 단계 설정까지 진행.**

5. **Linux 확장 및 Windows용 공간 확보**
   - 같은 설정 창에서 Linux의 오른쪽 끝을 확장.
   - **Free space following: `204800` MiB**로 설정. 최종 배치: **EFI 512MiB → Linux 약 753.4GiB → 미할당 200GiB**.
   - 뒤쪽은 **unallocated**로 유지. 새 파티션 생성·포맷하지 않음.

6. **Linux 이동·확장 적용**
   - 예정 작업과 최종 배치 확인 후 **Apply** 실행.
   - **작업 완료까지 전원을 유지하고 중단하지 않음.**

7. **Linux 부팅 및 결과 확인**
   - USB를 제거하고 SSD로 부팅. `/` 파티션 약 **753.4GiB**, `/boot/efi` 정상 마운트 확인.
   - 디스크 끝에 **204800MiB 미할당 공간** 확인. 파일시스템 표시 용량은 파티션 용량보다 조금 작을 수 있음.
   - 부팅 실패 시 Live USB로 재부팅하여 EFI·GRUB·파일시스템 점검.

**보존: p1 EFI · p5 Linux. `Create Partition Table`은 사용하지 않습니다.**

EFI 확장이 실패하면 파티션 크기만 보고 성공으로 판단하지 않습니다. EFI 복구·재구성과 부팅 설정 검증 후 다음 단계로 진행합니다.

[정적 HTML](https://ane1235.github.io/report/linuxpartition/) · [인터랙티브 HTML](https://ane1235.github.io/report/linuxpartition/interactive.html)

자료: [GParted 매뉴얼](https://gparted.org/display-doc.php?name=help-manual), [파일시스템 지원](https://gparted.org/features.php), [작은 FAT32 제한](https://bugzilla.gnome.org/show_bug.cgi?id=649324)
