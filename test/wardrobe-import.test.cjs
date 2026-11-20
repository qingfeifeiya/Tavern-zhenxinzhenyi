const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');

/** @param {string} start 生产代码片段的首行。 @param {string} end 片段之后的标记。 @returns {string} 供最小宿主运行的原始代码。 */
function sourceBetween(start, end) {
  const from = script.indexOf(start);
  const to = script.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, start);
  return script.slice(from, to);
}

/** @returns {Promise<void>} 两种宿主路径均可入库，返回其他文件时保留本次上传的回收记录。 */
async function checkWardrobeImageUploadPaths() {
  const run = new Function('P', 'diagnosticFetch', `
    const diagnosticLocalErrors = new WeakSet();
    ${sourceBetween('  function wardrobeDiagnosticError(', '  function diagnosticHttpStatus(')}
    ${sourceBetween('  const HTTP_URL_PREFIX =', '  const ADD_IMAGE_TYPES =')}
    ${sourceBetween('  function parseHttpUrl(', '  function isImageUrl(')}
    ${sourceBetween('  async function uploadWardrobeImage(', '  async function rollbackWardrobeImageUploads(')}
    return uploadWardrobeImage;
  `);
  const image = { filename: 'front.png', format: 'png', imageFolder: '衣柜-新 衣柜', base64: 'aW1hZ2U=' };
  const filePath = '/user/images/衣柜-新 衣柜/front.png';
  const expected = '/user/images/%E8%A1%A3%E6%9F%9C-%E6%96%B0%20%E8%A1%A3%E6%9F%9C/front.png';
  for (const [path, valid] of [
    [filePath, true], [filePath.slice(1), true],
    ['user/images/衣柜-其他/front.png', false], ['user/images/衣柜-新 衣柜/back.png', false],
  ]) {
    /** @returns {Promise<Response>} 模拟宿主上传成功后返回的路径。 */
    const diagnosticFetch = async () => Response.json({ path });
    const upload = run({ URL, location: { origin: 'http://tauri.localhost' } }, diagnosticFetch);
    const uploaded = [];
    const result = upload(image, { signal: new AbortController().signal }, uploaded);
    if (valid) assert.equal(await result, expected);
    else await assert.rejects(result, /酒馆未返回有效的图片地址/);
    assert.deepEqual(uploaded, [filePath]);
  }
}

test('共用上传入口兼容 SillyTavern 和 TauriTavern 的图片返回路径', checkWardrobeImageUploadPaths);

/** @returns {Function} 运行实际的 JSON 导入入口及字段校验，图片解码由最小浏览器宿主代替。 */
function createPackageReader() {
  const read = new Function('P', `
    const diagnosticLocalErrors = new WeakSet();
    ${sourceBetween('  function wardrobeDiagnosticError(', '  function diagnosticHttpStatus(')}
    ${sourceBetween('  const WARDROBE_ITEMS_FORMAT =', '  const API_MODES =')}
    ${sourceBetween('  const DEFAULT_WEAR_SLOTS =', '  const JSON_FENCE_PATTERN =')}
    ${sourceBetween('  const UNSORTED_CATEGORY =', '  function readCategories(')}
    ${sourceBetween('  const isRecord =', '  function indexWearSlotNames(')}
    ${sourceBetween('  function readWardrobeItemError(', '  function parseHttpUrl(')}
    ${sourceBetween('  async function readWardrobeBlob(', '  function readImageDataUrl(')}
    ${sourceBetween('  function getWardrobeRasterFormat(', '  function wardrobeImportMatchKey(')}
    ${sourceBetween('  const createId =', '  const renderMatrixUI =')}
    return readWardrobeItemsPackage;
  `)({ atob, Blob, URL, crypto,
    /** 提供生产读图流程需要的最小图像对象。 */
    Image: class {
      naturalWidth = 1;
      naturalHeight = 1;
      /** @param {string} url 待读取的图片。模拟浏览器发出加载事件，导入流程仍读取真实的图片字节。 */
      set src(url) {
        this.url = url;
        queueMicrotask(() => this.onload?.());
      }
      /** @returns {void} 模拟清除图片地址，实际对象 URL 由导入流程释放。 */
      removeAttribute() { delete this.url; }
    },
  });
  /** @param {object} data 待导入的数据包。 @param {string} name 模拟文件名。 @returns {Promise<object>} 校验并解包后的导入数据。 */
  return (data, name) => read(new File([JSON.stringify(data)], name), 'json', new AbortController().signal);
}

/** @returns {Promise<void>} 服饰、配件和方案通过同一个导入入口，图片必须随包携带。 */
async function checkOutfitManagerImport() {
  const read = createPackageReader();
  const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jvygAAAAASUVORK5CYII=';
  const source = {
    type: 'user',
    _assets: { 'coat.png': image },
    outfits: [{
      id: 'one', name: '汉服', category: '古风', subCategory: '秋装', description: '交领',
      imageData: '/api/plugins/outfit-manager/images/coat.png', sceneTag: '外出', favorite: true,
      kits: [{ id: 'empty', name: '日常', accIds: [] }, { id: 'full', name: '出门', accIds: ['one', 'two'], disabledAccIds: ['two'] }],
    }],
    accessories: [{ id: 'one', name: '布鞋', category: '鞋子', imageData: image }, { id: 'two', name: '布帽', category: '帽子' }],
  };
  const pack = await read(source, '汉服.json');
  const [shoes, hat, main, kit] = [...pack.rows.values()];
  assert.equal(pack.wardrobes.get(main.item.wardrobeId), '汉服');
  assert.equal(main.item.owner, 'USER 玩家');
  assert.equal(main.item.category, '古风 / 秋装');
  assert.equal(main.item.desc, '交领');
  assert.equal(main.item.fav, true);
  assert.deepEqual(main.item.tags, ['外出', '日常']);
  assert.equal(main.item.frontUrl, '');
  assert.equal(main.images.frontUrl.format, 'png');
  assert.equal(shoes.images.frontUrl, main.images.frontUrl);
  assert.equal(shoes.item.wearSlot, 'shoes');
  assert.equal(hat.item.wearSlot, 'head');
  assert.deepEqual(kit.item.outfit.slots.map(slot => slot.itemId), [main.item.id, shoes.item.id]);
  assert.equal(kit.item.desc, '交领\n布鞋');
  await assert.rejects(read({ ...source, _assets: {} }, '汉服.json'), /缺少导出图片/);
}

test('通过原有 JSON 入口导入 Outfit Manager 穿搭与包内图片', checkOutfitManagerImport);

/** @returns {Promise<void>} 验证角色、通用衣柜和预设里的同源 ID 各自形成独立卡片。 */
async function checkOutfitManagerPartitions() {
  const read = createPackageReader();
  const partition = { outfits: [{ id: 'original', name: '外套' }] };
  const one = await read({ type: 'char', charName: '测试角色', ...partition }, '角色.json');
  assert.deepEqual([...one.wardrobes.values()], ['测试角色']);
  const chars = { 测试角色: partition, __shared__: partition };
  const all = await read({ type: 'chars_all', chars }, '全部角色.json');
  assert.deepEqual([...all.rows.values()].map(({ item }) => item.owner), ['Char 角色', '双人通用']);
  const backup = await read({
    ...partition, chars, charNames: ['测试角色'], activePresetId: 'current',
    presets: [{ id: 'current', name: '当前预设', ...partition }, { id: 'other', name: '备用预设', ...partition }],
  }, '备份.json');
  assert.deepEqual([...backup.wardrobes.values()], ['预设 · 当前预设', '测试角色', '通用衣柜', '预设 · 备用预设']);
  assert.equal(backup.rows.size, 4);
}

test('识别 Outfit Manager 角色衣柜和完整备份的归属', checkOutfitManagerPartitions);

/** @returns {Promise<void>} 验证 Tavern Wardrobe 转换后的标签、正背面和前置搭配引用进入原有的导入流程。 */
async function checkTavernWardrobeImport() {
  const read = createPackageReader();
  const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jvygAAAAASUVORK5CYII=';
  const outfit = {
    id: 'outfit', name: '出门搭配', category: 'outfits', description: '补充说明',
    image: '', groupIds: ['casual'], contentRating: 'nsfw', componentIds: ['shoes'],
  };
  const shoes = {
    id: 'shoes', name: '布鞋', category: 'shoes', description: '布面', image, backImage: image,
    groupIds: ['casual', 'same-name', 'removed'], contentRating: 'sfw', favorite: true, lastUsedAt: 1700000000000,
  };
  const source = {
    format: 'tw-wardrobe', version: 1, items: [outfit, shoes],
    groups: [{ id: 'casual', name: '日常' }, { id: 'same-name', name: '日常' }],
  };
  const pack = await read(source, '衣柜-2件.json');
  const [combination, member] = [...pack.rows.values()];
  assert.deepEqual([...pack.wardrobes.values()], ['Tavern Wardrobe']);
  assert.equal(combination.item.rating, 'R-18');
  assert.equal(combination.item.wearSlot, 'outfit');
  assert.deepEqual(combination.item.outfit.slots.map(slot => slot.itemId), [member.item.id]);
  assert.equal(combination.item.desc, '补充说明\n布鞋（鞋子）：布面');
  assert.equal(member.item.owner, '无');
  assert.equal(member.item.rating, 'SFW');
  assert.equal(member.item.wearSlot, 'shoes');
  assert.equal(member.item.fav, true);
  assert.equal(member.item.lastUsedAt, shoes.lastUsedAt);
  assert.deepEqual(member.item.tags, ['日常']);
  assert.equal(member.images.frontUrl.format, 'png');
  assert.equal(member.images.backUrl, member.images.frontUrl);

  const edited = await read({ ...source, items: [{ ...outfit, descriptionOverride: true }, shoes] }, '搭配.json');
  assert.equal(edited.rows.get(combination.item.id).item.desc, '补充说明');
  await assert.rejects(read({ ...source, items: [outfit] }, '缺少成员.json'), /成员缺失/);
  await assert.rejects(read({ ...source, version: 2 }, '未知版本.json'), /请选择受支持/);
}

test('通过原有 JSON 入口导入 Tavern Wardrobe 服饰与搭配', checkTavernWardrobeImport);
