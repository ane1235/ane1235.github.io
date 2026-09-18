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
import json
import os
import plistlib
import re
import stat
import subprocess
import sys
import tempfile
import unicodedata
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


SETTINGS = ('PRODUCT_MODULE_NAME', 'PRODUCT_NAME', 'IBSC_MODULE', 'IBC_MODULE',
            'ENABLE_DEBUG_DYLIB', 'EXCLUDED_SOURCE_FILE_NAMES', 'INCLUDED_SOURCE_FILE_NAMES')
SOURCE_NAMES = ('AppDelegate.swift', 'ViewController.swift', 'AppDelegate.m', 'ViewController.m')
DERIVED_SUFFIX = '-gjdttgdlahjlvofkbkwwdnogohbs'


def report(label, value):
    print(label + ': ' + json.dumps(value, ensure_ascii=False), flush=True)


def safe_path(path, directory=False):
    path = Path(path).expanduser().absolute()
    if any(item.is_symlink() for item in (path, *path.parents)):
        raise RepairError('진단 경로에 심볼릭 링크가 있어 중단합니다.')
    if not (path.is_dir() if directory else path.is_file()):
        raise RepairError('필요한 일반 파일 또는 폴더를 확인하지 못했습니다.')
    if not directory and path.stat().st_size > 16 * 1024 * 1024:
        raise RepairError('진단 파일의 크기 제한을 넘었습니다.')
    return path


def read_tool(argv):
    try:
        result = subprocess.run(argv, stdin=subprocess.DEVNULL, capture_output=True,
                                text=True, timeout=15, check=False, shell=False)
    except (OSError, subprocess.TimeoutExpired):
        return None
    return result.stdout if result.returncode == 0 and len(result.stdout) <= 2 * 1024 * 1024 else None


def diagnose_project(project):
    storyboards = list(project.rglob('Main.storyboard'))
    if len(storyboards) != 1:
        raise RepairError('진단할 Main.storyboard가 정확히 하나여야 합니다.')
    tree = ET.fromstring(safe_path(storyboards[0]).read_bytes())
    for name in ('AppDelegate', 'ViewController'):
        report('스토리보드 ' + name, [{key: node.get(key) for key in
               ('customClass', 'customModule', 'customModuleProvider')}
               for node in tree.iter() if node.get('customClass') == name][:4])
    for name in SOURCE_NAMES:
        files = list(project.rglob(name))
        report('소스 파일 ' + name, len(files))
        if len(files) > 4:
            raise RepairError('같은 이름의 소스가 너무 많아 중단합니다.')
        for source in files:
            text = safe_path(source).read_text(encoding='utf-8')
            declarations = re.findall(r'(?m)^\s*(?:@(?:objc(?:\([\w.$]+\))?|MainActor|main|NSApplicationMain)\s+)*'
                                      r'(?:(?:final|public|internal|private|fileprivate|open)\s+)*'
                                      r'(?:class|@interface)\s+(\w{1,100})\s*:\s*([\w., ]{1,160})', text)
            annotations = re.findall(r'@objc(?:\s*\(\s*([\w.$]+)\s*\))?', text)
            conditions = re.findall(r'#(?:if|elseif)\s+os\((?:macOS|iOS)\)', text)
            report('소스 선언', {'file': source.relative_to(project).as_posix(),
                'classes': declarations[:4], 'objc_names': annotations[:4],
                'objc_implementation': re.findall(r'@implementation\s+(\w{1,100})\b', text)[:4],
                'main_annotation': bool(re.search(r'@(?:main|NSApplicationMain)\b', text)),
                'platform_conditions': conditions[:8], 'webView_outlet': bool(re.search(r'@IBOutlet\s+(?:\w+\s+)*webView\b', text))})
    projects = list(project.rglob('*.xcodeproj/project.pbxproj'))
    if len(projects) != 1:
        raise RepairError('진단할 Xcode 프로젝트가 정확히 하나여야 합니다.')
    output = read_tool(['/usr/bin/plutil', '-convert', 'json', '-o', '-', str(safe_path(projects[0]))])
    if output is None:
        report('타깃 분석', 'plutil 결과를 읽지 못했습니다. 원문 오류는 출력하지 않습니다.')
        return
    data = json.loads(output)
    objects = data['objects']
    native = [(key, value) for key, value in objects.items() if value.get('isa') == 'PBXNativeTarget'
              and value.get('productType') == 'com.apple.product-type.application']
    if len(native) != 1:
        raise RepairError('앱 타깃을 하나로 확인하지 못했습니다.')
    target_id, target = native[0]
    source_files = []
    for phase_id in target.get('buildPhases', []):
        phase = objects.get(phase_id, {})
        if phase.get('isa') != 'PBXSourcesBuildPhase':
            continue
        for file_id in phase.get('files', []):
            build_file = objects.get(file_id, {})
            entry = objects.get(build_file.get('fileRef'), {})
            name = Path(entry.get('path', entry.get('name', ''))).name
            if name in SOURCE_NAMES:
                source_files.append({'file': name, **{key: build_file[key]
                                     for key in ('platformFilter', 'platformFilters') if key in build_file}})
    sync = target.get('fileSystemSynchronizedGroups', [])
    report('앱 Compile Sources', sorted(source_files, key=lambda item: item['file']))
    report('동기화 그룹', {'count': len(sync), 'membership':
           '자동 멤버십 가능: 명시 목록 부재로 소스 누락을 확정할 수 없음' if sync else '명시 Compile Sources 방식'})
    report('설정 해석', '아래 값은 저장된 설정이며 상속·xcconfig를 적용한 최종 유효값이 아닙니다.')
    project_object = objects.get(data.get('rootObject'), {})
    for label, owner in (('프로젝트', project_object), ('앱', target)):
        configuration = objects.get(owner.get('buildConfigurationList'), {})
        for config_id in configuration.get('buildConfigurations', [])[:8]:
            config = objects.get(config_id, {})
            if config.get('name') not in ('Debug', 'Release'):
                continue
            settings = config.get('buildSettings', {})
            report(label + ' ' + config['name'], {'settings': {key: settings[key] for key in SETTINGS if key in settings},
                'xcconfig_reference': bool(config.get('baseConfigurationReference'))})


def find_built_app():
    derived = Path.home() / 'Library/Developer/Xcode/DerivedData'
    if not derived.is_dir():
        return None
    safe_path(derived, directory=True)
    matching = list(derived.glob('*' + DERIVED_SUFFIX))
    if len(matching) != 1:
        return None
    debug = safe_path(matching[0], directory=True) / 'Build/Products/Debug'
    if not debug.is_dir():
        return None
    safe_path(debug, directory=True)
    apps = [path for path in debug.iterdir() if unicodedata.normalize('NFC', path.name) == '냥스타저장.app']
    return apps[0] if len(apps) == 1 else None


def diagnose_app(app):
    if app is None:
        report('빌드 산출물', '지정된 DerivedData의 Debug 앱을 찾지 못했습니다. 다른 프로젝트는 탐색하지 않았습니다.')
        return
    app = safe_path(app, directory=True)
    if app.suffix != '.app':
        raise RepairError('명시한 빌드 산출물은 .app 폴더여야 합니다.')
    with safe_path(app / 'Contents/Info.plist').open('rb') as stream:
        info = plistlib.load(stream)
    keys = ('CFBundleIdentifier', 'CFBundleExecutable', 'NSPrincipalClass', 'NSMainStoryboardFile', 'NSMainNibFile')
    report('앱 Info', {key: info[key] for key in keys if key in info})
    executable = info.get('CFBundleExecutable')
    if not isinstance(executable, str) or Path(executable).name != executable or executable in ('.', '..', ''):
        raise RepairError('앱 실행 파일 이름을 확인하지 못했습니다.')
    binaries = safe_path(app / 'Contents/MacOS', directory=True)
    candidates = [binaries / executable, *sorted(binaries.glob('*.debug.dylib'))]
    if len(candidates) > 5:
        raise RepairError('예상보다 많은 Debug 라이브러리가 있어 중단합니다.')
    for candidate in candidates:
        if not candidate.exists():
            report('바이너리 ' + candidate.name, '없음')
            continue
        output = read_tool(['/usr/bin/nm', '-g', '-U', str(safe_path(candidate))])
        if output is None:
            report('바이너리 ' + candidate.name, 'nm 결과를 읽지 못했습니다. 원문 오류는 출력하지 않습니다.')
            continue
        objc, swift = set(), set()
        for line in output.splitlines():
            symbol = line.split()[-1] if line.split() else ''
            if len(symbol) > 240 or not any(name in symbol for name in ('AppDelegate', 'ViewController')):
                continue
            if re.fullmatch(r'_?OBJC_CLASS_\$_[\w$]+', symbol):
                objc.add(symbol)
            elif re.fullmatch(r'_?\$s[\w$]*(?:11AppDelegate|14ViewController)C(?:N|Ma|Mn)', symbol):
                swift.add(symbol)
        report('바이너리 ' + candidate.name, {'objc_classes': sorted(objc)[:6], 'swift_metadata': sorted(swift)[:6]})
    report('심볼 해석', '정의된 심볼만 검사했습니다. 미검출만으로 소스 누락이나 런타임 클래스 부재를 확정할 수 없습니다.')


def diagnose(arguments):
    root, app = None, None
    iterator = iter(arguments)
    for value in iterator:
        if value == '--app' and app is None:
            app = next(iterator, None)
            if app is None:
                raise RepairError('--app 뒤에 앱 경로가 필요합니다.')
        elif not value.startswith('--') and root is None:
            root = value
        else:
            raise RepairError('진단은 프로젝트 경로 하나와 선택적인 --app 경로만 받습니다.')
    root = safe_path(root or Path.home() / 'Downloads/Nyangsta-Safari-Project-20260918-102433', directory=True)
    project = safe_path(root / 'Project', directory=True)
    report('진단 시작', '읽기 전용: 파일·설정·계정·서명을 변경하거나 빌드하지 않습니다.')
    diagnose_project(project)
    diagnose_app(Path(app) if app else find_built_app())
    report('진단 완료', '표시된 요약만 전달하세요. 앱 실행·서명 성공을 뜻하지 않습니다.')


def main():
    diagnostic = len(sys.argv) > 1 and sys.argv[1] == '--diagnose'
    try:
        if diagnostic:
            diagnose(sys.argv[2:])
        else:
            repair()
            print('다음: Xcode에서 Product → Clean Build Folder를 선택한 뒤 Run을 누르세요.')
            print('앱 빌드·서명·Safari 재시작 유지 여부는 아직 확인하지 않았습니다.')
    except (RepairError, OSError, ET.ParseError, ValueError, KeyError, TypeError, AttributeError) as error:
        if diagnostic:
            print('진단 중단: 필요한 파일 구조 또는 도구 응답을 안전하게 확인하지 못했습니다.', file=sys.stderr)
        else:
            print('중단:', error, file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
PY
exit $?
