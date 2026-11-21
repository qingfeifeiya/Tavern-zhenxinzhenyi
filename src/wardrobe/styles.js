
  // 样式
  const CSS = `
:host{all:initial}
*{box-sizing:border-box;margin:0;padding:0;-webkit-font-smoothing:antialiased}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:inherit}
input,select,textarea{font:inherit;color:inherit}
[hidden]{display:none!important}
:is(button,summary):focus-visible{outline:2px solid #38bdf8;outline-offset:-2px}
*{scrollbar-width:thin;scrollbar-color:#27272a transparent}

/* 悬浮球 */
.fab-wrap{--z950:#09090b;--z800:#1e1e26;--z700:#292933;--z400:#a1a1aa;--z100:#f4f4f5;--emerald:#34d399;--sans:Inter,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;position:fixed;left:18px;bottom:120px;z-index:99980;font:12px/1.4 var(--sans);color:var(--z100);user-select:none;touch-action:none}
.fab-ball{position:relative;display:grid;place-items:center;width:44px;height:44px;border-radius:14px;background:rgba(15,15,20,.92);border:1px solid var(--z700);color:var(--z100);box-shadow:0 10px 28px rgba(0,0,0,.65);cursor:grab;transition:border-color .15s,transform .12s;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.fab-ball:hover{border-color:#52525b;transform:scale(1.04)}
.fab-dot{position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:var(--emerald);box-shadow:0 0 8px var(--emerald)}
.fab-dot.off{background:#71717a;box-shadow:none}
.fab-menu{position:absolute;left:54px;bottom:0;width:186px;padding:6px;border-radius:11px;background:rgba(15,15,20,.96);border:1px solid var(--z700);box-shadow:0 16px 40px rgba(0,0,0,.75);display:flex;flex-direction:column;gap:4px;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.fab-wrap.right-side .fab-menu{left:auto;right:54px}
.fab-item{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:8px 10px;border-radius:7px;font-size:12px;color:#e4e4e7}
.fab-item:hover{background:var(--z800);color:#fff}
.fab-item-l{display:flex;align-items:center;gap:8px}
.fab-error{padding:4px 10px;color:var(--z400);font-size:11px}
.fab-badge{padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;background:rgba(52,211,153,.16);color:var(--emerald)}
.fab-badge.off{background:rgba(255,255,255,.08);color:var(--z400)}

.overlay{
  --z950:#09090b;--z925:#0c0c10;--z900:#121217;--z850:#17171e;--z800:#1e1e26;--z700:#292933;--z600:#3f3f4e;
  --z500:#71717a;--z400:#a1a1aa;--z300:#d4d4d8;--z200:#e4e4e7;--z100:#f4f4f5;--z50:#fafafa;
  --line:#1f1f27;--emerald:#34d399;--sky:#38bdf8;--amber:#fbbf24;--rose:#fb7185;
  --sans:Inter,-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
  --mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  position:fixed;inset:0;z-index:99990;display:grid;background:rgba(0,0,0,.76);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font:13px/1.5 var(--sans);color:var(--z100);color-scheme:dark;
}
.mono{font-family:var(--mono)}
.dim{color:var(--z500)}
.panel{position:fixed;inset:0;display:flex;flex-direction:column;width:100%;max-width:none;height:100dvh;max-height:none;border:0;background:var(--z950);color:inherit;overflow:hidden}
.panel:not([open]),.backdrop:not([open]){display:none}
.panel::backdrop{background:var(--z950)}
/* 提示在原生面板内浮于状态栏上方，避免被模态层挡住，也不拦截面板内的点击。 */
.panel-notice{position:absolute;left:50%;bottom:36px;z-index:3;translate:-50% 0;max-width:calc(100% - 32px);pointer-events:none}
.panel-notice:not(:empty){padding:7px 12px;border:1px solid var(--z700);border-radius:8px;background:var(--z900);color:var(--z100)}

/* 基础控件 */
.inp{width:100%;padding:7px 11px;font-size:12px;border-radius:7px;background:var(--z900);border:1px solid var(--z700);color:var(--z100);outline:0;transition:border-color .15s,background .15s}
.inp::placeholder{color:var(--z500)}
.inp:hover{border-color:var(--z600)}
.inp:focus{border-color:var(--z400);background:var(--z950)}
textarea.inp{resize:vertical;line-height:1.6;padding:9px 12px}
select.inp{-webkit-appearance:none;appearance:none;padding-right:28px;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 9px center}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 12px;border-radius:7px;font-size:12px;font-weight:500;white-space:nowrap;background:var(--z900);border:1px solid var(--z700);color:var(--z200);transition:all .15s}
.btn:hover{background:var(--z800);border-color:var(--z600);color:var(--z50)}
.btn.on{background:var(--z800);border-color:var(--z300);color:var(--z50)}
.btn.solid{background:var(--z100);border-color:transparent;color:var(--z950);font-weight:600}
.btn.solid:hover{background:#fff}
.btn.emerald{background:rgba(52,211,153,.13);border-color:rgba(52,211,153,.38);color:var(--emerald)}
.btn.sky{background:rgba(56,189,248,.13);border-color:rgba(56,189,248,.38);color:var(--sky)}
.btn.ghost{background:transparent;border-color:transparent;color:var(--z400)}
.btn.ghost:hover{background:var(--z900);color:var(--z100)}
.btn.danger:hover,.btn.danger-solid{background:rgba(251,113,133,.15);border-color:rgba(251,113,133,.4);color:var(--rose)}
.btn.danger-solid{background:#e11d48;border-color:transparent;color:#fff}
.btn.sm{padding:4px 9px;font-size:11px;border-radius:6px}
:is(.top-r,.toolbar-r,.gallery-management) :is(.btn,.icon-btn):disabled{opacity:.45;cursor:default;pointer-events:none}
.action-row{display:flex;gap:8px}
.inline-entry{display:flex;gap:6px;margin-top:4px}
.inline-entry .inp{padding:5px 9px;font-size:11px}
.icon-btn{display:grid;place-items:center;width:30px;height:30px;border-radius:7px;color:var(--z400);border:1px solid transparent;transition:all .15s;flex:none}
.icon-btn:hover{background:var(--z900);border-color:var(--line);color:var(--z100)}
.icon-btn.sm{width:24px;height:24px;border-radius:5px}
.badge{display:inline-flex;align-items:center;gap:5px;padding:2px 7px;border-radius:5px;font:11px var(--mono);background:var(--z900);color:var(--z400);border:1px solid var(--line)}
.pill{display:inline-flex;align-items:center;gap:5px;padding:2px 7px;border-radius:5px;font:500 10px/1.5 var(--mono);color:var(--z100);background:rgba(9,9,11,.82);border:1px solid rgba(255,255,255,.12);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.pill i,.seg i{width:6px;height:6px;border-radius:50%}

/* 顶栏 */
.top{position:relative;display:flex;align-items:center;justify-content:space-between;gap:14px;height:54px;padding:0 16px;border-bottom:1px solid var(--line);background:var(--z950);flex:none}
.top-l,.top-r{display:flex;align-items:center;gap:8px;z-index:2}
.brand{display:flex;align-items:center;gap:8px}
.logo{display:grid;place-items:center;width:28px;height:28px;border-radius:7px;background:var(--z900);border:1px solid var(--z700);color:var(--z100)}
.brand h1{font-size:13.5px;font-weight:600;white-space:nowrap}
.wb-switcher{display:flex;align-items:center;gap:6px;padding-left:8px;border-left:1px solid var(--line)}
.wb-controls{display:flex;align-items:center;gap:6px;min-width:0}
.wb-select{width:auto;min-width:142px;max-width:100%;padding:5px 26px 5px 9px;font-size:12px;font-weight:500;text-overflow:ellipsis}

.ws-tabs{display:inline-flex;align-items:center;gap:2px;padding:3px;border-radius:9px;background:#0d0d12;border:1px solid var(--z700)}
.ws-tab{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:12px;color:var(--z400);transition:all .15s;white-space:nowrap}
.ws-tab:hover{color:var(--z200)}
.ws-tab em,.owner-btn em{font:600 11px var(--mono);color:var(--z500)}
.ws-tab.on{background:#1c1d24;color:var(--z50);font-weight:500;box-shadow:0 1px 3px rgba(0,0,0,.4)}
.ws-tab.on em,.owner-btn.on em{color:var(--emerald)}

.api-pool-dock{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:1;
  display:flex;align-items:center;gap:12px;padding:5px 14px;border-radius:9px;
  background:var(--z900);border:1px solid var(--z700);white-space:nowrap;
}
.pool-tag{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--z300)}
.pool-tag b{font-family:var(--mono);padding:1px 6px;border-radius:4px;font-size:11px}
.pool-tag b.user{background:rgba(56,189,248,.15);color:var(--sky);border:1px solid rgba(56,189,248,.3)}
.pool-tag b.char{background:rgba(52,211,153,.15);color:var(--emerald);border:1px solid rgba(52,211,153,.3)}

/* 三栏主工作区 */
.cols{display:grid;grid-template-columns:280px minmax(0,1fr) 440px;flex:1;min-height:0}
.side{display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--line);background:var(--z950);user-select:none}
.side-sec{padding:12px 12px 8px}
.side-sec + .side-sec{border-top:1px solid var(--line)}
.owner-switch{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:3px;border-radius:10px;background:#0d0d12;border:1px solid var(--z700)}
.owner-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 8px;border-radius:7px;font-size:12px;color:var(--z400);white-space:nowrap;transition:all .15s}
.owner-btn b{font-weight:600}
.owner-btn.on{background:#1c1d24;color:var(--z50)}

.side-h{display:flex;align-items:center;justify-content:space-between;padding:0 6px 6px;font-size:11px;font-weight:600;color:var(--z500)}
.side-h-l{display:inline-flex;align-items:center;gap:6px}
.sec-dot{width:6px;height:6px;border-radius:50%;background:var(--z600)}
.cat-dot{width:9px;height:9px;border-radius:3.5px;flex:none}

.nav-list{display:flex;flex-direction:column;gap:2px}
.nav{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:6px 10px;border-radius:7px;font-size:12px;color:var(--z400);transition:all .12s}
.nav:hover{background:var(--z900);color:var(--z200)}
.nav.on{background:var(--z800);color:var(--z50);font-weight:500}
.nav-l{display:flex;align-items:center;gap:9px;min-width:0}
.nav-l span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nav em{font:11px var(--mono);color:var(--z500)}
.matrix-outfit-row{display:flex;align-items:center;gap:4px}
.matrix-outfit-row .nav{flex:1;min-width:0}
.matrix-outfit-row .icon-btn{flex:none;color:var(--z400)}
.matrix-outfit-row .icon-btn:hover{color:var(--rose)}

/* 中栏：单品画廊 */
.mid{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--z925)}
.toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line);background:var(--z950)}
.search{position:relative;flex:1;min-width:200px;max-width:320px}
.search svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--z500);pointer-events:none}
.search .inp{padding-left:32px;padding-right:42px}
.search kbd{position:absolute;right:8px;top:50%;transform:translateY(-50%);padding:1px 5px;border-radius:4px;background:var(--z800);border:1px solid var(--z700);font:10px var(--mono);color:var(--z400)}
.toolbar-r{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.seg{display:inline-flex;align-items:center;padding:2px;border-radius:8px;background:var(--z900);border:1px solid var(--line);font-size:11px}
.seg button{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;color:var(--z400)}
.seg button.on{background:var(--z700);color:var(--z50);font-weight:500}

.subbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:8px 16px;border-bottom:1px solid var(--line);background:rgba(12,12,16,.75);font-size:11px;color:var(--z500)}
.subbar-l{display:flex;align-items:center;gap:8px;flex:1 1 180px;min-width:0}
.subbar-l b{color:var(--z200);font-weight:600;white-space:nowrap}
.subbar-r,.gallery-management{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.subbar-r{min-width:0}
.subbar-tags{display:flex;align-items:center;gap:5px;overflow-x:auto;flex:1;min-width:0;padding:2px 0}
.tag-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 9px;border-radius:999px;font-size:11px;white-space:nowrap;background:var(--z900);border:1px solid var(--line);color:var(--z400)}
.tag-pill.on{background:var(--z100);border-color:var(--z100);color:var(--z950);font-weight:500}

.gwrap{flex:1;overflow-y:auto;padding:14px 16px 20px;display:flex;flex-direction:column;gap:12px}
.gwrap-bar{position:sticky;top:0;z-index:10;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;border-radius:9px;background:rgba(18,18,23,.95);border:1px solid var(--emerald);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.gwrap-bar-l,.gwrap-bar-r{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.batch-stat{font-size:11.5px;color:var(--z200)}
.batch-stat b{color:var(--emerald);font-family:var(--mono)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(178px,1fr));gap:14px}

.card-add{display:flex;flex-direction:column;justify-content:space-between;border-radius:10px;border:1.5px dashed var(--z700);background:linear-gradient(180deg,rgba(24,24,31,.55),rgba(14,14,19,.8));color:var(--z400);transition:all .16s;overflow:hidden;cursor:pointer}
.card-add:hover{border-color:var(--z400);background:var(--z900);color:var(--z100);transform:translateY(-2px)}
.card-add-body{aspect-ratio:3/4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:18px;text-align:center}
.card-add-ic{display:grid;place-items:center;width:48px;height:48px;border-radius:12px;background:var(--z900);border:1px solid var(--z700);color:var(--z200)}
.card-add:hover .card-add-ic{background:var(--z100);color:var(--z950)}
.card-add-title{font-size:13px;font-weight:600;color:var(--z100)}

/* 隔离卡片内部的布局和样式更新，卡片外部仍按内容自动定高。 */
.card{position:relative;contain:layout style;display:flex;flex-direction:column;border-radius:10px;overflow:hidden;background:var(--z900);border:1px solid var(--line);transition:transform .15s,border-color .15s;cursor:pointer}
.card:hover{border-color:var(--z600);transform:translateY(-2px)}
.card.on{border-color:var(--z100);box-shadow:0 0 0 1px var(--z100)}
.card.batch-checked{border-color:var(--emerald);box-shadow:0 0 0 1.5px var(--emerald)}
/* 缩略图区域由比例或列表固定尺寸撑开，跳过离屏内容的布局与绘制时仍保留原尺寸。 */
.thumb,.p-thumb{content-visibility:auto}
.thumb{position:relative;aspect-ratio:3/4;background:var(--z950);overflow:hidden}
.thumb img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .3s,filter .25s}
.card:hover .thumb img{transform:scale(1.03)}

.gwrap.blur-r18 .card[data-rating="R-18"] .thumb img{filter:blur(14px) brightness(.85)}
.gwrap.blur-r18 .card[data-rating="R-18"]:hover .thumb img{filter:blur(0)}
.gwrap.hide-tags .cmeta-tags{display:none}

.card-top{position:absolute;top:8px;left:8px;right:8px;display:flex;justify-content:space-between;align-items:flex-start;z-index:2;pointer-events:none}
.card-top-l{display:flex;flex-direction:column;gap:4px;align-items:flex-start;pointer-events:auto}
.eq-status{padding:2px 7px;border-radius:5px;font:700 10px/1.4 var(--sans);box-shadow:0 2px 8px rgba(0,0,0,.4)}
.eq-status.user{background:var(--sky);color:var(--z950)}
.eq-status.char{background:var(--emerald);color:var(--z950)}
.card-check{display:none;place-items:center;width:24px;height:24px;border-radius:6px;background:rgba(9,9,11,.85);border:1.5px solid rgba(255,255,255,.35);color:transparent}
.gwrap.batch-mode .card-check{display:grid}
.gwrap.batch-mode .eq-status{display:none}
.card.batch-checked .card-check{background:var(--emerald);border-color:var(--emerald);color:var(--z950)}
.card-top-r{display:flex;align-items:center;gap:5px;pointer-events:auto}
.fav-top-btn{display:grid;place-items:center;width:26px;height:26px;border-radius:6px;background:rgba(9,9,11,.82);border:1px solid rgba(255,255,255,.14);color:var(--z400)}
.fav-top-btn.fav{color:var(--amber);border-color:rgba(251,191,36,.45);background:rgba(251,191,36,.12)}
.fav-top-btn.fav svg{fill:var(--amber)}

.card-hover{position:absolute;inset:auto 8px 8px 8px;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:5px;border-radius:8px;background:rgba(9,9,11,.9);border:1px solid rgba(255,255,255,.14);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);opacity:0;transform:translateY(6px);transition:all .16s;z-index:2}
.card:hover .card-hover{opacity:1;transform:none}
.card:focus-within .card-hover{opacity:1;transform:none}
.card-hover .act-eq{display:flex;align-items:center;justify-content:center;gap:4px;padding:6px 4px;border-radius:5px;background:var(--z800);color:var(--z200);font-size:11px;font-weight:600;border:1px solid var(--z700)}
.card-hover .act-eq.on-user{background:rgba(56,189,248,.2);border-color:var(--sky);color:var(--sky)}
.card-hover .act-eq.on-char{background:rgba(52,211,153,.2);border-color:var(--emerald);color:var(--emerald)}

.cmeta{display:flex;flex-direction:column;gap:6px;padding:10px 11px;background:var(--z950);border-top:1px solid var(--line)}
.cmeta-t{font-size:12.5px;font-weight:500;color:var(--z100);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cmeta-tags{display:flex;gap:4px;overflow:hidden;white-space:nowrap}
.mini-tag{padding:1px 5px;border-radius:4px;font-size:10px;background:var(--z900);color:var(--z400);border:1px solid var(--line)}
.cmeta-f{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--z500)}

/* 列表布局与网格共用卡片节点。 */
.grid.list{grid-template-columns:1fr;gap:8px}
.grid.list .card-add{flex-direction:row;align-items:center;padding:10px 14px}
.grid.list .card-add-body{aspect-ratio:auto;flex-direction:row;padding:0;gap:12px;text-align:left}
.grid.list .card-add-ic{width:36px;height:36px}
.grid.list .card-top,.grid.list .card-hover{display:none}
.grid.list .card{flex-direction:row;align-items:center;padding:8px 12px;gap:14px}
.grid.list .thumb{width:48px;height:64px;aspect-ratio:auto;border-radius:6px;flex:none}
.grid.list .cmeta{flex:1;min-width:0;border-top:0;padding:0;background:none;flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:space-between}
.gwrap.batch-mode .grid.list .card{padding-left:42px}
.gwrap.batch-mode .grid.list .card-top{display:flex;inset:8px auto auto 8px}
.gwrap.batch-mode .grid.list .card-top-r{display:none}

/* 右栏属性面板 */
.insp{display:flex;flex-direction:column;min-height:0;border-left:1px solid var(--line);background:var(--z950)}
.insp-h{display:flex;align-items:center;justify-content:space-between;gap:8px;height:46px;padding:0 16px;border-bottom:1px solid var(--line);flex:none}
.insp-h-l,.insp-h-r,.insp-f-r{display:flex;align-items:center;gap:8px}
.insp-h .back{display:none}
.unsaved-dot{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--amber)}
.unsaved-dot::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--amber)}
.insp-b{flex:1;overflow-y:auto;padding:14px 16px 18px;display:flex;flex-direction:column;gap:14px}

.insp-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border-radius:10px;background:#0d0d12;border:1px solid var(--z700);flex:none}
.insp-tab{padding:7px 6px;border-radius:7px;font-size:12px;font-weight:500;color:var(--z400);text-align:center;white-space:nowrap;transition:all .15s}
.insp-tab:hover{color:var(--z200)}
.insp-tab.on{background:#1c1d24;color:var(--z50);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.45)}
.insp-pane{display:flex;flex-direction:column;gap:15px}

.hero-media{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:10px;border-radius:10px;background:var(--z900);border:1px solid var(--line)}
.media-slot{display:flex;flex-direction:column;gap:7px;padding:8px;border-radius:8px;background:var(--z950);border:1px solid var(--line)}
.slot-head{display:flex;align-items:center;justify-content:space-between;font-size:11px}
.slot-head b{font-weight:600;color:var(--z200)}
.slot-thumb{position:relative;aspect-ratio:3/4;border-radius:6px;overflow:hidden;background:var(--z900);border:1px solid var(--z700);cursor:zoom-in}
.slot-thumb img,.m-slot-body img,.p-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.slot-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(9,9,11,.65);opacity:0;transition:opacity .15s}
.slot-thumb:hover .slot-overlay{opacity:1}
.slot-url{font-size:11px;padding:5px 8px}
.hero-media-note{grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:6px;padding:5px 8px;border-radius:6px;background:rgba(9,9,11,.6);border:1px dashed var(--z700);font-size:11px;color:var(--z400);text-align:center}

.form-group{display:flex;flex-direction:column;gap:6px;min-width:0}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.lbl{font-size:12px;font-weight:500;color:var(--z300)}
.rating-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.rp-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 8px;border-radius:7px;font:500 11px var(--mono);background:var(--z900);border:1px solid var(--z700);color:var(--z400)}
.rp-btn i{width:7px;height:7px;border-radius:50%}
.rp-btn.on{background:var(--z800);border-color:var(--z200);color:var(--z50)}

.chips{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:7px;border-radius:7px;background:var(--z900);border:1px solid var(--z700)}
.chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:5px;font-size:11px;background:var(--z800);color:var(--z200);border:1px solid var(--z700)}
.chip.all-chip{background:rgba(52,211,153,.12);border-color:rgba(52,211,153,.35);color:var(--emerald);font-weight:500}
.chip button{color:var(--z500);display:grid;place-items:center}
.chip button:hover{color:var(--z100)}
.chip-add{padding:2px 7px;border-radius:5px;font-size:11px;color:var(--z400);border:1px dashed var(--z700)}
.chip-add:hover{color:var(--z100);border-color:var(--z500)}

.ai-card{display:flex;flex-direction:column;gap:12px;padding:14px;border-radius:11px;background:#0e0e13;border:1px solid var(--z700)}
.ai-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.ai-title{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:var(--z100)}
.ai-vision-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:10px;border-top:1px solid var(--line);font-size:12px;color:var(--z400)}
.ai-rr{display:grid;grid-template-columns:92px 1fr;gap:8px}
.link{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--z400)}
.link:hover{color:var(--z50);text-decoration:underline}

.insp-f{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px;border-top:1px solid var(--line);background:var(--z950);flex:none}

/* 穿戴矩阵与套装预览 */
.matrix-mid{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:18px;background:var(--z925)}
.matrix-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
.matrix-head h2{font-size:15px;font-weight:600;color:var(--z100)}
.matrix-head .action-row{flex-wrap:wrap}
.matrix-jump{display:none}
.matrix-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.m-slot{display:flex;flex-direction:column;border-radius:10px;padding:10px;background:var(--z950);border:1px solid var(--line);cursor:pointer;transition:border-color .15s,transform .15s;position:relative}
.m-slot:hover{border-color:var(--z400);transform:translateY(-2px)}
.m-slot.active{border-color:rgba(52,211,153,.45)}
.m-slot-top{display:flex;align-items:center;justify-content:space-between;gap:6px;font:11px var(--mono);color:var(--z400);margin-bottom:8px}
.m-slot-top span{min-width:0;overflow-wrap:anywhere}
.m-slot-top button{flex:none}
.m-slot-body{aspect-ratio:3/4;border-radius:7px;background:var(--z900);border:1px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--z400);position:relative;overflow:hidden}
.m-slot.empty .m-slot-body{border-style:dashed;background:rgba(15,15,20,.5)}
.m-slot-hover{position:absolute;inset:0;background:rgba(9,9,11,.74);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;opacity:0;transition:opacity .15s;-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
.m-slot:is(:hover,:focus-within) .m-slot-hover{opacity:1}
.m-slot-foot{margin-top:9px;font-size:12px;font-weight:500;color:var(--z200);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.m-slot.empty .m-slot-foot{color:var(--z600)}
#matrixActiveList b,#matrixActiveList small{overflow-wrap:anywhere}
#matrixActiveList .cfg-row>div{min-width:0}
#wsMatrix .btn:disabled{opacity:.45;cursor:default}

/* 槽位选衣弹窗 */
.picker-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding-bottom:10px;border-bottom:1px solid var(--line)}
.picker-wardrobe{flex:0 1 180px;min-width:130px}
.picker-cats{display:flex;align-items:center;gap:6px;overflow-x:auto;padding:2px 0}
.picker-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(152px,1fr));gap:12px;max-height:52dvh;overflow-y:auto;padding:4px 2px}
.p-card{display:flex;flex-direction:column;border-radius:9px;overflow:hidden;background:var(--z900);border:1px solid var(--line);cursor:pointer;transition:all .15s;position:relative}
.p-card:hover{border-color:var(--z300);transform:translateY(-2px)}
.p-card.equipped{border-color:var(--emerald);box-shadow:0 0 0 1.5px var(--emerald)}
.p-thumb{position:relative;aspect-ratio:3/4;background:var(--z950)}
.p-badge{position:absolute;top:7px;left:7px;padding:2px 6px;border-radius:4px;background:var(--emerald);color:var(--z950);font:700 10px var(--sans)}
.p-meta{padding:8px 10px;display:flex;flex-direction:column;gap:4px;background:var(--z950);border-top:1px solid var(--line)}
.p-meta b{font-size:12px;font-weight:500;color:var(--z100);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.p-meta small{font-size:11px;color:var(--z500);display:flex;justify-content:space-between}
.p-wardrobe{font-size:11px;color:var(--z400);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* 风格分类管理与导入导出 */
.cat-mgr-list{display:flex;flex-direction:column;gap:10px;max-height:52dvh;overflow-y:auto;padding:4px 2px}
.cat-mgr-row{display:flex;align-items:center;gap:12px}
.cat-mgr-row .cat-dot{width:10px;height:10px;border-radius:50%}
.cat-mgr-row .inp{flex:1;padding:8px 12px;background:var(--z950)}
.cat-mgr-count{width:46px;text-align:right;font:12px var(--mono);color:var(--z400);flex:none}

.io-box{padding:18px;border-radius:11px;background:#0e0e13;border:1px solid var(--z700);display:flex;flex-direction:column;gap:10px}
.io-box h3{font-size:14px;font-weight:600;color:var(--z50)}
.io-box p{font-size:12px;line-height:1.5;color:var(--z400)}
.io-acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:4px}

/* 弹窗与设置通用样式 */
.status{display:flex;align-items:center;justify-content:space-between;height:28px;padding:0 16px;border-top:1px solid var(--line);background:var(--z950);font-size:11px;color:var(--z500);flex:none}
.status-l,.status-r{display:flex;align-items:center;gap:16px}
.backdrop{position:fixed;inset:0;display:grid;place-items:center;width:100%;height:100%;max-width:none;max-height:none;padding:16px;border:0;background:rgba(0,0,0,.74);color:inherit;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.modal{width:min(580px,100%);border-radius:12px;overflow:hidden;background:var(--z950);border:1px solid var(--z700);box-shadow:0 24px 64px rgba(0,0,0,.78);display:flex;flex-direction:column}
.modal.sm{width:min(420px,100%);max-height:calc(100dvh - 32px)}
.modal.lg{width:min(820px,96vw);max-height:88dvh}
.modal-h{display:flex;align-items:center;justify-content:space-between;height:48px;padding:0 16px;border-bottom:1px solid var(--line);flex:none}
.modal-b{padding:16px;display:flex;flex-direction:column;gap:14px;overflow-y:auto}
.modal-f{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px;border-top:1px solid var(--line);background:var(--z925);flex:none}
/* 气泡在滚动区外定位，字段错误就近显示，整项操作的结果显示在底栏上方。 */
.modal-toast-slot{position:relative;z-index:1;flex:none}
.modal-toast{position:absolute;bottom:10px;left:50%;translate:-50% 0;display:flex;align-items:center;gap:8px;width:max-content;max-width:min(390px,calc(100% - 20px));padding:7px 9px;border:1px solid var(--z700);border-radius:9px;background:var(--z900);box-shadow:0 6px 20px rgba(0,0,0,.55)}
.modal-toast:not([data-kind]),.modal-toast[data-offscreen]{opacity:0;pointer-events:none}
.toast-icon,.modal-toast .toast-dismiss{display:none}
.toast-icon{flex:none;place-items:center;width:28px;height:28px;border-radius:8px}
.modal-toast[data-kind="error"] .toast-error{display:grid;width:20px;height:20px;border-radius:50%;background:#be123c;color:#fff}
.modal-toast[data-kind="error"]:not([data-anchored]) .toast-dismiss{display:grid}
.modal-toast[data-anchored]{top:var(--toast-top);bottom:auto;left:var(--toast-left);translate:none;pointer-events:none}
.modal-toast[data-anchored]::before{content:"";position:absolute;top:-6px;left:var(--toast-arrow);width:10px;height:6px;background:var(--z300);clip-path:polygon(50% 0,100% 100%,0 100%)}
.modal-toast[data-above]::before{top:auto;bottom:-6px;transform:rotate(180deg)}
.modal-toast[data-kind="success"]{pointer-events:none}
.modal-toast[data-kind="success"] .toast-success{display:grid;background:rgba(52,211,153,.12);color:var(--emerald)}
.toast-copy{min-width:0;overflow-wrap:anywhere;font-weight:500}
.inp[aria-invalid="true"],.wardrobe-group-member:has(input[aria-invalid="true"]){border-color:var(--rose);box-shadow:0 0 0 2px rgba(251,113,133,.2)}
@media (prefers-reduced-motion:no-preference){
  .modal-toast[data-kind]{animation:modal-toast-in .16s ease-out}
  @keyframes modal-toast-in{from{opacity:0;transform:translateY(-6px)}}
}
.add-form-col{display:flex;flex-direction:column;gap:12px}
.combine-list{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:220px;overflow-y:auto;padding:4px}
.combine-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;background:var(--z900);border:1px solid var(--line);cursor:pointer}
.combine-item.on{border-color:var(--emerald);background:rgba(52,211,153,.08)}
.combine-item img{width:32px;height:42px;border-radius:4px;object-fit:cover}
.combine-item-info{min-width:0;flex:1}
.combine-item-info b{display:block;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.combine-item-info small{font-size:11px;color:var(--z500)}
.log-list{display:flex;flex-direction:column;gap:8px;max-height:56dvh;overflow-y:auto}
.log-item{display:flex;flex-direction:column;gap:5px;padding:10px 12px;border-radius:8px;background:var(--z900);border:1px solid var(--line);font-size:12px}
.log-head{display:flex;align-items:center;justify-content:space-between;font:11px var(--mono);color:var(--z400)}
.log-tag{padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600}
.log-tag.req{background:rgba(56,189,248,.15);color:var(--sky)}
.log-tag.pick{background:rgba(52,211,153,.15);color:var(--emerald)}
.log-tag.inj{background:rgba(251,191,36,.15);color:var(--amber)}
.settings-layout{display:grid;grid-template-columns:210px 1fr;flex:1;min-height:420px;max-height:70dvh}
.settings-nav{padding:12px 10px;border-right:1px solid var(--line);background:var(--z925);display:flex;flex-direction:column;gap:4px}
.s-tab{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border-radius:7px;font-size:12px;color:var(--z400)}
.s-tab.on{background:var(--z800);color:var(--z50);font-weight:500}
.settings-pane{padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:16px}
.cfg-group{display:flex;flex-direction:column;gap:8px}
.cfg-group h3{font-size:13px;font-weight:600}
.cfg-group p{font-size:11px;color:var(--z500)}
.cfg-card{border-radius:10px;background:#0e0e13;border:1px solid var(--z700);overflow:hidden}
.cfg-card-title{padding:14px 16px 4px;font-size:13px;font-weight:600;color:var(--z100)}
.cfg-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 16px}
.cfg-row + .cfg-row{border-top:1px solid var(--line)}
.cfg-row b{display:block;font-size:12.5px;font-weight:500;color:var(--z200)}
.cfg-row small{display:block;margin-top:2px;font-size:11px;color:var(--z500)}
.wardrobe-row .wardrobe-label{min-width:0;flex:1;overflow-wrap:anywhere}
.wardrobe-actions{align-items:center;flex-wrap:wrap}
.wardrobe-actions button,.wardrobe-create button,.wardrobe-rename button{white-space:nowrap}
.wardrobe-create input,.wardrobe-rename input{min-width:0}
.modal.wardrobe-manager{width:min(700px,100%);max-height:88dvh}
.wardrobe-manager .modal-f{justify-content:flex-end}
.wardrobe-manager .modal-b{gap:18px}
.wardrobe-group-editor{display:flex;flex-direction:column;gap:6px;padding:12px}
/* 确认框叠在管理窗口上时保留列表轮廓，方便定位刚才操作的位置。 */
#modalWardrobeDelete{background:rgba(0,0,0,.52);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}
.wardrobe-delete .modal-b{gap:6px;overflow-wrap:anywhere}
.wardrobe-delete .modal-f{justify-content:flex-end}
.wardrobe-delete-summary{font-size:14px;font-weight:600}
.wardrobe-delete-details{color:var(--z300)}
#wardrobeList .wardrobe-row:only-child [data-ui="wardrobe-delete"]{display:none}
.wardrobe-group-members{display:flex;flex-wrap:wrap;gap:6px}
.wardrobe-group-member{display:inline-flex;align-items:center;min-width:0;gap:6px;padding:5px 8px;border:1px solid var(--z700);border-radius:7px;background:var(--z900);color:var(--z300);overflow-wrap:anywhere;cursor:pointer}
.wardrobe-group-member:has(input:checked){border-color:var(--emerald);color:var(--z50);background:rgba(52,211,153,.08)}
.wardrobe-group-member input{accent-color:var(--emerald);flex:none}
#btnBatchMove:disabled{opacity:.5;cursor:default}
.sw{position:relative;width:38px;height:21px;border-radius:999px;background:var(--z700);flex:none;transition:background .15s}
.sw::after{content:"";position:absolute;top:2.5px;left:2.5px;width:16px;height:16px;border-radius:50%;background:var(--z300);transition:transform .15s,background .15s}
.sw:is(.on,:checked){background:var(--z100)}
.sw:is(.on,:checked)::after{transform:translateX(17px);background:var(--z950)}
input.sw{appearance:none;cursor:pointer}
input.sw:focus-visible{outline:2px solid var(--sky);outline-offset:2px}
.lb-dual{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.lb-card{display:flex;flex-direction:column;gap:8px;align-items:center;background:var(--z900);padding:10px;border-radius:9px;border:1px solid var(--line)}
.lb-card img{width:100%;max-height:56dvh;object-fit:contain;border-radius:6px}

@media (max-width:1400px){.matrix-grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))}}
@media (max-width:1320px){.api-pool-dock{display:none}}
@media (max-width:960px){
  /* 窄屏给工作区和衣柜选择各留一行，避免操作入口落到面板的裁切区。 */
  .top{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"brand actions" "wardrobes wardrobes" "workspaces workspaces";gap:6px;height:auto;padding:8px 12px}
  .top-l,.wb-switcher{display:contents}
  .brand{grid-area:brand;gap:5px}
  .top-r{grid-area:actions;gap:4px}
  .top-r .btn,.top-r .icon-btn{min-height:36px}
  .top-r .optional-label{display:none}
  .wb-controls{grid-area:wardrobes}
  .wb-select{width:100%;min-width:0}
  .ws-tabs{grid-area:workspaces}
  .ws-tab{flex:1;justify-content:center;min-height:32px}
  .cols,.settings-layout,.combine-list{grid-template-columns:minmax(0,1fr)}
  .side{display:none}
  #wsGallery .insp,.panel.detail-open #wsGallery .mid{display:none}
  .panel.detail-open #wsGallery .insp{display:flex}
  .insp-h .back{display:grid}
  /* 窄屏整页滚动，各区按内容占位，避免套装库被后面的网格覆盖。 */
  #wsMatrix{overflow-y:auto;grid-auto-rows:max-content;align-content:start}
  #wsMatrix .side{display:flex;max-height:180px;border-bottom:1px solid var(--line)}
  .matrix-mid{padding:14px 12px}
  .matrix-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .matrix-jump{display:inline-flex}
  .matrix-mid,#wsMatrix .insp-b{overflow:visible}
  .modal-f,.modal-f .action-row,.status-l{flex-wrap:wrap}
  .status{height:auto;min-height:28px}
  .status-r{display:none}
  .settings-layout{min-height:0;max-height:none}
  .settings-pane{padding:10px 0}
  .cfg-row{flex-wrap:wrap}
  .wardrobe-row .wardrobe-label{flex-basis:100%}
}
@media (max-width:480px){
  .subbar-r,.gallery-management{gap:5px}
}
`;
