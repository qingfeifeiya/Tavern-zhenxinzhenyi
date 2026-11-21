
  /** 按给定衣柜填充下拉菜单，可选的提示项要求用户先选择一个目标。 */
  const fillWardrobeOptions = (select, wardrobes, placeholder) => {
    select.replaceChildren();
    if (placeholder) select.add(new P.Option(placeholder, ''));
    for (const { id, name } of wardrobes) select.add(new P.Option(name, id));
  };

  /** 同步衣柜下拉和存储统计。有组合时用不可选的小标题标明组合入口。 */
  const renderWardrobeOptions = () => {
    fillWardrobeOptions(wardrobeSelect, WARDROBES.values());
    if (WARDROBE_GROUPS.size) {
      // 将组合与单个衣柜放在同一层，避免浏览器给 optgroup 内的选项额外缩进。
      const heading = new P.Option(WARDROBE_GROUP_LABEL, '');
      heading.disabled = true;
      wardrobeSelect.add(heading);
      for (const { id, name } of WARDROBE_GROUPS.values()) {
        const option = new P.Option(name, id);
        option.setAttribute('aria-label', `${WARDROBE_GROUP_LABEL} ${name}`);
        wardrobeSelect.add(option);
      }
    }
    wardrobeSelect.value = wardrobeScope;
    $('statusWardrobe').textContent = wardrobeSelect.selectedOptions[0].textContent;
    const groupCount = WARDROBE_GROUPS.size ? ` · ${WARDROBE_GROUPS.size} 个组合` : '';
    $('storedWardrobeCount').textContent = `${WARDROBES.size} 个衣柜${groupCount}`;
  };

  /** 按衣柜与真实服饰数量生成一行管理控件，名称只作为文本和可访问标签显示。 */
  const wardrobeRowTpl = ({ id, name }, count) => {
    const label = escapeHTML(name);
    return `<div class="cfg-row wardrobe-row" data-wardrobe-id="${escapeHTML(id)}">
      <div class="wardrobe-label">
        <b class="wardrobe-name">${label}</b>
        <form class="action-row wardrobe-rename" novalidate hidden>
          <input class="inp" aria-label="衣柜名称">
          <button class="btn sm solid" type="submit">保存</button>
          <button class="btn sm" type="button" data-ui="wardrobe-cancel-rename">取消</button>
        </form>
        <small class="wardrobe-count">${count} 件</small>
      </div>
      <div class="action-row wardrobe-actions">
        ${actionBtn('wardrobe-rename', '重命名', 'sm')}
        ${actionBtn('wardrobe-view', '独立查看', 'sm')}
        <button class="btn sm danger" type="button" data-ui="wardrobe-delete" aria-label="删除衣柜 ${label}">删除</button>
      </div>
    </div>`;
  };

  /** 根据已保存组合生成查看与编辑入口，成员名称读取最新的衣柜记录。 */
  const renderWardrobeGroups = () => {
    wardrobeGroupList.hidden = !WARDROBE_GROUPS.size;
    wardrobeGroupList.innerHTML = Array.from(WARDROBE_GROUPS.values(), ({ id, name, wardrobeIds }) => `
      <div class="cfg-row wardrobe-row" data-group-id="${escapeHTML(id)}">
        <div class="wardrobe-label"><b>${escapeHTML(name)}</b><small>${wardrobeIds.map(key => escapeHTML(WARDROBES.get(key).name)).join(' · ')}</small></div>
        <div class="action-row wardrobe-actions">
          ${actionBtn('wardrobe-group-view', '查看', 'sm')}
          ${actionBtn('wardrobe-group-edit', '编辑', 'sm')}
          ${actionBtn('wardrobe-group-delete', '删除组合', 'sm danger')}
        </div>
      </div>`).join('');
  };

  /** 按指定已选 ID 填充组合的衣柜复选项。未传入时保留编辑中已勾选的成员。 */
  const renderWardrobeGroupMembers = (selected = new Set([...wardrobeGroupMembers.querySelectorAll(':checked')].map(input => input.value))) => {
    wardrobeGroupMembers.innerHTML = Array.from(WARDROBES.values(), ({ id, name }) => `
      <label class="wardrobe-group-member"><input type="checkbox" name="wardrobe" value="${escapeHTML(id)}"${selected.has(id) ? ' checked' : ''}><span>${escapeHTML(name)}</span></label>`).join('');
  };

  /** 打开组合编辑区并回填指定组合，省略组合参数时从空表单开始。 */
  const openWardrobeGroupEditor = group => {
    wardrobeGroupForm.dataset.groupId = group?.id ?? '';
    wardrobeGroupName.value = group?.name ?? '';
    renderWardrobeGroupMembers(new Set(group?.wardrobeIds));
    clearModalToast(wardrobeDialog);
    wardrobeGroupForm.hidden = false;
    wardrobeGroupName.focus();
  };

  /** 收起当前组合编辑区，将焦点还给新建入口。 */
  const closeWardrobeGroupEditor = () => {
    wardrobeGroupForm.hidden = true;
    clearModalToast(wardrobeDialog);
    wardrobeDialog.querySelector('[data-ui="wardrobe-group-new"]').focus();
  };

  /** 按完整库存重建衣柜列表，同步每个衣柜的真实件数。 */
  const renderWardrobeList = () => {
    const counts = new Map();
    for (const { wardrobeId } of ITEMS_BY_ID.values()) counts.set(wardrobeId, (counts.get(wardrobeId) ?? 0) + 1);
    wardrobeList.innerHTML = Array.from(WARDROBES.values(), wardrobe => wardrobeRowTpl(wardrobe, counts.get(wardrobe.id) ?? 0)).join('');
  };

  /** 打开管理弹窗，同步衣柜和组合列表后聚焦新衣柜输入。 */
  const openWardrobeManager = () => {
    renderWardrobeList();
    wardrobeGroupForm.hidden = true;
    renderWardrobeGroups();
    openModal('modalWardrobeMgr');
    createName.focus();
  };

  /** 保存一个新增或更新的衣柜。完整快照写入成功后才替换索引中的记录。 */
  const saveWardrobe = wardrobe => {
    const exists = WARDROBES.has(wardrobe.id);
    const wardrobes = Array.from(WARDROBES.values(), current => current.id === wardrobe.id ? wardrobe : current);
    if (!exists) wardrobes.push(wardrobe);
    if (!persistState(wardrobeDialog, { wardrobes })) return false;
    WARDROBES.set(wardrobe.id, wardrobe);
    renderWardrobeOptions();
    renderWardrobeGroups();
    if (!wardrobeGroupForm.hidden) renderWardrobeGroupMembers();
    return true;
  };

  /** 从指定行的删除按钮打开独立确认弹窗，说明服饰去向和受影响的组合。 */
  const openWardrobeDelete = trigger => {
    const { wardrobeId } = trigger.closest('.wardrobe-row').dataset;
    const target = WARDROBES.get(getDefaultWardrobeId(wardrobeId));
    if (!target) return;

    let itemCount = 0, updatedGroups = 0, removedGroups = 0;
    for (const item of ITEMS_BY_ID.values()) if (item.wardrobeId === wardrobeId) itemCount++;
    for (const { wardrobeIds } of WARDROBE_GROUPS.values()) {
      if (!wardrobeIds.includes(wardrobeId)) continue;
      if (wardrobeIds.length === 2) removedGroups++;
      else updatedGroups++;
    }

    const details = [];
    if (itemCount) details.push(`${itemCount} 件服饰将移到「${target.name}」。`);
    if (updatedGroups) details.push(`将从 ${updatedGroups} 个组合中移除此衣柜。`);
    if (removedGroups) details.push(`${removedGroups} 个组合将因少于两个衣柜而删除。`);
    wardrobeDeleteTrigger = trigger;
    $('wardrobeDeletePrompt').textContent = `确定删除「${WARDROBES.get(wardrobeId).name}」？`;
    const detailsText = $('wardrobeDeleteDetails');
    detailsText.textContent = details.join('');
    detailsText.hidden = !details.length;
    clearModalToast(wardrobeDialog);
    openModal('modalWardrobeDelete');
    // 默认聚焦取消，避免打开确认框后再次按 Enter 就删除衣柜。
    wardrobeDeleteDialog.querySelector('.modal-f [data-ui="close-modals"]').focus();
  };

  /** 按匹配函数生成移至目标衣柜的完整库存和变更记录，供一次保存后提交。 */
  const stageWardrobeMove = (wardrobeId, matches) => {
    const moved = [];
    const items = Array.from(ITEMS_BY_ID.values(), item => {
      if (item.wardrobeId === wardrobeId || !matches(item)) return item;
      const next = { ...item, wardrobeId };
      moved.push(next);
      return next;
    });
    return { items, moved };
  };

  /** 一次保存衣柜删除、迁移和组合更新，成功后就地更新管理列表。 */
  const deleteWardrobe = () => {
    if (!wardrobeDeleteTrigger) return;
    const row = wardrobeDeleteTrigger.closest('.wardrobe-row');
    const { wardrobeId } = row.dataset;
    const destinationId = getDefaultWardrobeId(wardrobeId);
    const { items, moved } = stageWardrobeMove(destinationId, item => item.wardrobeId === wardrobeId);
    const wardrobes = [...WARDROBES.values()].filter(wardrobe => wardrobe.id !== wardrobeId);
    const wardrobeGroups = [];
    for (const group of WARDROBE_GROUPS.values()) {
      const wardrobeIds = group.wardrobeIds.filter(id => id !== wardrobeId);
      // 组合至少包含两个衣柜。保留有效组合的原 ID，让现有下拉选择仍可用。
      if (wardrobeIds.length >= 2) wardrobeGroups.push({ ...group, wardrobeIds });
    }
    if (!persistState(wardrobeDeleteDialog, { items, wardrobes, wardrobeGroups })) return;

    const resetSelection = wardrobeScope === wardrobeId || WARDROBE_GROUPS.get(wardrobeScope)?.wardrobeIds.includes(wardrobeId);
    WARDROBES.delete(wardrobeId);
    for (const item of moved) ITEMS_BY_ID.set(item.id, item);
    WARDROBE_GROUPS.clear();
    for (const group of wardrobeGroups) WARDROBE_GROUPS.set(group.id, group);
    if (!WARDROBES.has(wardrobeScope) && !WARDROBE_GROUPS.has(wardrobeScope)) wardrobeScope = destinationId;

    // 保留其余行，避免滚动位置和编辑中的输入随列表重建一起丢失。
    const adjacent = row.nextElementSibling ?? row.previousElementSibling;
    closeModal(wardrobeDeleteDialog);
    row.remove();
    if (moved.length) {
      let count = 0;
      for (const item of items) if (item.wardrobeId === destinationId) count++;
      wardrobeList.querySelector(`[data-wardrobe-id="${P.CSS.escape(destinationId)}"] .wardrobe-count`).textContent = `${count} 件`;
    }
    renderWardrobeGroups();
    if (!wardrobeGroupForm.hidden) {
      const { groupId } = wardrobeGroupForm.dataset;
      if (groupId && !WARDROBE_GROUPS.has(groupId)) wardrobeGroupForm.hidden = true;
      else renderWardrobeGroupMembers();
    }
    renderWardrobeOptions();
    refreshWardrobeView(resetSelection);
    adjacent.querySelector(WARDROBES.size > 1 ? '[data-ui="wardrobe-delete"]' : '[data-ui="wardrobe-view"]').focus();
    showModalToast(wardrobeDialog, '衣柜已删除。', 'success');
  };

  /** 从指定输入校验衣柜或组合名称，返回去空白后的有效值，失败时显示本插件的错误。 */
  const readWardrobeName = (input, records, currentId, kind) => {
    const name = input.value.trim();
    let error;
    if (!name) error = `请输入${kind}名称。`;
    else if (Array.from(records.values()).some(record => record.id !== currentId && record.name === name)) error = `已存在同名${kind}。`;
    if (error) {
      showModalError(wardrobeDialog, error, input);
      return '';
    }
    return name;
  };

  /** 写入指定的组合更改。省略组合时删除该 ID，若正在查看则回到默认衣柜。 */
  const saveWardrobeGroup = (id, group) => {
    const next = new Map(WARDROBE_GROUPS);
    if (group) next.set(id, group);
    else next.delete(id);
    if (!persistState(wardrobeDialog, { wardrobeGroups: [...next.values()] })) return false;
    const previous = WARDROBE_GROUPS.get(id);
    if (group) WARDROBE_GROUPS.set(id, group);
    else WARDROBE_GROUPS.delete(id);
    const scopeChanged = wardrobeScope === id && (!group || previous.wardrobeIds.length !== group.wardrobeIds.length
      || previous.wardrobeIds.some((key, index) => key !== group.wardrobeIds[index]));
    if (!group && wardrobeScope === id) wardrobeScope = getDefaultWardrobeId();
    renderWardrobeGroups();
    renderWardrobeOptions();
    if (scopeChanged) refreshWardrobeView(true);
    return true;
  };

  /** 切换指定行的名称编辑状态，在打开和关闭时把焦点放回对应控件。 */
  const setWardrobeEditor = (row, editing) => {
    const label = row.querySelector('.wardrobe-name');
    const form = row.querySelector('.wardrobe-rename');
    const button = row.querySelector('[data-ui="wardrobe-rename"]');
    label.hidden = button.hidden = editing;
    form.hidden = !editing;
    clearModalToast(wardrobeDialog);
    if (editing) {
      const input = form.querySelector('input');
      input.value = label.textContent;
      input.focus();
      input.select();
    } else button.focus();
  };

  /** 打开服饰表单。查看组合时让用户在其成员中选择存放位置。 */
  const openAddOutfit = () => {
    const group = WARDROBE_GROUPS.get(wardrobeScope);
    const target = $('addWardrobe');
    if (group) {
      const previous = target.value;
      fillWardrobeOptions(target, group.wardrobeIds.map(id => WARDROBES.get(id)), '请选择衣柜');
      if (group.wardrobeIds.includes(previous)) target.value = previous;
    }
    target.disabled = target.parentElement.hidden = !group;
    openModal('modalAddOutfit');
  };
