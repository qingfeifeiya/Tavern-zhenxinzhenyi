
  /** 切换指定种类的行内输入框，并在打开时聚焦。 */
  const toggleChipInput = kind => {
    const row = $(`${kind}Inline`);
    row.hidden = !row.hidden;
    if (!row.hidden) $(`${kind}Input`).focus();
  };

  /** 提交指定种类的输入，沿用各自的前缀和重复提交后的刷新时机。 */
  const commitChip = kind => {
    const { field, prefix } = CHIP_FIELDS[kind];
    const it = ITEMS_BY_ID.get(activeItemId);
    const input = $(`${kind}Input`);
    const raw = input.value.trim();
    const value = raw.startsWith(prefix) ? raw.slice(1) : raw;
    if (it && value) {
      const exists = it[field].includes(value);
      if (!exists) it[field].push(value);
      if (!exists || kind === 'char') renderChips(it, kind);
    }
    input.value = '';
    $(`${kind}Inline`).hidden = true;
  };

  for (const kind of Object.keys(CHIP_FIELDS)) {
    /** 处理输入框的 Enter 键，与确认按钮共用提交逻辑。 */
    $(`${kind}Input`).addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      commitChip(kind);
    }, listenerOptions);
  }
