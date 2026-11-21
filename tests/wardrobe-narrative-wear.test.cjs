const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const source = ['wardrobe-config', 'prompts', 'state-read', 'chat-wear'].map(name =>
  readFileSync(join(__dirname, '../src/wardrobe', `${name}.js`), 'utf8')).join('\n');

function createWardrobe(items) {
  const cards = items.map(item => ({ owner: 'Char 角色', ...item }));
  return runInNewContext(`${source}
    const wearSlots = DEFAULT_WEAR_SLOTS;
    const wearSlotIdsByName = indexWearSlotNames(wearSlots);
    const isInOwnerGallery = (item, target) => item.owner === target.fullName;
    const itemsInWardrobeScope = () => [...ITEMS_BY_ID.values()].filter(item => !item.outsideScope);
    function run(sync, previous = { user: [] }, selection = []) {
      const context = { name1: '玩家', name2: '角色卡' };
      const preset = readPresetOptions({ injectContent: 'text' });
      const { byId: candidates, entries } = collectSelectionCandidates(context, 'text');
      const sources = sync.map(({ source, changes, text }, index) => ({
        id: source, text: text ?? changes.map(change => change.quote).join('。'),
        row: { message: { is_user: index === sync.length - 1 } },
      }));
      const story = {
        character: {}, userInput: sources.at(-1)?.text ?? '', history: sources.slice(0, -1),
      };
      const reply = JSON.stringify({ sync, selection });
      const { state, synced } = validateSelectionReply(reply, previous, sources, candidates, story);
      const material = readSelectedWearMaterial(state, preset, context, candidates);
      return {
        state, synced, entries, prompt: renderMainWearText({ context, selected: true }, preset, material),
        selectionPrompt: buildSelectionPrompt(story, preset, previous, sources, entries),
      };
    }
    ({ run });
  `, {
    ITEMS_BY_ID: new Map(cards.map(item => [item.id, item])), TH: undefined,
    wardrobeDiagnosticError: message => new Error(message),
  });
}

const wear = (name, slot, description, fields = {}) => ({
  who: `char:${name}`, slot, action: 'wear', description, quote: `${name}换上了${description}`, ...fields,
});
const card = (id, name, wearSlot, title, desc, fields = {}) =>
  ({ id, boundChars: [name], wearSlot, title, desc, ...fields });
const wearerBlock = (prompt, name) => prompt.split(`<char_outfit wearer="${name}">\n`)[1].split('\n</char_outfit>')[0];

test('正文换装将唯一匹配的衣柜原文注入对应穿戴者，新旧同步记录均可用', () => {
  const dresses = [
    { id: 'red', title: '红色玫瑰短礼服', desc: '缎面裙身，肩部缀有立体玫瑰。', boundChars: ['圣嘉丽'], wearSlot: 'dress' },
    { id: 'black', title: '黑色蕾丝双衩裙', desc: '双衩边缘缝有黑色花边。\n后腰点缀缎带。', boundChars: ['允紫萱'], wearSlot: 'dress' },
    { id: 'white', title: '白色双衩长礼服', desc: '白色丝绸裙摆，两侧开衩。', boundChars: ['云清润'] },
  ];
  const sameTitle = [
    { ...dresses[0], id: 'different-wearer', boundChars: ['其他角色'], desc: '其他角色的款式' },
    { ...dresses[0], id: 'different-slot', wearSlot: 'top', desc: '同名上装' },
  ];
  const ambiguous = { id: 'duplicate', title: '同名礼服', desc: '不确定的款式', boundChars: ['云清润'], wearSlot: 'dress' };
  const { run } = createWardrobe([...dresses, ...sameTitle, ambiguous, { ...ambiguous, id: 'another-duplicate' }]);

  const change = (name, description) => ({
    who: `char:${name}`, slot: 'dress', action: 'wear', description, quote: `${name}换上了${description}`,
  });
  const changes = dresses.map(item => change(item.boundChars[0], item.title));
  const previous = { user: [] };
  for (const { who } of changes) previous[who] = [{ slot: 'shoes', title: '细高跟鞋', text: '' }];
  const result = run([{ source: 'input', changes }], previous);
  const legacy = structuredClone(previous);
  for (const { who, description } of changes) legacy[who].push({ slot: 'dress', title: '', text: description, temporary: true });
  assert.equal(run([], legacy).prompt, result.prompt);
  for (const { id, title, desc, boundChars: [name] } of dresses) {
    assert.equal(result.state[`char:${name}`].at(-1).id, id);
    const outfit = wearerBlock(result.prompt, name);
    assert.equal(outfit, `当前穿戴组合：\n- 细高跟鞋\n- ${title}：${desc.replaceAll('\n', '\n  ')}`);
  }

  const unmatched = run([{ source: 'input', changes: [change('云清润', '同名礼服'), change('其他角色', '正文临时写到的裙子')] }], previous);
  assert.equal(unmatched.state['char:云清润'].at(-1).temporary, true);
  assert.match(unmatched.prompt, /- 同名礼服\n/);
  assert.doesNotMatch(unmatched.prompt, /不确定的款式/);
  assert.match(unmatched.prompt, /外观细节：正文临时写到的裙子/);
});

test('两段正文分别补齐三人的裙装、套装分件、鞋履和眼镜', () => {
  const sheng = '圣嘉丽', yun = '云清润', yun2 = '允紫萱';
  const top = '【上装】白色衬衫，袖口有珠扣。';
  const bottom = '【下装】香槟色缎面短裙。';
  const { run } = createWardrobe([
    card('silver', sheng, 'dress', '银灰蕾丝挂脖裙', '银灰蕾丝与细闪裙身。'),
    card('pink', yun2, 'dress', '玫红挂脖纱裙', '玫红薄纱分层。'),
    card('set', yun, 'outfit', '白衫香槟短裙', `套装概述。${top}${bottom}`),
    card('other-shirt', yun, 'top', '扣领白衫', '独立卡描述。'),
    card('heels-sheng', sheng, 'shoes', '细高跟鞋a', '银色细跟。'),
    card('heels-yun', yun, 'shoes', '12cm高跟鞋', '香槟色尖头。'),
    card('heels-yun2', yun2, 'shoes', '细高跟鞋', '黑色鞋带。'),
    card('glasses', sheng, 'accessory', '金丝眼镜', '椭圆金丝镜框。'),
  ]);
  const setQuote = `${yun}换上了白衫香槟短裙`;
  const result = run([
    { source: 0, changes: [
      ...[sheng, yun, yun2].map(name => wear(name, 'dress', '临时长裙')),
      wear(sheng, 'shoes', '细高跟鞋', { id: 'heels-sheng' }),
      wear(yun, 'shoes', '１２ＣＭ高跟鞋'),
      wear(yun2, 'shoes', '细高跟鞋'),
      wear(sheng, 'accessory', '金丝眼镜'),
    ] },
    { source: 1, changes: [
      wear(sheng, 'dress', '银灰蕾丝挂脖裙'),
      wear(yun2, 'dress', '玫红纱裙', { quote: `${yun2}换上了玫红挂脖纱裙` }),
      wear(yun, 'top', '扣领白衫', { quote: setQuote, id: 'set' }),
      wear(yun, 'bottom', '香槟短裙', { quote: setQuote }),
    ] },
  ]);

  assert.deepEqual(Array.from(result.synced, ({ source }) => source.id), [0, 1]);
  const set = result.entries.find(({ id }) => id === 'set');
  assert.deepEqual([...set.slots], ['outfit']);
  assert.deepEqual([...set.syncSlots], ['top', 'bottom']);
  assert.match(result.selectionPrompt, /wear 同时填写候选的 id/);
  assert.equal(wearerBlock(result.prompt, sheng),
    '当前穿戴组合：\n- 细高跟鞋a：银色细跟。\n- 金丝眼镜：椭圆金丝镜框。\n- 银灰蕾丝挂脖裙：银灰蕾丝与细闪裙身。');
  assert.equal(wearerBlock(result.prompt, yun), `当前穿戴组合：\n- 12cm高跟鞋：香槟色尖头。\n- 白衫香槟短裙：${top}\n  ${bottom}`);
  assert.equal(wearerBlock(result.prompt, yun2), '当前穿戴组合：\n- 细高跟鞋：黑色鞋带。\n- 玫红挂脖纱裙：玫红薄纱分层。');

  const legacy = { user: [], [`char:${yun}`]: [
    { slot: 'top', title: '', text: '白衫', temporary: true },
    { slot: 'bottom', title: '', text: '香槟短裙', temporary: true },
  ] };
  const recovered = run([], legacy);
  assert.match(wearerBlock(recovered.prompt, yun), /白色衬衫，袖口有珠扣。[\s\S]*香槟色缎面短裙。/);
  assert.equal(legacy[`char:${yun}`][0].temporary, true);
  const changed = run([{ source: 2, changes: [wear(yun, 'top', '蓝衫')] }], legacy);
  const outfit = wearerBlock(changed.prompt, yun);
  assert.match(outfit, /香槟色缎面短裙。/);
  assert.match(outfit, /蓝衫/);
  assert.doesNotMatch(outfit, /白色衬衫/);
});

test('有拆分记录的套装只同步引用明确穿戴的分件', () => {
  const name = '云清润', title = '白衫香槟短裙';
  const { run } = createWardrobe([
    card('set', name, 'outfit', title, '母卡描述。', {
      splitParts: [{ slot: 'top', id: 'shirt' }, { slot: 'bottom', id: 'skirt' }],
    }),
    card('shirt', name, 'top', `${title} · 上装`, '拆分过的白衫原文。', { splitParent: 'set' }),
    card('skirt', name, 'bottom', `${title} · 下装`, '拆分过的短裙原文。', { splitParent: 'set' }),
  ]);
  const { state, prompt } = run([{ source: 0, changes: [
    wear(name, 'top', '白衫', { id: 'set', quote: `${name}穿上了${title}里的白衫` }),
  ] }]);
  assert.deepEqual(Array.from(state[`char:${name}`], ({ id, slot }) => [id, slot]), [['shirt', 'top']]);
  assert.match(prompt, /拆分过的白衫原文/);
  assert.doesNotMatch(prompt, /拆分过的短裙原文|母卡描述/);
});

test('无法分段的套装只在两件同时穿戴时注入整套描述', () => {
  const name = '云清润', key = `char:${name}`, title = '白衫香槟短裙';
  const set = card('set', name, 'outfit', title, '配成一套的白衫与香槟色短裙。');
  const { run } = createWardrobe([set]);
  const quote = `${name}换上了${title}`;
  const changes = [
    wear(name, 'top', '白衫', { quote, id: 'set' }),
    wear(name, 'bottom', '香槟短裙', { quote, id: 'set' }),
  ];
  const current = run([{ source: 0, changes }]);
  assert.deepEqual(Array.from(current.state[key], ({ slot, temporary }) => [slot, temporary]), [['top', true], ['bottom', true]]);
  assert.equal(wearerBlock(current.prompt, name), `当前穿着：${title}\n外观细节：${set.desc}`);
  assert.equal(run([], current.state).prompt, current.prompt);
  const swapped = run([{ source: 1, changes: [wear(name, 'bottom', '黑色长裤')] }], current.state);
  assert.doesNotMatch(swapped.prompt, /配成一套/);
  assert.match(swapped.prompt, /白衫[\s\S]*黑色长裤/);
  const ambiguous = createWardrobe([set, { ...set, id: 'second-set' }]).run([{ source: 0, changes }]);
  assert.doesNotMatch(ambiguous.prompt, /配成一套/);
});

test('无效引用或未经允许的候选 ID 无法补入衣柜描述', () => {
  const name = '圣嘉丽', key = `char:${name}`;
  const { run } = createWardrobe([
    card('other', '允紫萱', 'shoes', '黑靴', '别人的靴子。'),
    card('wrong-slot', name, 'top', '靴形吊坠', '上衣细节。'),
    card('hidden', name, 'shoes', '世界书内靴子', '隐藏的靴子。', { wbEnabled: true, boundWorldbook: '未启用' }),
    card('outside', name, 'shoes', '别的衣柜的鞋', '其他衣柜的鞋。', { outsideScope: true }),
    card('empty', name, 'shoes', '空描述靴子', '  '),
  ]);
  for (const id of ['other', 'wrong-slot', 'hidden', 'outside', 'empty', 'missing']) {
    const title = id === 'empty' ? '空描述靴子' : '黑色短靴';
    const result = run([{ source: 0, changes: [wear(name, 'shoes', title, { id })] }]);
    assert.equal(result.state[key][0].temporary, true);
    assert.ok(result.prompt.includes(`外观细节：${title}`));
  }
  assert.throws(() => run([{
    source: 0, text: `${name}坐了下来`, changes: [wear(name, 'shoes', '靴子', { id: 'other' })],
  }]), /正文穿戴变化缺少有效引用或部位/);
});
