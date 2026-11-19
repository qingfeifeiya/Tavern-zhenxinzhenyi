const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8').replaceAll('\r\n', '\n');

/** @param {string} name 插件函数名。 @returns {string} 可在模拟宿主中运行的原始函数声明。 */
function production(name) {
  const match = script.match(new RegExp(`^  (?:async )?function\\*? ${name}\\([\\s\\S]*?^  }$`, 'm'));
  assert.ok(match, name);
  return match[0];
}

/** @param {object} state 模拟宿主的存档、控件及模型状态。 @returns {object} 可驱动批量识别的操作。 */
const createHost = new Function('state', `
  const { items: ITEMS_BY_ID, api, dialog: batchRecognitionDialog, status: batchRecognitionStatus, action: batchRecognitionAction } = state;
  const P = { AbortController }, panel = { open: true }, apiKeys = new Map();
  const settings = { apiPresets: [api], activeApiPresetId: api.id };
  const WARDROBE_GROUPS = new Map([['group', { wardrobeIds: ['a', 'b'] }]]);
  let wardrobeScope = 'a', gallerySort = 'default', batchRecognition;
  const inspectorItemId = 'manual', foregroundSave = undefined, workshopRequest = undefined, panelActionDiagnostic = undefined;
  const wearSlots = new Map([['top', '上装'], ['shoes', '鞋子']]);
  const categories = new Map([['正式分类', {}], ['识别分类', {}]]);
  ${script.split('\n').filter(line => /^  const (?:PASTED_ITEM_TITLE|UNSORTED_CATEGORY|NO_RATING|JSON_FENCE_PATTERN|isRecord|displayCategory) =/.test(line)).join('\n')}
  const WORKSHOP_RATINGS = [{ key: 'SFW' }];
  ${script.slice(script.indexOf('  const galleryTitleOrder ='), script.indexOf('  // 画廊单独保留浏览状态'))}
  /** @returns {void} 省略与此次用例无关的界面和诊断操作。 */
  const noop = () => {};
  const diagnosticScope = noop, writeDiagnostic = noop, diagnosticTextShape = noop, cancelWardrobeTurn = noop;
  const refreshWardrobeView = noop, loadInspector = noop, activeWardrobePreset = noop, getStorageError = noop;
  /** @returns {boolean} 模拟可操作的当前脚本实例。 */
  const isCurrentInstance = () => true;
  /** @returns {boolean} 记录草稿拦截，等待用例显式清除。 */
  const allowInspectorLeave = () => !state.draft;
  /** @param {string} message 提示内容。 @returns {void} 留存结果以便检查空队列反馈。 */
  const showPanelNotice = message => { state.notice = message; };
  /** @returns {void} 模拟打开识别进度弹窗。 */
  const openModal = () => { batchRecognitionDialog.open = true; };
  /** @returns {string} 模拟的请求 ID。 */
  const createId = () => 'vision-' + state.events.length;
  /** @param {string} message 校验错误。 @returns {Error} 测试宿主中的工坊异常。 */
  const wardrobeDiagnosticError = message => new Error(message);
  /** @param {object} preset 当前衣柜预设。 @param {object} material 素材。 @returns {string} 供模拟模型定位卡片的标题。 */
  const buildWorkshopPrompt = (preset, material) => material.title;
  /** @param {object} image 图片素材。 @returns {Promise<string>} 用素材地址模拟读图结果。 */
  const readWorkshopImage = async image => image.url;
  /** @param {object} job 当前模型请求。 @param {object} connection 当前接口。 @param {string} key 接口密钥。 @param {string} title 卡片标题。 @param {string[]} images 图片列表。 @returns {Promise<string>} 模拟模型输出。 */
  const requestWorkshopReply = (job, connection, key, title, images) => state.model(job, title, images);
  /** @param {object} dialog 保存反馈弹窗。 @param {Function} save 待写入操作。 @returns {Promise<void>} 执行本次存档。 */
  const runForegroundSave = (dialog, save) => save();
  /** @param {object} dialog 保存反馈弹窗。 @param {object} snapshot 待保存快照。 @returns {Promise<boolean>} 模拟确认快照或拒绝写入。 */
  async function persistState(dialog, snapshot) {
    const updated = snapshot.items.find(item => item !== ITEMS_BY_ID.get(item.id));
    state.events.push('保存 ' + updated.id);
    return updated.id !== state.failId;
  }
  ${[
    'itemsInWardrobeScope', 'itemWearSlot', 'savedInspectorWorkshop', 'appendWorkshopImages',
    'generateWorkshopText', 'parseWorkshopResult', 'prepareWorkshopSave', 'persistItemEdits', 'saveCandidateEdits',
    'collectBatchRecognitionItems', 'batchRecognitionChanges', 'stopBatchRecognition', 'recognizeWardrobeItem', 'runBatchRecognition',
  ].map(production).join('\n')}
  return {
    run: runBatchRecognition, stop: stopBatchRecognition,
    /** @param {string} scope 当前衣柜或组合。 @param {string} order 排序方式。 @returns {string[]} 排好序的待识别卡片 ID。 */
    queue(scope, order) {
      wardrobeScope = scope;
      gallerySort = order;
      return collectBatchRecognitionItems().map(([id]) => id);
    },
  };
`);

/** @param {string} id 卡片 ID。 @param {string} title 卡片标题。 @param {object} [fields] 卡片的测试属性。 @returns {object} 保存态卡片。 */
function card(id, title, fields) {
  return { id, title, wardrobeId: 'a', category: '待整理', rating: '无', desc: '', tags: [], frontUrl: id + '/正面', ...fields };
}

/** @returns {Promise<void>} 验证串行识别和保存、手填优先及失败或取消后的重试。 */
async function checkBatchRecognition() {
  const cards = [
    card('fresh', '新服饰', { wardrobeId: 'b' }),
    card('manual', '02 手填', { backUrl: 'manual/背面', category: '正式分类', rating: 'R-15', wearSlot: 'top', desc: '手填描述', tags: ['手填标签'] }),
    card('bad', '01 无效回复'),
    card('tail', '衣柜尾卡', { wardrobeId: 'b', frontUrl: '', backUrl: 'tail/背面', splitParent: 'done' }),
    card('done', '已经识别', { workshop: { reason: '旧依据', description: '', prompt: '' } }),
    card('outside', '组合之外', { wardrobeId: 'c' }),
    card('outfit', '搭配台套装', { outfit: {} }),
    card('no-image', '无图服饰', { frontUrl: '' }),
  ];
  const items = new Map(cards.map(item => [item.id, item]));
  const originalManual = { ...items.get('manual') };
  const state = { items, api: { id: 'test', timeout: 5 }, dialog: {}, status: {}, action: { dataset: {} }, events: [], draft: true };
  const host = createHost(state);
  const valid = JSON.stringify({
    title: '识别标题', category: '识别分类', wearSlot: 'shoes', tags: ['识别标签', ' 识别标签 '],
    rating: 'SFW', reason: '识别依据', description: '识别描述', prompt: '识别生图词',
  });
  let invalidReply = true;
  let pending;
  /** @param {object} job 当前模型请求。 @param {string} title 卡片标题。 @param {string[]} images 已准备的图片。 @returns {Promise<string>} 按测试阶段返回正常、无效或延迟的响应。 */
  state.model = async (job, title, images) => {
    state.events.push('识别 ' + title);
    if (title === '02 手填') assert.deepEqual(images, ['manual/正面', 'manual/背面']);
    if (title === '01 无效回复' && invalidReply) return '无效 JSON';
    if (title === '新服饰' && state.hold) {
      return new Promise(resolve => { pending = { resolve, signal: job.controller.signal }; });
    }
    if (title === '衣柜尾卡') assert.deepEqual(images, ['tail/背面']);
    return valid;
  };

  assert.deepEqual(host.queue('a', 'default'), ['manual', 'bad']);
  assert.deepEqual(host.queue('a', 'title'), ['bad', 'manual']);
  await host.run();
  assert.equal(state.dialog.open, undefined);
  assert.deepEqual(state.events, []);
  state.draft = false;
  await host.run();
  assert.deepEqual(state.events, ['识别 01 无效回复', '识别 02 手填', '保存 manual']);
  assert.match(state.status.textContent, /已保存 1 张，失败 1 张，未处理 0 张/);
  assert.deepEqual(items.get('manual'), {
    ...originalManual,
    workshop: { style: 'item', instruction: '', includeImages: true, rating: 'SFW', reason: '识别依据', description: '识别描述', prompt: '识别生图词' },
  });

  assert.deepEqual(host.queue('group', 'title'), ['bad', 'fresh', 'tail']);
  state.events.length = 0;
  invalidReply = false;
  state.failId = 'fresh';
  await host.run();
  assert.deepEqual(state.events, ['识别 01 无效回复', '保存 bad', '识别 新服饰', '保存 fresh']);
  assert.match(state.status.textContent, /存档失败.*已保存 1 张，失败 1 张，未处理 1 张/);
  assert.equal(items.get('fresh').workshop, undefined);

  state.events.length = 0;
  state.failId = undefined;
  state.hold = true;
  const running = host.run();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(state.events, ['识别 新服饰']);
  host.stop();
  await running;
  assert.equal(pending.signal.aborted, true);
  assert.match(state.status.textContent, /已保存 0 张，失败 0 张，未处理 2 张/);
  pending.resolve(valid);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(state.events, ['识别 新服饰']);
  assert.equal(items.get('fresh').workshop, undefined);

  state.events.length = 0;
  state.hold = false;
  await host.run();
  assert.deepEqual(state.events, ['识别 新服饰', '保存 fresh', '识别 衣柜尾卡', '保存 tail']);
  const { title, category, wearSlot, rating, desc, tags } = items.get('fresh');
  assert.deepEqual({ title, category, wearSlot, rating, desc, tags }, {
    title: '识别标题', category: '识别分类', wearSlot: 'shoes', rating: 'SFW', desc: '识别描述', tags: ['识别标签'],
  });
  assert.equal(items.get('tail').wearSlot, undefined);
  assert.equal(items.get('done').workshop.reason, '旧依据');
  assert.equal(items.get('outside').workshop, undefined);
  assert.deepEqual(host.queue('group', 'title'), []);
}

test('一键识别按衣柜范围串行保存，保留手填值并可从失败或停止处重试', checkBatchRecognition);
