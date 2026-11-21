
  /** 按选中 ID 和批量勾选集合生成画廊，新建入口在空衣柜时仍可用。 */
  const renderCardsHTML = (activeId) =>
    `<button class="card-add" data-ui="open-add-modal" title="点击打开添加新服饰面板">
      <div class="card-add-body">
        <div class="card-add-ic">${icon('plus', 22, 2)}</div>
        <div class="card-add-title">添加新服饰</div>
      </div>
    </button>` + Array.from(visibleItems.values(), it => itemCardTpl(it, activeId, batchIds.has(it.id))).join('');

  sh.innerHTML = `
<style>${CSS}</style>

<!-- 悬浮球 -->
<div class="fab-wrap" id="fabWrap">
  <button class="fab-ball" id="fabBall" aria-label="衣柜快捷菜单" aria-expanded="false" aria-controls="fabMenu" title="按住可拖动位置">
    ${icon('hanger', 20)}<span class="fab-dot" id="fabDot"></span>
  </button>
  <div class="fab-menu" id="fabMenu" hidden>
    <button class="fab-item" data-ui="fab-toggle-plugin" aria-pressed="true"><span class="fab-item-l">${icon('power', 14)}<span>插件功能</span></span><span class="fab-badge" id="fabPluginState">已开启</span></button>
    <button class="fab-item" data-ui="fab-open-wardrobe"><span class="fab-item-l">${icon('hanger', 14)}<span>打开衣柜面板</span></span></button>
    <p class="fab-error" id="fabPluginError" role="status" hidden>无法保存开关状态，本页仍已生效。</p>
  </div>
</div>

<div class="overlay" id="overlay" hidden>
  <dialog class="panel" id="panel" aria-label="衣柜管理">

    <!-- 1. 顶部全局导航栏 -->
    <header class="top">
      <div class="top-l">
        <div class="brand"><div class="logo">${icon('hanger', 15)}</div><h1>酒馆衣柜</h1></div>
        <div class="wb-switcher">
          <div class="wb-controls">
            <select class="inp wb-select" id="wbSelect" aria-label="当前衣柜"></select>
            <button class="btn sm" data-ui="open-wardrobe-mgr" title="管理单个衣柜与${WARDROBE_GROUP_LABEL}">${icon('folder', 13)}多衣柜管理</button>
          </div>
          <div class="ws-tabs" role="group" aria-label="工作区">
            <button class="ws-tab on" data-ui="switch-ws" data-ws="gallery" aria-pressed="true" aria-controls="wsGallery">${icon('grid', 13)}<span>单品画廊</span><em id="topGalleryCount"></em></button>
            <button class="ws-tab" id="matrixWorkspaceTab" data-ui="switch-ws" data-ws="matrix" aria-pressed="false" aria-controls="wsMatrix">${icon('layers', 13)}<span>全身搭配台</span><em id="topMatrixCount">0 槽</em></button>
          </div>
        </div>
      </div>

      <div class="api-pool-dock">
        <span class="pool-tag">选衣 API 候选池:</span>
        <span class="pool-tag">USER 已装备 <b class="user" id="poolUserCount">2 件</b></span>
        <span class="pool-tag">Char 已装备 <b class="char" id="poolCharCount">3 件</b></span>
      </div>

      <div class="top-r">
        <button class="btn sm" data-ui="open-io" aria-label="导入 / 导出">${icon('upload', 14)}<span class="optional-label">导入 / 导出</span></button>
        <button class="btn sm" data-ui="open-logs" aria-label="日志">${icon('terminal', 14)}<span class="optional-label">日志</span></button>
        <button class="btn sm" type="button" aria-label="主题" title="主题" disabled>${icon('palette', 13)}<span class="optional-label">主题</span></button>
        <button class="btn sm" type="button" data-ui="open-settings" aria-label="设置" title="设置">${icon('sliders', 13)}<span class="optional-label">设置</span></button>
        <button class="icon-btn" data-ui="close" aria-label="关闭面板" autofocus>${icon('x', 16)}</button>
      </div>
    </header>

    <!-- 单品画廊 -->
    <div class="cols" id="wsGallery">
      <aside class="side">
        <div class="side-sec">
          <div class="owner-switch">
            <button class="owner-btn" data-ui="owner-tab">${icon('user', 14)}<b>USER 玩家</b><em id="galleryUserCount"></em></button>
            <button class="owner-btn on" data-ui="owner-tab">${icon('user', 14)}<b>Char 角色</b><em id="galleryCharCount"></em></button>
          </div>
        </div>

        <div class="side-sec">
          <div class="side-h"><span class="side-h-l"><i class="sec-dot"></i>装备与快捷筛选</span></div>
          <div class="nav-list">
            ${[
              ['全部服饰', 'galleryAllCount', 'layers'],
              ['已装备给 USER', 'galleryEquippedUserCount', 'send', 'sky'],
              ['已装备给 Char', 'galleryEquippedCharCount', 'send', 'emerald'],
              ['最近使用', '', 'clock'],
              ['待整理', 'galleryUnsortedCount', 'inbox'],
              ['常用收藏', 'galleryFavoriteCount', 'star'],
            ].map(([label, countId, glyph, color], index) =>
              navTpl(label, '', icon(glyph, color ? 13 : 14), { active: index === 0, color, countId })
            ).join('')}
          </div>
        </div>

        <div class="side-sec" style="flex:1;overflow-y:auto">
          <div class="side-h">
            <span class="side-h-l"><i class="sec-dot"></i>服饰分类</span>
            <button class="icon-btn sm" data-ui="open-cat-mgr" title="新增分类">${icon('plus', 13)}</button>
          </div>
          <div class="nav-list">
            ${CATEGORIES.map((c, index) => navTpl(c.name, '', `<i class="cat-dot" style="background:${c.dot}"></i>`, { countId: `galleryCategory${index}` })).join('')}
          </div>
        </div>
      </aside>

      <main class="mid">
        <div class="toolbar">
          <div class="search">${icon('search', 14)}<input class="inp" placeholder="搜索标题、材质、#特征标签 或描述..."><kbd>⌘K</kbd></div>
          <div class="toolbar-r">
            <div class="seg">
              <button class="on" data-ui="seg">全部</button>
              ${RATINGS.map(r => `<button data-ui="seg"><i style="background:${r.dot}"></i>${r.key}</button>`).join('')}
            </div>
            ${actionBtn('open-combine-modal', '合并搭配', '', 'layers', 14)}
            <button class="btn" type="button" disabled>整套拆分</button>
            <button class="btn" type="button" disabled>${icon('zap', 14)}一键识图</button>
            ${actionBtn('open-add-modal', '添加新服饰', 'solid', 'plus', 14)}
          </div>
        </div>

        <div class="subbar">
          <div class="subbar-l">
            <b>Char 角色 · 全部服饰</b><span>·</span>
            <div class="subbar-tags">
              <button class="tag-pill on" data-ui="tag-filter">全部标签</button>
              ${ALL_TAGS.map(t => `<button class="tag-pill" data-ui="tag-filter">#${t}</button>`).join('')}
            </div>
          </div>
          <div class="subbar-r">
            <div class="gallery-management">
              <button class="btn sm" type="button" disabled>管理标签</button>
              <button class="btn sm" type="button" id="btnToggleBatch" data-ui="toggle-batch-mode" aria-pressed="false" aria-controls="gwrapBar">${icon('checkSquare', 12)}批量管理</button>
            </div>
            <select class="inp" style="width:auto;padding:3px 24px 3px 8px;font-size:11px"><option>默认排序</option><option>已装备优先</option><option>最近使用优先</option><option>按标题名称</option></select>
            <div class="seg" role="group" aria-label="画廊视图">
              ${[['grid', '网格'], ['list', '列表']].map(([mode, label], index) =>
                `<button type="button"${index ? '' : ' class="on"'} data-ui="view-mode" data-mode="${mode}" title="${label}模式" aria-label="${label}模式" aria-pressed="${!index}" aria-controls="grid">${icon(mode, 13)}</button>`
              ).join('')}
            </div>
          </div>
        </div>

        <div class="gwrap" id="gwrap">
          <div class="gwrap-bar" id="gwrapBar" hidden>
            <div class="gwrap-bar-l">
              <span class="batch-stat">批量模式 · 已勾选 <b id="batchCount">0</b> 件</span>
              ${actionBtn('batch-select-all', '全选本页', 'sm', 'checkSquare', 12)}
              ${actionBtn('batch-clear', '清空勾选', 'sm ghost')}
            </div>
            <div class="gwrap-bar-r">
              ${actionBtn('batch-eq-user', '批量装备 USER', 'sm sky', 'check', 12)}
              ${actionBtn('batch-eq-char', '批量装备 Char', 'sm emerald', 'check', 12)}
              <button class="btn sm" id="btnBatchMove" data-ui="open-batch-move" disabled>${icon('folder', 12)}批量移至衣柜</button>
              ${actionBtn('open-batch-delete', '批量删除', 'sm danger', 'trash', 12)}
              ${actionBtn('toggle-batch-mode', '退出批量', 'sm ghost')}
            </div>
          </div>
          <div class="grid" id="grid"></div>
        </div>
      </main>

      <!-- 4. 右栏：属性面板 -->
      <aside class="insp" id="galleryInspector">
        <div class="insp-h">
          <div class="insp-h-l">
            <button class="icon-btn back" data-ui="close-detail" aria-label="返回单品画廊">${icon('back', 16)}</button>
            <span class="dim" style="font-size:12px;font-weight:600">服饰属性面板</span>
            <span class="badge" id="inspId">#WD-001</span>
          </div>
          <div class="insp-h-r"><span class="unsaved-dot">编辑预览</span><button class="icon-btn sm" style="color:var(--amber)">${icon('star', 15)}</button></div>
        </div>

        <div class="insp-b">
          <div class="insp-tabs" role="tablist">
            ${tabsTpl(INSPECTOR_TABS, 'insp-tab', 'insp-tab')}
          </div>

          <!-- Tab 1：1. 基础属性 -->
          <div class="insp-pane" id="inspPaneBasic">
            ${dualMediaTpl()}
            ${fieldTpl('服饰标题', `<input class="inp" id="inspTitle" value="${DEMO_ITEMS[0].title}">`, '必填')}
            ${ownerCatSelectTpl('inspOwner', 'inspCat')}
            ${fieldTpl('尺度分级', ratingPickerTpl('inspRatingPicker'))}
            <div class="form-group">
              <div class="row"><label class="lbl">特征标签</label><span class="dim" style="font-size:11px">同步显示在画廊顶部筛选栏</span></div>
              <div class="chips" id="inspChips"></div>
              ${inlineEntryTpl('tag', '输入新特征标签...')}
            </div>
            ${fieldTpl('服饰细节描述', `<textarea class="inp" id="inspDesc" rows="3">${DEMO_ITEMS[0].desc}</textarea>`, '用于发送给选衣 API 与上下文注入')}
          </div>

          <!-- Tab 2：2. AI 视觉工坊 -->
          <div class="insp-pane" id="inspPaneAI" hidden>
            ${visionWorkshopTpl('insp', {
              reason: '全身覆盖完整，剪裁正式克制，无明显裸露',
              description: '【穿戴状态：炭黑廓形双排扣西装大衣】外层披覆重磅炭黑精纺羊毛大衣，宽肩直线剪裁勾勒出挺拔冷峻的肩线；双排哑光牛角扣半扣，领口微露内搭的纯黑高领羊绒衫。',
              prompt: 'charcoal black oversized double-breasted wool coat, wide shoulders, horn buttons, black turtleneck sweater underneath',
            })}
          </div>

          <!-- Tab 3：3. 世界书绑定 -->
          <div class="insp-pane" id="inspPaneWorld" hidden>
            <div class="cfg-card">
              ${cfgRowTpl(
                '启用世界书专属绑定',
                '默认关闭（不生效）；开启后该服饰仅在下方指定的世界书中才会进入选衣池生效',
                '<button class="sw" type="button" id="inspWbSw" data-ui="toggle-wb-enable" role="switch" aria-checked="false" aria-label="启用世界书专属绑定"></button>'
              )}
            </div>

            <div class="cfg-card" style="padding:14px;display:flex;flex-direction:column;gap:14px">
              <div class="form-group" id="wbSelectField" style="opacity:.55">
                <div class="row">
                  <label class="lbl">${icon('book', 13)} 绑定专属世界书</label>
                  <span class="dim" style="font-size:11px" id="wbStateHint">当前默认关闭 · 不生效</span>
                </div>
                <select class="inp" id="inspWorldbook" disabled>
                  <option value="" selected>未绑定世界书（默认关闭）</option>
                  <option value="现代都市日常设定集">现代都市日常设定集</option>
                  <option value="特勤局世界书 v2">特勤局世界书 v2</option>
                  <option value="奇幻西幻大陆志">奇幻西幻大陆志</option>
                </select>
                <small class="dim" style="font-size:11px">说明：开启上方开关并选择世界书后，只有当前对话启用了该世界书，这件衣服才会生效。</small>
              </div>

              <div class="form-group" style="border-top:1px solid var(--line);padding-top:14px">
                <div class="row">
                  <label class="lbl">${icon('user', 13)} 绑定专属人物</label>
                  <span class="dim" style="font-size:11px">添加人物后「全部」自动消失</span>
                </div>
                <div class="chips" id="inspCharChips"></div>
                ${inlineEntryTpl('char', '输入要绑定的人物名称（回车或点击确认）...')}
                <small class="dim" style="font-size:11px">说明：默认为「全部」（对所有角色/玩家生效）；当输入一个或多个绑定人物名称后，「全部」自动消失，仅对所选人物生效。</small>
              </div>
            </div>
          </div>
        </div>

        <div class="insp-f">
          <button class="btn danger" data-ui="open-item-delete">${icon('trash', 14)}删除</button>
          <div class="insp-f-r" id="inspItemActions"><button class="btn">还原</button><button class="btn solid">${icon('save', 14)}保存修改</button></div>
          <button class="btn solid" id="inspEditOutfit" data-ui="matrix-open-outfit" hidden>${icon('layers', 14)}编辑搭配</button>
        </div>
      </aside>
    </div>

    <!-- 全身搭配台 -->
    <div class="cols" id="wsMatrix" hidden>
      <aside class="side">
        <div class="side-sec" style="flex:1;overflow-y:auto">
          <div class="side-h" style="margin-bottom:8px">
            <span class="side-h-l"><i class="sec-dot"></i>套装库</span>
            <button class="btn sm solid" id="matrixNewDraft" data-ui="matrix-new-draft">${icon('plus', 12)}新建槽位</button>
          </div>
          <div class="nav-list" id="matrixOutfitList"></div>
        </div>
      </aside>

      <main class="matrix-mid">
        <div class="matrix-head">
          <h2 id="matrixHeadTitle" tabindex="-1">全身 8 槽位穿戴矩阵</h2>
          <div class="action-row">
            <button class="btn sm" id="matrixDefaultSlots" data-ui="matrix-reset-defaults" disabled>默认槽位</button>
            <button class="btn sm" id="matrixAddSlot" data-ui="matrix-name-slot">${icon('plus', 12)}添加槽位</button>
            ${actionBtn('matrix-clear-all', '清空槽位', 'sm')}
            ${actionBtn('matrix-jump-preview', '预览', 'sm matrix-jump')}
          </div>
        </div>
        <div class="matrix-grid" id="matrixGrid"></div>
      </main>

      <aside class="insp">
        <div class="insp-h"><h2 class="lbl" id="matrixPreviewTitle" tabindex="-1">套装效果预览</h2><span class="badge" id="matrixActiveBadge">0 / 8 槽位</span></div>
        <div class="insp-b">
          <div class="insp-tabs" role="group" aria-label="套装效果预览页签">
            ${tabsTpl(MATRIX_TABS, 'insp-tab', 'matrix-tab', true)}
          </div>
          <div class="insp-pane" id="matrixPaneBasic">
            ${fieldTpl('套装名称', '<input class="inp" id="matrixTitle" placeholder="未命名套装" required>', '', 'matrixTitle')}
            ${ownerCatSelectTpl('matrixOwner', 'matrixCategory')}
            ${fieldTpl('尺度分级', ratingPickerTpl('matrixRatingPicker'))}
            <div class="two-col">
              ${fieldTpl('正面图片链接', '<input class="inp" id="matrixFront" inputmode="url">', '', 'matrixFront')}
              ${fieldTpl('背面图片链接', '<input class="inp" id="matrixBack" inputmode="url">', '', 'matrixBack')}
            </div>
            <div class="form-group">
              <div class="row"><label class="lbl" for="matrixSynthPrompt">套装描述</label><button class="link" data-ui="copy-field" data-field="matrixSynthPrompt">${icon('copy', 11)}复制</button></div>
              <textarea class="inp" id="matrixSynthPrompt" rows="5"></textarea>
            </div>
            ${fieldTpl('已穿服饰', '<div class="cfg-card" id="matrixActiveList"></div>')}
          </div>
          <div class="insp-pane" id="matrixPaneAI" hidden>
            ${visionWorkshopTpl('matrix')}
          </div>
        </div>
        <div class="insp-f">
          <button class="btn danger" id="matrixDeleteCard" data-ui="matrix-delete-outfit" disabled>${icon('trash', 14)}删除</button>
          <button class="btn solid" id="matrixSaveGallery" data-ui="matrix-save" disabled>${icon('save', 14)}保存/修改</button>
        </div>
      </aside>
    </div>

    <!-- 5. 底部状态栏 -->
    <footer class="status">
      <div class="status-l">
        <span id="statusWardrobe"></span>
        <span style="color:var(--emerald)" id="statusPoolText">● 已装备候选: USER (2件) / Char (3件)</span>
      </div>
      <div class="status-r"><span>悬浮球支持左键拖拽位置</span><span>按 Esc 关闭弹窗或面板</span></div>
    </footer>
    <p class="panel-notice" id="panelOpenNotice" role="status"></p>

    <!-- 弹窗 -->
    ${modalTpl(
      'modalMatrixNewDraft',
      '新建槽位',
      '<p class="lbl" id="matrixNewDraftPrompt">新搭配会从八个空槽位开始，当前未保存的改动会丢失。</p>',
      `<span></span>${confirmActionsTpl('确认新建', 'solid', 'plus', 'matrix-confirm-new-draft')}`,
      'sm'
    )}

    ${modalTpl(
      'modalMatrixResetDefaults',
      '恢复默认槽位',
      '<p class="lbl" id="matrixResetDefaultsPrompt">会删除额外槽位及其中的穿戴记录，并恢复八个默认槽位的名称和顺序。</p>',
      `<span></span>${confirmActionsTpl('确认恢复', 'danger-solid', '', 'matrix-confirm-defaults')}`,
      'sm'
    )}

    ${modalTpl(
      'modalMatrixSlotName',
      '添加槽位',
      `<form id="matrixSlotNameForm" novalidate>
        ${fieldTpl('槽位名称', '<input class="inp" id="matrixSlotName" required autofocus>', '', 'matrixSlotName')}
      </form>`,
      `<button class="btn danger" id="matrixRemoveSlot" data-ui="matrix-remove-slot" hidden>${icon('trash', 13)}删除槽位</button>
       <div class="action-row">${dismissBtn('取消')}<button class="btn solid" id="matrixConfirmSlotName" type="submit" form="matrixSlotNameForm">添加槽位</button></div>`,
      'sm'
    )}

    ${modalTpl(
      'modalMatrixSave',
      '保存套装卡片',
      `<form class="add-form-col" id="matrixSaveForm" novalidate>
        <p class="lbl" id="matrixSaveTitle"></p>
        ${fieldTpl('存放衣柜', '<select class="inp" id="matrixSaveWardrobe"></select>', '', 'matrixSaveWardrobe')}
      </form>`,
      `<div class="action-row">
        ${dismissBtn('取消')}
        <button class="btn solid" id="matrixUpdateCard" type="submit" form="matrixSaveForm" value="update" hidden>更新当前卡片</button>
        <button class="btn solid" id="matrixNewCard" type="submit" form="matrixSaveForm" value="new">保存为新卡片</button>
      </div>`,
      'sm'
    )}

    ${modalTpl(
      'modalSlotPicker',
      '<span id="slotPickerTitle">从衣柜选择服饰</span>',
      `<div class="picker-bar">
        <div class="search" style="max-width:240px">${icon('search', 14)}<input class="inp" id="pickerSearch" placeholder="搜索衣柜中的衣服..."></div>
        <select class="inp picker-wardrobe" id="pickerWardrobe" aria-label="筛选衣柜"></select>
        <div class="seg" id="pickerOwnerSeg">
          <button class="on" data-ui="picker-owner" data-owner="ALL">全部归属</button>
          <button data-ui="picker-owner" data-owner="USER 玩家">USER 玩家</button>
          <button data-ui="picker-owner" data-owner="Char 角色">Char 角色</button>
        </div>
      </div>
      <div class="picker-cats" id="pickerCatBar">
        <button class="tag-pill on" data-ui="picker-cat" data-cat="ALL">全部分类</button>
        ${CATEGORIES.map(c => `<button class="tag-pill" data-ui="picker-cat" data-cat="${c.name}"><i style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${c.dot};margin-right:4px"></i>${c.name}</button>`).join('')}
      </div>
      <div class="picker-grid" id="slotPickerGrid"></div>`,
      `<div class="action-row">
        ${actionBtn('slot-unequip-current', '卸下当前槽位服饰', 'danger sm', 'trash')}
        ${actionBtn('slot-to-add-new', '衣柜里没有？新建服饰', 'ghost sm', 'plus')}
      </div>
      ${dismissBtn('关闭')}`,
      'lg'
    )}

    ${modalTpl(
      'modalCatMgr',
      '风格分类管理',
      `<div class="cat-mgr-list">
        ${CATEGORIES.map((c, index) => `
          <div class="cat-mgr-row">
            <i class="cat-dot" style="background:${c.dot}"></i>
            <input class="inp" value="${c.name}">
            <span class="cat-mgr-count" id="categoryManagerCount${index}"></span>
          </div>`).join('')}
      </div>`,
      `<input class="inp" placeholder="新分类名称..." style="flex:1"><button class="btn solid" style="padding:7px 18px">新增</button>`
    )}

    ${modalTpl(
      'modalWardrobeMgr',
      '多衣柜管理',
      `<section class="form-group" aria-labelledby="wardrobeGroupsTitle">
         <div class="row"><h3 class="lbl" id="wardrobeGroupsTitle">${WARDROBE_GROUP_LABEL}</h3>${actionBtn('wardrobe-group-new', '新建组合', 'sm', 'plus')}</div>
         <form class="cfg-card wardrobe-group-editor" id="wardrobeGroupForm" novalidate hidden>
           ${fieldTpl('组合名称', '<input class="inp" id="wardrobeGroupName">', '', 'wardrobeGroupName')}
           <div class="lbl" id="wardrobeGroupMembersTitle">包含的衣柜</div>
           <div class="wardrobe-group-members" id="wardrobeGroupMembers" role="group" aria-labelledby="wardrobeGroupMembersTitle"></div>
           <div class="action-row"><button class="btn sm solid" type="submit">保存组合</button><button class="btn sm" type="button" data-ui="wardrobe-group-cancel">取消</button></div>
         </form>
         <div class="cfg-card" id="wardrobeGroupList" hidden></div>
       </section>
       <section class="form-group" aria-labelledby="wardrobeListTitle">
         <h3 class="lbl" id="wardrobeListTitle">衣柜</h3>
         <form class="action-row wardrobe-create" id="wardrobeCreateForm" novalidate><input class="inp" id="wardrobeCreateName" aria-label="新衣柜名称" placeholder="新衣柜名称"><button class="btn solid" type="submit">${icon('plus', 13)}添加衣柜</button></form>
         <div class="cfg-card" id="wardrobeList"></div>
       </section>`,
      dismissBtn('完成设置', 'solid'),
      'wardrobe-manager'
    )}

    ${modalTpl(
      'modalWardrobeDelete',
      '删除衣柜',
      `<p class="wardrobe-delete-summary" id="wardrobeDeletePrompt"></p>
       <p class="wardrobe-delete-details" id="wardrobeDeleteDetails" hidden></p>`,
      confirmActionsTpl('确认删除', 'danger-solid', 'trash', 'wardrobe-delete-confirm'),
      'sm wardrobe-delete'
    )}

    ${modalTpl(
      'modalCombine',
      '合并搭配 // 组合多件单品为套装',
      `<div class="two-col">
        ${fieldTpl('套装搭配名称', '<input class="inp" value="秋日都市通勤大衣套装">')}
        ${fieldTpl('归属对象与分类', '<select class="inp"><option>Char 角色 · 正装礼服</option><option>USER 玩家 · 日常便装</option></select>')}
      </div>
      <div class="form-group"><div class="row"><label class="lbl">勾选要合并搭配的单品（点击选择）</label><span class="dim" id="combineCount" style="font-size:11px"></span></div>
         <div class="combine-list" id="combineList"></div>
      </div>
      <div class="form-group"><div class="row"><label class="lbl">合并后的整体穿戴描述</label><button class="link">${icon('zap', 11)} AI 润色整合描述</button></div><textarea class="inp" rows="3">外穿炭黑廓形双排扣西装大衣，内搭极简白宽松亚麻衬衫，脚踏哑光黑方头切尔西踝靴，整体层次利落修长。</textarea></div>`,
      `<div class="action-row">${dismissBtn('合并并装备给 USER', 'sky sm')}${dismissBtn('合并并装备给 Char', 'emerald sm')}</div>
      ${confirmActionsTpl('保存为新搭配', 'solid', 'save')}`
    )}

    ${modalTpl(
      'modalBatchMove',
      '批量移至衣柜',
      `<form id="batchMoveForm" novalidate>${fieldTpl('目标衣柜', '<select class="inp" id="batchWardrobe"></select>', '', 'batchWardrobe')}</form>`,
      `<div class="action-row">${dismissBtn('取消')}<button class="btn solid" type="submit" form="batchMoveForm">移动服饰</button></div>`,
      'sm'
    )}

    ${modalTpl(
      'modalAddOutfit',
      '添加新服饰',
      `<form class="add-form-col" id="addOutfitForm" novalidate>
        ${fieldTpl('服饰标题', '<input id="addTitle" class="inp" autofocus>', '必填', 'addTitle')}
        ${fieldTpl('存入衣柜', '<select id="addWardrobe" class="inp"></select>', '', 'addWardrobe')}
        ${ownerCatSelectTpl('addOwner', 'addCategory')}
        ${fieldTpl('尺度分级', ratingPickerTpl('addRatingPicker'))}
        ${fieldTpl('特征标签', '<input id="addTags" class="inp" placeholder="用空格或逗号分隔">', '', 'addTags')}
        ${fieldTpl('服饰细节描述', '<textarea id="addDesc" class="inp" rows="3"></textarea>', '', 'addDesc')}
        <div class="two-col">
          ${fieldTpl('正面图片链接', '<input id="addFront" class="inp" inputmode="url">', '', 'addFront')}
          ${fieldTpl('背面图片链接', '<input id="addBack" class="inp" inputmode="url">', '', 'addBack')}
        </div>
      </form>`,
      `<div class="action-row">${dismissBtn('取消')}<button class="btn solid" type="submit" form="addOutfitForm">添加至衣柜</button></div>
      <div class="action-row">
        <button class="btn sky sm" type="submit" form="addOutfitForm" value="equippedUser">添加并装备给 USER</button>
        <button class="btn emerald sm" type="submit" form="addOutfitForm" value="equippedChar">添加并装备给 Char</button>
      </div>`,
      'lg'
    )}

    ${modalTpl(
      'modalLogs',
      '额外选衣 API 与上下文注入日志',
      `<div class="row"><div class="seg"><button class="on" data-ui="seg">全部记录 (3)</button><button data-ui="seg">候选发送</button><button data-ui="seg">AI 选衣结果</button><button data-ui="seg">主 API 注入</button></div><button class="btn sm danger">${icon('trash', 12)}清空日志</button></div>
       <div class="log-list">
         ${logRowTpl('inj', '主 API 注入', '2026-11-15 14:02:13', '注入深度: 1 · 角色: system',
           '已将额外 API 选定的 <b>USER 服饰 (#WD-003)</b> 与 <b>Char 服饰 (#WD-001)</b> 组装并注入主回复 API 上下文。')}
         ${logRowTpl('pick', 'AI 选衣结果', '2026-11-15 14:02:12', '耗时: 1.1s',
           '额外 API 返回选衣决策：为 USER 选定「<b>极简白宽松亚麻衬衫</b>」，为 Char 选定「<b>炭黑廓形双排扣西装大衣</b>」。')}
         ${logRowTpl('req', '候选发送', '2026-11-15 14:02:11', '候选数: USER 2件 / Char 3件',
           '已向额外选衣 API 发送已装备的候选衣服列表及最近 3 条聊天上下文。')}
       </div>`,
      `<span class="dim" style="font-size:11px">仅保留最近 50 条选衣与注入通信记录</span>${dismissBtn('关闭')}`,
      'lg'
    )}

    ${modalTpl(
      'modalSettings',
      '衣柜全局设置中心',
      `<div class="settings-layout">
        <nav class="settings-nav">
          ${tabsTpl(SETTINGS_TABS, 's-tab', 'cfg-tab')}
        </nav>

        <div class="settings-pane" id="paneDisplay">
          <div class="cfg-card">
            <div class="cfg-card-title">画廊与隐私显示</div>
            ${cfgRowTpl('默认高斯模糊 R-18 缩略图', '', switchTpl('toggle-blur-r18', true, '', 'blurR18', '模糊 R-18 缩略图'))}
            ${cfgRowTpl('卡片显示特征标签', '', switchTpl('toggle-show-tags', true, '', 'showTags', '显示特征标签'))}
          </div>
        </div>

        ${settingsGroupTpl('paneApi', '额外选衣 API 配置', `
          ${cfgRowTpl('启用额外 API 自动选衣', '每次发送消息前自动挑选最贴合剧情的衣服', switchTpl('switch', true, '', 'autoSelect', '启用额外 API 自动选衣'))}
          ${cfgRowTpl('接口地址', '', '<input class="inp mono" data-setting="apiUrl" aria-label="接口地址" value="https://api.openai.com/v1" style="width:240px">')}
          ${cfgRowTpl('接口密钥', '仅在当前页面保留', '<input class="inp mono" type="password" aria-label="接口密钥" style="width:240px">')}
          ${cfgRowTpl('选衣模型名称', '', '<input class="inp mono" data-setting="apiModel" aria-label="选衣模型名称" value="gpt-4o-mini" style="width:240px">')}
        `, '将已装备给 USER 和 Char 的候选服饰发送给额外 API，由 AI 选定后注入主 API。')}

        ${settingsGroupTpl('paneInject', '主 API 上下文注入规则', `
          ${cfgRowTpl('注入位置深度', '距聊天末尾第几条消息处注入，0 为最底部', '<input class="inp mono" id="injectDepth" inputmode="numeric" data-setting="injectDepth" aria-label="注入位置深度" value="1" style="width:72px;text-align:center">')}
          ${cfgRowTpl('注入消息角色', '推荐使用 system 角色', '<select class="inp" data-setting="injectRole" aria-label="注入消息角色" style="width:140px"><option>system</option><option>user</option></select>')}
        `)}

        ${settingsGroupTpl('paneAI', 'AI 正背面识图与描述生成',
          cfgRowTpl('同时发送正面图与背面图', '一并发送给多模态模型以防漏写后背细节', switchTpl('switch', true, '', 'dualVision', '同时发送正面图与背面图'))
        )}

        ${settingsGroupTpl('paneData', '衣柜存储状态', `
          ${cfgRowTpl('已建衣柜总数', '', '<span class="mono" id="storedWardrobeCount"></span>')}
          ${cfgRowTpl('服饰数量', '', '<span class="mono" id="storedItemCount"></span>')}
        `)}
      </div>`,
      `<span></span>${confirmActionsTpl('保存设置', 'solid', 'save', 'save-settings')}`,
      'lg'
    )}

    ${modalTpl(
      'modalIO',
      '导入 / 导出衣柜数据包',
      `${ioBoxTpl('导出当前衣柜', '打包导出全部分类、单品、世界书绑定与预设套装，或直接导出为酒馆世界书 JSON 及含本地图片的 ZIP 压缩包。',
        'download', ['导出衣柜 JSON', '导出为酒馆世界书', '导出为 ZIP 压缩包'])}
      ${ioBoxTpl('导入衣柜数据包', '从本地文件恢复或合并衣柜 JSON、解析导入酒馆世界书词条，或直接导入打包好的 ZIP 服饰压缩包。',
        'upload', ['导入衣柜 JSON', '导入酒馆世界书', '导入 ZIP 压缩包'])}`
    )}

    ${modalTpl(
      'modalLightbox',
      '<span id="lbTitle">炭黑廓形双排扣西装大衣 · 正背面视图对照</span>',
      `<div class="lb-dual">
        <div class="lb-card"><span class="badge">正面视图</span><img id="lbImgFront" src="${placeholder('WD-001', '正面视图')}" alt=""></div>
        <div class="lb-card"><span class="badge">背面视图</span><img id="lbImgBack" src="${placeholder('WD-001', '背面视图')}" alt=""></div>
      </div>`
    )}

    ${modalTpl(
      'modalConfirm',
      '确认删除',
      '<p id="deletePrompt" style="font-size:12.5px;color:var(--z300)"></p>',
      `<span></span>${confirmActionsTpl('确认删除', 'danger-solid', '', 'delete-items')}`,
      'sm'
    )}

  </dialog>
</div>`;
