const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const source = ['wardrobe-config', 'prompts', 'state-read', 'state-init', 'state-write', 'tag-management'].map(name =>
  readFileSync(join(__dirname, '../src/wardrobe', `${name}.js`), 'utf8')).join('\n');

function loadWardrobe(snapshot) {
  return runInNewContext(`${source}
    wardrobeScope = 'group';
    ({ issues: storageIssues, manage: () => collectManagedTags(managedTagScope()),
      edit: (edits, created) => planManagedTagEdits(managedTagScope(), edits, created), buildStateSnapshot });
  `, {
    savedState: structuredClone(snapshot), storageIssues: [], apiKeys: new Map(), P: { URL },
    getTavernContext: () => ({ extensionSettings: { wardrobe: { apiKeys: [] } } }),
    API_KEYS_EXTENSION_ID: 'wardrobe',
    $: () => ({ addEventListener() {} }), listenerOptions: {}, observePanelAction: (_name, handler) => handler,
  });
}

test('组合内按归属批量编辑标签，独立新建的标签随衣柜重载', () => {
  const item = (id, wardrobeId, tags, owner = 'Char 角色') => ({ id, wardrobeId, owner, tags });
  const snapshot = {
    wardrobes: [
      { id: 'wb-main', name: '主衣柜' },
      { id: 'member', name: '成员衣柜', tagsByOwner: { char: ['旧名', '待删除'], user: ['玩家名录'] } },
      { id: 'outside', name: '其他衣柜' },
    ],
    wardrobeGroups: [{ id: 'group', name: '组合', wardrobeIds: ['wb-main', 'member'] }],
    items: [
      item('first', 'wb-main', [' 保留 ', '旧名', ' 旧名 ', '待删除', '不改']),
      item('second', 'member', ['另一个', '旧名', '待删除', '也删除']),
      item('chain', 'member', ['链头', '链尾']),
      item('player', 'wb-main', ['旧名', '待删除'], 'USER 玩家'),
      item('unassigned', 'wb-main', ['旧名'], '无'),
      item('shared', 'member', ['待删除'], '双人通用'),
      item('outside', 'outside', ['旧名', '待删除']),
    ],
  };
  const wardrobe = loadWardrobe(snapshot);
  assert.deepEqual([...wardrobe.issues], []);
  assert.equal(wardrobe.manage().get('旧名'), 2);
  assert.equal(wardrobe.manage().has('玩家名录'), false);

  const { changes, updatedWardrobes } = wardrobe.edit(new Map([
    ['旧名', '保留'], ['另一个', '保留'], ['待删除', null], ['也删除', null], ['链头', '链尾'], ['链尾', '最终'],
  ]), ['新建', '另一新建']);
  assert.deepEqual([...changes.keys()], ['first', 'second', 'chain']);
  assert.deepEqual([...changes.get('first').tags], ['保留', '不改']);
  assert.deepEqual([...changes.get('second').tags], ['保留']);
  assert.deepEqual([...changes.get('chain').tags], ['链尾', '最终']);
  assert.deepEqual([...updatedWardrobes.keys()], ['wb-main', 'member']);
  assert.deepEqual([...updatedWardrobes.get('member').tagsByOwner.user], ['玩家名录']);

  const saved = wardrobe.buildStateSnapshot({
    items: snapshot.items.map(entry => ({ ...entry, ...changes.get(entry.id) })),
    wardrobes: snapshot.wardrobes.map(entry => updatedWardrobes.get(entry.id) ?? entry),
  });
  const reloaded = loadWardrobe(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual([...reloaded.issues], []);
  assert.equal(reloaded.manage().get('保留'), 2);
  assert.equal(reloaded.manage().has('待删除'), false);
  assert.equal(reloaded.manage().get('新建'), 0);
  for (const id of ['wb-main', 'member']) {
    assert.equal(saved.wardrobes.find(entry => entry.id === id).tagsByOwner.char.includes('另一新建'), true);
  }
  assert.deepEqual(saved.items.slice(3), snapshot.items.slice(3));
});
