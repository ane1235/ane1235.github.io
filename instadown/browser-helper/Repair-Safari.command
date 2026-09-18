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
    report_target_modules(data)
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


def pbx_spans(text):
    """Locate OpenStep values without reserializing comments or unrelated settings."""
    tokens = []
    lexer = re.compile(r'\s+|/\*[\s\S]*?\*/|//[^\r\n]*|"(?:[^"\\]|\\[\s\S])*"|[{}()=;,]|[^\s{}()=;,"]+')
    position = 0
    while position < len(text):
        match = lexer.match(text, position)
        if match is None:
            raise RepairError('프로젝트 원문의 구문을 안전하게 확인하지 못했습니다.')
        raw = match.group()
        if not (raw.isspace() or raw.startswith(('/*', '//'))):
            tokens.append((raw, match.start(), match.end()))
        position = match.end()
    position = 0

    def take(expected=None):
        nonlocal position
        if position >= len(tokens) or (expected is not None and tokens[position][0] != expected):
            raise RepairError('프로젝트 원문의 항목 경계를 확인하지 못했습니다.')
        token = tokens[position]
        position += 1
        return token

    def value(depth=0):
        if depth > 64:
            raise RepairError('프로젝트 원문의 중첩 범위가 예상보다 큽니다.')
        first = take()
        node = {'start': first[1], 'end': first[2], 'kind': first[0], 'entries': {}}
        if first[0] == '{':
            while position < len(tokens) and tokens[position][0] != '}':
                key = take()[0]
                if key.startswith('"'):
                    key = key[1:-1]
                if '\\' in key or key in '{}()=;,' or key in node['entries']:
                    raise RepairError('중복되거나 예상하지 않은 프로젝트 키가 있습니다.')
                take('=')
                node['entries'][key] = value(depth + 1)
                take(';')
            last = take('}')
            node.update(end=last[2], close=last[1])
        elif first[0] == '(':
            while position < len(tokens) and tokens[position][0] != ')':
                value(depth + 1)
                if position < len(tokens) and tokens[position][0] == ',':
                    take(',')
                elif position < len(tokens) and tokens[position][0] != ')':
                    raise RepairError('프로젝트 배열 구문을 확인하지 못했습니다.')
            node['end'] = take(')')[2]
        elif first[0] in '}=;,':
            raise RepairError('프로젝트 값 구문을 확인하지 못했습니다.')
        return node

    root = value()
    if root['kind'] != '{' or position != len(tokens):
        raise RepairError('프로젝트 전체 원문 구조를 확인하지 못했습니다.')
    return root


def plist_json(path):
    output = read_tool(['/usr/bin/plutil', '-convert', 'json', '-o', '-', str(path)])
    if output is None:
        raise RepairError('plutil로 프로젝트 설정을 확인하지 못했습니다. 파일을 교체하지 않습니다.')
    data = json.loads(output)
    if not isinstance(data, dict) or not isinstance(data.get('objects'), dict):
        raise RepairError('프로젝트 설정 구조가 예상과 다릅니다.')
    return data


def file_state(path):
    safe_path(path)
    info = path.stat()
    return (info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns, info.st_ctime_ns,
            stat.S_IMODE(info.st_mode))


def report_target_modules(data):
    objects = data['objects']
    for target in [obj for obj in objects.values() if obj.get('isa') == 'PBXNativeTarget'][:16]:
        configuration_list = objects.get(target.get('buildConfigurationList'), {})
        for config_id in configuration_list.get('buildConfigurations', [])[:8]:
            config = objects.get(config_id, {})
            settings = config.get('buildSettings', {})
            report('타깃 모듈', {'target': str(target.get('name', '(이름 없음)'))[:100],
                   'product_type': target.get('productType'), 'configuration': config.get('name'),
                   'module': settings.get('PRODUCT_MODULE_NAME'),
                   'product_name': settings.get('PRODUCT_NAME'),
                   'xcconfig_reference': bool(config.get('baseConfigurationReference')),
                   'conditional_module': any(key.startswith('PRODUCT_MODULE_NAME[') for key in settings)})


def native_target(data, product_type, label):
    objects = data['objects']
    project = objects.get(data.get('rootObject'), {})
    matches = [(key, obj) for key, obj in objects.items() if obj.get('isa') == 'PBXNativeTarget'
               and obj.get('productType') == product_type]
    if (project.get('isa') != 'PBXProject' or len(matches) != 1
            or project.get('targets', []).count(matches[0][0]) != 1):
        raise RepairError('프로젝트에 속한 ' + label + ' 타깃을 하나로 확인하지 못했습니다.')
    return matches[0]


def target_configurations(data, target, label):
    objects = data['objects']
    project = objects.get(data.get('rootObject'), {})
    list_id = target.get('buildConfigurationList')
    configuration_list = objects.get(list_id, {})
    ids = configuration_list.get('buildConfigurations', [])
    if (configuration_list.get('isa') != 'XCConfigurationList' or len(ids) != 2
            or len(set(ids)) != 2
            or sum(obj.get('buildConfigurationList') == list_id for obj in objects.values()) != 1):
        raise RepairError(label + ' 전용 Debug·Release 설정을 확인하지 못했습니다.')
    for key, obj in objects.items():
        if key != list_id and obj.get('isa') == 'XCConfigurationList' and set(ids).intersection(obj.get('buildConfigurations', [])):
            raise RepairError(label + ' 설정을 다른 타깃과 공유하고 있어 중단합니다.')
    configurations = [(key, objects.get(key, {})) for key in ids]
    if {config.get('name') for _, config in configurations} != {'Debug', 'Release'}:
        raise RepairError(label + ' 설정 이름이 Debug·Release와 다릅니다.')
    project_list = objects.get(project.get('buildConfigurationList'), {})
    relevant = [config for _, config in configurations] + [objects.get(key, {}) for key in project_list.get('buildConfigurations', [])]
    for config in relevant:
        settings = config.get('buildSettings')
        if (config.get('isa') != 'XCBuildConfiguration' or not isinstance(settings, dict)
                or config.get('baseConfigurationReference')
                or any(key.startswith('PRODUCT_MODULE_NAME[') for key in settings)):
            raise RepairError('조건부 설정 또는 외부 설정 파일이 있어 자동 수정하지 않습니다.')
    return configurations


def module_configurations(data):
    app_id, app = native_target(data, 'com.apple.product-type.application', '앱')
    configurations = target_configurations(data, app, '앱')
    for _, config in configurations:
        if ('PRODUCT_MODULE_NAME' in config['buildSettings']
                and config['buildSettings']['PRODUCT_MODULE_NAME'] != 'NyangstaSave'):
            raise RepairError('앱에 다른 모듈 이름이 명시되어 있어 자동 수정하지 않습니다.')
    for key, target in data['objects'].items():
        if key == app_id or target.get('isa') != 'PBXNativeTarget':
            continue
        configuration_list = data['objects'].get(target.get('buildConfigurationList'), {})
        for config_id in configuration_list.get('buildConfigurations', []):
            settings = data['objects'].get(config_id, {}).get('buildSettings', {})
            if any(value == 'NyangstaSave' for name, value in settings.items()
                   if name == 'PRODUCT_MODULE_NAME' or name.startswith('PRODUCT_MODULE_NAME[')):
                report_target_modules(data)
                raise RepairError('다른 타깃도 NyangstaSave를 사용합니다. 모듈 충돌 진단이 필요해 변경하지 않았습니다.')
    return configurations


def replace_project(root, path, original, original_state, updated, expected, unchanged):
    temporary = None
    try:
        descriptor, temporary = tempfile.mkstemp(prefix='.project-module-repair-', dir=path.parent)
        with os.fdopen(descriptor, 'wb') as pending:
            pending.write(updated)
            pending.flush()
            os.fsync(pending.fileno())
        os.chmod(temporary, original_state[-1])
        if plist_json(temporary) != expected:
            raise RepairError('허용한 모듈 설정 외의 변경이 감지되어 교체하지 않았습니다.')
        unchanged()
        backup = root / ('project.pbxproj-backup-' + datetime.now().strftime('%Y%m%d-%H%M%S-%f') + '.txt')
        backup_descriptor = os.open(backup, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(backup_descriptor, 'wb') as saved:
            saved.write(original)
            saved.flush()
            os.fsync(saved.fileno())
        unchanged()
        if safe_path(temporary).read_bytes() != updated:
            raise RepairError('임시 파일이 변경되어 교체하지 않았습니다.')
        os.replace(temporary, path)
        temporary = None
    finally:
        if temporary is not None:
            Path(temporary).unlink(missing_ok=True)
    return backup


def fix_module(arguments):
    if len(arguments) > 1 or (arguments and arguments[0].startswith('--')):
        raise RepairError('--fix-module 뒤에는 프로젝트 루트 경로 하나만 지정하세요.')
    print('모듈 수정 시작: Xcode를 종료한 상태에서 실행하세요.', flush=True)
    root = safe_path(arguments[0] if arguments else Path.home() / 'Downloads/Nyangsta-Safari-Project-20260918-102433', directory=True)
    project = safe_path(root / 'Project', directory=True)
    storyboards, projects = [], []
    for folder, directories, names in os.walk(project, followlinks=False, onerror=walk_error):
        if any((Path(folder) / name).is_symlink() for name in directories):
            raise RepairError('Project 안에 연결된 폴더가 있어 중단합니다.')
        if 'Main.storyboard' in names:
            storyboards.append(Path(folder) / 'Main.storyboard')
        if 'project.pbxproj' in names and Path(folder).suffix == '.xcodeproj':
            projects.append(Path(folder) / 'project.pbxproj')
    if len(storyboards) != 1 or len(projects) != 1:
        raise RepairError('프로젝트 파일과 Main.storyboard가 각각 하나여야 합니다.')
    storyboard, path = safe_path(storyboards[0]), safe_path(projects[0])
    storyboard_state, original_state = file_state(storyboard), file_state(path)
    storyboard_bytes, original = storyboard.read_bytes(), path.read_bytes()
    tree = ET.fromstring(storyboard_bytes)
    for name in ('AppDelegate', 'ViewController'):
        nodes = [node for node in tree.iter() if node.get('customClass') == name]
        if (len(nodes) != 1 or nodes[0].get('customModule') != 'NyangstaSave'
                or 'customModuleProvider' in nodes[0].attrib):
            raise RepairError('스토리보드의 두 클래스 참조가 NyangstaSave여야 합니다.')
    data = plist_json(path)
    configurations = module_configurations(data)
    text = original.decode('utf-8')
    spans = pbx_spans(text)['entries']['objects']['entries']
    expected = json.loads(json.dumps(data))
    edits = []
    newline = '\r\n' if '\r\n' in text else '\n'
    for config_id, config in configurations:
        settings = spans[config_id]['entries']['buildSettings']
        if settings['kind'] != '{' or set(settings['entries']) != set(config['buildSettings']):
            raise RepairError('원문과 해석된 앱 설정이 다릅니다.')
        if config['buildSettings'].get('PRODUCT_MODULE_NAME') == 'NyangstaSave':
            continue
        closing = settings['close']
        line_start = text.rfind('\n', 0, closing) + 1
        indent = text[line_start:closing]
        if indent.strip():
            raise RepairError('앱 설정의 줄 구조가 예상과 달라 자동 수정하지 않습니다.')
        edits.append((line_start, indent + '\tPRODUCT_MODULE_NAME = NyangstaSave;' + newline))
        expected['objects'][config_id]['buildSettings']['PRODUCT_MODULE_NAME'] = 'NyangstaSave'
    def unchanged():
        if (file_state(path) != original_state or path.read_bytes() != original
                or file_state(storyboard) != storyboard_state or storyboard.read_bytes() != storyboard_bytes):
            raise RepairError('작업 중 프로젝트가 변경되어 교체하지 않았습니다. Xcode를 종료한 뒤 다시 실행하세요.')
    unchanged()
    if not edits:
        print('이미 수정됨: 앱 Debug·Release 모듈은 NyangstaSave입니다. 파일을 변경하지 않았습니다.')
        return
    for position, addition in sorted(edits, reverse=True):
        text = text[:position] + addition + text[position:]
    updated = text.encode('utf-8')
    backup = replace_project(root, path, original, original_state, updated, expected, unchanged)
    print('모듈 수정 완료: 앱 Debug·Release의 PRODUCT_MODULE_NAME을 NyangstaSave로 맞췄습니다.')
    print('원본 백업:', backup)


def extension_info_path(value, source_root, project):
    if not isinstance(value, str) or not value:
        raise RepairError('확장 INFOPLIST_FILE 경로가 명시되어 있지 않습니다.')
    for prefix in ('$(SRCROOT)/', '$(PROJECT_DIR)/'):
        if value.startswith(prefix):
            value = str(source_root / value[len(prefix):])
            break
    if '$' in value or '~' in value or '..' in Path(value).parts:
        raise RepairError('확장 Info.plist 경로에 해석할 수 없는 변수 또는 상위 경로가 있습니다.')
    path = Path(value)
    if not path.is_absolute():
        path = source_root / path
    if not path.is_relative_to(project):
        raise RepairError('확장 Info.plist가 Project 폴더 밖에 있어 중단합니다.')
    return safe_path(path)


def extension_dependencies(data, extension, configurations, pbx, project):
    objects = data['objects']
    project_object = objects[data['rootObject']]
    project_list = objects.get(project_object.get('buildConfigurationList'), {})
    relevant = [config for _, config in configurations] + [objects.get(key, {}) for key in project_list.get('buildConfigurations', [])]
    for config in relevant:
        settings = config.get('buildSettings', {})
        if (settings.get('INFOPLIST_EXPAND_BUILD_SETTINGS', 'YES') != 'YES'
                or settings.get('INFOPLIST_PREPROCESS', 'NO') != 'NO'
                or settings.get('INFOPLIST_PREFIX_HEADER') or settings.get('INFOPLIST_OTHER_PREPROCESSOR_FLAGS')
                or any(key.startswith(('INFOPLIST_FILE[', 'INFOPLIST_EXPAND_BUILD_SETTINGS[',
                                       'INFOPLIST_PREPROCESS[', 'INFOPLIST_PREFIX_HEADER[',
                                       'INFOPLIST_OTHER_PREPROCESSOR_FLAGS[', 'INFOPLIST_KEY_NSExtension'))
                       for key in settings)):
            raise RepairError('확장 Info.plist의 변수 확장·전처리·덮어쓰기 설정이 모호해 중단합니다.')
    paths = [extension_info_path(config['buildSettings'].get('INFOPLIST_FILE'), pbx.parent.parent, project)
             for _, config in configurations]
    if paths[0] != paths[1]:
        raise RepairError('확장 Debug·Release의 Info.plist 경로가 서로 다릅니다.')
    info_path = paths[0]
    info_state, info_bytes = file_state(info_path), info_path.read_bytes()
    info = plistlib.loads(info_bytes).get('NSExtension', {})
    if (not isinstance(info, dict) or info.get('NSExtensionPointIdentifier') != 'com.apple.Safari.web-extension'
            or info.get('NSExtensionPrincipalClass') != '$(PRODUCT_MODULE_NAME).SafariWebExtensionHandler'
            or 'NSExtensionMainStoryboard' in info):
        raise RepairError('Safari 확장 식별자 또는 모듈 변수 기반 진입 클래스가 예상과 다릅니다.')
    sources = list(project.rglob('SafariWebExtensionHandler.swift'))
    if len(sources) != 1:
        raise RepairError('SafariWebExtensionHandler.swift가 정확히 하나여야 합니다.')
    handler = safe_path(sources[0])
    handler_state, handler_bytes = file_state(handler), handler.read_bytes()
    text = handler_bytes.decode('utf-8')
    declarations = re.findall(r'(?m)^\s*(?:(?:final|public|internal|private|fileprivate|open)\s+)*'
                              r'class\s+SafariWebExtensionHandler\s*:\s*([^\{\n]+)', text)
    if (len(declarations) != 1 or 'NSExtensionRequestHandling' not in [base.strip() for base in declarations[0].split(',')]
            or re.search(r'@objc\s*\(', text)):
        raise RepairError('확장 핸들러 클래스 또는 Objective-C 별칭이 예상과 다릅니다.')
    if extension.get('fileSystemSynchronizedGroups'):
        raise RepairError('확장 소스가 자동 동기화 그룹이므로 멤버십 추가 진단이 필요합니다.')
    membership = []
    for phase_id in extension.get('buildPhases', []):
        phase = objects.get(phase_id, {})
        if phase.get('isa') != 'PBXSourcesBuildPhase':
            continue
        for file_id in phase.get('files', []):
            entry = objects.get(file_id, {})
            file = objects.get(entry.get('fileRef'), {})
            if Path(file.get('path', file.get('name', ''))).name == 'SafariWebExtensionHandler.swift':
                membership.append(entry)
    if len(membership) != 1 or any(key in membership[0] for key in ('platformFilter', 'platformFilters')):
        raise RepairError('확장 Compile Sources에서 핸들러를 하나로 확인하지 못했습니다.')
    return [(info_path, info_state, info_bytes), (handler, handler_state, handler_bytes)]


def fix_collision(arguments):
    if len(arguments) > 1 or (arguments and arguments[0].startswith('--')):
        raise RepairError('--fix-collision 뒤에는 프로젝트 루트 경로 하나만 지정하세요.')
    print('충돌 확인 시작: Xcode를 종료한 상태에서 실행하세요.', flush=True)
    root = safe_path(arguments[0] if arguments else Path.home() / 'Downloads/Nyangsta-Safari-Project-20260918-102433', directory=True)
    project = safe_path(root / 'Project', directory=True)
    for folder, directories, _ in os.walk(project, followlinks=False, onerror=walk_error):
        if any((Path(folder) / name).is_symlink() for name in directories):
            raise RepairError('Project 안에 연결된 폴더가 있어 중단합니다.')
    projects = list(project.rglob('*.xcodeproj/project.pbxproj'))
    storyboards = list(project.rglob('Main.storyboard'))
    if len(projects) != 1 or len(storyboards) != 1:
        raise RepairError('프로젝트 파일과 Main.storyboard가 각각 하나여야 합니다.')
    path, storyboard = safe_path(projects[0]), safe_path(storyboards[0])
    original_state, original = file_state(path), path.read_bytes()
    dependencies = [(storyboard, file_state(storyboard), storyboard.read_bytes())]
    data = plist_json(path)
    report_target_modules(data)
    storyboard_tree = ET.fromstring(dependencies[0][2])
    for name in ('AppDelegate', 'ViewController'):
        nodes = [node for node in storyboard_tree.iter() if node.get('customClass') == name]
        if (len(nodes) != 1 or nodes[0].get('customModule') != 'NyangstaSave'
                or 'customModuleProvider' in nodes[0].attrib):
            raise RepairError('스토리보드의 두 클래스 참조가 NyangstaSave여야 합니다.')
    app_id, app = native_target(data, 'com.apple.product-type.application', '앱')
    extension_id, extension = native_target(data, 'com.apple.product-type.app-extension', '확장')
    app_configs = target_configurations(data, app, '앱')
    extension_configs = target_configurations(data, extension, '확장')
    if any(config['buildSettings'].get('PRODUCT_MODULE_NAME') != 'NyangstaSave' for _, config in app_configs):
        raise RepairError('앱 Debug·Release 모듈이 모두 NyangstaSave인 상태가 아니므로 변경하지 않았습니다.')
    extension_modules = {config['buildSettings'].get('PRODUCT_MODULE_NAME') for _, config in extension_configs}
    if extension_modules not in ({'NyangstaSave'}, {'NyangstaSaveExtension'}):
        raise RepairError('확장의 동일 모듈 충돌을 확인하지 못했습니다. 표시된 타깃 모듈 진단이 필요합니다.')
    for key, target in data['objects'].items():
        if target.get('isa') != 'PBXNativeTarget' or key in (app_id, extension_id):
            continue
        configuration_list = data['objects'].get(target.get('buildConfigurationList'), {})
        for config_id in configuration_list.get('buildConfigurations', []):
            settings = data['objects'].get(config_id, {}).get('buildSettings', {})
            if ('NyangstaSaveExtension' in settings.values()
                    or target.get('name') == 'NyangstaSaveExtension'):
                raise RepairError('다른 타깃이 NyangstaSaveExtension을 사용하므로 변경하지 않았습니다.')
        raise RepairError('앱과 Safari 확장 외의 타깃이 있어 추가 진단이 필요합니다.')
    dependencies.extend(extension_dependencies(data, extension, extension_configs, path, project))
    def unchanged():
        if (file_state(path) != original_state or path.read_bytes() != original
                or any(file_state(file) != state or file.read_bytes() != content
                       for file, state, content in dependencies)):
            raise RepairError('작업 중 프로젝트 또는 확장 소스가 변경되어 교체하지 않았습니다.')
    unchanged()
    if extension_modules == {'NyangstaSaveExtension'}:
        print('이미 분리됨: 앱 NyangstaSave, 확장 NyangstaSaveExtension. 파일을 변경하지 않았습니다.')
        return
    text = original.decode('utf-8')
    spans = pbx_spans(text)['entries']['objects']['entries']
    expected = json.loads(json.dumps(data))
    edits = []
    for config_id, config in extension_configs:
        settings = spans[config_id]['entries']['buildSettings']
        if settings['kind'] != '{' or set(settings['entries']) != set(config['buildSettings']):
            raise RepairError('원문과 해석된 확장 설정이 다릅니다.')
        value = settings['entries']['PRODUCT_MODULE_NAME']
        if text[value['start']:value['end']] not in ('NyangstaSave', '"NyangstaSave"'):
            raise RepairError('확장 모듈 원문이 예상과 달라 변경하지 않았습니다.')
        replacement = '"NyangstaSaveExtension"' if text[value['start']] == '"' else 'NyangstaSaveExtension'
        edits.append((value['start'], value['end'], replacement))
        expected['objects'][config_id]['buildSettings']['PRODUCT_MODULE_NAME'] = 'NyangstaSaveExtension'
    for start, end, replacement in sorted(edits, reverse=True):
        text = text[:start] + replacement + text[end:]
    backup = replace_project(root, path, original, original_state, text.encode('utf-8'), expected, unchanged)
    print('충돌 수정 완료: 확장 Debug·Release 모듈만 NyangstaSaveExtension으로 분리했습니다.')
    print('원본 백업:', backup)


def main():
    diagnostic = len(sys.argv) > 1 and sys.argv[1] == '--diagnose'
    try:
        if diagnostic:
            diagnose(sys.argv[2:])
        elif len(sys.argv) > 1 and sys.argv[1] == '--fix-collision':
            fix_collision(sys.argv[2:])
            print('다음: 기존 Xcode 프로젝트를 다시 열고 Product → Clean Build Folder → Run을 실행하세요.')
            print('앱 실행·서명·Safari 재시작 유지 여부는 아직 확인하지 않았습니다.')
        elif len(sys.argv) > 1 and sys.argv[1] == '--fix-module':
            fix_module(sys.argv[2:])
            print('다음: 기존 Xcode 프로젝트를 다시 열고 Product → Clean Build Folder → Run을 실행하세요.')
            print('앱 실행·서명·Safari 재시작 유지 여부는 아직 확인하지 않았습니다.')
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
