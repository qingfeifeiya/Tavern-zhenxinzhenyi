
  /** 固定本次删除的服饰 ID，并展示确认内容。 */
  const openDelete = ids => {
    if (!ids.size) return;
    pendingDeletion = new Set(ids);
    if (ids.size === 1) {
      const item = ITEMS_BY_ID.get(ids.values().next().value);
      $('deletePrompt').textContent = item.outfit
        ? `确定从套装库和单品画廊删除「${item.title}」？`
        : `确定删除「${item.title}」？`;
    } else $('deletePrompt').textContent = `确定删除选中的 ${ids.size} 件服饰？`;
    openModal('modalConfirm');
  };

  /** 保存删除结果后同步列表、槽位和详情，同时将焦点移到可继续操作的控件。 */
  const deleteItems = () => {
    const remaining = [];
    for (const item of ITEMS_BY_ID.values()) if (!pendingDeletion.has(item.id)) remaining.push(item);
    if (!persistState($('modalConfirm'), { items: remaining })) return;
    for (const id of pendingDeletion) {
      ITEMS_BY_ID.delete(id);
      batchIds.delete(id);
    }
    for (const slot of SLOTS_BY_ID.values()) if (pendingDeletion.has(slot.itemId)) slot.itemId = null;
    if (pendingDeletion.has(matrixOutfitId)) resetMatrixDraft();
    closeModal();
    panel.classList.remove('detail-open');
    detailTrigger = null;
    refreshWardrobeView();
    if (!$('wsMatrix').hidden) $('matrixNewDraft').focus();
    else if (gwrap.classList.contains('batch-mode')) $('btnToggleBatch').focus();
    else closeDetail();
  };
