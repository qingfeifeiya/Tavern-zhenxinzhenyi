const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const source = ['host-context', 'wardrobe-config', 'prompts', 'state-read', 'vision-workshop', 'chat-wear', 'chat-send-hook']
  .map(name => readFileSync(join(__dirname, '../src/wardrobe', `${name}.js`), 'utf8')).join('\n');

function selectionReply(data, selection = []) {
  return JSON.stringify({ sync: data.pending.map(({ source }) => ({ source, changes: [] })), selection });
}

function session(cards, {
  mode = 'text', position, readImage, autoSelect = true, mainApi = 'openai',
  select = selectionReply, timeout = 1, iframeFetch,
} = {}) {
  const requests = [];
  const sent = [];
  const errors = [];
  const notices = [];
  const ITEMS_BY_ID = new Map(cards.map(card => [card.id, { ...card }]));
  const tavern_events = Object.fromEntries([
    'GENERATION_AFTER_COMMANDS', 'GENERATE_AFTER_DATA', 'CHAT_COMPLETION_SETTINGS_READY', 'GENERATION_STOPPED', 'GENERATION_ENDED',
    'MESSAGE_RECEIVED', 'CHARACTER_MESSAGE_RENDERED', 'MESSAGE_DELETED', 'MESSAGE_UPDATED', 'CHAT_CHANGED',
  ].map(name => [name, name]));
  const listeners = new Map();
  function subscribe(name, listener, first = false) {
    const callbacks = listeners.get(name) ?? [];
    listeners.set(name, callbacks);
    if (first) callbacks.unshift(listener);
    else callbacks.push(listener);
    return { stop: () => callbacks.splice(callbacks.indexOf(listener), 1) };
  }
  async function emit(name, ...args) {
    for (const callback of listeners.get(name)?.slice() ?? []) {
      try {
        await callback(...args);
      } catch (error) {
        errors.push(error);
      }
    }
  }
  const dataset = {};
  let chatId = 'initial';
  let hostRequest;
  const context = {
    chat: [], mainApi, characterId: 1, name1: '阿青', name2: '小雪', eventSource: { emit }, getCurrentChatId: () => chatId,
    getRequestHeaders: () => ({ 'Content-Type': 'application/json' }),
    extractMessageFromData: ({ choices }) => choices[0].message.content,
    stopGeneration() {
      hostRequest.abort();
      void emit('GENERATION_STOPPED');
    },
  };
  const api = runInNewContext(`${source}
    const wearSlots = DEFAULT_WEAR_SLOTS;
    const wearSlotIdsByName = indexWearSlotNames(wearSlots);
    const itemsInWardrobeScope = () => [...ITEMS_BY_ID.values()].filter(item => !item.outsideScope);
    const isInOwnerGallery = (item, target) => item.owner === SHARED_OWNER || item.owner === target.fullName;
    const settings = {
      autoSelect, activeApiPresetId: 'default', apiPresets: [{ id: 'default', apiMode: 'main', timeout }],
      activeWardrobePresetId: 'default', wardrobePresets: [{ id: 'default', ...readPresetOptions({ injectContent: mode, injectPosition: position }) }],
    };
    let wardrobeTurn, selectionSequence = 0;
    showSelectionNotice = message => notices.push(message);
    if (!window.fetch) requestWorkshopReply = extraRequest;
    readWorkshopImage = readImage;
    const stop = installWardrobeSending();
    ({ current: readCurrentChatWear, recordKey: WARDROBE_CHAT_RECORD, stop });
  `, {
    window: { fetch: iframeFetch, parent: {
      AbortController, AbortSignal, DOMException, TextEncoder, URL, performance, navigator: { userAgent: '' },
      document: { body: { dataset }, baseURI: 'http://localhost:8000/' },
    } },
    ITEMS_BY_ID, autoSelect, mode, position, timeout, notices, setTimeout, clearTimeout, tavern_events,
    eventOn: subscribe, eventMakeLast: subscribe, eventMakeFirst: (name, callback) => subscribe(name, callback, true),
    getTavernContext: () => context, pluginEnabled: true,
    createId: prefix => prefix, getStorageError: () => true, diagnosticWearDetails() {}, refreshDiagnosticHistoryIfOpen() {}, panel: { open: false },
    $: field => ({ value: field === 'matrixOwner' ? 'USER 玩家' : field === 'matrixTitle' ? '搭配台草稿' : '' }),
    matrixDescription: { value: '搭配台专用描述' }, matrixOutfitId: null, SLOTS_BY_ID: new Map(),
    readImage: readImage ?? (async () => 'data:image/png;base64,AA=='),
    extraRequest(job, _connection, _key, prompt) {
      const line = prompt.split('\n').findLast(line => line.startsWith('{"character"'));
      const data = JSON.parse(line);
      requests.push(data);
      return select(data, [], job.controller.signal);
    },
  });
  return {
    ...api, context, requests, sent, errors, notices, emit, subscribe, items: ITEMS_BY_ID,
    async send(text, type = 'normal', {
      prompt = [{ role: 'user', content: text }], settings = {}, dryRun = false, helper = false, beforeFinal,
    } = {}) {
      const controller = hostRequest = new AbortController();
      dataset.generating = 'true';
      await emit('GENERATION_AFTER_COMMANDS', type, helper ? {} : { signal: undefined }, dryRun);
      if (type === 'normal' && !dryRun && !helper) context.chat.push({ mes: text, is_user: true });
      if (type === 'regenerate' && !dryRun && !helper) {
        context.chat.pop();
        await emit('MESSAGE_DELETED', context.chat.length);
      }
      if (!helper) await emit('GENERATE_AFTER_DATA', { prompt }, dryRun);
      if (dryRun) return;
      const request = { type, model: 'test', ...settings, messages: prompt.map(message => ({ ...message })) };
      await beforeFinal?.(request);
      await emit('CHAT_COMPLETION_SETTINGS_READY', request);
      if (!controller.signal.aborted) sent.push(structuredClone(request));
      return request;
    },
    async generate(text, type = 'normal', options) {
      const request = await this.send(text, type, options);
      return request.messages.findLast(message => message.role === 'user').content;
    },
    async finish(type = 'normal', body = '生成结束。') {
      delete dataset.generating;
      if (context.streamingProcessor) await emit('GENERATION_ENDED');
      const continuing = type === 'appendFinal';
      if (type === 'swipe') context.chat.pop();
      const message = continuing ? context.chat.at(-1) : { mes: body, is_user: false, gen_finished: true };
      if (continuing) message.mes += body;
      else context.chat.push(message);
      const index = context.chat.length - 1;
      await emit('MESSAGE_RECEIVED', index, type);
      await emit('CHARACTER_MESSAGE_RENDERED', index, type);
      return message.extra?.[api.recordKey]?.turn;
    },
    cancel: () => context.stopGeneration(),
    async switchChat() {
      chatId = 'other';
      context.chat = [];
      await emit('CHAT_CHANGED');
    },
  };
}

const garment = (id, title, wearSlot, fields = {}) => ({ id, title, wearSlot, desc: `${title}的衣柜原文`, owner: 'Char 角色', boundChars: [], ...fields });
const coat = garment('coat', '白色针织开衫', 'outer', { boundChars: ['小雪'], frontUrl: 'https://example.invalid/coat.png' });
const shoes = garment('shoes', '白色皮鞋', 'shoes');
const userShirt = garment('shirt', '蓝色衬衫', 'top', { owner: 'USER 玩家' });

test('点名服饰用零次额外 API 将衣柜图文放进本轮主请求', async () => {
  const game = session([
    coat, { ...coat, id: 'other', boundChars: ['其他人物'] }, { ...coat, id: 'out', outsideScope: true },
    { ...coat, id: 'locked', wbEnabled: true, boundWorldbook: '未启用的世界书' },
  ], { mode: 'both' });
  await game.generate('今天下雨了。');
  const previous = await game.finish();
  assert.equal(game.requests.length, 1);
  assert.ok(previous.through);

  const input = '请让小雪换上《白色针织开衫》！';
  const content = await game.generate(input);
  assert.equal(game.requests.length, 1);
  assert.match(JSON.stringify(content), /白色针织开衫的衣柜原文/);
  assert.match(JSON.stringify(content), /data:image\/png;base64,/);
  assert.equal(game.context.chat.at(-1).mes, input);
  assert.equal(game.current().state['char:小雪'], undefined);
  const record = await game.finish();
  assert.equal(record.through, previous.through);
  assert.equal(record.state['char:小雪'][0].id, 'coat');
});

test('识别省略人物和带顿号的卡名，替换互斥部位并保持其他人物的穿戴', async () => {
  const dress = garment('dress', '蓝色连衣裙', 'dress');
  const top = garment('top', '红、白拼色衫', 'top');
  const suit = garment('suit', '通勤套装', undefined, { outfit: { slots: [{ name: '上装', itemId: 'top' }] } });
  const game = session([dress, top, shoes, userShirt, suit]);
  await game.generate('换上蓝色衬衫');
  assert.equal((await game.finish()).state.user[0].id, 'shirt');
  await game.generate('换上蓝色连衣裙');
  await game.finish();

  const content = await game.generate('小雪穿上《红、白拼色衫》、 「白色皮鞋」');
  assert.match(content, /红、白拼色衫的衣柜原文/);
  assert.match(content, /白色皮鞋的衣柜原文/);
  assert.doesNotMatch(content, /蓝色连衣裙的衣柜原文/);
  const record = await game.finish();
  assert.deepEqual(Array.from(record.state['char:小雪'], part => part.id), ['top', 'shoes']);
  assert.equal(record.state.user[0].id, 'shirt');

  await game.generate('让小雪换上通勤套装');
  const outfit = await game.finish();
  assert.equal(outfit.state['char:小雪'].length, 1);
  assert.equal(outfit.state['char:小雪'][0].outfitId, 'suit');
  assert.equal(game.requests.length, 0);
});

test('歧义、同名、未完整匹配和叙述交给额外 API，关闭时沿用搭配台', async () => {
  const shared = { ...shoes, owner: '双人通用' };
  for (const [text, cards] of [
    ['换上白色皮鞋', [shared]],
    ['小雪换上白色针织开衫', [coat, { ...coat, id: 'duplicate' }]],
    ['我穿白色针织开衫', [coat]],
    ['让小雪穿开衫', [coat]],
    ['小雪换上白色针织开衫、帽子', [coat]],
    ['小雪换上蓝色连衣裙、白色衬衣', [garment('d', '蓝色连衣裙', 'dress'), garment('s', '白色衬衣', 'top')]],
    ['小雪不穿白色针织开衫', [coat]],
    ['小雪换上白色针织开衫？', [coat]],
    ['如果下雨，让小雪换上白色针织开衫', [coat]],
    ['小雪之前穿过白色针织开衫', [coat]],
    ['小雪穿上了白色针织开衫。', [coat]],
  ]) {
    const game = session(cards);
    await game.generate(text);
    assert.equal(game.requests.length, 1, text);
  }
  const manual = session([userShirt], { autoSelect: false });
  const content = await manual.generate('我穿蓝色衬衫');
  assert.match(content, /搭配台专用描述/);
  assert.doesNotMatch(content, /蓝色衬衫的衣柜原文/);
  assert.equal(manual.requests.length, 0);
});

test('重生成和新 Swipe 按同条玩家输入重读当前卡片，续写沿用确认穿戴', async () => {
  const game = session([coat]);
  const input = '换上白色针织开衫';
  await game.generate(input);
  await game.finish();
  game.items.get('coat').desc = '卡片更新后的衣料';
  for (const type of ['regenerate', 'swipe']) {
    assert.match(await game.generate(input, type), /卡片更新后的衣料/);
    assert.equal((await game.finish(type === 'regenerate' ? 'normal' : type)).state['char:小雪'][0].id, 'coat');
  }
  assert.equal(game.requests.length, 0);
  const content = await game.generate(input, 'continue');
  assert.match(content, /卡片更新后的衣料/);
  assert.equal(game.requests.length, 0);
  const continuation = await game.finish('appendFinal', '随后小雪脱下了开衫。');
  assert.equal(continuation.state['char:小雪'][0].id, 'coat');
  assert.equal(game.current().state['char:小雪'][0].id, 'coat');

  await game.generate('继续往前走。');
  assert.equal(game.requests.length, 1);
  assert.ok(game.requests[0].pending.some(({ text }) => text.includes('随后小雪脱下了开衫。')));
});

test('仅图片预设继续使用图片，点名卡缺图时主聊天继续生成', async () => {
  const game = session([coat, shoes], { mode: 'image' });
  const content = await game.generate('让小雪换上白色针织开衫');
  assert.match(JSON.stringify(content), /data:image\/png;base64,/);
  assert.doesNotMatch(JSON.stringify(content), /衣柜原文/);
  await game.finish();

  const input = '小雪穿白色皮鞋';
  const previousImage = await game.generate(input);
  assert.match(JSON.stringify(previousImage), /data:image\/png;base64,/);
  assert.equal(await game.finish(), undefined);
  assert.equal(game.current().state['char:小雪'][0].id, 'coat');
  assert.equal(game.requests.length, 0);

  const withoutImage = session([shoes], { mode: 'image' });
  assert.equal(await withoutImage.generate(input), input);
  assert.equal(await withoutImage.finish(), undefined);
  assert.equal(withoutImage.requests.length, 0);
});

test('停止、切聊天或目标楼层变化时，宿主不会发送已作废的点名轮', async () => {
  for (const action of ['cancel', 'switchChat', 'edit']) {
    let reading, finishReading;
    const started = new Promise(resolve => { reading = resolve; });
    const game = session([coat], { mode: 'both', readImage: (_image, signal) => new Promise((resolve, reject) => {
      reading();
      finishReading = () => resolve('data:image/png;base64,AA==');
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }) });
    const input = '让小雪换上白色针织开衫';
    const reply = game.send(input);
    await Promise.race([started, reply]);
    if (action === 'edit') {
      game.context.chat.at(-1).mes = '已经修改本轮输入。';
      finishReading();
    } else await game[action]();
    const request = await reply;
    assert.equal(request.messages[0].content, input);
    assert.equal(game.sent.length, 0);
    assert.deepEqual(game.errors, []);
    assert.equal(await game.finish(), undefined);
    assert.equal(game.current().state['char:小雪'], undefined);
    assert.equal(game.requests.length, 0);
  }
});

test('额外选衣先走 iframe 后端，校验结果后同轮主请求才携带所选服饰', async () => {
  const input = '小雪要出门，请帮她搭配。';
  const mainSettings = {
    model: 'test-provider-model', chat_completion_source: 'custom', custom_url: 'https://example.invalid/api',
    custom_include_headers: 'Authorization: fixture', custom_include_body: 'stream: true',
    custom_exclude_body: 'messages', stream: true, temperature: 0.8, tools: [{ type: 'function' }],
    response_format: { type: 'json_object' }, assistant_prefill: '主回复开头', enable_web_search: true,
  };
  const extra = [];
  const game = session([coat], {
    async iframeFetch(url, options) {
      assert.equal(game.sent.length, 0);
      assert.equal(game.current().state['char:小雪'], undefined);
      const payload = JSON.parse(options.body);
      extra.push({ url: String(url), payload, signal: options.signal });
      const prompt = payload.messages.at(-1).content;
      const data = JSON.parse(prompt.slice(prompt.lastIndexOf('\n') + 1));
      assert.equal(data.userInput, input);
      assert.deepEqual(data.candidates.map(({ id }) => id), ['coat']);
      const content = selectionReply(data, [{ who: 'char:小雪', id: 'coat', action: 'wear', reason: '出门保暖' }]);
      return { ok: true, json: async () => ({ choices: [{ message: { content } }] }) };
    },
  });

  const original = { role: 'user', content: input };
  const final = await game.send(input, 'normal', {
    settings: mainSettings, prompt: [{ role: 'system', content: '主聊天专用提示词' }, original],
    async beforeFinal(request) {
      assert.equal(Object.getOwnPropertySymbols(request.messages[1]).length, 1);
      assert.equal(Object.getOwnPropertySymbols(original).length, 0);
      assert.deepEqual(JSON.parse(JSON.stringify(request.messages[1])), original);
      assert.equal(extra.length, 0);
    },
  });
  assert.equal(extra.length, 1, JSON.stringify(game.notices));
  assert.equal(extra[0].url, 'http://localhost:8000/api/backends/chat-completions/generate');
  assert.equal(extra[0].signal.aborted, false);
  const { payload } = extra[0];
  assert.equal(payload.model, mainSettings.model);
  assert.equal(payload.chat_completion_source, mainSettings.chat_completion_source);
  assert.equal(payload.custom_url, mainSettings.custom_url);
  assert.equal(payload.custom_include_headers, mainSettings.custom_include_headers);
  assert.equal(payload.type, 'quiet');
  assert.equal(payload.stream, false);
  assert.equal(payload.enable_web_search, false);
  for (const field of ['tools', 'response_format', 'assistant_prefill', 'custom_include_body', 'custom_exclude_body']) {
    assert.equal(Object.hasOwn(payload, field), false, field);
    assert.deepEqual(final[field], mainSettings[field], field);
  }
  assert.doesNotMatch(JSON.stringify(payload.messages), /主聊天专用提示词/);
  assert.equal(final.stream, true);
  assert.equal(Object.getOwnPropertySymbols(final.messages[1]).length, 0);
  assert.match(game.sent[0].messages[1].content, /白色针织开衫的衣柜原文/);
  assert.equal(game.context.chat.at(-1).mes, input);
  assert.equal(game.current().state['char:小雪'], undefined);
  assert.equal((await game.finish()).state['char:小雪'][0].id, 'coat');
  assert.deepEqual(game.errors, []);
});

test('预览、静默生成、辅助生成和文本补全跳过注入，未匹配请求不会领取原生选衣', async () => {
  const input = '小雪要出门，请帮她搭配。';
  const game = session([coat]);
  await game.send(input, 'normal', { dryRun: true });
  await game.send(input, 'quiet');
  await game.send(input, 'normal', { helper: true });
  assert.equal(game.requests.length, 0);
  assert.deepEqual(game.sent.map(({ messages }) => messages[0].content), [input, input]);
  await game.send(input, 'normal', {
    async beforeFinal(request) {
      const unrelated = { type: 'normal', messages: [{ role: 'user', content: request.messages[0].content }] };
      await game.emit('CHAT_COMPLETION_SETTINGS_READY', unrelated);
      assert.equal(unrelated.messages[0].content, input);
      assert.equal(game.requests.length, 0);
      await game.emit('GENERATION_STOPPED', 'workshop-request');
    },
  });
  assert.equal(game.requests.length, 1);

  const textOnly = session([coat], { mainApi: 'textgenerationwebui' });
  await textOnly.send(input);
  assert.equal(textOnly.requests.length, 0);
  assert.deepEqual(textOnly.sent[0].messages, [{ role: 'user', content: input }]);
  assert.deepEqual([...game.errors, ...textOnly.errors], []);
});

test('额外选衣超时或 JSON 无效时，主回复继续发送并沿用已确认穿搭', async () => {
  for (const failure of ['timeout', 'invalid']) {
    let selectionSignal;
    const game = session([coat], {
      timeout: 0.02,
      select(_data, _selection, signal) {
        selectionSignal = signal;
        return failure === 'timeout' ? new Promise(() => {}) : '无效 JSON';
      },
    });
    await game.send('让小雪换上白色针织开衫。');
    await game.finish();
    const request = await game.send('小雪接下来穿什么？');
    assert.equal(game.sent.length, 2);
    assert.match(request.messages[0].content, /白色针织开衫的衣柜原文/);
    assert.ok(game.notices.includes('选衣失败，已沿用现有穿搭。'));
    if (failure === 'timeout') assert.equal(selectionSignal.aborted, true);
    assert.equal(await game.finish(), undefined);
    assert.equal(game.current().state['char:小雪'][0].id, 'coat');
    assert.deepEqual(game.errors, []);
  }
});

test('三个注入位置保留原消息和附件，参考图只出现在用户消息', async () => {
  for (const position of ['system_end', 'context_end', 'user_end']) {
    const game = session([coat], { mode: 'both', position });
    const input = '让小雪换上白色针织开衫';
    const attachment = { type: 'image_url', image_url: { url: 'https://example.invalid/attachment.png' } };
    const user = { role: 'user', content: [{ type: 'text', text: input }, attachment] };
    const system = { role: 'system', content: '主系统提示' };
    const assistant = { role: 'assistant', content: '主请求后置内容' };
    const { messages } = await game.send(input, 'normal', { prompt: [system, user, assistant] });
    assert.deepEqual(user.content, [{ type: 'text', text: input }, attachment]);
    assert.equal(system.content, '主系统提示');
    assert.equal(game.context.chat.at(-1).mes, input);
    const image = messages.findIndex(({ content }) => JSON.stringify(content).includes('data:image/png;base64,AA=='));
    assert.equal(messages[image].role, 'user');
    const text = messages.findIndex(({ content }) => JSON.stringify(content).includes('白色针织开衫的衣柜原文'));
    assert.equal(text, { system_end: 0, context_end: messages.length - 1, user_end: 1 }[position]);
    assert.deepEqual(game.errors, []);
  }
});

test('切换聊天会中止正在运行的独立 HTTP 请求，并作废原主请求', async () => {
  let capture;
  const started = new Promise(resolve => { capture = resolve; });
  const game = session([coat], {
    iframeFetch(_url, { signal }) {
      capture(signal);
      return new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    },
  });
  const input = '小雪要出门，请帮她搭配。';
  const old = game.send(input);
  const signal = await Promise.race([started, old.then(() => assert.fail('主请求必须等待选衣'))]);
  await game.switchChat();
  assert.equal(signal.aborted, true);
  assert.equal((await old).messages[0].content, input);
  assert.equal(game.sent.length, 0);
  const next = await game.send('让小雪换上白色针织开衫。');
  assert.match(next.messages[0].content, /白色针织开衫的衣柜原文/);
  assert.equal(game.sent.length, 1);
  assert.equal((await game.finish()).state['char:小雪'][0].id, 'coat');
  assert.deepEqual(game.errors, []);
});

test('流式完成后等待回复渲染再保存穿搭，取消续写不会改写旧快照', async () => {
  const game = session([coat]);
  await game.send('让小雪换上白色针织开衫。');
  game.context.streamingProcessor = { isFinished: true };
  game.subscribe('CHARACTER_MESSAGE_RENDERED', messageId => {
    const message = game.context.chat[messageId];
    assert.equal(message.extra?.[game.recordKey], undefined);
    message.mes += '（正文已后处理）';
  }, true);
  const saved = await game.finish();
  const reply = game.context.chat.at(-1);
  assert.match(reply.mes, /正文已后处理/);
  assert.equal(saved.state['char:小雪'][0].id, 'coat');
  assert.equal(game.current().state['char:小雪'][0].id, 'coat');

  await game.send('续写。', 'continue');
  reply.mes += '流式续写未完成。';
  game.cancel();
  assert.equal(reply.extra[game.recordKey].turn, saved);
  assert.deepEqual(game.errors, []);
});
