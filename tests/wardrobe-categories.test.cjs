const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

test('服饰分类按保存值显示和统计，归属为无的服饰仍可按分类找到', () => {
  const source = [
    'wardrobe-config', 'prompts', 'state-read', 'state-init', 'panel-templates', 'chat-wear', 'outfit-matrix', 'gallery-inspector',
  ].map(name => readFileSync(join(__dirname, '../src/wardrobe', `${name}.js`), 'utf8')).join('\n');
  const category = '日常便装';
  const item = (id, owner, fields = {}) => ({
    id, title: id, owner, category, wardrobeId: 'wb-main', rating: '无', desc: '', tags: [], boundChars: [],
    frontUrl: '/wardrobe/test.png', ...fields,
  });
  const items = [
    item('unassigned', '无', { tags: ['通勤'] }),
    item('blank', 'Char 角色'),
    item('user', 'USER 玩家', { desc: '便装' }),
    item('shared', '双人通用', { desc: '便装' }),
    item('deleted-category', '无', { category: '已删除分类' }),
    item('empty-category', '无', { category: '' }),
    item('unsorted', '无', { category: '待整理' }),
  ];
  const fields = new Map();
  const field = id => {
    if (!fields.has(id)) fields.set(id, { value: '', addEventListener() {} });
    return fields.get(id);
  };
  const count = {};
  const element = { addEventListener() {} };
  const wardrobe = runInNewContext(`${source}
    for (const [id, item] of ITEMS_BY_ID) visibleItems.set(id, item);
    let navigation;
    navigateGallery = next => { navigation = next; };
    ({
      gallery(owner, filter, value = '') {
        galleryOwner = owner;
        galleryFilter = filter;
        galleryFilterValue = value;
        syncGalleryItems();
        return [...galleryItems.keys()];
      },
      card: id => itemCardTpl(ITEMS_BY_ID.get(id), undefined, false),
      clearOwner: id => { ITEMS_BY_ID.get(id).owner = NO_OWNER; },
      afterSaving(id) {
        navigation = undefined;
        refreshAfterInspectorSave(ITEMS_BY_ID.get(id), true);
        return navigation?.filter;
      },
      picker(category) {
        pickerFilterCat = category;
        renderSlotPickerGrid();
        return $('slotPickerGrid').innerHTML;
      },
      exportIds: content => [...collectWardrobeExportItems(new Set(['wb-main']), content).selected.keys()],
      candidates: () => collectSelectionCandidates({}, 'text').entries.map(entry => entry.id),
    });
  `, {
    savedState: { items: structuredClone(items) }, storageIssues: [], apiKeys: new Map(), P: { URL }, TH: undefined,
    getTavernContext: () => ({ extensionSettings: { wardrobe: { apiKeys: [] } } }), API_KEYS_EXTENSION_ID: 'wardrobe',
    $: field, listenerOptions: {}, observePanelAction: (_name, handler) => handler,
    inspectorBody: element, gallerySearch: element, categoryForm: element, wardrobeSelect: element, narrowLayout: element,
    matrixSlotNameForm: element, matrixDescription: element, pickerWardrobe: { ...element, value: '' },
    currentSlotId: undefined, pickerFilterOwner: 'ALL', pickerFilterCat: '',
    galleryMain: { before() {} }, gwrap: { prepend() {} }, gwrapBar: {},
    gallerySearchFrame: undefined, cardsById: new Map(),
    gallerySidebar: { querySelectorAll: () => [] }, galleryTags: { contains: () => false },
    galleryCategories: { children: [{ dataset: { category }, querySelector: () => count }] },
    galleryWearSlots: { children: [] }, sh: element,
  });

  assert.match(wardrobe.card('unassigned'), /无 · 日常便装/);
  assert.match(wardrobe.card('blank'), /Char · 日常便装/);
  assert.deepEqual([...wardrobe.gallery('Char 角色', 'category', category)], ['unassigned', 'blank', 'shared']);
  assert.equal(count.textContent, '3');
  assert.deepEqual([...wardrobe.gallery('Char 角色', 'unsorted')], ['deleted-category', 'empty-category', 'unsorted']);
  assert.equal(field('galleryUnsortedCount').textContent, '3');
  assert.equal(wardrobe.afterSaving('unassigned'), 'all');

  wardrobe.clearOwner('blank');
  assert.match(wardrobe.card('blank'), /无 · 日常便装/);
  assert.deepEqual([...wardrobe.gallery('Char 角色', 'category', category)], ['unassigned', 'blank', 'shared']);
  assert.equal(count.textContent, '3');
  assert.deepEqual([...wardrobe.gallery('USER 玩家', 'category', category)], ['unassigned', 'blank', 'user', 'shared']);
  assert.equal(count.textContent, '4');
  assert.equal(field('poolUserCount').textContent, '2 件');
  assert.equal(field('poolCharCount').textContent, '1 件');
  assert.equal(wardrobe.afterSaving('unsorted'), 'unsorted');

  assert.match(wardrobe.picker(category), /data-item-id="unassigned"/);
  assert.match(wardrobe.picker(category), /data-item-id="blank"/);
  assert.doesNotMatch(wardrobe.picker(category), /data-item-id="deleted-category"/);
  assert.deepEqual([...wardrobe.exportIds('sorted')], ['unassigned', 'blank', 'user', 'shared']);
  assert.deepEqual([...wardrobe.exportIds('unsorted')], ['deleted-category', 'empty-category', 'unsorted']);
  assert.deepEqual([...wardrobe.candidates()], ['user', 'shared']);
});
