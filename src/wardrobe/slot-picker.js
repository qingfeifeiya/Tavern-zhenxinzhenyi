
  /** 从全部衣柜筛选这个槽位的服饰，来源衣柜与主工作区选择分开处理。 */
  const renderSlotPickerGrid = () => {
    const currentItemId = SLOTS_BY_ID.get(currentSlotId)?.itemId;
    const q = $('pickerSearch').value.trim().toLowerCase();
    const wardrobeId = pickerWardrobe.value;
    const showWardrobe = WARDROBES.size > 1;
    const rows = [];
    for (const it of ITEMS_BY_ID.values()) {
      if (it.outfit) continue; // 槽位选单件服饰，避免套装卡片互相引用。
      if (wardrobeId && it.wardrobeId !== wardrobeId) continue;
      if (pickerFilterOwner !== 'ALL' && it.owner !== pickerFilterOwner) continue;
      if (pickerFilterCat !== 'ALL' && it.category !== pickerFilterCat) continue;
      if (q && !`${it.title} ${it.category} ${it.tags.join(' ')}`.toLowerCase().includes(q)) continue;
      const isEq = currentItemId === it.id;
      const source = showWardrobe ? escapeHTML(WARDROBES.get(it.wardrobeId).name) : '';
      rows.push(`
        <button class="p-card ${isEq ? 'equipped' : ''}" data-ui="picker-select-item" data-item-id="${escapeHTML(it.id)}">
          <span class="p-thumb">
            <img src="${escapeHTML(itemImage(it, '正面视图'))}" loading="lazy" decoding="async" alt="">
            ${isEq ? '<span class="p-badge">当前槽位已穿</span>' : ''}
          </span>
          <span class="p-meta">
            <b>${escapeHTML(it.title)}</b>
            ${showWardrobe ? `<span class="p-wardrobe" title="${source}">${source}</span>` : ''}
            <small><span>${escapeHTML(it.category)}</span><span class="mono">${escapeHTML(it.rating)}</span></small>
          </span>
        </button>`);
    }
    $('slotPickerGrid').innerHTML = rows.join('')
      || '<div style="grid-column:1/-1;padding:36px;text-align:center;color:var(--z500)">没有找到匹配的服饰。</div>';
  };

  /** 按槽位 ID 打开选衣弹窗，沿用仍可用的衣柜筛选，默认展示所有衣柜。 */
  const openSlotPicker = slotId => {
    currentSlotId = slotId;
    const slot = SLOTS_BY_ID.get(slotId);
    if (!slot) return;
    $('slotPickerTitle').textContent = `从衣柜选择服饰 · ${slot.name}`;
    $('modalSlotPicker').querySelector('[data-ui="slot-unequip-current"]').hidden = !ITEMS_BY_ID.has(slot.itemId);
    const previousWardrobe = pickerWardrobe.value;
    fillWardrobeOptions(pickerWardrobe, WARDROBES.values(), '全部衣柜');
    pickerWardrobe.hidden = WARDROBES.size === 1;
    if (!pickerWardrobe.hidden && WARDROBES.has(previousWardrobe)) pickerWardrobe.value = previousWardrobe;
    openModal('modalSlotPicker');
    // 与主面板一样，候选卡片在原生对话框完成聚焦后再参与布局。
    renderSlotPickerGrid();
  };

  // 搜索与衣柜筛选共用候选渲染，切换衣柜时继续应用现有关键词和分类。
  $('pickerSearch').addEventListener('input', renderSlotPickerGrid, listenerOptions);
  pickerWardrobe.addEventListener('change', renderSlotPickerGrid, listenerOptions);
