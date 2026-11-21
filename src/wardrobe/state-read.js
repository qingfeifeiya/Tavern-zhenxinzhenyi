
  /** 读取酒馆存储中的启停状态，首次运行或无法读取时返回默认开启。 */
  function readPluginEnabled() {
    try {
      return P.localStorage.getItem(ENABLED_KEY) !== 'false';
    } catch {
      return true;
    }
  }

  /** 读取本地快照。存储不可用或内容不符合快照结构时，返回空对象以启用默认数据。 */
  function readState() {
    try {
      const saved = JSON.parse(P.localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved?.items) && saved.items.every(isSavedItem) && saved.settings && typeof saved.settings === 'object') return saved;
    } catch {
      // 浏览器禁用存储或快照无法解析时，仍允许打开衣柜。
    }
    return {};
  }

  /** 检查本地快照的服饰字段，返回是否能直接交给各视图使用。 */
  function isSavedItem(item) {
    return item && ['id', 'title', 'owner', 'category', 'rating', 'desc'].every(key => typeof item[key] === 'string')
      && ['tags', 'boundChars'].every(key => Array.isArray(item[key]) && item[key].every(value => typeof value === 'string'))
      && ['frontUrl', 'backUrl'].every(key => !item[key] || (typeof item[key] === 'string' && HTTP_IMAGE_PREFIX.test(item[key])))
      && (item.outfit === undefined || (RATINGS.some(rating => rating.key === item.rating) && isSavedOutfit(item.outfit)));
  }

  /** 校验套装快照的槽位与工坊字段，返回它们能否直接恢复到搭配台。 */
  function isSavedOutfit(outfit) {
    return Array.isArray(outfit?.slots) && outfit.slots.every(slot => slot && typeof slot.id === 'string'
      && typeof slot.name === 'string' && (slot.itemId === null || typeof slot.itemId === 'string'))
      && typeof outfit.descriptionEdited === 'boolean'
      && RATINGS.some(rating => rating.key === outfit.workshop?.rating)
      && ['reason', 'description', 'prompt'].every(key => typeof outfit.workshop[key] === 'string')
      && (outfit.workshop.style === undefined || VISION_STYLES.has(outfit.workshop.style))
      && (outfit.workshop.instruction === undefined || typeof outfit.workshop.instruction === 'string')
      && (outfit.workshop.includeImages === undefined || typeof outfit.workshop.includeImages === 'boolean');
  }

  /** 判断已清理的图片地址是否为完整的 HTTP 或 HTTPS URL。 */
  function isImageUrl(value) {
    if (!HTTP_IMAGE_PREFIX.test(value)) return false;
    try {
      return Boolean(new P.URL(value).hostname);
    } catch {
      return false;
    }
  }

  const savedState = readState();
  let settings = savedState.settings ?? {};

  /** 从快照读取有效衣柜并按 ID 索引。只有没有可用衣柜时才创建初始主衣柜。 */
  function readWardrobes(records) {
    const wardrobes = new Map();
    if (Array.isArray(records)) {
      for (const record of records) {
        if (typeof record?.id !== 'string' || !record.id || typeof record.name !== 'string' || !record.name.trim()) continue;
        wardrobes.set(record.id, { id: record.id, name: record.name.trim() });
      }
    }
    if (!wardrobes.size) {
      wardrobes.set(DEFAULT_WARDROBE_ID, { id: DEFAULT_WARDROBE_ID, name: '默认主衣柜' });
    }
    return wardrobes;
  }

  const WARDROBES = readWardrobes(savedState.wardrobes);

  /** 返回初始主衣柜或列表中的首个可用衣柜 ID。删除时传入需排除的衣柜 ID。 */
  function getDefaultWardrobeId(excludedId) {
    if (DEFAULT_WARDROBE_ID !== excludedId && WARDROBES.has(DEFAULT_WARDROBE_ID)) return DEFAULT_WARDROBE_ID;
    for (const id of WARDROBES.keys()) if (id !== excludedId) return id;
    return undefined;
  }

  /** 读取组合快照并校验成员，返回按 ID 索引的组合。旧快照的多个参与项合并为一条组合。 */
  function readWardrobeGroups(records, legacyWardrobes) {
    const groups = new Map();
    if (Array.isArray(records)) {
      for (const record of records) {
        if (typeof record?.id !== 'string' || !record.id || WARDROBES.has(record.id)
          || typeof record.name !== 'string' || !record.name.trim() || !Array.isArray(record.wardrobeIds)) continue;
        const wardrobeIds = [...new Set(record.wardrobeIds.filter(id => WARDROBES.has(id)))];
        if (wardrobeIds.length >= 2) groups.set(record.id, { id: record.id, name: record.name.trim(), wardrobeIds });
      }
    } else if (Array.isArray(legacyWardrobes)) {
      // 只有旧快照中实际勾选了多个衣柜才生成组合，首次运行及零参与时只显示单个衣柜。
      const wardrobeIds = new Set();
      for (const wardrobe of legacyWardrobes) {
        if (wardrobe?.pull === true && WARDROBES.has(wardrobe.id)) wardrobeIds.add(wardrobe.id);
      }
      if (wardrobeIds.size >= 2) {
        const id = 'wg-legacy';
        groups.set(id, { id, name: `原${WARDROBE_GROUP_LABEL}`, wardrobeIds: [...wardrobeIds] });
      }
    }
    return groups;
  }

  const WARDROBE_GROUPS = readWardrobeGroups(savedState.wardrobeGroups, savedState.wardrobes);
