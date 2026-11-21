// @name         甄心甄意·衣柜插件
// @namespace    http://tampermonkey.net/
// @version      0.0.0（当前脚本开发阶段，无需保留任何旧字段兼容或降级分支。）
// @description  SillyTavern 衣柜管理脚本。
// @match        */*
// @grant        none


(() => {
  'use strict';

  const P = window.parent;
  const PD = P.document;
  // @include wardrobe-config.js
  // @include state-read.js
  // @include state-init.js
  // @include panel-templates.js
  // @include styles.js

  // 挂载骨架
  const previousHost = PD.getElementById('wardrobe-host');
  if (previousHost) {
    // 同步交接后再创建新宿主，旧计时器和菜单点击监听不会留给新实例。
    previousHost.dispatchEvent(new P.Event('wardrobe:dispose'));
    if (previousHost.isConnected) {
      previousHost.remove();
      PD.getElementById('wardrobe-menu-item')?.remove();
    }
  }
  const listeners = new AbortController();
  const listenerOptions = { signal: listeners.signal };
  const host = PD.createElement('div');
  host.id = 'wardrobe-host';
  const sh = host.attachShadow({ mode: 'open' });
  // @include panel-html.js

  PD.body.appendChild(host);
  // @include panel-controls.js
  // @include panel-modals.js
  // @include state-write.js

  /** 同步开关外观与辅助技术读到的状态。 */
  const setSettingSwitch = (field, enabled) => {
    field.classList.toggle('on', enabled);
    field.setAttribute('aria-checked', String(enabled));
  };
  // @include wardrobe-management.js
  // @include settings-panel.js
  // @include selection-controls.js
  // @include panel-navigation.js
  // @include outfit-matrix.js
  // @include slot-picker.js
  // @include gallery-inspector.js
  // @include wardrobe-forms.js
  // @include gallery-delete.js

  applySettings();
  // @include tag-editor.js
  // @include panel-events.js
  // @include panel-entrances.js

  /** 释放本实例的计时器、监听及宿主节点；旧实例只清理自己发布的全局对象。 */
  const dispose = () => {
    clearInterval(menuTimer);
    close();
    listeners.abort();
    menuItem?.remove();
    host.remove();
    if (P.WardrobePanel === api) delete P.WardrobePanel;
  };

  const api = { open, close };
  applyPluginEnabled();
  host.addEventListener('wardrobe:dispose', dispose, listenerOptions);
  /** 根据页面离开事件清理插件。进入后退缓存时保留实例，因为恢复页面时脚本不会再次执行。 */
  window.addEventListener('pagehide', event => {
    if (!event.persisted) dispose();
  }, listenerOptions);
  P.WardrobePanel = api;
  console.info('[甄心甄意·衣柜] 已加载');
})();
