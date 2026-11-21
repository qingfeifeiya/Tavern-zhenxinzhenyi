
  const MODAL_MAP = {
    'open-cat-mgr': 'modalCatMgr',
    'open-combine-modal': 'modalCombine',
    'open-logs': 'modalLogs',
    'open-settings': 'modalSettings',
    'open-io': 'modalIO',
  };

  /** 按弹窗 ID 打开项目弹窗，清除上一次提交的提示。 */
  const openModal = id => {
    const dialog = $(id);
    clearModalToast(dialog);
    dialog.showModal();
  };

  /**
   * 关闭弹窗，撤销未保存的设置预览，并将衣柜删除弹窗的焦点归还原操作行。
   * @param {HTMLDialogElement} [dialog] 要关闭的弹窗，默认使用当前最上层弹窗。
   * @returns {void}
   */
  const closeModal = (dialog = wardrobeDeleteDialog.open ? wardrobeDeleteDialog : sh.querySelector('.backdrop[open]')) => {
    if (!dialog) return;
    if (dialog === settingsDialog) applySettings();
    clearModalToast(dialog);
    dialog.close();
    if (dialog === wardrobeDeleteDialog) {
      wardrobeDeleteTrigger.focus({ preventScroll: true });
      wardrobeDeleteTrigger = undefined;
    }
  };

  /** 清除指定弹窗的气泡、字段错误标记、定位监听和自动关闭计时器。 */
  const clearModalToast = dialog => {
    const toast = dialog.querySelector('.modal-toast');
    const { kind } = toast.dataset;
    if (!kind) return;
    const { field, stopTracking, timer } = toastStates.get(toast);
    stopTracking?.();
    field?.removeAttribute('aria-invalid');
    field?.removeAttribute('aria-errormessage');
    clearTimeout(timer);
    toastStates.delete(toast);
    toast.querySelector(kind === 'error' ? '[role="alert"]' : '[role="status"]').textContent = '';
    delete toast.dataset.kind;
    delete toast.dataset.anchored;
    delete toast.dataset.above;
    delete toast.dataset.offscreen;
  };

  /** 让气泡贴在指定弹窗的出错字段旁，返回清理定位监听及待执行帧的函数。 */
  const trackModalToast = (dialog, toast, field) => {
    const slot = toast.parentElement;
    const body = dialog.querySelector('.modal-b');
    const pane = field.closest('.settings-pane');
    const anchor = field.closest('.wardrobe-group-member') ?? field;
    const editor = field.closest('.wardrobe-group-members') ?? field;
    const controller = new P.AbortController();
    const options = { signal: controller.signal, passive: true };
    let frame = 0;

    /** 按滚动区和字段位置计算气泡坐标，字段滚出可见区时隐藏气泡。 */
    const position = () => {
      frame = 0;
      const rect = anchor.getBoundingClientRect();
      const bodyRect = body.getBoundingClientRect();
      const paneRect = pane?.getBoundingClientRect() ?? bodyRect;
      const top = Math.max(bodyRect.top, paneRect.top);
      const bottom = Math.min(bodyRect.bottom, paneRect.bottom);
      const offscreen = !rect.height || rect.top < top || rect.bottom > bottom;
      toast.toggleAttribute('data-offscreen', offscreen);
      if (offscreen) return;

      const slotRect = slot.getBoundingClientRect();
      const { width, height } = toast.getBoundingClientRect();
      const gap = 8;
      const below = rect.bottom + gap;
      const above = rect.top - height - gap;
      // 列表末行下方空间不足时翻到字段上方，避免遮住底栏按钮。
      const useAbove = below + height > bottom && above >= slot.parentElement.getBoundingClientRect().top + gap;
      const left = Math.max(slotRect.left + 10, Math.min(rect.left, slotRect.right - width - 10));
      const arrow = Math.max(10, Math.min(rect.left + Math.min(20, rect.width / 2) - left - 5, width - 20));
      toast.toggleAttribute('data-above', useAbove);
      toast.style.setProperty('--toast-top', `${(useAbove ? above : below) - slotRect.top}px`);
      toast.style.setProperty('--toast-left', `${left - slotRect.left}px`);
      toast.style.setProperty('--toast-arrow', `${arrow}px`);
    };

    /** 将同一帧内的滚动或缩放合并为一次定位，避免重复读写布局。 */
    const schedule = () => {
      if (!frame) frame = P.requestAnimationFrame(position);
    };
    dialog.addEventListener('scroll', schedule, { ...options, capture: true });
    P.addEventListener('resize', schedule, options);
    /** 用户开始修正当前字段时清除旧提示，由下次提交重新校验。 */
    editor.addEventListener('input', () => clearModalToast(dialog), options);
    position();
    /** 关闭气泡后释放定位监听，避免用旧字段覆盖下一次提示。 */
    return () => {
      controller.abort();
      P.cancelAnimationFrame(frame);
    };
  };

  /** 显示指定弹窗的消息。字段错误贴着控件，成功消息定时从底栏上方收起。 */
  const showModalToast = (dialog, message, kind, field) => {
    clearModalToast(dialog);
    const toast = dialog.querySelector('.modal-toast');
    const state = { field };
    toastStates.set(toast, state);
    toast.dataset.kind = kind;
    const copy = toast.querySelector(kind === 'error' ? '[role="alert"]' : '[role="status"]');
    copy.textContent = message;
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-errormessage', copy.id);
      toast.dataset.anchored = '';
      state.stopTracking = trackModalToast(dialog, toast, field);
    }
    if (kind === 'success') {
      state.timer = setTimeout(() => clearModalToast(dialog), 3500);
    }
  };

  /** 显示指定弹窗的错误消息，传入字段时将焦点移到可修正的位置。 */
  const showModalError = (dialog, message, field) => {
    field?.focus();
    showModalToast(dialog, message, 'error', field);
  };
