
  /**
   * 更新已勾选数量和批量移动按钮状态。
   * @returns {void}
   */
  const updateBatchCount = () => {
    $('batchCount').textContent = String(batchIds.size);
    $('btnBatchMove').disabled = !batchIds.size;
  };

  const batchIds = new Set();

  /**
   * 按当前范围全选或清空，并同步卡片。
   * @param {boolean} selected 是否全选。
   * @returns {void}
   */
  const setBatchSelection = selected => {
    batchIds.clear();
    if (selected) for (const id of visibleItems.keys()) batchIds.add(id);
    for (const card of cardsById.values()) syncCardCheck(card);
    updateBatchCount();
  };

  /** 根据卡片记录的服饰 ID 同步勾选外观和按下状态。 */
  const syncCardCheck = card => {
    const checked = batchIds.has(card.dataset.id);
    card.classList.toggle('batch-checked', checked);
    card.querySelector('[data-ui="card-check"]').setAttribute('aria-pressed', String(checked));
  };

  /**
   * 切换服饰的勾选状态并同步其卡片。
   * @param {string} id 服饰 ID。
   * @returns {void}
   */
  const toggleBatchItem = id => {
    if (batchIds.has(id)) batchIds.delete(id);
    else batchIds.add(id);
    syncCardCheck(cardsById.get(id));
    updateBatchCount();
  };
