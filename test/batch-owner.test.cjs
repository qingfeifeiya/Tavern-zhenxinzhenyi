const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8').replaceAll('\r\n', '\n');

/** @param {string} start 生产代码的起始标记。 @param {string} end 代码片段的结束标记。 @returns {string} 由测试宿主运行的源码。 */
function sourceBetween(start, end) {
  const from = script.indexOf(start);
  const to = script.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, start);
  return script.slice(from, to);
}

/** @returns {Promise<void>} 验证批量表单校验、失败重试和成功后勾选及草稿的同步。 */
async function checkBatchOwner() {
  const items = new Map([
    ['coat', { id: 'coat', owner: 'USER 玩家', category: '日常' }],
    ['outfit', { id: 'outfit', owner: 'Char 角色', category: '礼服' }],
    ['hat', { id: 'hat', owner: 'USER 玩家', category: '日常' }],
  ]);
  const selected = new Set(['coat', 'outfit']);
  const state = { fail: true, writes: 0, canceled: 0, refreshed: 0, closed: false };
  const createHost = new Function('items', 'selected', 'state', `
    ${sourceBetween('  const NO_OWNER =', '  // 风格键用于读取')}
    ${sourceBetween('  async function persistItemEdits(', '  /**\n   * 单件和批量收藏')}
    ${sourceBetween('  async function saveCandidateEdits(', '  /**\n   * 对比表单')}
    const ITEMS_BY_ID = items, batchIds = selected;
    const inspectorItemId = 'coat', matrixOutfitId = 'outfit';
    const batchOwnerDialog = {}, listenerOptions = {}, foregroundSave = {};
    let submit, invalid = false;
    /** @returns {void} 此处省略诊断、提示与焦点等界面副作用。 */
    const noop = () => {};
    const diagnosticScope = noop, writeDiagnostic = noop, showPanelNotice = noop, syncInspectorActions = noop;
    const controls = {
      batchOwner: { value: '' }, inspOwner: { value: '双人通用' }, matrixOwner: { value: 'Char 角色' },
      btnToggleBatch: { focus: noop },
      batchOwnerForm: {
        /** @param {string} type 事件类型。 @param {Function} handler 生产表单监听器。 @returns {void} 保存原始监听器。 */
        addEventListener(type, handler) { submit = handler; },
      },
    };
    /** @param {string} id 控件 ID。 @returns {object} 对应的测试控件。 */
    const $ = id => controls[id];
    /** @param {string} name 诊断动作名称。 @param {Function} handler 表单动作。 @returns {Function} 原始回调。 */
    const observePanelAction = (name, handler) => handler;
    /** @param {object} dialog 保存弹窗。 @param {Function} operation 待执行的保存。 @returns {Promise<void>} 保存完成。 */
    const runForegroundSave = (dialog, operation) => operation();
    /** @returns {boolean} 详情仍符合筛选，可以留在原处继续编辑。 */
    const allowInspectorItemChange = () => true;
    /** @returns {void} 记录空白选项的校验结果。 */
    const showModalError = () => { invalid = true; };
    /** @param {object} dialog 接收保存错误的弹窗。 @param {object} snapshot 待写入的快照。 @returns {Promise<boolean>} 模拟存储结果。 */
    async function persistState(dialog, snapshot) {
      state.writes++;
      state.dialog = dialog;
      state.snapshot = snapshot;
      return !state.fail;
    }
    /** @returns {void} 记录旧选衣任务的取消。 */
    const cancelWardrobeTurn = () => { state.canceled++; };
    /** @returns {void} 记录归属弹窗已关闭。 */
    const closeModal = () => { state.closed = true; };
    /** @returns {void} 记录画廊已刷新。 */
    const refreshGalleryView = () => { state.refreshed++; };
    ${sourceBetween('  async function changeBatchOwner(', '  /** @returns {Promise<void>} 写入勾选服饰的分类')}
    return {
      controls, batchOwnerDialog,
      /** @param {string} owner 提交的归属值。 @returns {Promise<boolean>} 本次是否触发字段校验错误。 */
      async submitOwner(owner) {
        invalid = false;
        controls.batchOwner.value = owner;
        await submit({ preventDefault: noop });
        return invalid;
      },
    };
  `);
  const host = createHost(items, selected, state);
  assert.equal(await host.submitOwner(''), true);
  assert.equal(state.writes, 0);

  assert.equal(await host.submitOwner('无'), false);
  assert.equal(state.dialog, host.batchOwnerDialog);
  assert.equal(items.get('coat').owner, 'USER 玩家');
  assert.equal(selected.size, 2);
  assert.equal(state.closed, false);
  assert.equal(state.canceled, 0);

  state.fail = false;
  await host.submitOwner('无');
  assert.equal(state.writes, 2);
  assert.deepEqual([...items.values()], [
    { id: 'coat', owner: '无', category: '日常' },
    { id: 'outfit', owner: '无', category: '礼服' },
    { id: 'hat', owner: 'USER 玩家', category: '日常' },
  ]);
  assert.deepEqual(state.snapshot.items, [...items.values()]);
  assert.equal(host.controls.inspOwner.value, '双人通用');
  assert.equal(host.controls.matrixOwner.value, '无');
  assert.equal(selected.size, 0);
  assert.equal(state.closed, true);
  assert.equal(state.refreshed, 1);
  assert.equal(state.canceled, 1);
}

test('批量归属仅更新勾选服饰，保存失败可重试并保留手动草稿', checkBatchOwner);
