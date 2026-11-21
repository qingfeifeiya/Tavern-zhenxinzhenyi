
  /**
   * 提交衣柜数据和设置快照。
   * @param {HTMLDialogElement|null} dialog 错误提示所在弹窗，为空时显示在主面板。
   * @param {object} [snapshot] 要替换的服饰、设置、衣柜或衣柜组合。
   * @returns {boolean} 是否写入成功。
   */
  const persistState = (dialog, {
    items = [...ITEMS_BY_ID.values()], nextSettings = settings, wardrobes = [...WARDROBES.values()], wardrobeGroups = [...WARDROBE_GROUPS.values()],
  } = {}) => {
    try {
      P.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, settings: nextSettings, wardrobes, wardrobeGroups }));
    } catch {
      const message = '无法写入浏览器存储，请检查存储权限或剩余空间后重试。';
      if (dialog) showModalError(dialog, message);
      else showPanelNotice(message);
      return false;
    }
    if (dialog) clearModalToast(dialog);
    return true;
  };
