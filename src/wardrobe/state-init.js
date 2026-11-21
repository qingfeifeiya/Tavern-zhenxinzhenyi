
  const CATEGORIES = [
    { name: '日常便装', dot: '#a1a1aa' },
    { name: '正装礼服', dot: '#60a5fa' },
    { name: '职业制服', dot: '#34d399' },
    { name: '居家睡衣', dot: '#f472b6' },
    { name: '鞋履袜品', dot: '#fbbf24' },
    { name: '配饰小物', dot: '#c084fc' },
  ];

  const ALL_TAGS = ['精纺羊毛', '宽肩剪裁', '高领内搭', '桑蚕丝', '交叉露背', '法国亚麻', '防刮混纺', '战术腰封', '法式蕾丝', '小牛皮'];

  const INSPECTOR_TABS = [
    ['inspPaneBasic', '1. 基础属性'],
    ['inspPaneAI', '2. AI 视觉工坊'],
    ['inspPaneWorld', '3. 世界书绑定'],
  ];
  const MATRIX_TABS = [
    ['matrixPaneBasic', '1. 基础属性'],
    ['matrixPaneAI', '2. AI 视觉工坊'],
  ];
  const SETTINGS_TABS = [
    ['paneDisplay', '画廊与隐私显示', 'image'],
    ['paneApi', '额外选衣 API 配置', 'send'],
    ['paneInject', '主 API 上下文注入', 'check'],
    ['paneAI', 'AI 正背面视觉解析', 'ai'],
    ['paneData', '存储与数据统计', 'database'],
  ];

  const DEMO_ITEMS = [
    { id: 'WD-001', equippedChar: true, fav: true, title: '炭黑廓形双排扣西装大衣', category: '正装礼服', tags: ['精纺羊毛', '宽肩剪裁', '高领内搭'], desc: '重磅精纺羊毛，利落的宽肩剪裁与哑光牛角扣，内搭黑色高领羊绒衫，后背采用经典开叉垂坠剪裁。' },
    { id: 'WD-002', equippedChar: true, fav: true, rating: 'R-15', title: '雾灰真丝露背吊带睡裙', category: '居家睡衣', tags: ['桑蚕丝', '交叉露背', '居家'], desc: '22 姆米桑蚕丝，极细肩带与交叉露背设计，裙摆垂坠至大腿中段。' },
    { id: 'WD-003', owner: 'USER 玩家', equippedUser: true, title: '极简白宽松亚麻衬衫', category: '日常便装', tags: ['法国亚麻', '微敞领口', '休闲'], desc: '自然微皱的法国亚麻长袖衬衫，领口微敞，袖口随意挽至小臂。' },
    { id: 'WD-004', equippedChar: true, title: '深炭灰修身战术执勤制服', category: '职业制服', tags: ['防刮混纺', '立领半拉链', '战术腰封'], desc: '高密度防刮混纺面料，立领半拉链上衣配束脚工装长裤，金属快拆扣腰封。' },
    { id: 'WD-005', fav: true, rating: 'R-18', title: '曜石黑薄纱骨线紧身胸衣', category: '居家睡衣', tags: ['法式蕾丝', '鱼骨支撑', '半透明'], desc: '半透明黑色法式蕾丝与哑光鱼骨支撑结构，搭配可调节吊袜带。' },
    { id: 'WD-006', owner: 'USER 玩家', equippedUser: true, title: '哑光黑方头切尔西踝靴', category: '鞋履袜品', tags: ['小牛皮', '粗跟', '踝靴'], desc: '意大利小牛皮，4.5cm 几何粗跟，靴筒利落贴合脚踝。' },
  ].map(item => ({
    owner: 'Char 角色', rating: 'SFW', equippedUser: false, equippedChar: false, fav: false,
    // 每件服饰拥有独立的可编辑绑定列表。
    wbEnabled: false, boundWorldbook: '', boundChars: [], ...item,
  }));

  // 默认配置定义原始顺序。槽位 ID 固定，编辑中的名称可修改和重复。
  const DEFAULT_SLOTS = [
    ['s1', '外套'], ['s2', '上装'], ['s3', '下装'], ['s4', '连身'],
    ['s5', '内衣'], ['s6', '袜品'], ['s7', '鞋履'], ['s8', '配饰'],
  ];
  const DEFAULT_SLOT_NAMES = new Map(DEFAULT_SLOTS);

  // 所有写入都基于完整索引。旧服饰与失去有效归属的服饰统一放入可用的默认衣柜。
  const initialWardrobeScope = getDefaultWardrobeId();
  const ITEMS_BY_ID = new Map();
  for (const item of savedState.items ?? DEMO_ITEMS) {
    if (!WARDROBES.has(item.wardrobeId)) item.wardrobeId = initialWardrobeScope;
    ITEMS_BY_ID.set(item.id, item);
  }
  // 画廊、选衣候选和批量操作共用衣柜范围，已穿服饰则仍可跨衣柜查找。
  const visibleItems = new Map();
  let wardrobeScope = initialWardrobeScope;
  const SLOTS_BY_ID = new Map(DEFAULT_SLOTS.map(([id, name]) => [id, { id, name, itemId: null }]));
  const RATING_DOTS = new Map(RATINGS.map(rating => [rating.key, rating.dot]));
  const EQUIP_TARGETS = [
    { slug: 'user', field: 'equippedUser', label: 'USER' },
    { slug: 'char', field: 'equippedChar', label: 'Char' },
  ];
