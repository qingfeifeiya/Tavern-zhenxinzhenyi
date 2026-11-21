const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

test('缺少 toWellFormed 的 WebView 仍能请求额外 API 并写入脱敏诊断', async () => {
  const source = ['host-context', 'wardrobe-config', 'prompts', 'state-read', 'vision-workshop', 'chat-wear', 'diagnostics-view']
    .map(name => readFileSync(join(__dirname, '../src/wardrobe', `${name}.js`), 'utf8')).join('\n');
  const key = 'fixture/"🔑\uD800';
  const encodedKey = encodeURIComponent('fixture/"🔑\uFFFD');
  const escapedKey = JSON.stringify(key).slice(1, -1);
  const requests = [];
  const reply = JSON.stringify({ sync: [{ source: 'input', changes: [] }], selection: [] });
  const context = {
    name1: '玩家',
    chat: [],
    ChatCompletionService: {
      async processRequest(payload, _options, extractData, signal) {
        requests.push({ payload, extractData, signal });
        if (requests.length === 2) throw Object.assign(new Error(key), { status: 401 });
        return { content: reply };
      },
    },
  };
  const connection = {
    id: 'extra', apiMode: 'custom', apiUrl: 'https://example.test/v1/', apiModel: 'fixture-model', timeout: 1,
  };
  const { runTurn, redactDiagnosticText } = runInNewContext(`
    delete String.prototype.toWellFormed;
    ${source}
    const wearSlots = DEFAULT_WEAR_SLOTS;
    const itemsInWardrobeScope = () => [{ id: 'shirt', title: '衬衫', desc: '棉布衬衫', wearSlot: 'top', boundChars: [] }];
    const isInOwnerGallery = (_item, target) => target === OWNER_TARGETS[0];
    let selectionNoticeTimer;
    apiKeys.set(connection.id, key);
    manualDiagnosticEnabled = true;
    async function runTurn(input) {
      context.chat = [{ is_user: true, mes: input }];
      const job = {
        id: 'test-selection', type: 'normal', context, initialLength: 0,
        controller: new P.AbortController(), log: diagnosticScope('发送', 'runTurn'),
      };
      const content = await prepareWardrobeTurn(job, readPresetOptions({ injectContent: 'text' }));
      return {
        content, prepared: job.prepared, logs: diagnosticBuffer.map(({ record }) => record)
          .filter(record => record.operationId === job.log.operationId),
        preview: manualDiagnostic,
      };
    }
    ({ runTurn, redactDiagnosticText });
  `, {
    window: { parent: { document: {}, navigator: { userAgent: '' }, AbortController, TextEncoder, URL, performance } },
    $: () => ({}), setTimeout, clearTimeout, key, connection, context,
    settings: { autoSelect: true, activeApiPresetId: connection.id, apiPresets: [connection] },
    getTavernContext: () => context,
  });

  const success = await runTurn('保持现有穿搭');
  assert.equal(requests.length, 1, JSON.stringify(success.logs));
  assert.equal(requests[0].payload.proxy_password, key);
  assert.equal(requests[0].payload.reverse_proxy, 'https://example.test/v1');
  assert.equal(requests[0].payload.model, connection.apiModel);
  assert.equal(requests[0].extractData, true);
  assert.equal(requests[0].signal.aborted, false);
  assert.ok(success.prepared);
  assert.ok(success.logs.some(record => record.stage === '候选发送'));
  assert.ok(success.logs.some(record => record.stage === '选衣已返回'));
  assert.equal(success.preview.texts['模型响应'], reply);

  const failure = await runTurn(`保持现有穿搭 ${encodedKey}`);
  assert.equal(requests.length, 2);
  assert.equal(failure.content.notice, '选衣失败，本轮继续发送。');
  const rejected = failure.logs.find(record => record.stage === '请求结束');
  assert.equal(rejected?.error.status, 401);
  assert.ok(failure.logs.some(record => record.stage === '选衣失败'));
  assert.match(failure.preview.texts['请求提示词'], /已省略原文/);
  const diagnosticOutput = JSON.stringify([success.logs, success.preview, failure.logs, failure.preview]);
  for (const secret of [key, escapedKey, encodedKey]) {
    assert.equal(redactDiagnosticText(secret), '[已脱敏]');
    assert.ok(!diagnosticOutput.includes(secret));
  }
});
