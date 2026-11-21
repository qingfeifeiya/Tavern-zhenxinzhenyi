const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

test('正文标签在额外 API 的两处正文和本次输入生效', async () => {
  const requests = [];
  let quote;
  const source = ['wardrobe-config', 'prompts', 'state-read', 'chat-wear'].map(name =>
    readFileSync(join(__dirname, '../src/wardrobe', `${name}.js`), 'utf8')).join('\n');
  const { excludeStoryTags, prepareSelectedWear, readPresetOptions, readSelectionBranch } = runInNewContext(`${source}
    collectSelectionCandidates = () => ({ entries: [], images: [], byId: new Map() });
    markSelectionWaiting = () => {};
    ({ excludeStoryTags, prepareSelectedWear, readPresetOptions, readSelectionBranch });
  `, {
    P: { AbortController, performance }, setTimeout, clearTimeout,
    wearSlots: new Map([['top', '上装']]), settings: { activeApiPresetId: 'default', apiPresets: [{ id: 'default', timeout: 1 }] },
    apiKeys: new Map(), diagnosticScope() {}, writeDiagnostic() {}, diagnosticWearDetails() {},
    wardrobeDiagnosticError: message => new Error(message),
    requestWorkshopReply(_job, _connection, _key, prompt) {
      const payload = JSON.parse(prompt.slice(prompt.lastIndexOf('\n') + 1));
      requests.push(payload);
      const sync = payload.pending.map(({ source }) => ({ source, changes: [] }));
      if (quote) sync[0].changes.push({ who: 'user', slot: 'top', action: 'remove', quote });
      return JSON.stringify({ sync, selection: [] });
    },
  });

  const names = ['2', '状态'];
  assert.equal(excludeStoryTags('<1>保留</1><2>跨\n行<2>嵌套</2></2><2>重复</2><状态>另一组</状态>', names), '<1>保留</1>');
  assert.equal(excludeStoryTags('<2>未闭合<2>完整</2>尾部</状态><状态栏>保留</状态栏>', names), '<2>未闭合尾部</状态><状态栏>保留</状态栏>');
  assert.equal(readPresetOptions().excludedStoryTags.length, 0);
  assert.equal(readPresetOptions({ excludedStoryTags: ['<2>'] }).excludedStoryTags, null);

  const original = ['玩家历史<2>隐藏历史</2>', '<2>整楼隐藏</2>', '这次输入<状态>隐藏输入</状态>'];
  const context = { chat: original.map((mes, index) => ({ mes, is_user: index !== 1 })) };
  const rows = readSelectionBranch(context);
  const job = { context, rows, initialLength: 2 };
  const previous = { through: -1, state: { user: [] } };
  await prepareSelectedWear(job, readPresetOptions({ excludedStoryTags: names }), previous);
  const { history, userInput, pending } = requests.at(-1);
  assert.deepEqual(history, [
    { source: 0, role: 'user', text: '玩家历史' },
    { source: 1, role: 'assistant', text: '' },
  ]);
  assert.equal(userInput, '这次输入');
  assert.deepEqual(pending, [...history, { source: 'input', role: 'user', text: '这次输入' }]);
  assert.deepEqual(context.chat.map(({ mes }) => mes), original);

  const filteredKey = job.turnKey;
  await prepareSelectedWear(job, readPresetOptions({ excludedStoryTags: [...names, '未出现'] }), previous);
  assert.deepEqual(requests.at(-1).pending, pending);
  assert.notEqual(job.turnKey, filteredKey);
  await prepareSelectedWear(job, readPresetOptions(), previous);
  assert.notEqual(job.turnKey, filteredKey);
  assert.equal(requests.at(-1).userInput, original.at(-1));

  quote = '隐藏历史';
  await assert.rejects(prepareSelectedWear(job, readPresetOptions({ excludedStoryTags: names }), previous), /缺少有效引用/);
});
