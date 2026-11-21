
  /** 同步槽位卡片、已装备明细和套装描述，三处使用同一次槽位遍历的结果。 */
  const renderMatrixUI = () => {
    const slotCards = [], details = [], descriptions = [];
    let isDefaultLayout = SLOTS_BY_ID.size === DEFAULT_SLOTS.length;
    for (const slot of SLOTS_BY_ID.values()) {
      if (isDefaultLayout) {
        const [id, name] = DEFAULT_SLOTS[slotCards.length];
        isDefaultLayout = slot.id === id && slot.name === name;
      }
      // 已穿服饰使用完整索引，在单个衣柜里打开跨柜套装时仍可恢复其它衣柜的服饰。
      const it = ITEMS_BY_ID.get(slot.itemId);
      const id = escapeHTML(slot.id);
      const name = escapeHTML(slot.name);
      const code = `${String(slotCards.length + 1).padStart(2, '0')} · ${name}`;
      const title = it ? escapeHTML(it.title) : '';
      if (it) {
        details.push(cfgRowTpl(code, title, `<button class="btn sm ghost" data-ui="matrix-slot" data-slot-id="${id}" aria-label="更换 ${code} 的服饰">更换</button>`));
        if (!matrixDescriptionEdited) descriptions.push(`- ${slot.name}：${it.title}${it.desc ? `（${it.desc}）` : ''}`);
      }
      slotCards.push(`
        <div class="m-slot ${it ? 'active' : 'empty'}" data-ui="matrix-slot" data-slot-id="${id}">
          <div class="m-slot-top">
            <span>${code}</span>
            <button type="button" class="link" data-ui="matrix-name-slot" data-slot-id="${id}" aria-label="编辑槽位 ${code}">编辑</button>
          </div>
          <div class="m-slot-body">
            ${it ? `<img src="${escapeHTML(itemImage(it, '正面视图'))}" loading="lazy" decoding="async" alt="">
              <div class="m-slot-hover">
                <span class="btn sm solid">${icon('hanger', 12)}更换服饰</span>
                <button type="button" class="btn sm danger" data-ui="slot-quick-clear" data-slot-id="${id}">${icon('trash', 12)}卸下</button>
              </div>` : '<span class="dim">+ 选衣</span>'}
          </div>
          <button type="button" class="m-slot-foot" aria-label="${it ? '更换' : '选择'} ${code} 的服饰">${title || '空置'}</button>
        </div>`);
    }
    const activeCount = details.length;
    $('topMatrixCount').textContent = `${activeCount} 槽`;
    $('matrixHeadTitle').textContent = `全身 ${SLOTS_BY_ID.size} 槽位穿戴矩阵`;
    $('matrixActiveBadge').textContent = `${activeCount} / ${SLOTS_BY_ID.size} 槽位`;
    $('matrixSaveGallery').disabled = activeCount === 0;
    $('matrixDeleteCard').disabled = !matrixOutfitId;
    $('matrixDefaultSlots').disabled = isDefaultLayout;
    matrixGrid.innerHTML = slotCards.join('');
    $('matrixActiveList').innerHTML = activeCount
      ? details.join('')
      : '<div class="cfg-row"><small class="dim">未穿戴服饰</small></div>';
    if (!matrixDescriptionEdited) matrixDescription.value = descriptions.join('\n');
  };

  /** 恢复布局前检查会否清除自定义槽位或名称，有改动时先展示确认。 */
  const requestDefaultMatrixSlots = () => {
    for (const { id, name } of SLOTS_BY_ID.values()) {
      if (DEFAULT_SLOT_NAMES.get(id) !== name) {
        openModal('modalMatrixResetDefaults');
        return;
      }
    }
    restoreDefaultMatrixSlots();
  };

  /** 按原始顺序重建八个槽位。恢复布局时按固定 ID 继承服饰，新搭配使用空槽位。 */
  const setDefaultMatrixSlots = keepEquipped => {
    const slots = DEFAULT_SLOTS.map(([id, name]) => ({
      id, name, itemId: keepEquipped ? (SLOTS_BY_ID.get(id)?.itemId ?? null) : null,
    }));
    SLOTS_BY_ID.clear();
    for (const slot of slots) SLOTS_BY_ID.set(slot.id, slot);
  };

  /** 恢复当前搭配的默认布局，并将焦点交给添加槽位入口。 */
  const restoreDefaultMatrixSlots = () => {
    setDefaultMatrixSlots(true);
    renderMatrixUI();
    $('matrixAddSlot').focus();
  };

  /** 读取字段的 HTML 默认值，供新建搭配和检测草稿共用。 */
  const matrixFieldDefault = field => {
    if (field instanceof P.HTMLSelectElement) return (field.querySelector('option[selected]') ?? field.options[0]).value;
    return field.type === 'checkbox' ? field.defaultChecked : field.defaultValue;
  };

  /** 比较已保存套装或空白默认布局，只在新建会丢弃编辑内容时返回真。 */
  const hasMatrixDraft = () => {
    const saved = ITEMS_BY_ID.get(matrixOutfitId);
    if (saved) return hasSavedMatrixChanges(saved);
    if ($('matrixRatingPicker').querySelector('.on').dataset.rating !== RATINGS[0].key) return true;
    for (const { id, name, itemId } of SLOTS_BY_ID.values()) {
      if (itemId || DEFAULT_SLOT_NAMES.get(id) !== name) return true;
    }
    for (const field of matrixDraftFields) {
      const value = field.type === 'checkbox' ? field.checked : field.value;
      if (value !== matrixFieldDefault(field)) return true;
    }
    return false;
  };

  /** 读取服饰引用，已从衣柜删除的服饰在搭配里按空槽处理。 */
  const resolveMatrixItemId = id => ITEMS_BY_ID.has(id) ? id : null;

  /** 用界面默认值补齐工坊设置，恢复和比较保存记录时采用同一口径。 */
  const resolveMatrixWorkshop = workshop => ({
    style: matrixFieldDefault($('matrixAIStyle')), instruction: '', includeImages: true, ...workshop,
  });

  /** 对照保存记录检查属性、工坊和槽位。自动描述由穿戴内容计算，不作为单独改动。 */
  const hasSavedMatrixChanges = item => {
    const { slots, descriptionEdited, workshop } = item.outfit;
    if (matrixDescriptionEdited !== descriptionEdited || SLOTS_BY_ID.size !== slots.length) return true;
    for (const [key, value] of Object.entries(readMatrixProperties())) {
      if (key === 'desc' && !matrixDescriptionEdited) continue;
      if (value !== (item[key] ?? '')) return true;
    }
    const savedWorkshop = resolveMatrixWorkshop(workshop);
    for (const [key, value] of Object.entries(readMatrixWorkshop())) {
      if (value !== savedWorkshop[key]) return true;
    }
    let index = 0;
    for (const slot of SLOTS_BY_ID.values()) {
      const savedSlot = slots[index++];
      if (slot.id !== savedSlot.id || slot.name !== savedSlot.name || slot.itemId !== resolveMatrixItemId(savedSlot.itemId)) return true;
    }
    return false;
  };

  /** 用八个空槽位初始化编辑区并解除卡片关联，让下次保存创建新卡片。 */
  const resetMatrixDraft = () => {
    setDefaultMatrixSlots(false);
    matrixOutfitId = undefined;
    matrixDescriptionEdited = false;
    for (const field of matrixDraftFields) {
      const value = matrixFieldDefault(field);
      if (field.type === 'checkbox') field.checked = value;
      else field.value = value;
    }
    setInspectorRating('matrix', RATINGS[0].key);
    switchPane(sh.querySelector('[data-pane="matrixPaneBasic"]'), MATRIX_TABS, '.insp-tab');
  };

  /** 新开一套搭配，并将焦点移到首个默认槽位以便直接选衣。 */
  const startMatrixDraft = () => {
    resetMatrixDraft();
    renderMatrixOutfitList();
    renderMatrixUI();
    focusMatrixSlot(DEFAULT_SLOTS[0][0]);
  };

  /** 按槽位 ID 恢复重绘后的焦点，新槽位也可直接用键盘选衣。 */
  const focusMatrixSlot = slotId => {
    matrixGrid.querySelector(`[data-slot-id="${P.CSS.escape(slotId)}"] .m-slot-foot`)?.focus();
  };

  /** 接收可选槽位 ID，打开新建或改名表单，只有追加槽位可以删除。 */
  const openMatrixSlotName = slotId => {
    const slot = SLOTS_BY_ID.get(slotId);
    const label = slot ? '修改槽位名称' : '添加槽位';
    matrixSlotNameForm.dataset.slotId = slotId ?? '';
    $('modalMatrixSlotName-title').textContent = label;
    $('matrixConfirmSlotName').textContent = slot ? '保存名称' : label;
    $('matrixRemoveSlot').hidden = !slot || DEFAULT_SLOT_NAMES.has(slotId);
    const input = $('matrixSlotName');
    input.value = slot?.name ?? '';
    openModal('modalMatrixSlotName');
    input.select();
  };

  /** 接收名称表单提交。新槽位使用独立 ID，同名槽位仍能分别操作。 */
  matrixSlotNameForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!pluginEnabled) return;
    const dialog = $('modalMatrixSlotName');
    const input = $('matrixSlotName');
    const name = input.value.trim();
    if (!name) {
      showModalError(dialog, '请输入槽位名称。', input);
      return;
    }
    const selectedId = matrixSlotNameForm.dataset.slotId;
    const id = selectedId || createId('ms-');
    if (selectedId) SLOTS_BY_ID.get(id).name = name;
    else SLOTS_BY_ID.set(id, { id, name, itemId: null });
    closeModal(dialog);
    renderMatrixUI();
    focusMatrixSlot(id);
  }, listenerOptions);

  /** 手动编辑后保留用户填写的描述，包括用户主动清空的情况。 */
  matrixDescription.addEventListener('input', () => { matrixDescriptionEdited = true; }, listenerOptions);

  /** 从当前衣柜范围生成套装列表，每行独立提供打开和删除入口。 */
  const renderMatrixOutfitList = () => {
    const rows = [];
    for (const item of visibleItems.values()) {
      if (!item.outfit) continue;
      let count = 0;
      for (const slot of item.outfit.slots) if (ITEMS_BY_ID.has(slot.itemId)) count++;
      const title = escapeHTML(item.title);
      const outfitId = escapeHTML(item.id);
      rows.push(`<div class="matrix-outfit-row">
        ${navTpl(title, `${count} 件`, icon('layers', 13), { active: item.id === matrixOutfitId, outfitId })}
        <button type="button" class="icon-btn sm" data-ui="matrix-delete-outfit" data-id="${outfitId}" aria-label="删除套装 ${title}" title="删除套装">${icon('trash', 13)}</button>
      </div>`);
    }
    $('matrixOutfitList').innerHTML = rows.join('') || '<small class="dim">暂无套装</small>';
  };

  /** 把指定保存记录复制到编辑区，避免改名、换衣等草稿操作直接修改原卡。 */
  const openSavedOutfit = item => {
    if (matrixOutfitId !== item.id) {
      const { slots, descriptionEdited } = item.outfit;
      const workshop = resolveMatrixWorkshop(item.outfit.workshop);
      matrixOutfitId = item.id;
      matrixDescriptionEdited = descriptionEdited;
      SLOTS_BY_ID.clear();
      for (const slot of slots) {
        SLOTS_BY_ID.set(slot.id, { ...slot, itemId: resolveMatrixItemId(slot.itemId) });
      }
      $('matrixTitle').value = item.title;
      $('matrixOwner').value = item.owner;
      $('matrixCategory').value = item.category;
      setInspectorRating('matrix', item.rating);
      $('matrixFront').value = item.frontUrl ?? '';
      $('matrixBack').value = item.backUrl ?? '';
      matrixDescription.value = item.desc;
      $('matrixAIRating').value = workshop.rating;
      $('matrixAIReason').value = workshop.reason;
      $('matrixAIDescription').value = workshop.description;
      $('matrixAIPrompt').value = workshop.prompt;
      $('matrixAIStyle').value = workshop.style;
      $('matrixAIInstruction').value = workshop.instruction;
      $('matrixAIIncludeImages').checked = workshop.includeImages;
      renderMatrixOutfitList();
      renderMatrixUI();
    }
    switchWorkspace($('matrixWorkspaceTab'));
    $('matrixHeadTitle').focus();
  };

  /** 将指定面板的基础分级选择器定位到给定分级。 */
  const setInspectorRating = (prefix, rating) => {
    activateWithin($(`${prefix}RatingPicker`).querySelector(`[data-rating="${rating}"]`), '.rp-btn');
  };

  /** 普通衣柜首次直接保存，更新原卡或需要选定衣柜时打开保存表单。 */
  const openMatrixSave = () => {
    if (!validateMatrixBasics()) return;
    const existing = ITEMS_BY_ID.get(matrixOutfitId);
    const group = WARDROBE_GROUPS.get(wardrobeScope);
    if (!existing && !group) {
      saveMatrixOutfit(wardrobeScope);
      return;
    }
    const target = $('matrixSaveWardrobe');
    if (group) fillWardrobeOptions(target, group.wardrobeIds.map(id => WARDROBES.get(id)), '请选择衣柜');
    target.disabled = target.parentElement.hidden = !group;
    $('matrixSaveTitle').textContent = $('matrixTitle').value.trim();
    $('matrixUpdateCard').hidden = !existing;
    $('modalMatrixSave-title').textContent = existing ? '保存套装卡片' : '选择存放衣柜';
    $('matrixNewCard').textContent = existing ? '另存新卡片' : '保存';
    openModal('modalMatrixSave');
  };

  /** 检查套装名称和图片链接。失败时回到基础属性并定位字段，返回是否可继续保存。 */
  const validateMatrixBasics = () => {
    const title = $('matrixTitle');
    let invalidField, message;
    if (!title.value.trim()) {
      invalidField = title;
      message = '请输入套装名称。';
    } else {
      for (const id of ['matrixFront', 'matrixBack']) {
        const field = $(id);
        const url = field.value.trim();
        if (url && !isImageUrl(url)) {
          invalidField = field;
          message = '请输入完整的 HTTP 或 HTTPS 图片链接。';
          break;
        }
      }
    }
    if (!invalidField) return true;
    switchPane(sh.querySelector('[data-pane="matrixPaneBasic"]'), MATRIX_TABS, '.insp-tab');
    invalidField.focus();
    showPanelNotice(message);
    return false;
  };

  /** 按保存时的格式读取基础属性，供写入和判断未保存改动共用。 */
  const readMatrixProperties = () => ({
    title: $('matrixTitle').value.trim(),
    owner: $('matrixOwner').value,
    category: $('matrixCategory').value,
    rating: $('matrixRatingPicker').querySelector('.on').dataset.rating,
    desc: matrixDescription.value.trim(),
    frontUrl: $('matrixFront').value.trim(),
    backUrl: $('matrixBack').value.trim(),
  });

  /** 读取当前工坊配置和结果，供写入和判断未保存改动共用。 */
  const readMatrixWorkshop = () => ({
    style: $('matrixAIStyle').value,
    instruction: $('matrixAIInstruction').value,
    includeImages: $('matrixAIIncludeImages').checked,
    rating: $('matrixAIRating').value,
    reason: $('matrixAIReason').value,
    description: $('matrixAIDescription').value,
    prompt: $('matrixAIPrompt').value,
  });

  /** 将搭配存入目标衣柜，可传入原卡和表单弹窗。写入成功后才提交到界面。 */
  const saveMatrixOutfit = (wardrobeId, { existing, dialog } = {}) => {
    const item = {
      ...(existing ?? {
        id: createId('WD-'), tags: [], fav: false, equippedUser: false, equippedChar: false,
        wbEnabled: false, boundWorldbook: '', boundChars: [],
      }),
      wardrobeId,
      ...readMatrixProperties(),
      outfit: {
        slots: Array.from(SLOTS_BY_ID.values(), slot => ({ ...slot })),
        descriptionEdited: matrixDescriptionEdited,
        workshop: readMatrixWorkshop(),
      },
    };
    // 在一个快照中保存卡片和完整搭配，写入失败时仍能按原样重试。
    const items = Array.from(ITEMS_BY_ID.values(), current => current === existing ? item : current);
    if (!existing) items.push(item);
    if (!persistState(dialog, { items })) return;
    ITEMS_BY_ID.set(item.id, item);
    activeItemId = matrixOutfitId = item.id;
    if (dialog) closeModal(dialog);
    refreshWardrobeView();
    showPanelNotice(existing ? '已更新当前卡片。' : '已保存到单品画廊。');
  };

  /** 从表单读取更新或另存的目标，组合衣柜的另存必须选择一个成员。 */
  $('matrixSaveForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!pluginEnabled) return;
    const existing = event.submitter?.value === 'update' ? ITEMS_BY_ID.get(matrixOutfitId) : undefined;
    const group = WARDROBE_GROUPS.get(wardrobeScope);
    const target = $('matrixSaveWardrobe');
    const wardrobeId = existing?.wardrobeId ?? (group ? target.value : wardrobeScope);
    if (!existing && group && !group.wardrobeIds.includes(wardrobeId)) {
      showModalError(matrixSaveDialog, '请选择存放新卡片的衣柜。', target);
      return;
    }
    saveMatrixOutfit(wardrobeId, { existing, dialog: matrixSaveDialog });
  }, listenerOptions);

  /** 将预览字段复制到剪贴板，失败时选中文字以便手动复制。 */
  const copyField = async field => {
    if (!field.value) return;
    try {
      await P.navigator.clipboard.writeText(field.value);
      if (panel.open) showPanelNotice('已复制。');
    } catch {
      if (!panel.open) return;
      field.focus();
      field.select();
      showPanelNotice('无法访问剪贴板，可手动复制选中的文字。');
    }
  };
