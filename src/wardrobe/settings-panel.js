
  /**
   * 即时预览隐私设置，取消时可恢复到存档中的状态。
   * @param {boolean} blurR18 是否模糊 R-18 缩略图。
   * @param {boolean} showTags 是否显示服饰标签。
   * @returns {void}
   */
  const applyDisplay = (blurR18, showTags) => {
    gwrap.classList.toggle('blur-r18', blurR18);
    gwrap.classList.toggle('hide-tags', !showTags);
  };

  /**
   * 把已保存的设置回填到控件和画廊。
   * @returns {void}
   */
  function applySettings() {
    for (const field of settingsFields) {
      const value = settings[field.dataset.setting];
      if (field.matches('button')) setSettingSwitch(field, value !== false);
      else field.value = typeof value === 'string' ? value : field.defaultValue ?? field.options[0].value;
    }
    applyDisplay(settings.blurR18 !== false, settings.showTags !== false);
  }

  /**
   * 校验并保存设置，校验失败时定位到对应页签的错误字段。
   * @returns {void}
   */
  const saveSettings = () => {
    const depthField = $('injectDepth');
    const depth = depthField.value.trim();
    if (depth && !/^\d+$/.test(depth)) {
      const tab = settingsDialog.querySelector('[data-pane="paneInject"]');
      switchPane(tab, SETTINGS_TABS, '.s-tab');
      showModalError(settingsDialog, '注入位置深度请输入 0 或正整数。', depthField);
      return;
    }
    const next = { ...settings };
    for (const field of settingsFields) {
      next[field.dataset.setting] = field.matches('button') ? field.classList.contains('on') : field.value;
    }
    next.injectDepth = depth;
    if (!persistState(settingsDialog, { nextSettings: next })) return;
    settings = next;
    closeModal();
  };
