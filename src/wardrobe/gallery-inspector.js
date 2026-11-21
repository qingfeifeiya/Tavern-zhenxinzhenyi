
  const CHIP_FIELDS = {
    tag: { field: 'tags', target: 'inspChips', prefix: '#', label: '标签' },
    char: { field: 'boundChars', target: 'inspCharChips', prefix: '@', label: '人物' },
  };

  /** 按服饰和输入种类刷新标签或绑定人物，只有人物的空列表表示「全部」。 */
  const renderChips = (it, kind) => {
    const { field, target, prefix, label } = CHIP_FIELDS[kind];
    const removeTitle = kind === 'char' ? '移除绑定人物' : '移除标签';
    const values = it[field];
    const chips = values.map((value, index) =>
      `<span class="chip">${prefix}${escapeHTML(value)} <button data-ui="del-${kind}" data-idx="${index}" title="${removeTitle}">${icon('x', 10)}</button></span>`
    ).join('');
    const empty = kind === 'char' && !values.length ? '<span class="chip all-chip">全部</span>' : '';
    $(target).innerHTML = chips + empty + `<button class="chip-add" data-ui="toggle-${kind}-input">+ 添加${label}</button>`;
  };

  /**
   * 按服饰的绑定状态刷新世界书开关、选择框和提示。
   * @param {object} it 当前服饰。
   * @returns {void}
   */
  const syncWbUI = it => {
    const enabled = !!it.wbEnabled;
    const switchButton = $('inspWbSw');
    switchButton.classList.toggle('on', enabled);
    switchButton.setAttribute('aria-checked', String(enabled));
    $('inspWorldbook').disabled = !enabled;
    $('inspWorldbook').value = enabled ? (it.boundWorldbook || '现代都市日常设定集') : '';
    $('wbSelectField').style.opacity = enabled ? '1' : '.55';
    $('wbStateHint').textContent = enabled ? '已启用 · 仅在激活该世界书时生效' : '当前默认关闭 · 不生效';
  };

  /** 在顶部、状态栏和侧栏同步指定的两组装备数量。 */
  const displayEquipCounts = (u, c) => {
    $('poolUserCount').textContent = `${u} 件`;
    $('poolCharCount').textContent = `${c} 件`;
    $('galleryEquippedUserCount').textContent = String(u);
    $('galleryEquippedCharCount').textContent = String(c);
    $('statusPoolText').textContent = `● 已装备候选: USER (${u}件) / Char (${c}件)`;
  };

  /** 装备状态变化时，仅重新汇总当前范围内的两个装备数量。 */
  const syncEquipCounts = () => {
    let u = 0, c = 0;
    for (const it of visibleItems.values()) {
      if (it.equippedUser) u++;
      if (it.equippedChar) c++;
    }
    displayEquipCounts(u, c);
  };

  /** 查看范围改变后，一次遍历汇总装备、归属、分类和收藏数，避免各栏分别扫描。 */
  const syncInventoryCounts = () => {
    const categoryCounts = new Map(CATEGORIES.map(({ name }) => [name, 0]));
    let equippedUser = 0, equippedChar = 0, user = 0, char = 0, favorite = 0, unsorted = 0;
    for (const item of visibleItems.values()) {
      if (item.equippedUser) equippedUser++;
      if (item.equippedChar) equippedChar++;
      if (item.owner === 'USER 玩家') user++;
      if (item.owner === 'Char 角色') char++;
      if (item.fav) favorite++;
      if (categoryCounts.has(item.category)) categoryCounts.set(item.category, categoryCounts.get(item.category) + 1);
      else unsorted++;
    }
    $('galleryAllCount').textContent = String(visibleItems.size);
    $('galleryUserCount').textContent = String(user);
    $('galleryCharCount').textContent = String(char);
    $('galleryFavoriteCount').textContent = String(favorite);
    $('galleryUnsortedCount').textContent = String(unsorted);
    CATEGORIES.forEach(({ name }, index) => {
      const count = categoryCounts.get(name);
      $(`galleryCategory${index}`).textContent = String(count);
      $(`categoryManagerCount${index}`).textContent = `${count} 件`;
    });
    displayEquipCounts(equippedUser, equippedChar);
  };

  /** 根据动作后缀返回装备对象配置，供单件和批量操作共用。 */
  const equipTarget = action => EQUIP_TARGETS[action.endsWith('-user') ? 0 : 1];

  /**
   * 更新指定服饰的装备状态，仅刷新对应角色的卡片标记和按钮。
   * @param {object} it 当前服饰。
   * @param {{slug: string, field: string}} target 角色标识和装备字段。
   * @param {boolean} equipped 是否装备。
   * @returns {void}
   */
  const setItemEquipped = (it, { slug, field }, equipped) => {
    it[field] = equipped;
    const card = cardsById.get(it.id);
    if (card) {
      card.querySelector(`[data-role="badge-${slug}"]`).hidden = !equipped;
      card.querySelector(`[data-ui="toggle-eq-${slug}"]`).classList.toggle(`on-${slug}`, equipped);
    }
  };

  /** 切换指定服饰在动作所指向对象上的装备状态，并刷新界面。 */
  const toggleEquip = (it, action) => {
    if (!it) return;
    const target = equipTarget(action);
    setItemEquipped(it, target, !it[target.field]);
    syncEquipCounts();
  };

  /**
   * 切换选中卡片及右侧服饰详情。
   * @param {string} id 服饰 ID。
   * @returns {void}
   */
  const selectCard = id => {
    const it = visibleItems.get(id);
    if (!it) return;
    // 只更新上次和本次选中的服饰，切换详情时无需扫描全部卡片。
    if (id !== activeItemId) {
      cardsById.get(activeItemId)?.classList.remove('on');
      cardsById.get(id)?.classList.add('on');
    }
    activeItemId = id;
    $('inspId').textContent = '#' + it.id;
    $('inspTitle').value = it.title;
    $('inspOwner').value = it.owner;
    $('inspCat').value = it.category;
    $('inspDesc').value = it.desc;
    $('inspEditOutfit').hidden = !it.outfit;
    $('inspItemActions').hidden = Boolean(it.outfit);
    $('inspImgFront').src = itemImage(it, '正面视图');
    $('inspImgBack').src = itemImage(it, '背面视图');
    $('inspRatingPicker').querySelectorAll('.rp-btn').forEach(b => b.classList.toggle('on', b.dataset.rating === it.rating));
    renderChips(it, 'tag');
    renderChips(it, 'char');
    syncWbUI(it);
  };

  /**
   * 按当前范围重建画廊和卡片索引，并刷新库存统计与选中状态。
   * @returns {void}
   */
  const renderInventory = () => {
    grid.innerHTML = renderCardsHTML(activeItemId);
    cardsById.clear();
    for (const card of grid.querySelectorAll('.card')) cardsById.set(card.dataset.id, card);
    $('galleryInspector').hidden = !visibleItems.size;
    $('topGalleryCount').textContent = String(visibleItems.size);
    $('storedItemCount').textContent = `${ITEMS_BY_ID.size} 件`;
    $('combineList').replaceChildren();
    updateBatchCount();
    if (activeItemId) selectCard(activeItemId);
    syncInventoryCounts();
  };

  /** 从完整索引重建当前范围，并刷新所有依赖范围的视图。可同时退出旧详情并清空批量勾选。 */
  const refreshWardrobeView = (resetSelection = false) => {
    visibleItems.clear();
    // 组合成员一次建索引，衣柜数量增加时仍只遍历全量服饰一次。
    const inScope = new Set(WARDROBE_GROUPS.get(wardrobeScope)?.wardrobeIds ?? [wardrobeScope]);
    for (const [id, item] of ITEMS_BY_ID) {
      if (inScope.has(item.wardrobeId)) visibleItems.set(id, item);
    }
    if (resetSelection) batchIds.clear();
    if (resetSelection || !visibleItems.has(activeItemId)) {
      panel.classList.remove('detail-open');
      detailTrigger = null;
      for (const kind of Object.keys(CHIP_FIELDS)) {
        $(`${kind}Inline`).hidden = true;
        $(`${kind}Input`).value = '';
      }
    }
    if (!visibleItems.has(activeItemId)) activeItemId = visibleItems.keys().next().value;
    renderInventory();
    renderMatrixOutfitList();
    renderMatrixUI();
  };

  /** 按 ID 切换到已保存组合或单个衣柜，同步状态和各工作区的范围。 */
  const selectWardrobeScope = scope => {
    if (!WARDROBE_GROUPS.has(scope) && !WARDROBES.has(scope)) return;
    if (wardrobeScope !== scope) {
      wardrobeScope = scope;
      wardrobeSelect.value = scope;
      $('statusWardrobe').textContent = wardrobeSelect.selectedOptions[0].textContent;
      refreshWardrobeView(true);
    }
  };

  /** 从下拉切换当前面板查看的衣柜范围。 */
  wardrobeSelect.addEventListener('change', () => {
    selectWardrobeScope(wardrobeSelect.value);
  }, listenerOptions);

  /** 首次打开合并弹窗时生成候选项，保留再次打开时的勾选；服饰增删后按默认项重建。 */
  const renderCombineList = () => {
    const list = $('combineList');
    if (list.childElementCount) return;
    list.innerHTML = Array.from(visibleItems.values(), (it, index) =>
      `<div class="combine-item ${index === 0 || index === 2 || index === 5 ? 'on' : ''}" data-ui="combine-pick"><img src="${escapeHTML(itemImage(it, '正面视图'))}" loading="lazy" decoding="async" alt=""><div class="combine-item-info"><b>${escapeHTML(it.title)}</b><small>${escapeHTML(it.category)} · ${escapeHTML(it.rating)}</small></div></div>`
    ).join('');
    syncCombineCount();
  };

  /** 从合并候选的选中标记回填数量，空衣柜同时显示零个候选。 */
  const syncCombineCount = () => {
    $('combineCount').textContent = `已选 ${$('combineList').querySelectorAll('.combine-item.on').length} 件单品`;
  };

  /**
   * 收起窄屏服饰详情，把焦点归还原卡片或新建入口。
   * @returns {void}
   */
  const closeDetail = () => {
    panel.classList.remove('detail-open');
    const target = detailTrigger?.isConnected ? detailTrigger : grid.querySelector('.card.on .cmeta-t');
    (target ?? grid.querySelector('.card-add') ?? closePanelButton).focus();
  };
