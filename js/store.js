/*
 * Amor Stories - Kalıcı veri (localStorage)
 * Sunucu yok: her şey kullanıcının tarayıcısında saklanır.
 *
 * user:       { name, age, city, photo }
 * characters: [{ id, name, gender, age, city, job, zodiac, bio, traits: [], about,
 *                photo, album: [], colors: [renk1, renk2], created }]
 *   photo / album: data URL (yüklenen fotoğraf) ya da dosya yolu
 * threads:    [{ id, charId, title, created, opened }]  bir karakterin birden çok adlı sohbeti olabilir
 * chats:      sohbet id -> [{ id, from: 'me' | 'her' | 'sys', text, ts,
 *                             type?: 'photo', src?, reply?: mesaj id, react?: emoji,
 *                             effect?: efekt id ya da 'none' (yoksa anahtar kelimeden gelir) }]
 * side:       sohbet id -> şu an kim yazıyor ('me' | 'her')
 * turns:      sohbet id -> her mesajdan sonra taraf otomatik değişsin mi
 * pinned:     mesaj listesinde sabitlenen karakter id'leri (en fazla 4)
 */
window.Stories = window.Stories || {};

Stories.Store = (() => {
  const KEY = 'amor-stories:v2';
  const defaults = () => ({
    user: { name: '', age: '', city: '', photo: '' },
    characters: [],
    threads: [],
    chats: {},
    side: {},
    turns: {},
    pinned: [],
    keywords: []   // [{ id, word, effect }] sayılan anahtar kelimeler; effect varsa geçtiği mesaja uygulanır
  });

  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Eski sürüm: karakter başına tek sohbet (chats[karakter id]) -> "Sohbet 1" adlı sohbet kaydı
  function migrate(s) {
    if (s.threads) return s;
    s.threads = [];
    const map = {};
    Object.keys(s.chats || {}).forEach(cid => {
      const msgs = s.chats[cid];
      delete s.chats[cid];
      if (!msgs.length || !s.characters.some(c => c.id === cid)) return;
      const id = map[cid] = uid();
      s.threads.push({ id, charId: cid, title: 'Sohbet 1', created: msgs[0].ts, opened: 0 });
      s.chats[id] = msgs;
    });
    ['side', 'turns'].forEach(k => {
      const old = s[k] || {};
      s[k] = {};
      Object.keys(old).forEach(cid => { if (map[cid]) s[k][map[cid]] = old[cid]; });
    });
    return s;
  }

  // "yeni-set" modunun adı "carmen" oldu: kayıtlı karakterlerdeki mod/set adları ve resim yolları çevrilir
  const renameMod = data => {
    if (!data) return data;
    const s = JSON.stringify(data);
    return s.includes('yeni-set') ? JSON.parse(s.split('mods/yeni-set/').join('mods/carmen/')
      .split('"yeni-set:').join('"carmen:').split('"mod":"yeni-set"').join('"mod":"carmen"')) : data;
  };
  const fill = data => migrate(Object.assign(defaults(), renameMod(data), data && !data.threads ? { threads: undefined } : {}));
  let state = fill(read(KEY));

  // Kota dolarsa false döner
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }

  function replace(data) {
    state = fill(data);
    return save();
  }

  function reset() {
    const user = state.user;
    state = defaults();
    state.user = user;
    save();
  }

  return { get state() { return state; }, save, replace, reset, uid };
})();
