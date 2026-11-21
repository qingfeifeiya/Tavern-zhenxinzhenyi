  // 使用酒馆同源存储，让 iframe 重载后仍读到同一份衣柜与显示设置。
  const STORAGE_KEY = 'zhenxin.wardrobe.v1';
  const DEFAULT_WARDROBE_ID = 'wb-main';
  const WARDROBE_GROUP_LABEL = '组合衣柜';
  const HTTP_IMAGE_PREFIX = /^https?:\/\//i;
  const RATINGS = [
    { key: 'SFW', dot: '#34d399', label: 'SFW · 日常' },
    { key: 'R-15', dot: '#fbbf24', label: 'R-15 · 微露' },
    { key: 'R-18', dot: '#fb7185', label: 'R-18 · 私密' },
  ];
  const VISION_STYLES = new Map([
    ['worldbook', '酒馆世界书 · 沉浸式穿戴状态描写'],
    ['moss', 'MOSS 中文生图提示词增强'],
    ['tags', 'NovelAI / SD 英文视觉特征 Tags'],
  ]);
  // 启停独立保存，开关时只写一个值，衣柜快照异常时也能恢复关闭状态。
  const ENABLED_KEY = 'zhenxin.wardrobe.enabled';
