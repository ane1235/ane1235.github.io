var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');
var vm = require('node:vm');
var test = require('node:test');
var root = path.join(__dirname, '..');

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function run(context, file) { vm.runInContext(read(file), context, { filename: file }); }
function plain(value) { return JSON.parse(JSON.stringify(value)); }
function tick() { return new Promise(function(resolve) { setImmediate(resolve); }); }

function client() {
  var calls = [];
  var elements = {};
  var context = vm.createContext({
    API_URL: 'https://example.test/exec',
    document: {
      getElementById: function(id) {
        if (!elements[id]) elements[id] = {
          innerHTML: '', textContent: '',
          classList: { add: function() {}, remove: function() {} }
        };
        return elements[id];
      }
    },
    fetch: function(url, options) {
      return new Promise(function(resolve, reject) {
        calls.push({ url: url, options: options, reject: reject,
          respond: function(body, status) {
            resolve({ ok: !status || status === 200, status: status || 200,
              json: function() { return Promise.resolve(body); } });
          },
          invalidJson: function() {
            resolve({ ok: true, json: function() { return Promise.reject(new Error('Invalid JSON')); } });
          }
        });
      });
    }
  });
  run(context, 'sheets/js/utils.js');
  return { context: context, calls: calls, elements: elements };
}

test('overlapping reads share one request, then the next read fetches changed data', async function() {
  var c = client();
  var first = c.context.callApi({ action: 'getSheetData', sheetKey: 'sheet1', gid: 1 });
  var second = c.context.callApi({ gid: 1, sheetKey: 'sheet1', action: 'getSheetData' });
  assert.equal(c.calls.length, 1);
  assert.equal(first, second);
  assert.equal(c.calls[0].options.cache, 'no-store');
  c.calls[0].respond({ success: true, data: { rows: [['before']] } });
  await Promise.all([first, second]);
  var next = c.context.callApi({ action: 'getSheetData', sheetKey: 'sheet1', gid: 1 });
  assert.equal(c.calls.length, 2);
  c.calls[1].respond({ success: true, data: { rows: [['after']] } });
  assert.equal((await next).data.rows[0][0], 'after');
});

test('source, tab, options and API endpoint keep independent requests', async function() {
  var c = client();
  var requests = [
    c.context.callApi({ action: 'getSheetData', sheetKey: 'sheet1', gid: 1 }),
    c.context.callApi({ action: 'getSheetData', sheetKey: 'sheet2', gid: 1 }),
    c.context.callApi({ action: 'getSheetData', sheetKey: 'sheet1', gid: 2 }),
    c.context.callApi({ action: 'getSheetData', sheetKey: 'sheet1', gid: 1, includeFontColors: false })
  ];
  c.context.API_URL = 'https://example.test/new';
  requests.push(c.context.callApi({ action: 'getSheetData', sheetKey: 'sheet1', gid: 1 }));
  assert.equal(c.calls.length, 5);
  c.calls.forEach(function(call) { call.respond({ success: true }); });
  await Promise.all(requests);
});

['network', 'http', 'json', 'application'].forEach(function(failure) {
  test(failure + ' errors release the shared request for retry', async function() {
    var c = client();
    var params = { action: 'getSheetList' };
    var first = c.context.callApi(params);
    var second = c.context.callApi(params);
    assert.equal(c.calls.length, 1);
    var done = Promise.allSettled([first, second]);
    if (failure === 'network') c.calls[0].reject(new Error('Offline'));
    if (failure === 'http') c.calls[0].respond({}, 503);
    if (failure === 'json') c.calls[0].invalidJson();
    if (failure === 'application') c.calls[0].respond({ success: false, error: 'Unavailable' });
    var outcomes = await done;
    assert.equal(outcomes[0].status, failure === 'application' ? 'fulfilled' : 'rejected');
    assert.equal(outcomes[1].status, outcomes[0].status);
    var retry = c.context.callApi(params);
    assert.equal(c.calls.length, 2);
    c.calls[1].respond({ success: true, data: [] });
    assert.equal((await retry).success, true);
  });
});

test('login requests are not shared', async function() {
  var c = client();
  var first = c.context.callApi({ action: 'login', name: 'Test', sn2: 'test-id' });
  var second = c.context.callApi({ action: 'login', name: 'Test', sn2: 'test-id' });
  assert.equal(c.calls.length, 2);
  c.calls.forEach(function(call) { call.respond({ success: true }); });
  await Promise.all([first, second]);
});

test('dashboard loads list + Assign + Duty in three requests and refresh reads updated data', async function() {
  var c = client();
  run(c.context, 'sheets/js/calendar.js');
  run(c.context, 'sheets/js/app.js');
  vm.runInContext('selectedDate = new Date(2026, 9, 2); state = { user: { name: "Test" } };', c.context);
  var rendered = {};
  c.context.renderAssignSection = function(rows) { rendered.assign = rows; };
  c.context.renderDutySection = function(rows, colors, assignRows) {
    rendered.duty = { rows: rows, colors: colors, assignRows: assignRows };
  };
  c.context.initApp();
  assert.equal(c.calls.length, 1);
  assert.equal(new URL(c.calls[0].url).searchParams.get('action'), 'getSheetList');
  c.calls[0].respond({ success: true, data: [
    { key: 'sheet1', tabs: [{ name: '2026년 10월', gid: 10 }] },
    { key: 'sheet2', tabs: [{ name: '26.9/16~10/15', gid: 20 }] }
  ] });
  await tick();
  assert.equal(c.calls.length, 3);
  var assignCall = c.calls.find(function(call) { return new URL(call.url).searchParams.get('sheetKey') === 'sheet1'; });
  var dutyCall = c.calls.find(function(call) { return new URL(call.url).searchParams.get('sheetKey') === 'sheet2'; });
  assert.equal(new URL(assignCall.url).searchParams.get('includeFontColors'), 'false');
  assert.equal(new URL(dutyCall.url).searchParams.has('includeFontColors'), false);
  assignCall.respond({ success: true, data: { headers: ['header'], rows: [['first']], fontColors: [] } });
  dutyCall.respond({ success: true, data: { rows: [['duty']], fontColors: [['#ff0000']] } });
  await tick();
  assert.deepEqual(plain(rendered.assign), [['header'], ['first']]);
  assert.deepEqual(plain(rendered.duty.assignRows), plain(rendered.assign));
  assert.deepEqual(plain(rendered.duty.colors), [['#ff0000']]);
  c.context.refreshDashboard();
  assert.equal(c.calls.length, 5);
  c.calls[3].respond({ success: true, data: { headers: ['header'], rows: [['updated']], fontColors: [] } });
  c.calls[4].respond({ success: true, data: { rows: [['updated-duty']], fontColors: [['#000000']] } });
  await tick();
  assert.deepEqual(plain(rendered.assign), [['header'], ['updated']]);
  assert.deepEqual(plain(rendered.duty.rows), [['updated-duty']]);
});

function backend() {
  var metrics = { colors: 0, tabs: [], reads: 0 };
  var context = vm.createContext({
    SpreadsheetApp: { openById: function() { return {
      getSheetById: function(gid) {
        metrics.tabs.push(gid);
        if (gid !== 10 && gid !== 1181166797) return null;
        return {
          getName: function() { return 'Test tab'; },
          getDataRange: function() { return {
            getValues: function() { metrics.reads++; return context.values; },
            getFontColors: function() { metrics.colors++; return [['#000000'], ['#ff0000'], ['#000000']]; },
            getDisplayValues: function() { return [['header'], ['4:30'], ['2026-10-02']]; }
          }; }
        };
      },
      getSheets: function() { throw new Error('Must not enumerate every tab for a data read'); }
    }; } },
    Session: { getScriptTimeZone: function() { return 'Asia/Seoul'; } },
    Utilities: { formatDate: function() { return '2026-10-02 00:00:00'; } },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: function(text) {
      return { setMimeType: function() { return JSON.parse(text); } };
    } }
  });
  run(context, 'scripts/SheetViewerService.gs');
  vm.runInContext("values = [['header'], [new Date(1899, 11, 30, 16, 30)], [new Date(2026, 9, 2)]];", context);
  return { context: context, metrics: metrics };
}

test('backend keeps default font colors, row offsets, date/time formatting and fresh reads', function() {
  var b = backend();
  var result = b.context.getSheetData('sheet2', '10');
  assert.equal(result.success, true);
  assert.deepEqual(plain(result.data.headers), ['header']);
  assert.deepEqual(plain(result.data.rows), [['4:30'], ['2026-10-02 00:00:00']]);
  assert.deepEqual(plain(result.data.fontColors), [['#ff0000'], ['#000000']]);
  b.context.values[1][0] = 'changed';
  assert.equal(b.context.getSheetData('sheet2', '10').data.rows[0][0], 'changed');
  assert.equal(b.metrics.reads, 2);
  assert.equal(b.metrics.colors, 2);
  assert.deepEqual(b.metrics.tabs, [10, 10]);
});

test('Assign can omit unused colors through doGet while keeping values identical', function() {
  var b = backend();
  var full = b.context.getSheetData('sheet1', '10');
  var compact = b.context.doGet({ parameter: {
    action: 'getSheetData', sheetKey: 'sheet1', gid: '10', includeFontColors: 'false'
  } });
  assert.equal(compact.success, true);
  assert.deepEqual(plain(compact.data.rows), plain(full.data.rows));
  assert.deepEqual(plain(compact.data.headers), plain(full.data.headers));
  assert.deepEqual(plain(compact.data.fontColors), []);
  assert.equal(b.metrics.colors, 1);
});

test('backend retains default tab and unknown source/missing tab handling', function() {
  var b = backend();
  assert.equal(b.context.getSheetData('sheet1').success, true);
  assert.equal(b.metrics.tabs[0], 1181166797);
  assert.equal(b.context.getSheetData('missing', '10').success, false);
  assert.equal(b.context.getSheetData('sheet1', '999').success, false);
});
