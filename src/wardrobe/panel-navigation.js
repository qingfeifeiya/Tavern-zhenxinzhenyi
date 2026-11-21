
  /** 仅在触发控件的直接容器内，通过原有选择器更新激活状态。 */
  const activateWithin = (el, selector = 'button') => {
    el.parentElement.querySelectorAll(selector).forEach(button => button.classList.toggle('on', button === el));
  };

  /** 根据工作区按钮同步画廊、搭配台和顶部切换状态。 */
  const switchWorkspace = button => {
    const isMatrix = button.dataset.ws === 'matrix';
    activateWithin(button, '.ws-tab');
    for (const tab of button.parentElement.children) tab.setAttribute('aria-pressed', String(tab === button));
    $('wsGallery').hidden = isMatrix;
    $('wsMatrix').hidden = !isMatrix;
  };

  /** 根据触发页签及对应配置切换内容区，保持其它页签组的状态。 */
  const switchPane = (el, tabs, selector) => {
    activateWithin(el, selector);
    for (const [id] of tabs) $(id).hidden = id !== el.dataset.pane;
    if (el.hasAttribute('aria-pressed')) {
      for (const button of el.parentElement.children) button.setAttribute('aria-pressed', String(button === el));
    }
  };

  /** 返回带类型前缀的随机 ID，供新服饰和独立槽位保存引用。 */
  const createId = prefix => prefix + P.crypto.getRandomValues(new Uint32Array(2)).join('-');
