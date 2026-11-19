const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');
const eventTypes = Object.fromEntries([
  'GENERATION_AFTER_COMMANDS', 'GENERATION_STOPPED', 'GENERATION_ENDED', 'MESSAGE_RECEIVED',
  'CHARACTER_MESSAGE_RENDERED', 'CHAT_CHANGED', 'MESSAGE_EDITED', 'MESSAGE_DELETED',
  'MESSAGE_SWIPED', 'MESSAGE_SWIPE_DELETED', 'MESSAGE_UPDATED',
].map(event => [event, event]));
const clothes = {
  user: [],
  'char:圣嘉丽': [{ slot: 'outfit', title: '绿裙白衫组合', text: '' }],
  'char:允紫萱': [{ slot: 'outfit', title: '白色修身套裙', text: '' }],
  'char:云清润': [{ slot: 'outfit', title: '蓝色套装', text: '' }],
};

/**
 * 为单文件脚本提供最小宿主，直接运行生产事件、穿戴读写和画廊渲染函数。
 * @param {object[]} chat 酒馆当前聊天的消息。
 * @returns {object} 可驱动宿主事件和读取画廊的测试环境。
 */
function createHost(chat) {
  const handlers = new Map();
  const rows = [];
  const dataset = {};
  const logs = [];
  const eventSource = {
    /** @param {string} event 宿主事件。 @param {...any} args 事件参数。 @returns {Promise<string>} 宿主原始结果。 */
    async emit(event, ...args) {
      await handlers.get(event)?.(...args);
      return '宿主结果';
    },
  };
  const context = {
    chat, eventSource, eventTypes, characterId: 1,
    /** @returns {string} 测试用聊天标识。 */
    getCurrentChatId: () => '当前聊天',
    /** @returns {void} 提供注入接口以启用事件包装。 */
    setExtensionPrompt() {},
    /** @returns {void} 提供原生发送控件接口以启用事件包装。 */
    activateSendButtons() {},
  };
  const source = [
    'extendContentKey', 'readSelectionBranch', 'readSelectionRecord', 'restoreSelectionBranch', 'readCurrentChatWear',
    'isWearerKey', 'wearerName', 'selectionChatId', 'cancelWardrobeTurn', 'storeSelectionRecord', 'matchContinuedWear',
    'matchWardrobeReply', 'commitChatWear', 'installWardrobeSending', 'diagnosticWearDetails', 'renderCurrentChatWear',
  ].map(name => {
    const declaration = '  function ' + name + '(';
    const start = script.indexOf(declaration);
    assert.notEqual(start, -1, declaration);
    return script.slice(start, script.indexOf('\n  }', start) + 4);
  }).join('\n');
  const run = new Function('context', 'dataset', 'rows', 'logs', `
    let wardrobeTurn;
    const WARDROBE_CHAT_RECORD = 'zhenxinWardrobe', CHAR_WEARER_PREFIX = 'char:';
    const CONTENT_KEY_SEEDS = [2166136261, 374761393];
    const wearSlots = new Map(), PD = { body: { dataset } };
    const listeners = new AbortController(), panel = { open: true }, chatWearRows = new Map();
    /** @returns {object} 当前模拟宿主上下文。 */
    const getTavernContext = () => context;
    /** @param {unknown} value 来自存档的对象。 @returns {boolean} 是否为记录。 */
    const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    /** @returns {object} 可见的模拟画廊区域。 */
    const $ = () => ({ hidden: false });
    const chatWearList = {
      /** @returns {object|undefined} 当前首个穿戴行。 */
      get firstElementChild() { return rows[0]; },
      /** @param {object} row 待放置的行。 @param {object} [before] 该行之后的节点。 @returns {void} 更新画廊顺序。 */
      insertBefore(row, before) {
        row.remove();
        rows.splice(before ? rows.indexOf(before) : rows.length, 0, row);
      },
    };
    const chatWearRowTemplate = { content: { firstElementChild: {
      /** @returns {object} 画廊渲染需要的行节点及文字字段。 */
      cloneNode() {
        const image = {
          /** @returns {null} 测试服饰没有缩略图地址。 */
          getAttribute: () => null,
        };
        const name = { classList: { toggle: noop } };
        const label = {};
        return {
          dataset: {}, name, label,
          /** @returns {object|undefined} 当前行之后的穿戴行。 */
          get nextElementSibling() { return rows[rows.indexOf(this) + 1]; },
          /** @returns {void} 将当前行移出画廊。 */
          remove() { if (rows.includes(this)) rows.splice(rows.indexOf(this), 1); },
          /** @param {string} selector 穿戴行内的选择器。 @returns {object} 对应的模拟节点。 */
          querySelector(selector) { return { img: image, '.chat-wear-name': name, '.chat-wear-label': label }[selector]; },
        };
      },
    } } };
    /** @returns {undefined} 测试服饰没有缩略图库存。 */
    const wearImageSource = () => undefined;
    /** @returns {void} 非本次验收的诊断和统计副作用。 */
    function noop() {}
    const diagnosticScope = noop, diagnosticTextShape = noop, previewDiagnosticText = noop;
    const refreshDiagnosticHistoryIfOpen = noop, recordRecentUse = noop;
    /** @param {object} log 日志上下文。 @param {string} level 级别。 @param {string} stage 阶段。 @returns {void} 记录日志阶段以检查提交次数。 */
    const writeDiagnostic = (log, level, stage) => logs.push(stage);
    ${source}
    installWardrobeSending();
    return {
      readSelectionBranch, selectionChatId, storeSelectionRecord, renderCurrentChatWear,
      /** @param {object} job 本轮模拟任务。 @returns {void} 将任务交给生产事件包装。 */
      setJob(job) { wardrobeTurn = job; },
    };
  `);
  const api = run(context, dataset, rows, logs);
  return {
    ...api, context, dataset, handlers, logs,
    /** @returns {object} 画廊实际渲染的人名和服饰文字。 */
    displayed: () => Object.fromEntries(rows.map(row => [row.label.textContent, row.name.textContent])),
    /** @param {object} [options] 本轮任务的模式或快照覆盖。 @returns {object} 已准备注入的生成任务。 */
    ready(options = {}) {
      const rows = api.readSelectionBranch(context, options.replaced);
      const job = {
        rows, chat: context.chat, context, chatId: api.selectionChatId(context),
        id: 'select-1-2-3', type: 'normal', phase: 'ready', selected: true, controller: new AbortController(),
        previousWear: { user: [] }, through: rows.at(-1)?.key,
        prepared: { state: clothes, reasons: ['已换装'], synced: [] }, ...options,
      };
      api.setJob(job);
      return job;
    },
  };
}

/** @param {string} mes 聊天正文。 @param {boolean} [isUser] 是否为玩家消息。 @returns {object} 一条模拟酒馆消息。 */
function message(mes, isUser = false) {
  return { mes, is_user: isUser, name: isUser ? '玩家' : '角色卡', send_date: '2026-11-19', gen_finished: true };
}

/** @param {object} host 测试宿主。 @param {number} index 回复楼层。 @param {string} [type] 生成类型。 @returns {Promise<void>} 模拟宿主依次收到并渲染回复。 */
async function finishReply(host, index, type = 'normal') {
  const { eventSource } = host.context;
  await eventSource.emit(eventTypes.MESSAGE_RECEIVED, index, type);
  assert.equal(await eventSource.emit(eventTypes.CHARACTER_MESSAGE_RENDERED, index, type), '宿主结果');
}

for (const streaming of [false, true]) {
  test(streaming ? '流式回复在正文后处理完成后提交' : '非流式回复在正文后处理完成后提交', async () => {
    const chat = [message('玩家请求', true)];
    const host = createHost(chat);
    const job = host.ready();
    job.prepared.synced.push({ source: { row: job.rows[0] }, state: { user: [] } });
    const reply = message('待处理的回复');
    chat.push(reply);
    if (streaming) {
      host.context.streamingProcessor = { isFinished: true, abortController: new AbortController() };
      host.dataset.generating = 'true';
      await finishReply(host, 1);
      assert.equal(reply.extra, undefined);
      delete host.dataset.generating;
      await host.context.eventSource.emit(eventTypes.GENERATION_ENDED);
    }
    let receiving = false;
    host.handlers.set(eventTypes.MESSAGE_RECEIVED, async () => {
      receiving = true;
      await host.context.eventSource.emit(eventTypes.CHARACTER_MESSAGE_RENDERED, 1, 'normal');
      receiving = false;
      assert.equal(reply.extra, undefined);
      reply.mes += '，已处理收到回复';
    });
    let nested = false;
    host.handlers.set(eventTypes.CHARACTER_MESSAGE_RENDERED, async () => {
      if (receiving || nested) return;
      nested = true;
      await host.context.eventSource.emit(eventTypes.CHARACTER_MESSAGE_RENDERED, 1, 'normal');
      assert.equal(reply.extra, undefined);
      reply.mes += '，已处理渲染';
    });
    await finishReply(host, 1);
    assert.equal(reply.mes, '待处理的回复，已处理收到回复，已处理渲染');
    assert.equal(host.logs.filter(stage => stage === '已确认穿戴').length, 1);
    assert.equal(reply.extra.zhenxinWardrobe.turn.through, chat[0].extra.zhenxinWardrobe.sync.key);
    assert.deepEqual(host.displayed(), {
      USER: '暂无已确认的穿戴', 圣嘉丽: '绿裙白衫组合', 允紫萱: '白色修身套裙', 云清润: '蓝色套装',
    });

    // 模拟原生保存时写入当前 Swipe，并重新加载记录验证最终正文键。
    reply.swipe_id = 0;
    reply.swipe_info = [{ extra: reply.extra }];
    const reloaded = createHost(JSON.parse(JSON.stringify(chat)));
    reloaded.renderCurrentChatWear();
    assert.deepEqual(reloaded.displayed(), host.displayed());
  });
}

test('手动搭配在完整回复后显示', async () => {
  const chat = [message('玩家请求', true)];
  const host = createHost(chat);
  const state = { user: [{ slot: 'outfit', title: '手动搭配', text: '' }] };
  host.ready({ selected: false, mainWearSent: true, prepared: { state, reasons: [], synced: [] } });
  chat.push(message('回复'));
  await finishReply(host, 1);
  assert.equal(host.displayed().USER, '手动搭配');
});

test('续写后处理改写原正文时仍保留同一 Swipe 的旧穿戴', async () => {
  const reply = { ...message('原正文'), swipe_id: 0, swipe_info: [{}] };
  const chat = [message('玩家请求', true), reply];
  const host = createHost(chat);
  host.storeSelectionRecord(host.readSelectionBranch(host.context).at(-1), 'turn', { state: clothes });
  host.ready({ type: 'continue', continuedSwipeId: 0, prepared: undefined, continuedWear: reply.extra.zhenxinWardrobe.turn });
  reply.mes += '，续写内容';
  host.handlers.set(eventTypes.CHARACTER_MESSAGE_RENDERED, () => { reply.mes = '渲染后的完整续写'; });
  await finishReply(host, 1, 'appendFinal');
  assert.equal(host.displayed().圣嘉丽, '绿裙白衫组合');
  assert.equal(reply.swipe_info[0].extra.zhenxinWardrobe.turn.key, host.readSelectionBranch(host.context).at(-1).key);
});

test('新 Swipe 只提交到当前回复，切回旧 Swipe 后恢复原穿戴', async () => {
  const reply = { ...message('旧回复'), swipe_id: 0, swipe_info: [{}] };
  const chat = [message('玩家请求', true), reply];
  const host = createHost(chat);
  const oldState = { user: [{ slot: 'outfit', title: '上一套', text: '' }] };
  host.storeSelectionRecord(host.readSelectionBranch(host.context).at(-1), 'turn', { state: oldState });
  host.ready({ type: 'swipe', replaced: reply });
  reply.swipe_id = 1;
  reply.swipe_info.push({});
  reply.extra = {};
  reply.mes = '新回复';
  await finishReply(host, 1, 'swipe');
  assert.equal(host.displayed().圣嘉丽, '绿裙白衫组合');
  assert.equal(reply.swipe_info[1].extra.zhenxinWardrobe.turn.requestId, 'select-1-2-3');
  reply.swipe_id = 0;
  reply.extra = reply.swipe_info[0].extra;
  reply.mes = '旧回复';
  await host.context.eventSource.emit(eventTypes.MESSAGE_SWIPED, 1);
  assert.equal(host.displayed().USER, '上一套');
});

for (const changed of ['swipe', 'previous']) {
  test(changed === 'swipe' ? '渲染中 Swipe 已切换时跳过提交' : '渲染中前序楼层被改写时跳过提交', async () => {
    const chat = [message('玩家请求', true)];
    const host = createHost(chat);
    host.ready();
    const reply = { ...message('回复'), swipe_id: 0, swipe_info: [{}, {}] };
    chat.push(reply);
    host.handlers.set(eventTypes.CHARACTER_MESSAGE_RENDERED, () => {
      if (changed === 'swipe') reply.swipe_id = 1;
      else chat[0].mes = '被改写的前序楼层';
    });
    await finishReply(host, 1);
    assert.equal(reply.extra, undefined);
    assert.equal(host.logs.includes('已确认穿戴'), false);
  });
}

for (const interrupt of [eventTypes.GENERATION_STOPPED, eventTypes.CHAT_CHANGED]) {
  test(interrupt === eventTypes.GENERATION_STOPPED ? '渲染时停止生成保留原穿戴' : '渲染时切换聊天保留原穿戴', async () => {
    const chat = [message('上一轮回复'), message('玩家请求', true)];
    const host = createHost(chat);
    const oldState = { user: [{ slot: 'outfit', title: '上一套', text: '' }] };
    host.storeSelectionRecord(host.readSelectionBranch(host.context)[0], 'turn', { state: oldState });
    host.ready();
    const reply = message('新回复');
    chat.push(reply);
    host.handlers.set(eventTypes.CHARACTER_MESSAGE_RENDERED, async () => {
      if (interrupt === eventTypes.CHAT_CHANGED) host.context.chat = [message('另一条聊天')];
      await host.context.eventSource.emit(interrupt);
    });
    await finishReply(host, 2);
    assert.equal(reply.extra, undefined);
    host.context.chat = chat;
    host.renderCurrentChatWear();
    assert.equal(host.displayed().USER, '上一套');
  });
}
