// 在独立的酒馆测试实例上运行。浏览器通过真实界面发送，两个模型响应均由测试提供。
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright-core');
const COAT_IMAGE = 'https://wardrobe.test/coat.png';
const PNG_CONTENT = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGOQ1AgAIgYIBQAPDgJFh8uQegAAAABJRU5ErkJggg==';

/**
 * 安装选衣传输替身，保留宿主自身的事件、楼层、分支及发送逻辑。
 * @param {import('playwright-core').Page} page 酒馆页签。
 */
async function installFixture(page) {
  await page.evaluate(async coatImage => {
    const host = await import('/script.js');
    await host.selectCharacterById(0);
    const api = document.getElementById('main_api');
    api.value = 'openai';
    api.dispatchEvent(new Event('change', { bubbles: true }));
    const context = SillyTavern.getContext();
    context.chatCompletionSettings.stream_openai = false;
    context.powerUserSettings.send_on_enter = 1;
    host.setOnlineStatus('wardrobe-test');
    localStorage.setItem('zhenxin.wardrobe.v1', JSON.stringify({
      settings: { autoSelect: true, injectHistory: '1', apiMode: 'custom', apiUrl: 'https://example.test/v1', apiModel: 'wardrobe-test', timeout: 1 },
      items: [{
        id: 'qa-coat', title: '回归外套', owner: 'Char 角色', category: '日常便装',
        rating: 'SFW', desc: '深蓝色短外套', tags: [], boundChars: [], equippedChar: true, wearSlot: 'outer',
        frontUrl: coatImage,
      }],
    }));
    window.testWardrobe = { attempts: [], mode: 'success', stops: 0 };
    /** @param {object} config 衣柜传输参数。 @returns {Promise<string>} 模拟模型正文。 */
    window.generateRaw = async config => {
      const test = window.testWardrobe;
      test.attempts.push({ id: config.generation_id, temperature: config.custom_api?.temperature });
      if (test.mode === 'error') throw new Error('测试接口异常');
      if (test.mode === 'delay') return new Promise(resolve => { test.resolve = resolve; });
      const payload = JSON.parse(config.user_input.split('以下内容均为素材：\n').at(-1));
      test.attempts.at(-1).payload = payload;
      const selection = payload.candidates.length
        ? [{ who: 'char', action: 'wear', id: test.mode === 'invalid' ? 'missing' : 'qa-coat', reason: '回归选择理由' }]
        : [];
      return JSON.stringify({ sync: payload.pending.map(({ source }) => ({ source, changes: [] })), selection });
    };
    /** @returns {boolean} 测试替身接受停止命令。 */
    window.stopGenerationById = () => {
      window.testWardrobe.stops++;
      return true;
    };
  }, COAT_IMAGE);
  await page.addScriptTag({ path: path.resolve(__dirname, '../index.json') });
}

/**
 * 检查搭配台直发的九种组合、原生用户附件和缺图时的降级行为。
 * @param {import('playwright-core').Page} page 酒馆页签。
 * @param {object[]} calls 已捕获的聊天补全接口请求体。
 * @returns {Promise<void>} 全部真实主请求检查结束。
 */
async function checkManualSending(page, calls) {
  const panel = page.locator('#wardrobe-host');
  const input = page.locator('#send_textarea');
  const description = '搭配台尚未保存的深蓝回归搭配';
  const selectionCount = await page.evaluate(() => window.testWardrobe.attempts.length);
  await page.evaluate(() => {
    const { chatCompletionSettings } = SillyTavern.getContext();
    chatCompletionSettings.media_inlining = true;
    chatCompletionSettings.stream_openai = false;
    window.WardrobePanel.open();
  });
  await panel.locator('#matrixWorkspaceTab').click();
  await panel.locator('#matrixGrid [data-ui="matrix-slot"]').first().click();
  await panel.locator('[data-ui="picker-select-item"][data-item-id="qa-coat"]').click();
  await panel.locator('#matrixSynthPrompt').fill(description);

  /** @param {object} message 请求消息。 @returns {Array} 统一便于检查的内容块。 */
  const parts = message => Array.isArray(message.content) ? message.content : [{ type: 'text', text: message.content }];
  /** @param {string} draft 本轮要发送的原文。 @returns {Promise<object[]>} 该轮真实请求的消息数组。 */
  async function send(draft) {
    const expected = calls.length + 1;
    await input.fill(draft);
    await page.locator('#send_but').click();
    await page.waitForFunction(number => SillyTavern.getContext().chat.at(-1)?.mes === `酒馆模拟回复 ${number}`, expected);
    await page.locator('#mes_stop').waitFor({ state: 'hidden' });
    const saved = await page.evaluate(() => SillyTavern.getContext().chat.slice(-2)
      .map(row => ({ text: row.mes, wardrobe: row.extra?.zhenxinWardrobe })));
    assert.deepEqual(saved, [
      { text: draft, wardrobe: undefined }, { text: `酒馆模拟回复 ${expected}`, wardrobe: undefined },
    ]);
    return calls[expected - 1].messages;
  }

  for (const position of ['system_end', 'context_end', 'user_end']) {
    for (const mode of ['text', 'image', 'both']) {
      await page.evaluate(() => window.WardrobePanel.open());
      await panel.locator('[data-ui="open-settings"]').click();
      await panel.locator('[data-pane="paneInject"]').click();
      await panel.locator('#extraApiMode input[value="off"] + span').click();
      await panel.locator(`#injectPosition input[value="${position}"] + span`).click();
      await panel.locator(`#injectContent input[value="${mode}"] + span`).click();
      await panel.locator('[data-ui="save-settings"]').click();
      await panel.locator('.panel [data-ui="close"]').click();
      const attachUserImage = position === 'user_end' && mode === 'both';
      if (attachUserImage) {
        await page.locator('#file_form_input').setInputFiles({ name: '用户附件.png', mimeType: 'image/png', buffer: Buffer.from(PNG_CONTENT, 'base64') });
      }
      const draft = `搭配台直发 ${position} ${mode}`;
      const messages = await send(draft);
      /** @param {Function} matcher 内容块匹配条件。 @returns {number} 包含内容块的消息位置。 */
      const find = matcher => messages.findIndex(message => parts(message).some(matcher));
      // 重跑时聊天历史可能已有同样的测试原文，定位最后一次实际发送。
      const user = messages.findLastIndex(message => message.role === 'user'
        && parts(message).some(part => part.type === 'text' && part.text.includes(draft)));
      const text = find(part => part.type === 'text' && part.text.includes(description));
      const image = find(part => part.type === 'text' && part.text.includes('服装参考图（仅参考所列部位）'));
      assert.ok(user >= 0);
      assert.equal(text >= 0, mode !== 'image', `${position} ${mode} 的文字`);
      assert.equal(image >= 0, mode !== 'text', `${position} ${mode} 的图片`);
      if (image >= 0) {
        assert.equal(messages[image].role, 'user');
        assert.ok(parts(messages[image]).some(part => part.type === 'image_url' && part.image_url.url === `data:image/png;base64,${PNG_CONTENT}`));
      }
      if (position === 'system_end') {
        const firstDialogue = messages.findIndex(message => message.role !== 'system');
        if (text >= 0) assert.equal(text, firstDialogue - 1);
        if (image >= 0) assert.equal(image, firstDialogue);
      } else if (position === 'context_end') {
        if (text >= 0) assert.equal(text, messages.length - 1);
        if (image >= 0) assert.equal(image, messages.length - (text >= 0 ? 2 : 1));
      } else {
        if (text >= 0) assert.equal(text, user);
        if (image >= 0) assert.equal(image, user);
        if (attachUserImage) assert.equal(parts(messages[user]).filter(part => part.type === 'image_url').length, 2);
      }
    }
  }
  await page.evaluate(() => window.WardrobePanel.open());
  await panel.locator('#matrixFront').fill('https://wardrobe.test/missing.png');
  await panel.locator('.panel [data-ui="close"]').click();
  const messages = await send('套装图读取失败时继续发文字');
  const before = JSON.stringify(messages);
  assert.match(before, new RegExp(description));
  assert.doesNotMatch(before, /服装参考图（仅参考所列部位）/);
  await panel.locator('#wardrobeSelectionNotice', { hasText: '部分服装图片无法读取' }).waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => window.testWardrobe.attempts.length), selectionCount);
}

/**
 * 检查酒馆各入口调用顺序、出错无副作用及重生成、Swipe 的结果复用。
 * @returns {Promise<void>} 用例全部完成后结束。
 */
async function run() {
  const { WARDROBE_ST_URL, WARDROBE_CHROME } = process.env;
  const browser = await chromium.launch({ executablePath: WARDROBE_CHROME, headless: true });
  try {
    const page = await browser.newPage();
    const problems = [];
    page.on('pageerror', error => problems.push(error.message));
    const calls = [];
    await page.route(COAT_IMAGE, route => route.fulfill({
      contentType: 'image/png', headers: { 'Access-Control-Allow-Origin': '*' }, body: Buffer.from(PNG_CONTENT, 'base64'),
    }));
    await page.route('https://wardrobe.test/missing.png', route => route.fulfill({ status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }));
    await page.route('**/api/backends/chat-completions/generate', async route => {
      const request = route.request().postDataJSON();
      calls.push(request);
      const content = `酒馆模拟回复 ${calls.length}`;
      if (request.stream) {
        await route.fulfill({
          contentType: 'text/event-stream',
          body: `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content }, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`,
        });
        return;
      }
      await route.fulfill({
        json: { choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }] },
      });
    });
    await page.goto(WARDROBE_ST_URL);
    await page.waitForFunction(() => window.SillyTavern?.getContext().characters.length);
    await installFixture(page);
    const input = page.locator('#send_textarea');
    /** @param {string} value 设置原生草稿并通知酒馆输入监听器。 */
    const fill = value => input.evaluate((field, text) => {
      field.value = text;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
    /** @returns {Promise<object>} 读取页面中的请求和实际楼层状态。 */
    const snapshot = () => page.evaluate(() => ({
      attempts: window.testWardrobe.attempts,
      stops: window.testWardrobe.stops,
      messages: SillyTavern.getContext().chat.map(message => ({
        text: message.mes, record: message.extra?.zhenxinWardrobe, swipe: message.swipe_id, count: message.swipes?.length,
      })),
    }));
    /** @param {string} mode 模型下一次调用的测试行为。 */
    const mode = value => page.evaluate(value => { window.testWardrobe.mode = value; }, value);
    /** @param {number} count 等待指定次数的独立 API 调用。 */
    const waitAttempts = count => page.waitForFunction(count => window.testWardrobe.attempts.length === count, count);
    /** @param {number} count 等待真实回复及穿戴状态提交。 */
    const waitReply = count => page.waitForFunction(count => {
      const message = SillyTavern.getContext().chat.at(-1);
      return message?.mes === `酒馆模拟回复 ${count}` && message.extra?.zhenxinWardrobe?.turn;
    }, count);
    /** @param {number} count 等待独立 API 失败反馈。 */
    const waitFailure = async count => {
      await waitAttempts(count);
      await page.locator('#wardrobeSelectionNotice', { hasText: '选衣失败，本次发送已取消' }).waitFor({ state: 'visible' });
    };
    const original = await snapshot();

    await fill('原生发送按钮');
    assert.equal(await input.inputValue(), '原生发送按钮', '选衣前原生输入框应含测试草稿');
    await mode('error');
    await page.locator('#send_but').click();
    await waitFailure(1);
    assert.equal(calls.length, 0);
    assert.deepEqual((await snapshot()).messages, original.messages);
    assert.equal(await input.inputValue(), '原生发送按钮', JSON.stringify(await snapshot()));

    await mode('success');
    await page.locator('#send_but').click();
    await waitReply(1);
    assert.equal(calls.length, 1);
    assert.equal((await snapshot()).attempts.at(-1).temperature, 0.2);
    const first = JSON.stringify(calls[0]);
    assert.match(first, /当前服装状态.*回归外套/);
    assert.doesNotMatch(first, /回归选择理由|候选ID/);

    await page.locator('#mes_stop').waitFor({ state: 'hidden' });
    await fill('Enter 快捷键');
    await mode('invalid');
    await input.press('Enter');
    await waitFailure(3);
    assert.equal(calls.length, 1);
    assert.equal(await input.inputValue(), 'Enter 快捷键');
    await mode('success');
    await input.press('Enter');
    await waitReply(2);

    // 等待宿主保存并解锁，再走酒馆菜单的重生成。
    await page.locator('#mes_stop').waitFor({ state: 'hidden' });
    await page.locator('#options_button').click();
    await page.locator('#option_regenerate').click();
    await waitReply(3);
    assert.equal((await snapshot()).attempts.length, 4);

    await page.locator('#mes_stop').waitFor({ state: 'hidden' });
    await page.locator('#chat .last_mes .swipe_right').click();
    await waitReply(4);
    assert.equal((await snapshot()).attempts.length, 4);
    assert.equal((await snapshot()).messages.at(-1).swipe, 1);

    await page.locator('#mes_stop').waitFor({ state: 'hidden' });
    await page.locator('#chat .last_mes .swipe_left').click();
    await page.waitForFunction(() => SillyTavern.getContext().chat.at(-1)?.swipe_id === 0);
    assert.equal((await snapshot()).messages.at(-1).record.turn.state.char[0].id, 'qa-coat');
    assert.equal(calls.length, 4);
    await page.waitForFunction(() => SillyTavern.getContext().swipe.isAllowed());

    await fill('用户停止后保留草稿');
    await mode('delay');
    await page.locator('#send_but').click();
    await waitAttempts(5);
    await page.locator('#mes_stop').click();
    await page.waitForFunction(() => window.testWardrobe.stops > 0);
    assert.equal(calls.length, 4);
    assert.equal(await input.inputValue(), '用户停止后保留草稿');
    await page.evaluate(() => window.testWardrobe.resolve(JSON.stringify({ sync: [], selection: [] })));
    await page.locator('#mes_stop').waitFor({ state: 'hidden' });

    await fill('');
    await mode('success');
    await page.evaluate(() => SillyTavern.getContext().generate('normal'));
    await waitReply(5);
    await page.locator('#mes_stop').waitFor({ state: 'hidden' });
    await page.evaluate(() => SillyTavern.getContext().executeSlashCommandsWithOptions('/trigger await=true'));
    await waitReply(6);
    assert.equal(calls.length, 6);

    await page.locator('#mes_stop').waitFor({ state: 'hidden' });
    const branchAnchor = (await snapshot()).messages.length - 1;
    const newBranch = await page.evaluate(async index => {
      const { createBranch } = await import('/scripts/bookmarks.js');
      return createBranch(index);
    }, branchAnchor);
    assert.ok(newBranch);
    const from = await page.evaluate(() => SillyTavern.getContext().getCurrentChatId());
    const initial = await snapshot();
    await mode('delay');
    await fill('切换分支时取消尚未提交的选衣');
    await page.locator('#send_but').click();
    await waitAttempts(initial.attempts.length + 1);
    await page.evaluate(name => SillyTavern.getContext().openCharacterChat(name), newBranch);
    await page.waitForFunction(name => SillyTavern.getContext().getCurrentChatId() === name, newBranch);
    await page.evaluate(() => window.testWardrobe.resolve(JSON.stringify({ sync: [], selection: [] })));
    assert.equal(calls.length, 6);
    assert.equal((await snapshot()).messages.at(-1).record.turn.state.char[0].id, 'qa-coat');
    await page.evaluate(name => SillyTavern.getContext().openCharacterChat(name), from);
    await page.waitForFunction(name => SillyTavern.getContext().getCurrentChatId() === name, from);
    assert.deepEqual((await snapshot()).messages, initial.messages);
    await page.locator('#mes_stop').waitFor({ state: 'hidden' });

    await mode('delay');
    const timeout = (await snapshot()).attempts.length + 1;
    await fill('超时测试草稿');
    await page.locator('#send_but').click();
    await waitFailure(timeout);
    assert.equal(await input.inputValue(), '超时测试草稿');
    assert.equal(calls.length, 6);
    assert.deepEqual((await snapshot()).messages, initial.messages);

    await mode('delay');
    await fill('较早发送');
    await page.locator('#send_but').click();
    await waitAttempts(timeout + 1);
    const stale = await page.evaluateHandle(() => window.testWardrobe.resolve);
    await page.locator('#send_but').click();
    assert.equal((await snapshot()).attempts.length, timeout + 1);
    await mode('success');
    await fill('以最新草稿为准');
    await input.press('Enter');
    await waitReply(7);
    await stale.evaluate(resolve => resolve(JSON.stringify({ sync: [], selection: [] })));
    assert.equal((await snapshot()).attempts.length, timeout + 2);
    assert.equal((await snapshot()).messages.at(-2).text, '以最新草稿为准');
    assert.equal(calls.length, 7);

    // 改动选衣规则会使旧结果失效。重生成或新 Swipe 失败时仍应保留原来的真实回复。
    await page.locator('#mes_stop').waitFor({ state: 'hidden' });
    await page.evaluate(() => window.WardrobePanel.open());
    const wardrobe = page.locator('#wardrobe-host');
    await wardrobe.locator('[data-ui="open-settings"]').click();
    await wardrobe.locator('[data-pane="paneInject"]').click();
    await wardrobe.locator('#injectInstruction').evaluate(field => { field.value += ' 回归规则已更新。'; });
    await wardrobe.locator('[data-ui="save-settings"]').click();
    await wardrobe.locator('.panel [data-ui="close"]').click();
    const beforeFailedRegenerations = await snapshot();
    await mode('invalid');
    await page.locator('#options_button').click();
    await page.locator('#option_regenerate').click();
    await waitFailure(timeout + 3);
    assert.deepEqual((await snapshot()).messages, beforeFailedRegenerations.messages);
    await page.waitForFunction(() => SillyTavern.getContext().swipe.isAllowed());
    await page.locator('#chat .last_mes .swipe_right').click();
    await waitFailure(timeout + 4);
    await page.waitForFunction(() => SillyTavern.getContext().swipe.isAllowed());
    assert.deepEqual((await snapshot()).messages, beforeFailedRegenerations.messages);
    assert.equal(calls.length, 7);
    const failedAttempts = (await snapshot()).attempts.slice(-2);
    for (const { payload } of failedAttempts) {
      assert.equal(payload.userInput, '以最新草稿为准');
      assert.equal(payload.history.length, 1);
      assert.ok(payload.pending.every(row => row.text !== '酒馆模拟回复 7'));
    }

    await page.evaluate(() => { SillyTavern.getContext().chatCompletionSettings.stream_openai = true; });
    await mode('success');
    await fill('流式正文结束后再提交穿戴');
    await page.locator('#send_but').click();
    await waitReply(8);
    assert.equal(calls[7].stream, true);
    assert.equal(calls.length, 8);

    await page.locator('#mes_stop').waitFor({ state: 'hidden' });
    const beforeTypedCommand = await snapshot();
    await mode('error');
    await fill('/trigger await=true');
    await input.press('Enter');
    await waitFailure(beforeTypedCommand.attempts.length + 1);
    assert.equal(await input.inputValue(), '/trigger await=true');
    assert.deepEqual((await snapshot()).messages, beforeTypedCommand.messages);
    assert.equal(calls.length, 8);
    await mode('success');
    await input.press('Enter');
    await waitReply(9);
    await page.locator('#mes_stop').waitFor({ state: 'hidden' });
    await checkManualSending(page, calls);

    assert.ok(problems.every(problem => problem.includes('选衣失败，本次发送已取消')), problems.join('\n'));
    process.stdout.write('酒馆原生发送、选衣回看、重生成、Swipe、取消和九种搭配台直发组合检查通过。\n');
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
