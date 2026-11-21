
  // 悬浮球
  /** 按 ID 获取当前实例 Shadow DOM 中的控件。 */
  const $ = id => sh.getElementById(id);
  const fabWrap = $('fabWrap'), fabBall = $('fabBall'), fabMenu = $('fabMenu');
  let pluginEnabled = readPluginEnabled(), dragState = null;
  let fabDragged = false;

  /** 按可见状态更新悬浮菜单和展开状态，供指针、键盘及关闭面板时恢复焦点使用。 */
  const setFabMenu = visible => {
    fabMenu.hidden = !visible;
    fabBall.setAttribute('aria-expanded', String(visible));
  };

  /** 处理主按钮按下的指针事件，记录起点并捕获指针。 */
  fabBall.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    fabDragged = false;
    const r = fabWrap.getBoundingClientRect();
    dragState = { sx: e.clientX, sy: e.clientY, l: r.left, t: r.top, moved: false };
    fabBall.setPointerCapture(e.pointerId);
  }, listenerOptions);
  /** 根据移动事件计算边界内的位置，保留 5 像素的拖拽阈值。 */
  fabBall.addEventListener('pointermove', e => {
    if (!dragState) return;
    const dx = e.clientX - dragState.sx, dy = e.clientY - dragState.sy;
    if (Math.hypot(dx, dy) > 5) dragState.moved = true;
    if (!dragState.moved) return;
    const nl = Math.min(P.innerWidth - 52, Math.max(8, dragState.l + dx));
    const nt = Math.min(P.innerHeight - 52, Math.max(8, dragState.t + dy));
    Object.assign(fabWrap.style, { left: nl + 'px', top: nt + 'px', bottom: 'auto' });
    fabWrap.classList.toggle('right-side', nl > P.innerWidth / 2);
  }, listenerOptions);
  /** 捕获结束时记录是否拖动，下一次 click 据此忽略拖动产生的点击。 */
  fabBall.addEventListener('lostpointercapture', () => {
    fabDragged = Boolean(dragState?.moved);
    dragState = null;
  }, listenerOptions);

  /** 原生 click 同时覆盖指针、键盘和辅助技术，拖拽结束时保持菜单不变。 */
  fabBall.addEventListener('click', e => {
    if (e.detail === 0 || !fabDragged) setFabMenu(fabMenu.hidden);
  }, listenerOptions);

  // 面板与搭配台
  const overlay = $('overlay'), panel = $('panel'), gwrap = $('gwrap'), gwrapBar = $('gwrapBar'), grid = $('grid');
  const narrowLayout = P.matchMedia('(max-width: 960px)');
  const closePanelButton = panel.querySelector('[data-ui="close"]');
  const panelOpenNotice = $('panelOpenNotice');
  const backButton = panel.querySelector('[data-ui="close-detail"]');
  const addOutfitForm = $('addOutfitForm');
  const wardrobeSelect = $('wbSelect');
  const wardrobeDialog = $('modalWardrobeMgr');
  const wardrobeList = $('wardrobeList');
  const wardrobeDeleteDialog = $('modalWardrobeDelete');
  wardrobeDeleteDialog.setAttribute('role', 'alertdialog');
  wardrobeDeleteDialog.setAttribute('aria-describedby', 'wardrobeDeletePrompt wardrobeDeleteDetails');
  const createName = $('wardrobeCreateName');
  const wardrobeGroupList = $('wardrobeGroupList');
  const wardrobeGroupForm = $('wardrobeGroupForm');
  const wardrobeGroupName = $('wardrobeGroupName');
  const wardrobeGroupMembers = $('wardrobeGroupMembers');
  const batchMoveDialog = $('modalBatchMove');
  const settingsDialog = $('modalSettings');
  const settingsFields = [...settingsDialog.querySelectorAll('[data-setting]')];
  const matrixGrid = $('matrixGrid');
  const matrixSlotNameForm = $('matrixSlotNameForm');
  const matrixSaveDialog = $('modalMatrixSave');
  const matrixDescription = $('matrixSynthPrompt');
  const matrixDraftFields = sh.querySelectorAll(':is(#matrixPaneBasic,#matrixPaneAI) :is(input,select,textarea)');
  const pickerWardrobe = $('pickerWardrobe');
  $('modalMatrixNewDraft').setAttribute('aria-describedby', 'matrixNewDraftPrompt');
  $('modalMatrixResetDefaults').setAttribute('aria-describedby', 'matrixResetDefaultsPrompt');
  // 网格与列表使用同一张卡片，按服饰 ID 定位挂载节点。
  const cardsById = new Map();
  const toastStates = new WeakMap();
  let activeItemId;
  let panelTrigger;
  let panelNoticeTimer;
  let detailTrigger;
  let wardrobeDeleteTrigger;
  let pendingDeletion = new Set();
  let currentSlotId;
  let pickerFilterOwner = 'ALL';
  let pickerFilterCat = 'ALL';
  let matrixOutfitId;
  let matrixDescriptionEdited = false;
