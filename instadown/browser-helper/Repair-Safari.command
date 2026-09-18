#!/bin/zsh
# Download this file, then run: /bin/zsh /path/to/Repair-Safari.command
set -u
python_path=''
for candidate in /usr/bin/python3 /opt/homebrew/bin/python3 /usr/local/bin/python3; do
    if [[ -x "$candidate" ]]; then
        python_path="$candidate"
        break
    fi
done
if [[ -z "$python_path" ]]; then
    print -r -- '중단: Python 3를 찾지 못했습니다. Xcode 초기 설정을 확인하세요.'
    exit 1
fi
"$python_path" - "$@" <<'PY'
from datetime import datetime
from pathlib import Path
import os
import re
import stat
import sys
import tempfile
import xml.etree.ElementTree as ET


class RepairError(Exception):
    pass


def walk_error(error):
    raise error


def repair():
    print('시작: Safari 프로젝트의 두 클래스 참조를 확인합니다.', flush=True)
    if len(sys.argv) > 2:
        raise RepairError('프로젝트 루트 경로는 하나만 지정하세요.')
    root = (Path(sys.argv[1]).expanduser() if len(sys.argv) == 2 else
            Path.home() / 'Downloads/Nyangsta-Safari-Project-20260918-102433').absolute()
    if not root.is_dir() or any(p.is_symlink() for p in (root, *root.parents)):
        raise RepairError('프로젝트 루트가 일반 폴더가 아닙니다.')
    project = root / 'Project'
    if project.is_symlink() or not project.is_dir():
        raise RepairError('일반 Project 폴더를 찾지 못했습니다.')
    files = []
    for folder, directories, names in os.walk(project, followlinks=False, onerror=walk_error):
        if any((Path(folder) / name).is_symlink() for name in directories):
            raise RepairError('Project 안에 연결된 폴더가 있어 중단합니다.')
        if 'Main.storyboard' in names:
            files.append(Path(folder) / 'Main.storyboard')
    if len(files) != 1 or files[0].is_symlink() or not files[0].is_file():
        raise RepairError('일반 Main.storyboard 파일이 정확히 하나여야 합니다.')
    path = files[0]
    original_mode = stat.S_IMODE(path.stat().st_mode)
    original = path.read_bytes()
    document = ET.fromstring(original)
    classes = ('AppDelegate', 'ViewController')
    states = []
    for name in classes:
        elements = [element for element in document.iter() if element.get('customClass') == name]
        if len(elements) != 1:
            raise RepairError('예상한 클래스가 정확히 하나가 아닙니다: ' + name)
        attributes = elements[0].attrib
        if attributes.get('customModuleProvider') == 'target' and 'customModule' not in attributes:
            states.append('pending')
        elif attributes.get('customModule') == 'NyangstaSave' and 'customModuleProvider' not in attributes:
            states.append('fixed')
        else:
            raise RepairError('예상하지 않은 모듈 설정입니다: ' + name)
    if states == ['fixed', 'fixed']:
        print('이미 수정됨: 두 클래스가 NyangstaSave를 참조합니다. 파일을 변경하지 않았습니다.')
        return
    if states != ['pending', 'pending']:
        raise RepairError('두 클래스의 수정 상태가 서로 달라 중단합니다.')
    updated = original
    for name in classes:
        pattern = rb'<[A-Za-z_][^>]*\bcustomClass\s*=\s*"' + name.encode('ascii') + rb'"[^>]*>'
        matches = list(re.finditer(pattern, updated))
        if len(matches) != 1:
            raise RepairError('원문 클래스 태그를 하나로 확인하지 못했습니다: ' + name)
        match = matches[0]
        replacement, count = re.subn(rb'\bcustomModuleProvider\s*=\s*"target"',
                                     b'customModule="NyangstaSave"', match.group())
        if count != 1:
            raise RepairError('원문 모듈 참조가 예상과 다릅니다: ' + name)
        updated = updated[:match.start()] + replacement + updated[match.end():]
    repaired = ET.fromstring(updated)
    for name in classes:
        elements = [element for element in repaired.iter() if element.get('customClass') == name]
        if (len(elements) != 1 or elements[0].get('customModule') != 'NyangstaSave'
                or 'customModuleProvider' in elements[0].attrib):
            raise RepairError('수정 결과의 실제 클래스 참조를 확인하지 못했습니다: ' + name)
    backup = root / ('Main.storyboard-backup-' + datetime.now().strftime('%Y%m%d-%H%M%S-%f') + '.xml')
    with backup.open('xb') as saved:
        saved.write(original)
        saved.flush()
        os.fsync(saved.fileno())
    temporary = None
    try:
        descriptor, temporary = tempfile.mkstemp(prefix='.Main.storyboard-repair-', dir=path.parent)
        with os.fdopen(descriptor, 'wb') as pending:
            pending.write(updated)
            pending.flush()
            os.fsync(pending.fileno())
        os.chmod(temporary, original_mode)
        if path.is_symlink() or path.read_bytes() != original:
            raise RepairError('작업 중 원본이 변경되어 교체하지 않았습니다. 백업: ' + str(backup))
        os.replace(temporary, path)
        temporary = None
    finally:
        if temporary is not None:
            Path(temporary).unlink(missing_ok=True)
    print('완료: 두 클래스 참조만 수정했습니다.')
    print('원본 백업:', backup)


try:
    repair()
except (RepairError, OSError, ET.ParseError) as error:
    print('중단:', error, file=sys.stderr)
    sys.exit(1)
print('다음: Xcode에서 Product → Clean Build Folder를 선택한 뒤 Run을 누르세요.')
print('앱 빌드·서명·Safari 재시작 유지 여부는 아직 확인하지 않았습니다.')
PY
exit $?
