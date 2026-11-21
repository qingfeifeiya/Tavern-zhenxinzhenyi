
  // 图标与模板
  const HANGER_PATH = 'M12 3a3 3 0 0 0-3 3c0 1.3.8 2.4 2 2.8V11L4 16.2A2 2 0 0 0 5.2 20h13.6a2 2 0 0 0 1.2-3.8L13 11V8.8c1.2-.4 2-1.5 2-2.8a3 3 0 0 0-3-3z';
  const ICON = {
    hanger: `<path d="${HANGER_PATH}"/>`,
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<path d="M12 6v7m0 4h.01"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    ai: '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.6-3.2 1.5 1.5 0 0 1 1.2-2.4H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z"/><path d="M7.5 11h.01M10 7.5h.01M14 7.5h.01M17 10h.01"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
    power: '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>',
    checkSquare: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    archive: '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
  };

  /** 按图标名、尺寸和描边宽度返回 SVG 标记。 */
  const icon = (n, s = 14, sw = 1.7) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ''}</svg>`;

  /** 按种子和视图标签生成确定颜色的 SVG 图片地址。 */
  const placeholder = (seed = '1', label = '正面视图') => {
    // 生成缩略图时直接遍历字符，保留原来的码点遍历和取色算法。
    let h = 12;
    for (const c of String(seed + label)) h = (h * 31 + c.charCodeAt(0)) % 360;
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${h} 12% 16%)'/><stop offset='1' stop-color='hsl(${(h + 35) % 360} 12% 8%)'/></linearGradient></defs>` +
      `<rect width='300' height='400' fill='url(#g)'/>` +
      `<g transform='translate(102 140) scale(4)' fill='none' stroke='rgba(255,255,255,.2)' stroke-width='1.1' stroke-linecap='round' stroke-linejoin='round'><path d='${HANGER_PATH}'/></g>` +
      `<text x='150' y='265' text-anchor='middle' fill='rgba(255,255,255,.28)' font-family='sans-serif' font-size='13' letter-spacing='2'>${label}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };

  /** 按标识、标题、正文、底栏和尺寸类生成弹窗，附带可定位到表单控件的提示气泡。 */
  const modalTpl = (id, title, body, foot = '', cls = '') => `
    <dialog class="backdrop" id="${id}" aria-labelledby="${id}-title">
      <div class="modal ${cls}">
        <div class="modal-h"><b id="${id}-title" style="font-size:13.5px">${title}</b><button class="icon-btn" data-ui="close-modals" aria-label="关闭弹窗">${icon('x', 16)}</button></div>
        <div class="modal-b">${body}</div>
        <div class="modal-toast-slot">
          <div class="modal-toast">
            <span class="toast-icon toast-error">${icon('alert', 16, 2.4)}</span>
            <span class="toast-icon toast-success">${icon('check', 18)}</span>
            <div class="toast-copy"><span id="${id}-error" role="alert" aria-atomic="true"></span><span role="status" aria-atomic="true"></span></div>
            <button class="icon-btn sm toast-dismiss" type="button" data-ui="dismiss-toast" aria-label="关闭提示">${icon('x', 14)}</button>
          </div>
        </div>
        ${foot ? `<div class="modal-f">${foot}</div>` : ''}
      </div>
    </dialog>`;

  /** 返回正背面媒体区。实际地址由选中服饰填入，未打开衣柜时无需生成预览图。 */
  const dualMediaTpl = () => `
    <div class="hero-media">
      ${['正面', '背面'].map(side => `
        <div class="media-slot">
          <div class="slot-head"><b>${side}视图</b><button class="link" data-ui="open-lightbox">放大预览</button></div>
          <div class="slot-thumb" data-ui="open-lightbox">
            <img id="${side === '正面' ? 'inspImgFront' : 'inspImgBack'}" loading="lazy" decoding="async" alt="${side}图">
            <div class="slot-overlay"><div class="slot-acts"><span class="btn sm solid">${icon('upload', 12)}上传${side}</span></div></div>
          </div>
          <input class="inp mono slot-url" placeholder="${side}图链接...">
        </div>`).join('')}
      <div class="hero-media-note">${icon('image', 13)}支持拖拽图片、Ctrl+V 粘贴剪贴板图片或外部图床 URL。</div>
    </div>`;

  /** 接收可选容器 ID，返回以首项为默认值的分级选择器。 */
  const ratingPickerTpl = (idAttr = '') => `
    <div class="rating-picker" ${idAttr ? `id="${idAttr}"` : ''}>
      ${RATINGS.map((r, i) => `<button type="button" class="rp-btn ${i === 0 ? 'on' : ''}" data-ui="rp" data-rating="${r.key}"><i style="background:${r.dot}"></i>${r.label}</button>`).join('')}
    </div>`;

  /**
   * 生成表单控件及其标签，按需加入字段提示。
   * @param {string} label 字段标签。
   * @param {string} control 可信控件标记。
   * @param {string} [hint] 可信提示标记。
   * @param {string} [id] 标签关联的控件 ID。
   * @returns {string} 带标签的表单控件组。
   */
  const fieldTpl = (label, control, hint, id) => {
    const heading = `<label class="lbl"${id ? ` for="${id}"` : ''}>${label}</label>`;
    return `<div class="form-group">${hint ? `<div class="row">${heading}<span class="dim" style="font-size:11px">${hint}</span></div>` : heading}${control}</div>`;
  };

  /** 接收可选的归属和分类控件 ID，返回保留原默认选项的双列表单。 */
  const ownerCatSelectTpl = (ownerId = '', catId = '') => `
    <div class="two-col">
      ${fieldTpl('归属对象', `<select class="inp" ${ownerId ? `id="${ownerId}"` : ''}><option>USER 玩家</option><option selected>Char 角色</option><option>双人通用</option></select>`, '', ownerId)}
      ${fieldTpl('所属分类', `<select class="inp" ${catId ? `id="${catId}"` : ''}><option>待整理</option>${CATEGORIES.map(c => `<option ${c.name === '正装礼服' ? 'selected' : ''}>${c.name}</option>`).join('')}</select>`, '', catId)}
    </div>`;

  /** 接收可信模板中的标题、说明和右侧控件，返回一行设置标记。 */
  const cfgRowTpl = (title, sub, right) => `
    <div class="cfg-row"><div><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>${right}</div>`;

  /** 按面板 ID、标题、设置行及可选说明生成默认隐藏的设置组。 */
  const settingsGroupTpl = (id, title, rows, desc) => `
    <div class="settings-pane" id="${id}" hidden>
      <div class="cfg-group"><h3>${title}</h3>${desc ? `<p>${desc}</p>` : ''}
        <div class="cfg-card">${rows}</div>
      </div>
    </div>`;

  /** 按动作、初始状态及可选 ID 生成开关。配置项同时声明存储键和可访问名称。 */
  const switchTpl = (action = 'switch', on = true, id, setting, label) =>
    `<button class="sw${on ? ' on' : ''}"${id ? ` id="${id}"` : ''} data-ui="${action}"${setting ? ` data-setting="${setting}" role="switch" aria-checked="${on}" aria-label="${label}"` : ''}></button>`;

  /** 按面板 ID 前缀生成共用视觉工坊，可传入画廊原有的示例结果。 */
  const visionWorkshopTpl = (prefix, { reason = '', description = '', prompt = '' } = {}) => `
    <div class="ai-card">
      <div class="ai-top">
        <span class="ai-title">${icon('ai', 15)}AI 视觉解析与词条生成</span>
        <button class="btn sm solid" data-ui="workshop-generate">${icon('zap', 12)}一键生成</button>
      </div>
      ${fieldTpl('生成预设风格', `<select class="inp" id="${prefix}AIStyle">${Array.from(VISION_STYLES, ([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select>`, '', `${prefix}AIStyle`)}
      ${fieldTpl('附加识图提示要求（可选）', `<input class="inp" id="${prefix}AIInstruction" placeholder="例如：重点描写领口与后背镂空细节，不指定性别...">`, '', `${prefix}AIInstruction`)}
      <label class="ai-vision-row" for="${prefix}AIIncludeImages">
        <span>连同服饰参考图一起多模态识图</span>
        <input type="checkbox" class="sw" role="switch" id="${prefix}AIIncludeImages" checked>
      </label>
    </div>
    <div class="form-group">
      <div class="row"><label class="lbl" for="${prefix}AIRating">AI 建议分级与依据</label><button class="link" data-ui="workshop-rating" data-prefix="${prefix}">↑ 同步至主分级</button></div>
      <div class="ai-rr">
        <select class="inp mono" id="${prefix}AIRating">${RATINGS.map(rating => `<option>${rating.key}</option>`).join('')}</select>
        <input class="inp" id="${prefix}AIReason" aria-label="分级依据" value="${escapeHTML(reason)}">
      </div>
    </div>
    <div class="form-group">
      <div class="row"><label class="lbl" for="${prefix}AIDescription">AI 生成世界书描写</label><button class="link" data-ui="workshop-description" data-prefix="${prefix}">↑ 覆盖主描述</button></div>
      <textarea class="inp" id="${prefix}AIDescription" rows="4">${escapeHTML(description)}</textarea>
    </div>
    <div class="form-group">
      <div class="row"><label class="lbl" for="${prefix}AIPrompt">生图插件联动提示词</label><button class="link" data-ui="copy-field" data-field="${prefix}AIPrompt">${icon('copy', 12)}复制</button></div>
      <textarea class="inp mono" id="${prefix}AIPrompt" rows="3">${escapeHTML(prompt)}</textarea>
    </div>`;

  /** 根据名称、计数和可选套装 ID 生成侧栏按钮。调用方先转义用户提供的名称和 ID。 */
  const navTpl = (label, count, marker, { active = false, color, outfitId, countId } = {}) => `
    <button class="nav${active ? ' on' : ''}" data-ui="${outfitId ? 'matrix-open-outfit' : 'nav'}"${outfitId ? ` data-id="${outfitId}" aria-pressed="${active}"` : ''}>
      <span class="nav-l"${color ? ` style="color:var(--${color})"` : ''}>${marker}<span>${label}</span></span>
      ${countId || count !== '' ? `<em${countId ? ` id="${countId}"` : ''}>${count}</em>` : ''}
    </button>`;

  /**
   * 生成可用于表单内外的页签按钮，按需声明当前面板。
   * @param {Array<[string, string, string?]>} tabs 面板 ID、标签和可选图标。
   * @param {string} cls 页签按钮样式。
   * @param {string} action 点击事件名称。
   * @param {boolean} [announce] 是否标注控件关联和选中状态。
   * @returns {string} 页签按钮标记。
   */
  const tabsTpl = (tabs, cls, action, announce = false) => tabs.map(([id, label, glyph], index) =>
    `<button type="button" class="${cls}${index === 0 ? ' on' : ''}" data-ui="${action}" data-pane="${id}"${announce ? ` aria-controls="${id}" aria-pressed="${index === 0}"` : ''}>${glyph ? icon(glyph) : ''}${label}</button>`
  ).join('');

  /** 按输入种类和提示返回标签或人物的行内输入与确认控件。 */
  const inlineEntryTpl = (kind, prompt) => `
    <div id="${kind}Inline" class="inline-entry" hidden>
      <input class="inp" id="${kind}Input" placeholder="${prompt}">
      <button class="btn sm solid" data-ui="add-${kind}-confirm">确认添加</button>
    </div>`;

  /** 按动作、文案、样式和可选图标生成标准操作按钮。 */
  const actionBtn = (action, label, cls = '', glyph, size = 13) =>
    `<button class="btn${cls ? ` ${cls}` : ''}" data-ui="${action}">${glyph ? icon(glyph, size) : ''}${label}</button>`;

  /** 按文案、样式和可选图标生成沿用关闭动作的演示弹窗按钮。 */
  const dismissBtn = (label, cls = '', glyph, size = 13) =>
    actionBtn('close-modals', label, cls, glyph, size);

  /** 按确认动作、文案、样式和可选图标生成标准的取消与确认按钮组。 */
  const confirmActionsTpl = (label, cls = 'solid', glyph, action = 'close-modals') =>
    `<div class="action-row">${dismissBtn('取消')}${actionBtn(action, label, cls, glyph)}</div>`;

  /** 接收日志分类、标题、时间、摘要和正文，返回演示日志的一行。 */
  const logRowTpl = (kind, title, time, summary, body) =>
    `<div class="log-item"><div class="log-head"><span><span class="log-tag ${kind}">${title}</span> ${time}</span><span>${summary}</span></div><div>${body}</div></div>`;

  /** 接收标题、说明、方向图标及三项操作文案，返回导入或导出区域。 */
  const ioBoxTpl = (title, desc, direction, labels) => `
    <div class="io-box">
      <h3>${title}</h3><p>${desc}</p>
      <div class="io-acts">${labels.map((label, index) =>
        `<button class="btn${index === 0 ? ' solid' : ''}">${icon(index === 2 ? 'archive' : direction)}${label}</button>`
      ).join('')}</div>
    </div>`;

  /** 转义服饰输入中的 HTML 字符，返回可插入模板的纯文本或属性值。 */
  const escapeHTML = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

  /** 返回服饰指定视图的已保存图片地址，空缺时沿用占位图。 */
  const itemImage = (item, label) =>
    (label === '背面视图' ? item.backUrl : item.frontUrl) || placeholder(item.id, label);

  /** 根据服饰、选中 ID 和批量勾选状态返回卡片标记。快照中的分级名称按纯文本显示。 */
  const itemCardTpl = (it, activeId, checked) => `
    <div class="card${it.id === activeId ? ' on' : ''}${checked ? ' batch-checked' : ''}" data-ui="card" data-id="${escapeHTML(it.id)}" data-rating="${escapeHTML(it.rating)}">
      <div class="thumb">
        <img src="${escapeHTML(itemImage(it, '正面视图'))}" loading="lazy" decoding="async" alt="">
        <div class="card-top">
          <div class="card-top-l">
            <button class="card-check" data-ui="card-check" aria-label="勾选 ${escapeHTML(it.title)}" aria-pressed="${checked}">${icon('check', 13, 2.5)}</button>
            ${EQUIP_TARGETS.map(({ slug, field, label }) =>
              `<span class="eq-status ${slug}" data-role="badge-${slug}" ${it[field] ? '' : 'hidden'}>已装备: ${label}</span>`
            ).join('')}
          </div>
          <div class="card-top-r">
            <span class="pill"><i style="background:${RATING_DOTS.get(it.rating)}"></i>${escapeHTML(it.rating)}</span>
            <button class="fav-top-btn ${it.fav ? 'fav' : ''}" data-ui="toggle-fav" aria-label="收藏 ${escapeHTML(it.title)}" aria-pressed="${Boolean(it.fav)}">${icon('star', 13)}</button>
          </div>
        </div>
        <div class="card-hover">
          ${EQUIP_TARGETS.map(({ slug, field, label }) =>
            `<button class="act-eq ${it[field] ? `on-${slug}` : ''}" data-ui="toggle-eq-${slug}">${icon('check', 11, 2.2)}装备 ${label}</button>`
          ).join('')}
        </div>
      </div>
      <div class="cmeta">
        <button class="cmeta-t" type="button">${escapeHTML(it.title)}</button>
        <div class="cmeta-tags">${it.tags.map(t => `<span class="mini-tag">#${escapeHTML(t)}</span>`).join('')}</div>
        <div class="cmeta-f"><span>${escapeHTML(it.owner.split(' ')[0])} · ${escapeHTML(it.category)}</span><span class="mono">${escapeHTML(it.id)}</span></div>
      </div>
    </div>`;
