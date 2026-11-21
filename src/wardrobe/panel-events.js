
  /**
   * 处理 Shadow DOM 内的点击，统一路由页面切换和现有衣柜操作。
   * @param {MouseEvent} e 衣柜控件触发的点击。
   * @returns {void}
   */
  sh.addEventListener('click', e => {
    if (e.target.matches?.('.backdrop')) return closeModal();
    const el = e.target.closest('[data-ui]');
    if (!el) return;
    const act = el.dataset.ui;

    if (act === 'fab-toggle-plugin') {
      setPluginEnabled(!pluginEnabled);
      return;
    }
    if (act === 'fab-open-wardrobe') {
      open(fabBall);
      return;
    }
    if (MODAL_MAP[act]) {
      e.stopPropagation();
      openModal(MODAL_MAP[act]);
      if (act === 'open-combine-modal') renderCombineList();
      return;
    }

    const curItem = visibleItems.get(activeItemId);

    switch (act) {
      case 'close':
        close();
        break;
      case 'close-modals':
        closeModal();
        break;
      case 'dismiss-toast': {
        const dialog = el.closest('.backdrop');
        dialog.querySelector('.modal-h [data-ui="close-modals"]').focus({ preventScroll: true });
        clearModalToast(dialog);
        break;
      }
      case 'save-settings':
        saveSettings();
        break;
      case 'open-wardrobe-mgr':
        openWardrobeManager();
        break;
      case 'open-add-modal':
        openAddOutfit();
        break;
      case 'open-batch-move':
        if (batchIds.size) {
          fillWardrobeOptions($('batchWardrobe'), WARDROBES.values(), '请选择目标衣柜');
          openModal('modalBatchMove');
        }
        break;
      case 'wardrobe-rename':
      case 'wardrobe-cancel-rename':
        setWardrobeEditor(el.closest('.wardrobe-row'), act === 'wardrobe-rename');
        break;
      case 'wardrobe-view':
        selectWardrobeScope(el.closest('.wardrobe-row').dataset.wardrobeId);
        closeModal();
        wardrobeSelect.focus();
        break;
      case 'wardrobe-delete':
        openWardrobeDelete(el);
        break;
      case 'wardrobe-delete-confirm':
        deleteWardrobe();
        break;
      case 'wardrobe-group-new':
        openWardrobeGroupEditor();
        break;
      case 'wardrobe-group-cancel':
        closeWardrobeGroupEditor();
        break;
      case 'wardrobe-group-edit':
        openWardrobeGroupEditor(WARDROBE_GROUPS.get(el.closest('.wardrobe-row').dataset.groupId));
        break;
      case 'wardrobe-group-view':
        selectWardrobeScope(el.closest('.wardrobe-row').dataset.groupId);
        closeModal();
        wardrobeSelect.focus();
        break;
      case 'wardrobe-group-delete': {
        const { groupId } = el.closest('.wardrobe-row').dataset;
        if (saveWardrobeGroup(groupId)) {
          if (wardrobeGroupForm.dataset.groupId === groupId) closeWardrobeGroupEditor();
          else wardrobeDialog.querySelector('[data-ui="wardrobe-group-new"]').focus();
          showModalToast(wardrobeDialog, '组合已删除。', 'success');
        }
        break;
      }
      case 'open-item-delete':
        if (curItem) openDelete(new Set([curItem.id]));
        break;
      case 'open-batch-delete':
        openDelete(batchIds);
        break;
      case 'delete-items':
        deleteItems();
        break;
      case 'switch-ws':
        switchWorkspace(el);
        break;

      case 'matrix-jump-preview':
        $('matrixPreviewTitle').focus();
        break;
      case 'matrix-new-draft':
        if (hasMatrixDraft()) openModal('modalMatrixNewDraft');
        else startMatrixDraft();
        break;
      case 'matrix-confirm-new-draft':
        closeModal($('modalMatrixNewDraft'));
        startMatrixDraft();
        break;
      case 'matrix-reset-defaults':
        requestDefaultMatrixSlots();
        break;
      case 'matrix-confirm-defaults':
        closeModal($('modalMatrixResetDefaults'));
        restoreDefaultMatrixSlots();
        break;
      case 'matrix-name-slot':
        openMatrixSlotName(el.dataset.slotId);
        break;
      case 'matrix-remove-slot': {
        const slotId = matrixSlotNameForm.dataset.slotId;
        SLOTS_BY_ID.delete(slotId);
        closeModal($('modalMatrixSlotName'));
        renderMatrixUI();
        $('matrixAddSlot').focus();
        break;
      }
      case 'matrix-tab':
        switchPane(el, MATRIX_TABS, '.insp-tab');
        break;
      case 'matrix-save':
        openMatrixSave();
        break;
      case 'matrix-open-outfit': {
        const item = el.dataset.id ? visibleItems.get(el.dataset.id) : curItem;
        if (item?.outfit) openSavedOutfit(item);
        break;
      }
      case 'matrix-delete-outfit': {
        const id = el.dataset.id ?? matrixOutfitId;
        if (id) openDelete(new Set([id]));
        break;
      }
      case 'workshop-generate':
        showPanelNotice('一键生成尚未接入，可手动填写下方结果。');
        break;
      case 'workshop-rating': {
        const { prefix } = el.dataset;
        setInspectorRating(prefix, $(`${prefix}AIRating`).value);
        showPanelNotice('分级已应用到基础属性。');
        break;
      }
      case 'workshop-description': {
        const isMatrix = el.dataset.prefix === 'matrix';
        const source = $(`${el.dataset.prefix}AIDescription`);
        const description = source.value.trim();
        if (description) {
          const target = isMatrix ? matrixDescription : $('inspDesc');
          target.value = description;
          if (isMatrix) matrixDescriptionEdited = true;
          showPanelNotice('已更新主描述。');
        } else {
          source.focus();
          showPanelNotice('请输入世界书描写。');
        }
        break;
      }
      case 'copy-field':
        copyField($(el.dataset.field));
        break;

      // 槽位选衣
      case 'matrix-slot':
        openSlotPicker(el.dataset.slotId);
        break;
      case 'slot-quick-clear': {
        e.stopPropagation();
        const slot = SLOTS_BY_ID.get(el.dataset.slotId);
        if (slot) {
          slot.itemId = null;
          renderMatrixUI();
          focusMatrixSlot(slot.id);
        }
        break;
      }
      case 'matrix-clear-all':
        for (const slot of SLOTS_BY_ID.values()) slot.itemId = null;
        renderMatrixUI();
        break;
      case 'picker-owner':
        pickerFilterOwner = el.dataset.owner;
        activateWithin(el);
        renderSlotPickerGrid();
        break;
      case 'picker-cat':
        pickerFilterCat = el.dataset.cat;
        activateWithin(el);
        renderSlotPickerGrid();
        break;
      case 'picker-select-item':
      case 'slot-unequip-current': {
        const slot = SLOTS_BY_ID.get(currentSlotId);
        if (slot) {
          slot.itemId = act === 'picker-select-item' ? el.dataset.itemId : null;
          closeModal();
          renderMatrixUI();
          focusMatrixSlot(slot.id);
        }
        break;
      }
      case 'slot-to-add-new':
        closeModal();
        openAddOutfit();
        break;
      case 'view-mode': {
        // 仅切换布局，选中的服饰和批量勾选继续使用同一组节点。
        activateWithin(el);
        for (const button of el.parentElement.children) button.setAttribute('aria-pressed', String(button === el));
        grid.classList.toggle('list', el.dataset.mode === 'list');
        break;
      }
      case 'insp-tab':
        switchPane(el, INSPECTOR_TABS, '.insp-tab');
        break;
      case 'toggle-wb-enable':
        if (curItem) {
          curItem.wbEnabled = !curItem.wbEnabled;
          syncWbUI(curItem);
        }
        break;
      case 'toggle-char-input':
      case 'toggle-tag-input':
        toggleChipInput(act === 'toggle-tag-input' ? 'tag' : 'char');
        break;
      case 'add-char-confirm':
      case 'add-tag-confirm':
        commitChip(act === 'add-tag-confirm' ? 'tag' : 'char');
        break;
      case 'del-char':
      case 'del-tag':
        if (curItem) {
          const kind = act === 'del-tag' ? 'tag' : 'char';
          curItem[CHIP_FIELDS[kind].field].splice(Number(el.dataset.idx), 1);
          renderChips(curItem, kind);
        }
        break;
      case 'toggle-blur-r18':
        setSettingSwitch(el, !el.classList.contains('on'));
        gwrap.classList.toggle('blur-r18', el.classList.contains('on'));
        break;
      case 'toggle-show-tags':
        setSettingSwitch(el, !el.classList.contains('on'));
        gwrap.classList.toggle('hide-tags', !el.classList.contains('on'));
        break;
      case 'open-lightbox': {
        e.stopPropagation();
        $('lbTitle').textContent = `${curItem.title} · 正背面视图对照`;
        $('lbImgFront').src = itemImage(curItem, '正面视图');
        $('lbImgBack').src = itemImage(curItem, '背面视图');
        openModal('modalLightbox');
        break;
      }
      case 'toggle-batch-mode': {
        const on = gwrap.classList.toggle('batch-mode');
        gwrapBar.hidden = !on;
        const trigger = $('btnToggleBatch');
        trigger.classList.toggle('on', on);
        trigger.setAttribute('aria-pressed', String(on));
        if (!on) setBatchSelection(false);
        break;
      }
      case 'card-check':
        e.stopPropagation();
        toggleBatchItem(el.closest('.card').dataset.id);
        break;
      case 'batch-select-all':
      case 'batch-clear':
        setBatchSelection(act === 'batch-select-all');
        break;
      case 'batch-eq-user':
      case 'batch-eq-char': {
        const target = equipTarget(act);
        for (const id of batchIds) {
          const item = visibleItems.get(id);
          if (!item[target.field]) setItemEquipped(item, target, true);
        }
        syncEquipCounts();
        break;
      }
      case 'toggle-fav': {
        e.stopPropagation();
        const item = visibleItems.get(el.closest('.card').dataset.id);
        item.fav = !item.fav;
        // 只变动一件服饰的收藏状态，直接更新计数以免重新遍历衣柜。
        const count = $('galleryFavoriteCount');
        count.textContent = String(Number(count.textContent) + (item.fav ? 1 : -1));
        el.classList.toggle('fav', item.fav);
        el.setAttribute('aria-pressed', String(item.fav));
        break;
      }
      case 'toggle-eq-user':
      case 'toggle-eq-char':
        e.stopPropagation();
        toggleEquip(visibleItems.get(el.closest('.card')?.dataset.id), act);
        break;
      case 'combine-pick':
        el.classList.toggle('on');
        syncCombineCount();
        break;
      case 'switch':
        if (el.dataset.setting) setSettingSwitch(el, !el.classList.contains('on'));
        else el.classList.toggle('on');
        break;
      case 'cfg-tab':
        clearModalToast(settingsDialog);
        switchPane(el, SETTINGS_TABS, '.s-tab');
        break;
      case 'card':
        if (gwrap.classList.contains('batch-mode')) {
          toggleBatchItem(el.dataset.id);
          break;
        }
        selectCard(el.dataset.id);
        detailTrigger = el.querySelector('.cmeta-t');
        panel.classList.add('detail-open');
        if (narrowLayout.matches) backButton.focus();
        break;
      case 'close-detail':
        closeDetail();
        break;
      case 'owner-tab':
      case 'nav':
      case 'seg':
      case 'rp':
      case 'tag-filter':
        activateWithin(el, `[data-ui="${act}"]`);
        break;
    }
  }, listenerOptions);

  /** 响应 Esc，关闭最上层弹窗或当前详情。 */
  sh.addEventListener('cancel', event => {
    event.preventDefault();
    if (event.target !== panel) closeModal(event.target);
    else if (narrowLayout.matches && !$('wsGallery').hidden && panel.classList.contains('detail-open')) closeDetail();
    else close();
  }, { ...listenerOptions, capture: true });
