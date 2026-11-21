
  /**
   * 打开衣柜并在首次打开时填充画廊，记录关闭时应归还焦点的入口。
   * @param {Element} [trigger] 打开衣柜的触发控件。
   * @returns {void}
   */
  function open(trigger = sh.activeElement ?? PD.activeElement) {
    if (panel.open) return;
    if (trigger === fabBall) setFabMenu(false);
    panelTrigger = trigger;
    overlay.hidden = false;
    panel.showModal();
    closePanelButton.focus();
    if (!pluginEnabled) showPanelNotice('衣柜插件已关闭');
    // 原生模态框先完成聚焦，再填充卡片，避免聚焦阶段同步布局整座画廊。
    if (!grid.childElementCount) {
      renderWardrobeOptions();
      refreshWardrobeView();
    }
  }

  /** 复用面板提示告知提交、复制或校验结果，新消息覆盖原来的计时。 */
  function showPanelNotice(message) {
    clearPanelNotice();
    panelOpenNotice.textContent = message;
    panelNoticeTimer = setTimeout(clearPanelNotice, 3500);
  }

  /** 自动消失、关闭面板或开启插件时清除提示，避免影响下次打开。 */
  function clearPanelNotice() {
    clearTimeout(panelNoticeTimer);
    panelNoticeTimer = undefined;
    panelOpenNotice.textContent = '';
  }

  /** 关闭面板与子弹窗，将焦点归还可用的入口。 */
  function close() {
    if (!panel.open) return;
    clearPanelNotice();
    if (wardrobeDeleteDialog.open) closeModal(wardrobeDeleteDialog);
    closeModal();
    panel.close();
    overlay.hidden = true;
    if (panelTrigger?.isConnected) panelTrigger.focus();
  }

  // 魔法棒菜单
  let menuItem, menuTimer;

  /** 插件启用期间，酒馆扩展菜单出现或重建时挂载当前实例的入口。 */
  const ensureMenuItem = () => {
    if (!pluginEnabled) return;
    const menu = PD.querySelector('#extensionsMenu');
    if (!menu || PD.getElementById('wardrobe-menu-item')) return;
    if (!menuItem) {
      menuItem = PD.createElement('button');
      menuItem.type = 'button';
      menuItem.id = 'wardrobe-menu-item';
      menuItem.className = 'list-group-item flex-container flexGap5 interactable';
      menuItem.innerHTML = '<span class="fa-solid fa-shirt extensionsMenuExtensionButton" aria-hidden="true"></span><span>衣柜面板</span>';
      /** 记住酒馆菜单按钮，让点击或键盘激活后的焦点都能恢复。 */
      menuItem.addEventListener('click', () => open(menuItem), listenerOptions);
    }
    menu.appendChild(menuItem);
  };

  /** 同步悬浮球状态和酒馆扩展菜单。关闭时停止入口轮询，悬浮球仍可打开衣柜。 */
  const applyPluginEnabled = () => {
    $('fabDot').classList.toggle('off', !pluginEnabled);
    const badge = $('fabPluginState');
    badge.textContent = pluginEnabled ? '已开启' : '已关闭';
    badge.classList.toggle('off', !pluginEnabled);
    fabMenu.querySelector('[data-ui="fab-toggle-plugin"]').setAttribute('aria-pressed', String(pluginEnabled));
    if (pluginEnabled) {
      clearPanelNotice();
      ensureMenuItem();
      menuTimer ??= setInterval(ensureMenuItem, 2000);
    } else {
      clearInterval(menuTimer);
      menuTimer = undefined;
      menuItem?.remove();
    }
  };

  /** 应用指定启停状态并尝试保存，存储不可用时仍让本页的开关生效。 */
  const setPluginEnabled = enabled => {
    pluginEnabled = enabled;
    applyPluginEnabled();
    try {
      P.localStorage.setItem(ENABLED_KEY, String(enabled));
      $('fabPluginError').hidden = true;
    } catch {
      $('fabPluginError').hidden = false;
    }
  };
