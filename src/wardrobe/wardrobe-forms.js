
  /**
   * 校验新服饰，成功写入后将焦点移到新增服饰或当前工作区。
   * @param {SubmitEvent} event 新服饰表单提交。
   * @returns {void}
   */
  addOutfitForm.addEventListener('submit', event => {
    event.preventDefault();
    const dialog = $('modalAddOutfit');
    const group = WARDROBE_GROUPS.get(wardrobeScope);
    const target = $('addWardrobe');
    const wardrobeId = group ? target.value : wardrobeScope;
    if (group && !group.wardrobeIds.includes(wardrobeId)) {
      showModalError(dialog, '请选择存入组合中的哪个衣柜。', target);
      return;
    }
    const title = $('addTitle').value.trim();
    if (!title) {
      showModalError(dialog, '请输入服饰标题。', $('addTitle'));
      return;
    }
    const frontUrl = $('addFront').value.trim();
    const backUrl = $('addBack').value.trim();
    for (const [id, value] of [['addFront', frontUrl], ['addBack', backUrl]]) {
      if (value && !isImageUrl(value)) {
        showModalError(dialog, '请输入完整的 HTTP 或 HTTPS 图片链接。', $(id));
        return;
      }
    }
    const it = {
      id: createId('WD-'),
      wardrobeId,
      title,
      owner: $('addOwner').value,
      category: $('addCategory').value,
      rating: $('addRatingPicker').querySelector('.on').dataset.rating,
      desc: $('addDesc').value.trim(),
      tags: [...new Set($('addTags').value.split(/[\s,，]+/).map(tag => tag.replace(/^#/, '')).filter(Boolean))],
      frontUrl,
      backUrl,
      equippedUser: event.submitter?.value === 'equippedUser',
      equippedChar: event.submitter?.value === 'equippedChar',
      fav: false,
      wbEnabled: false,
      boundWorldbook: '',
      boundChars: [],
    };
    if (!persistState(dialog, { items: [...ITEMS_BY_ID.values(), it] })) return;
    ITEMS_BY_ID.set(it.id, it);
    activeItemId = it.id;
    addOutfitForm.reset();
    activateWithin($('addRatingPicker').querySelector('.rp-btn'), '.rp-btn');
    closeModal();
    refreshWardrobeView();
    const focusTarget = $('wsGallery').hidden ? $('wsMatrix').querySelector('.m-slot-foot') : grid.querySelector('.card.on .cmeta-t');
    (focusTarget ?? closePanelButton).focus();
  }, listenerOptions);

  /** 读取组合表单，校验名称和最少成员数，再保存新组合或更新原组合。 */
  wardrobeGroupForm.addEventListener('submit', event => {
    event.preventDefault();
    const currentId = wardrobeGroupForm.dataset.groupId;
    const name = readWardrobeName(wardrobeGroupName, WARDROBE_GROUPS, currentId, '组合');
    if (!name) return;
    const wardrobeIds = new P.FormData(wardrobeGroupForm).getAll('wardrobe');
    if (wardrobeIds.length < 2) {
      showModalError(wardrobeDialog, '请至少选择两个衣柜。', wardrobeGroupMembers.querySelector('input'));
      return;
    }
    const id = currentId || 'wg-' + P.crypto.getRandomValues(new Uint32Array(2)).join('-');
    if (saveWardrobeGroup(id, { id, name, wardrobeIds })) {
      closeWardrobeGroupEditor();
      showModalToast(wardrobeDialog, currentId ? '组合已更新。' : '组合已创建。', 'success');
    }
  }, listenerOptions);

  /** 提交新增或重命名。提交成功才改管理行，失败时保留用户输入和原有名称。 */
  wardrobeDialog.addEventListener('submit', event => {
    event.preventDefault();
    if (event.target === wardrobeGroupForm) return;
    const row = event.target.closest('.wardrobe-row');
    const input = event.target.querySelector('input');
    const id = row?.dataset.wardrobeId;
    const name = readWardrobeName(input, WARDROBES, id, '衣柜');
    if (!name) return;
    if (!row) {
      const wardrobe = { id: 'wb-' + P.crypto.getRandomValues(new Uint32Array(2)).join('-'), name };
      if (!saveWardrobe(wardrobe)) return;
      wardrobeList.insertAdjacentHTML('beforeend', wardrobeRowTpl(wardrobe, 0));
      input.value = '';
      input.focus();
      showModalToast(wardrobeDialog, '衣柜已添加。', 'success');
      return;
    }
    const wardrobe = WARDROBES.get(id);
    const renamed = wardrobe.name !== name;
    if (renamed) {
      if (!saveWardrobe({ ...wardrobe, name })) return;
      row.querySelector('.wardrobe-name').textContent = name;
      row.querySelector('[data-ui="wardrobe-delete"]').setAttribute('aria-label', `删除衣柜 ${name}`);
    }
    setWardrobeEditor(row, false);
    if (renamed) showModalToast(wardrobeDialog, '衣柜已重命名。', 'success');
  }, listenerOptions);

  /** 将选中的服饰一次写入目标衣柜，保存成功后才更新索引和清空勾选。 */
  $('batchMoveForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!batchIds.size) return;
    const target = $('batchWardrobe');
    const wardrobeId = target.value;
    if (!WARDROBES.has(wardrobeId)) {
      showModalError(batchMoveDialog, '请选择目标衣柜。', target);
      return;
    }
    const { items, moved } = stageWardrobeMove(wardrobeId, item => batchIds.has(item.id));
    if (moved.length && !persistState(batchMoveDialog, { items })) return;
    for (const item of moved) ITEMS_BY_ID.set(item.id, item);
    closeModal();
    refreshWardrobeView(true);
    $('btnToggleBatch').focus();
  }, listenerOptions);
