/*
 * Amor Stories - Arayüz
 * ---------------------
 * Amor'un ekranları; karakterler sadece "Oluştur" ekranından gelir ve sohbette iki tarafı da kullanıcı yazar.
 * Hash tabanlı yönlendirme (GitHub Pages ile uyumlu):
 *   #/home  #/messages  #/create  #/create/<id>  #/me  #/p/<id>  #/chat/<id>
 */
(() => {
  const Store = Stories.Store;
  const T = Stories.Traits;
  const S = () => Store.state;
  const $ = (sel, root = document) => root.querySelector(sel);
  const view = $('#view');
  const app = $('#app');

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const chars = () => S().characters;
  const byId = id => chars().find(c => c.id === id);

  const ui = { homeTab: 'all', profileTab: 'profile', route: null, create: null };
  let playTimer = null;

  /* ---------- İkonlar ---------- */
  const ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24"><path d="M20 12H5M11 5l-7 7 7 7"/></svg>',
    more: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="19" r="1.3"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M3.4 11.1 19.6 3.6c.9-.4 1.8.5 1.4 1.4l-7.5 16.2c-.4.9-1.7.8-2-.1l-1.6-5.4a1 1 0 0 0-.6-.6L3.9 13.5c-.9-.3-1-1.6-.1-2z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v6a3.5 3.5 0 0 1-3.5 3.5H11l-4.3 3.4c-.6.5-1.5 0-1.5-.7V16A3.5 3.5 0 0 1 4 12.5z"/><circle cx="9.5" cy="9.5" r="1.2" fill="#fff"/><circle cx="14.5" cy="9.5" r="1.2" fill="#fff"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  /* ---------- Yardımcılar ---------- */
  // Telefonda avatarlar biraz daha küçük
  const avaSize = size => Math.round(window.innerWidth < 768 ? size * 0.8 : size);
  const initial = name => esc((name || '?').trim().charAt(0).toLocaleUpperCase('tr') || '?');
  const grad = c => { const [a, b] = c.colors || T.colors[0]; return `linear-gradient(135deg,${a},${b})`; };

  function avatar(c, size = 56, opts = {}) {
    size = avaSize(size);
    const inner = c.photo ? `<img src="${esc(c.photo)}" alt="${esc(c.name)}" loading="lazy">` : initial(c.name);
    const unread = opts.unread ? `<b class="unread">${opts.unread}</b>` : '';
    return `<div class="ava" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px;background:${grad(c)}">${inner}${unread}</div>`;
  }

  function userAvatar(size = 56) {
    const u = S().user;
    return avatar({ name: u.name || 'Sen', photo: u.photo, colors: ['#7b5cff', '#c86bff'] }, size);
  }
  const userName = () => S().user.name || 'Sen';

  function fmtTime(ts) {
    const d = new Date(ts), now = new Date();
    const hm = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return hm;
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${hm}`;
  }

  /* Sohbetler: bir karakterin birden çok adlı sohbeti (thread) olabilir; mesajlar S().chats[sohbet id] */
  const threads = () => S().threads;
  const threadById = id => threads().find(t => t.id === id);
  const threadsOf = c => threads().filter(t => !t.group && t.charId === c.id).sort((a, b) => activity(b) - activity(a));
  // Grup sohbetleri: { group: true, members: [karakter id], title }; mesajlarda konuşan üye m.who
  const groups = () => threads().filter(t => t.group);
  const groupsOf = c => groups().filter(t => t.members.includes(c.id)).sort((a, b) => activity(b) - activity(a));
  const membersOf = t => (t.group ? t.members : [t.charId]).map(byId).filter(Boolean);
  const GHOST = { name: 'Silinmiş karakter', photo: '', colors: ['#8b8b99', '#5a5a6a'], album: [] };
  const msgsOf = t => (S().chats[t.id] = S().chats[t.id] || []);
  const lastOf = t => { const m = S().chats[t.id]; return m && m.length ? m[m.length - 1] : null; };
  const activity = t => Math.max(t.opened || 0, t.created || 0, (lastOf(t) || {}).ts || 0);
  const currentThread = c => threadsOf(c)[0] || null; // son kalınan sohbet
  const msgCount = c => threadsOf(c).reduce((n, t) => n + msgsOf(t).length, 0);
  const preview = m => m.type === 'photo' ? `📷 ${m.text || 'Fotoğraf'}` : m.text;

  function newThread(c, title) {
    const t = { id: Store.uid(), charId: c.id, title: title || `Sohbet ${threadsOf(c).length + 1}`, created: Date.now(), opened: 0 };
    if (c.theme) t.theme = Object.assign({}, c.theme); // karakterin varsayılan teması
    threads().push(t);
    save();
    return t;
  }
  function groupAvatar(t, size) {
    const ms = membersOf(t);
    if (ms.length < 2) return avatar(ms[0] || { name: '👥', colors: T.colors[1] }, size);
    const s = avaSize(size), inner = Math.round(size * 0.68);
    return `<div class="gava" style="width:${s}px;height:${s}px">${avatar(ms[0], inner)}${avatar(ms[1], inner)}${ms.length > 2 && size >= 50 ? `<b class="gmore">+${ms.length - 2}</b>` : ''}</div>`;
  }

  // Grup oluştur / düzenle: ad + en az 2 üye
  function groupSheet(t, preId) {
    if (chars().length < 2) { notify('Grup için en az 2 karakter gerekli', '👥'); return; }
    const sel = new Set(t ? t.members.filter(byId) : preId ? [preId] : []);
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>👥 ${t ? 'Grubu düzenle' : 'Yeni grup'}</h3>
      <form id="gForm" autocomplete="off">
        <div class="field" style="margin-top:0"><input id="gTitle" maxlength="40" value="${esc(t ? t.title : '')}" placeholder="Grup adı (ör. Ofis 💼)"></div>
        <div class="sec-title">Üyeler <small id="gCount"></small></div>
        <div class="g-pick">${chars().map(c => `<button type="button" data-m="${c.id}" class="${sel.has(c.id) ? 'on' : ''}">${avatar(c, 52)}<b>${esc(c.name)}</b></button>`).join('')}</div>
        <button class="btn primary block" type="submit">${t ? 'Kaydet' : 'Grubu oluştur'}</button>
      </form>`, 'light');
    const el = sh.el;
    const count = () => { el.querySelector('#gCount').textContent = `(${sel.size} seçili · en az 2)`; };
    count();
    el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
      const id = b.dataset.m;
      if (sel.has(id)) sel.delete(id); else sel.add(id);
      b.classList.toggle('on', sel.has(id));
      count();
    });
    el.querySelector('#gForm').onsubmit = e => {
      e.preventDefault();
      if (sel.size < 2) { notify('En az 2 üye seç', '👥'); return; }
      // seçim sırası değil, karakter listesindeki sıra
      const members = chars().filter(c => sel.has(c.id)).map(c => c.id);
      const title = el.querySelector('#gTitle').value.trim() || members.slice(0, 3).map(id => byId(id).name).join(', ');
      sh.close();
      if (t) {
        t.title = title;
        t.members = members;
        save();
        render();
      } else {
        const g = { id: Store.uid(), group: true, members, title, created: Date.now(), opened: 0 };
        threads().push(g);
        save();
        location.hash = `#/chat/${g.id}`;
      }
    };
  }

  // Karakterin son kaldığın sohbetini aç (hiç yoksa yeni bir tane)
  const openChat = c => { location.hash = `#/chat/${(currentThread(c) || newThread(c)).id}`; };

  // Sohbet adı sorma penceresi
  function askTitle(title, heading, cb) {
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>${esc(heading)}</h3>
      <form id="titleForm" autocomplete="off">
        <div class="field" style="margin-top:0"><input id="titleIn" maxlength="40" value="${esc(title)}" placeholder="ör. 1. Bölüm: Yanlış numara"></div>
        <button class="btn primary block" type="submit">Kaydet</button>
      </form>`, 'light');
    const input = sh.el.querySelector('#titleIn');
    setTimeout(() => { input.focus(); input.select(); }, 250);
    sh.el.querySelector('#titleForm').onsubmit = e => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) return;
      sh.close();
      cb(v);
    };
  }

  function save() {
    if (!Store.save()) notify('Depolama dolu! Albümden fotoğraf silmeyi dene.', '⚠️');
  }

  function notify(text, icon = '💜') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span style="font-size:28px">${icon}</span><div class="info"><b>${esc(text)}</b></div>`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2600);
  }

  function sheet(html, cls = '') {
    const wrap = document.createElement('div');
    wrap.className = 'sheet-wrap';
    wrap.innerHTML = `<div class="sheet ${cls}">${html}</div>`;
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('open'));
    function close() { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 250); }
    return { el: wrap.firstElementChild, close };
  }

  // Fotoğrafı küçültür (localStorage'a sığsın diye). square: ortadan kare kırpar
  function readPhoto(file, max, square) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (square) { const s = Math.min(sw, sh); sx = (sw - s) / 2; sy = (sh - s) / 2; sw = sh = s; }
        const k = Math.min(1, max / Math.max(sw, sh));
        const cv = document.createElement('canvas');
        cv.width = Math.round(sw * k);
        cv.height = Math.round(sh * k);
        cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        resolve(cv.toDataURL('image/jpeg', .85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });
  }

  /* ---------- Yönlendirme ---------- */
  function parseRoute() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const [name = 'home', id, extra] = parts;
    return { name, id, extra };
  }

  function render() {
    const r = ui.route = parseRoute();
    const t = r.name === 'chat' ? threadById(r.id) : null;
    const c = t ? (t.group ? null : byId(t.charId)) : r.id ? byId(r.id) : null;
    ui.chatKeys = null;
    const full = ['p', 'chat'].includes(r.name) || (r.name === 'create' && r.id);
    app.classList.toggle('no-nav', !!full);
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.tab === r.name && !full));
    document.querySelectorAll('.sheet-wrap, .lightbox').forEach(el => el.remove());
    clearTimeout(playTimer);
    window.scrollTo(0, 0);

    if ((r.name === 'p' && !c) || (r.name === 'chat' && !(t && (t.group || c)))) { location.hash = '#/home'; return; }
    switch (r.name) {
      case 'messages': return renderMessages();
      case 'me': return renderMe();
      case 'p': return renderProfile(c);
      case 'chat': return renderChat(c, t);
      case 'create': return renderCreate(r.id && byId(r.id) ? r.id : null);
      default: return renderHome();
    }
  }

  /* ---------- Ana sayfa ---------- */
  function renderHome() {
    const tabs = [['all', 'Tümü'], ['recent', 'Son yazılan'], ['new', 'Yeni']];
    let list = [...chars()];
    const lastAct = c => { const t = currentThread(c); return t ? activity(t) : 0; };
    if (ui.homeTab === 'new') list.sort((a, b) => b.created - a.created);
    if (ui.homeTab === 'recent') list = list.filter(c => currentThread(c)).sort((a, b) => lastAct(b) - lastAct(a));
    const chatCount = threads().filter(t => byId(t.charId)).length;

    view.innerHTML = `
      <div class="page-pad home ${window.scrollY > 120 ? 'compact' : ''}">
        <div class="home-top">
          <div class="banners">
            <a class="banner gold" href="#/create"><b>Karakter oluştur</b><small>fotoğraf + kişilik</small><span class="art">✨</span></a>
            <a class="banner green" href="#/messages"><b>Hikayeler</b><small>${chatCount} sohbet</small><span class="art">💬</span></a>
          </div>
          <div class="tabs-row">
            <div class="tabs">
              ${tabs.map(([k, t]) => `<button data-tab="${k}" class="${ui.homeTab === k ? 'active' : ''}">${t}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="list">
          ${list.length ? list.map(homeRow).join('') : `<div class="empty"><span class="big">✨</span>${!chars().length
            ? 'Henüz karakter yok.<br><a href="#/create" style="color:var(--pink)">İlk karakterini oluştur ✨</a>'
            : 'Henüz kimseyle yazmadın'}</div>`}
        </div>
      </div>`;

    view.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { ui.homeTab = b.dataset.tab; renderHome(); });
    view.querySelectorAll('.row').forEach(row => row.onclick = e => {
      const c = byId(row.dataset.id);
      if (e.target.closest('.hi-btn, .last-chat')) openChat(c);
      else { ui.profileTab = 'profile'; location.hash = `#/p/${c.id}`; }
    });
  }

  function infoChips(c) {
    return [
      c.age || c.gender ? `<span class="chip sex">${esc(c.gender || '')} ${esc(c.age || '')}</span>` : '',
      c.city ? `<span class="chip loc">📍 ${esc(c.city)}</span>` : '',
      c.zodiac ? `<span class="chip zod">✦ ${esc(c.zodiac)}</span>` : ''
    ].join('');
  }

  function homeRow(c) {
    const t = currentThread(c);
    const last = t && lastOf(t);
    return `
      <div class="row" data-id="${c.id}" role="button" tabindex="0">
        ${avatar(c, 80)}
        <div class="info">
          <div class="name">${esc(c.name)}</div>
          <div class="chips">
            ${infoChips(c)}
            ${(c.tags || []).slice(0, 3).map(x => `<span class="chip utag">🏷️ ${esc(x)}</span>`).join('')}
            ${c.job ? `<span class="chip">${esc(c.job)}</span>` : ''}
            ${c.traits.slice(0, 2).map(x => `<span class="chip">${esc(x)}</span>`).join('')}
          </div>
          ${t ? `<div class="last-chat">💬 <b>${esc(t.title)}</b>${last ? ` · ${esc((last.from === 'me' ? 'Sen: ' : '') + preview(last))}` : ''}</div>`
            : `<div class="bio">${esc(c.bio || c.about)}</div>`}
        </div>
        <button class="hi-btn ${t ? 'msg' : 'hi'}" aria-label="${t ? 'Son sohbete devam et' : 'Sohbet başlat'}">${t ? ICON.chat : 'Hi'}</button>
      </div>`;
  }

  // Yukarı kaydırınca banner'lar küçülür (eşik aralığı titremeyi önler)
  window.addEventListener('scroll', () => {
    const h = $('.home');
    if (!h) return;
    if (window.scrollY > 120) h.classList.add('compact');
    else if (window.scrollY < 20) h.classList.remove('compact');
  }, { passive: true });

  /* ---------- Mesajlar ---------- */
  // Geniş ekranda (≥1024px) mesaj listesi ve sohbet yan yana
  const wideMQ = window.matchMedia('(min-width: 1024px)');
  const wide = () => wideMQ.matches;

  // Karakter başına tek satır (son kaldığın sohbetin adı ve son mesajı) + her grup ayrı satır
  function msgRowsHtml(activeKey) {
    const rows = [
      ...chars().filter(c => currentThread(c)).map(c => ({ key: c.id, act: activity(currentThread(c)), html: a => msgRow(c, a) })),
      ...groups().map(t => ({ key: t.id, act: activity(t), html: a => groupRow(t, a) }))
    ];
    const pins = pinned();
    rows.sort((a, b) => {
      const pa = pins.indexOf(a.key), pb = pins.indexOf(b.key);
      if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
      return b.act - a.act;
    });
    return rows.length ? rows.map(r => r.html(r.key === activeKey)).join('')
      : '<div class="empty"><span class="big">💌</span>Henüz sohbet yok.<br>Ana sayfadan bir karaktere “Hi” de ya da 👥 grup kur!</div>';
  }

  function groupRow(t, active) {
    const last = lastOf(t);
    const ms = membersOf(t);
    const who = !last ? '' : last.from === 'me' ? 'Sen: ' : last.from === 'sys' ? '📝 ' : `${(byId(last.who) || GHOST).name}: `;
    return `
      <button class="msg-row ${active ? 'active' : ''} ${isPinned(t.id) ? 'pinned' : ''}" data-gid="${t.id}">
        ${groupAvatar(t, 62)}
        <div class="info">
          <div class="top"><span class="name">${esc(t.title)}</span><span class="time">${isPinned(t.id) ? '<span class="pin">📌</span>' : ''}${fmtTime(activity(t))}</span></div>
          <div class="last-chat">👥 <b>${esc(ms.map(m => m.name).join(', '))}</b></div>
          <div class="bottom">
            <div class="last">${last ? esc(who + preview(last)) : 'Henüz mesaj yok'}</div>
          </div>
        </div>
      </button>`;
  }

  function msgRow(c, active) {
    const t = currentThread(c);
    const last = lastOf(t);
    const n = threadsOf(c).length;
    const who = !last ? '' : last.from === 'me' ? 'Sen: ' : last.from === 'sys' ? '📝 ' : '';
    return `
      <button class="msg-row ${active ? 'active' : ''} ${isPinned(c.id) ? 'pinned' : ''}" data-id="${c.id}">
        ${avatar(c, 62)}
        <div class="info">
          <div class="top"><span class="name">${esc(c.name)}</span><span class="time">${isPinned(c.id) ? '<span class="pin">📌</span>' : ''}${fmtTime(activity(t))}</span></div>
          <div class="last-chat">💬 <b>${esc(t.title)}</b></div>
          <div class="bottom">
            <div class="last">${last ? esc(who + preview(last)) : 'Henüz mesaj yok'}</div>
            ${n > 1 ? `<span class="chip lv">🗂️ ${n}</span>` : ''}
          </div>
        </div>
      </button>`;
  }

  /* ---------- Sabitleme (karakter ya da grup, en fazla 4) ---------- */
  const MAX_PINS = 4;
  // Önceki sürümde sohbet id'si saklanıyordu; karakter id'sine çevrilir (gruplar kendi id'siyle kalır)
  const pinned = () => (S().pinned = [...new Set((S().pinned || []).map(id => (threadById(id) || {}).charId || id))]
    .filter(id => byId(id) || (threadById(id) || {}).group));
  const isPinned = id => pinned().includes(id);

  function togglePin(id) {
    const pins = pinned();
    if (pins.includes(id)) {
      S().pinned = pins.filter(x => x !== id);
      notify('Sabitleme kaldırıldı', '📌');
    } else {
      if (pins.length >= MAX_PINS) { notify(`En fazla ${MAX_PINS} sohbet sabitlenebilir`, '📌'); return; }
      pins.push(id);
      notify('En üste sabitlendi', '📌');
    }
    save();
    refreshList();
  }

  function deleteThread(t) {
    if (!confirm(`“${t.title}” sohbeti ve tüm mesajları silinsin mi?`)) return false;
    S().threads = threads().filter(x => x.id !== t.id);
    delete S().chats[t.id];
    delete S().side[t.id];
    delete S().turns[t.id];
    save();
    return true;
  }

  function renameThread(t, done) {
    askTitle(t.title, 'Sohbetin adı', v => { t.title = v; save(); done(); });
  }

  // Aynı başlangıçtan farklı bir son yazmak için sohbetin kopyası
  function duplicateThread(t) {
    const c = byId(t.charId);
    const copy = newThread(c, `${t.title} (kopya)`);
    copy.created = t.created;
    S().chats[copy.id] = JSON.parse(JSON.stringify(msgsOf(t)));
    if (S().side[t.id]) S().side[copy.id] = S().side[t.id];
    if (S().turns[t.id] === false) S().turns[copy.id] = false;
    save();
    return copy;
  }

  function createThread(c) {
    askTitle(`Sohbet ${threadsOf(c).length + 1}`, `${c.name} ile yeni sohbet`, v => {
      location.hash = `#/chat/${newThread(c, v).id}`;
    });
  }

  function groupActions(t) {
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <div class="row-act-head">${groupAvatar(t, 44)}<b>${esc(t.title)}</b></div>
      <button class="act" data-act="pin">📌 ${isPinned(t.id) ? 'Sabitlemeyi kaldır' : `En üste sabitle <small>(${pinned().length}/${MAX_PINS})</small>`}</button>
      <button class="act" data-act="edit">👥 Grubu düzenle</button>
      <button class="act danger" data-act="delete">🗑️ Grubu sil</button>`, 'light');
    sh.el.onclick = e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      sh.close();
      const a = b.dataset.act;
      if (a === 'pin') togglePin(t.id);
      if (a === 'edit') groupSheet(t);
      if (a === 'delete' && deleteThread(t)) render();
    };
  }

  // Basılı tutunca / sağ tıklayınca açılan işlemler
  function rowActions(id) {
    const g = threadById(id);
    if (g && g.group) return groupActions(g);
    const c = byId(id);
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <div class="row-act-head">${avatar(c, 44)}<b>${esc(c.name)}</b></div>
      <button class="act" data-act="pin">📌 ${isPinned(id) ? 'Sabitlemeyi kaldır' : `En üste sabitle <small>(${pinned().length}/${MAX_PINS})</small>`}</button>
      <button class="act" data-act="chats">🗂️ Sohbetleri düzenle <small>(${threadsOf(c).length})</small></button>
      <button class="act" data-act="new">➕ Yeni sohbet</button>
      <button class="act" data-act="profile">👤 Profili gör</button>`, 'light');
    sh.el.onclick = e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      sh.close();
      const a = b.dataset.act;
      if (a === 'pin') togglePin(id);
      if (a === 'new') createThread(c);
      if (a === 'chats' || a === 'profile') { ui.profileTab = a === 'chats' ? 'chats' : 'profile'; location.hash = `#/p/${c.id}`; }
    };
  }

  function messagesPanel(activeKey) {
    return `<div class="msg-panel">
      <div class="page-pad"><div class="msg-head"><div class="tabs msg-tabs"><button class="active">Mesaj</button></div>
        <button class="chip dice-all" id="newGroup" type="button">👥 Yeni grup</button></div></div>
      ${!S().user.name ? '<a class="notice" href="#/me" style="display:block">Adını yazarsan sohbetlerde senin adın görünür ✨</a>' : ''}
      <div class="pin-hint">📌 Sabitlemek için basılı tut · sohbetleri karakterin profilinden düzenle · ${pinned().length}/${MAX_PINS}</div>
      <div class="list" id="msgRows">${msgRowsHtml(activeKey)}</div></div>`;
  }

  function bindRows(root) {
    const ng = root.querySelector('#newGroup');
    if (ng) ng.onclick = () => groupSheet();
    root.querySelectorAll('.msg-row').forEach(r => {
      const key = r.dataset.gid || r.dataset.id;
      let timer = null, long = false;
      const cancel = () => clearTimeout(timer);
      r.onpointerdown = () => { long = false; timer = setTimeout(() => { long = true; rowActions(key); }, 500); };
      r.onpointerup = cancel;
      r.onpointerleave = cancel;
      r.onpointercancel = cancel;
      r.oncontextmenu = e => { e.preventDefault(); cancel(); long = true; rowActions(key); };
      r.onclick = () => {
        if (long) { long = false; return; }
        if (r.dataset.gid) location.hash = `#/chat/${key}`; else openChat(byId(key));
      };
    });
  }

  // Listede seçili satır: açık sohbetin karakteri ya da grubu
  const activeKey = () => { const t = ui.route.name === 'chat' && threadById(ui.route.id); return t ? (t.group ? t.id : t.charId) : null; };

  function refreshList() {
    const rows = $('#msgRows');
    if (!rows) return;
    rows.innerHTML = msgRowsHtml(activeKey());
    bindRows(rows.parentElement);
    const hint = $('.pin-hint');
    if (hint) hint.textContent = `📌 Sabitlemek için basılı tut · sohbetleri karakterin profilinden düzenle · ${pinned().length}/${MAX_PINS}`;
  }

  function renderMessages() {
    if (wide()) {
      view.innerHTML = `<div class="split"><aside class="split-list">${messagesPanel(null)}</aside>
        <section class="split-empty"><span>💌</span><b>Bir sohbet seç</b><small>Soldaki listeden birine tıkla ya da ana sayfadan bir karakterle yazmaya başla.</small></section></div>`;
      bindRows($('.split-list'));
      return;
    }
    view.innerHTML = messagesPanel(null);
    bindRows(view);
  }

  /* ---------- Profil ---------- */
  function renderProfile(c) {
    const cover = c.album[0] || c.photo;
    const list = threadsOf(c);
    const kwN = keywords().filter(k => k.charId === c.id).length;
    const tabs = [['profile', 'Profil'], ['chats', `Sohbetler (${list.length})`], ['keys', `Kelimeler${kwN ? ` (${kwN})` : ''}`], ['album', 'Albüm']];
    const cur = list[0];

    view.innerHTML = `<div class="profile">
      <div class="cover" style="background:${grad(c)}">
        ${cover ? `<img class="cover-bg" src="${esc(cover)}" alt="" aria-hidden="true"><img class="cover-fg" src="${esc(cover)}" alt="" data-zoom="0">` : ''}
      </div>
      <a class="round-btn left" href="#/home" aria-label="Geri">${ICON.back}</a>
      <a class="round-btn right" href="#/create/${c.id}" aria-label="Düzenle">${ICON.edit}</a>

      <div class="pcard">
        ${avatar(c, 96)}
        <div class="pname">${esc(c.name)}</div>
        <div class="pbio">${esc(c.bio || '')}</div>
        <div class="chips">
          ${infoChips(c)}
          ${c.traits[0] ? `<span class="chip arch">💫 ${esc(c.traits[0])}</span>` : ''}
          ${(c.tags || []).map(t => `<button type="button" class="chip utag" data-tag="${esc(t)}" title="Kaldırmak için dokun">🏷️ ${esc(t)}</button>`).join('')}
          <button type="button" class="chip tag-add" id="tagAdd">+ etiket</button>
        </div>
        <div class="stats">
          <div><b>${list.length}</b><span>Sohbet</span></div>
          <div><b>${msgCount(c)}</b><span>Mesaj</span></div>
          <div><b>${c.album.length}</b><span>Fotoğraf</span></div>
        </div>
      </div>

      <div class="sheet-body">
        <div class="tabs dark">
          ${tabs.map(([k, t]) => `<button data-t="${k}" class="${ui.profileTab === k ? 'active' : ''}">${t}</button>`).join('')}
        </div>
        <div id="ptab">${profileTab(c)}</div>
      </div>

      <div class="cta-bar">
        <button class="follow" id="newChat" aria-label="Yeni sohbet">➕</button>
        <button class="btn primary" id="goChat">💬 ${cur ? `${esc(cur.title)} · devam et` : 'mesaj yaz'}</button>
      </div></div>`;

    const bindTab = () => {
      $('#ptab').querySelectorAll('[data-thread]').forEach(r => r.onclick = () => { location.hash = `#/chat/${r.dataset.thread}`; });
      const nb = $('#ptab').querySelector('#newChat2');
      if (nb) nb.onclick = () => createThread(c);
      const ng = $('#ptab').querySelector('#newGroup2');
      if (ng) ng.onclick = () => groupSheet(null, c.id);
      const kb = $('#ptab').querySelector('#kwEdit');
      if (kb) kb.onclick = () => keywordSheet({ chars: [c.id], onChange: () => { ui.profileTab = 'keys'; refresh(); } });
      // Sohbet düzenleme: ad değiştir, kopyala, sil (sekme yerinde yenilenir)
      const redraw = () => { ui.profileTab = 'chats'; refresh(); };
      $('#ptab').querySelectorAll('[data-tact]').forEach(b => b.onclick = () => {
        const t = threadById(b.dataset.tid);
        const a = b.dataset.tact;
        if (a === 'rename') renameThread(t, redraw);
        if (a === 'copy') { duplicateThread(t); notify('Sohbetin kopyası oluşturuldu', '📄'); redraw(); }
        if (a === 'delete' && deleteThread(t)) redraw();
      });
    };
    view.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      ui.profileTab = b.dataset.t;
      view.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('active', x === b));
      $('#ptab').innerHTML = profileTab(c);
      bindTab();
    });
    bindTab();
    $('#newChat').onclick = () => createThread(c);
    $('#goChat').onclick = () => openChat(c);

    // 🏷️ Etiketler: "+ etiket" yazarak ekler, etikete dokununca kaldırır
    function refresh() { const y = window.scrollY; renderProfile(c); window.scrollTo(0, y); }
    $('#tagAdd').onclick = () => {
      const btn = $('#tagAdd');
      const inp = document.createElement('input');
      inp.className = 'tag-in';
      inp.maxLength = 24;
      inp.placeholder = 'etiket yaz, Enter';
      btn.replaceWith(inp);
      inp.focus();
      const add = () => {
        const v = inp.value.trim().replace(/^#/, '');
        c.tags = c.tags || [];
        if (v && !c.tags.some(t => lower(t) === lower(v))) { c.tags.push(v); save(); }
        refresh();
      };
      inp.onkeydown = e => {
        if (e.key === 'Enter') { e.preventDefault(); add(); }
        if (e.key === 'Escape') refresh();
      };
      inp.onblur = () => { if (inp.value.trim()) add(); else refresh(); };
    };
    view.querySelectorAll('[data-tag]').forEach(b => b.onclick = () => {
      if (!confirm(`“${b.dataset.tag}” etiketi kaldırılsın mı?`)) return;
      c.tags = (c.tags || []).filter(t => t !== b.dataset.tag);
      save();
      refresh();
    });
    $('.profile', view).addEventListener('click', e => {
      const z = e.target.closest('[data-zoom]');
      if (z) lightbox(c.album.length ? c.album : [c.photo], +z.dataset.zoom);
      if (e.target.closest('#delChar')) removeChar(c);
    });
  }

  function profileTab(c) {
    if (ui.profileTab === 'album') {
      if (!c.album.length) return `<div class="empty">Albüm boş<br><a href="#/create/${c.id}" style="color:var(--pink)">Fotoğraf ekle</a></div>`;
      return `<div class="album">${c.album.map((src, i) => `<div style="background:${grad(c)}"><img src="${esc(src)}" alt="" loading="lazy" data-zoom="${i}"></div>`).join('')}</div>`;
    }
    if (ui.profileTab === 'keys') {
      const ks = keywords().filter(k => k.charId === c.id);
      return `
        <p class="kw-help" style="margin-top:4px">${esc(c.name)} bu kelimeleri tüm sohbetlerinde (gruplar dahil) kaç kez söyledi?</p>
        ${ks.length ? ks.map(k => {
          const st = kwStats(k), f = fxById(k.effect);
          return `<div class="kw-row"><div class="info"><b>${esc(k.word)}</b><small>Sohbetlerinde toplam ${st.inChats} kez geçti${f ? ` · ${f.icon} ${esc(f.label)}` : ''}</small></div><span class="kw-count">${st.said}</span></div>`;
        }).join('') : '<div class="empty" style="padding:20px 10px">Henüz anahtar kelime yok</div>'}
        <button class="btn ghost block" id="kwEdit" style="margin-top:12px">🔑 Kelime ekle / düzenle</button>`;
    }
    if (ui.profileTab === 'chats') {
      const list = threadsOf(c);
      return `
        ${list.map((t, i) => {
          const last = lastOf(t);
          return `<div class="thread-row">
            <button class="th-open" data-thread="${t.id}">
              <span class="th-ico">${i === 0 ? '💬' : '🗂️'}</span>
              <div class="info"><b>${esc(t.title)}${i === 0 ? ' <em class="th-cur">son kaldığın</em>' : ''}</b>
                <small>${last ? esc((last.from === 'me' ? 'Sen: ' : '') + preview(last)) : 'Henüz mesaj yok'}</small>
                <small class="th-meta">${fmtTime(activity(t))} · ${msgsOf(t).length} mesaj</small></div>
            </button>
            <div class="th-tools">
              <button data-tact="rename" data-tid="${t.id}" aria-label="Adını değiştir" title="Adını değiştir">✏️</button>
              <button data-tact="copy" data-tid="${t.id}" aria-label="Kopyasını oluştur" title="Kopyasını oluştur">📄</button>
              <button data-tact="delete" data-tid="${t.id}" aria-label="Sil" title="Sil">🗑️</button>
            </div>
          </div>`;
        }).join('') || '<div class="empty" style="padding:24px 10px">Henüz sohbet yok</div>'}
        <div class="th-hint">✏️ adını değiştir · 📄 kopyasını oluştur (aynı başlangıçtan farklı bir son için) · 🗑️ sil</div>
        ${groupsOf(c).length ? `<div class="sec-title">👥 Gruplar</div>${groupsOf(c).map(t => {
          const last = lastOf(t);
          return `<div class="thread-row"><button class="th-open" data-thread="${t.id}">
            ${groupAvatar(t, 44)}
            <div class="info"><b>${esc(t.title)}</b>
              <small>${esc(membersOf(t).map(m => m.name).join(', '))}</small>
              <small class="th-meta">${fmtTime(activity(t))} · ${msgsOf(t).length} mesaj${last ? ` · ${esc(preview(last))}` : ''}</small></div>
          </button></div>`;
        }).join('')}` : ''}
        <button class="btn ghost block" id="newGroup2" style="margin-top:12px">👥 ${esc(c.name)} ile grup kur</button>
        <button class="btn ghost block" id="newChat2" style="margin-top:12px">➕ Yeni sohbet başlat</button>`;
    }
    const rows = [['🎂 Yaş', c.age], ['🏠 Şehir', c.city], ['💼 Meslek', c.job], ['✦ Burç', c.zodiac]].filter(r => r[1]);
    const group = id => c.traits.filter(t => (T.groups.find(g => g.id === id) || { items: [] }).items.includes(t));
    const custom = c.traits.filter(t => !T.all.includes(t));
    const chips = list => `<div class="chips">${list.map(t => `<span class="chip">💜 ${esc(t)}</span>`).join('')}</div>`;
    return `
      ${rows.length ? `<div class="sec-title" style="margin-top:4px">Profil</div>${rows.map(([k, v]) => `<div class="info-row"><span>${k}</span><b>${esc(v)}</b></div>`).join('')}` : ''}
      ${T.groups.map(g => group(g.id).length ? `<div class="sec-title">${esc(g.label)}</div>${chips(group(g.id))}` : '').join('')}
      ${custom.length ? `<div class="sec-title">Diğer özellikler</div>${chips(custom)}` : ''}
      ${c.about ? `<div class="sec-title">Hakkında</div><div class="about" style="white-space:pre-wrap">${esc(c.about)}</div>` : ''}
      <button class="btn ghost block" id="delChar" style="margin-top:22px;color:#ff2d55">Karakteri sil</button>`;
  }

  function removeChar(c) {
    if (!confirm(`${c.name} silinsin mi? Bütün sohbetleri de silinir.`)) return;
    threadsOf(c).forEach(t => { delete S().chats[t.id]; delete S().side[t.id]; delete S().turns[t.id]; });
    S().threads = threads().filter(t => t.charId !== c.id);
    // Gruplardan çıkar; üyesi kalmayan grup silinir (mesajlarında "Silinmiş karakter" görünür)
    groups().forEach(t => {
      t.members = t.members.filter(id => id !== c.id);
      if (!t.members.length) { S().threads = threads().filter(x => x !== t); delete S().chats[t.id]; }
    });
    S().characters = chars().filter(x => x.id !== c.id);
    S().keywords = keywords().filter(k => k.charId !== c.id);
    save();
    ui.create = null;
    location.hash = '#/home';
  }

  /* ---------- Fotoğraf görüntüleyici ---------- */
  function lightbox(list, start = 0) {
    list = list.filter(Boolean);
    if (!list.length) return;
    let i = Math.min(start, list.length - 1);
    const el = document.createElement('div');
    el.className = 'lightbox';
    const draw = () => {
      el.innerHTML = `
        <img src="${esc(list[i])}" alt="">
        ${list.length > 1 ? `<button class="lb-nav prev" aria-label="Önceki">‹</button><button class="lb-nav next" aria-label="Sonraki">›</button>
        <div class="lb-count">${i + 1} / ${list.length}</div>` : ''}
        <button class="lb-close" aria-label="Kapat">✕</button>`;
    };
    el.onclick = e => {
      if (e.target.closest('.prev')) { i = (i - 1 + list.length) % list.length; draw(); return; }
      if (e.target.closest('.next')) { i = (i + 1) % list.length; draw(); return; }
      el.remove();
    };
    let x0 = null;
    el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', e => {
      if (x0 === null || list.length < 2) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) { i = (i + (dx < 0 ? 1 : -1) + list.length) % list.length; draw(); }
      x0 = null;
    });
    draw();
    document.body.appendChild(el);
  }

  /* ---------- Sohbet ----------
   * Alttaki avatara (ya da 🔁 Taraf) dokunarak kimin yazdığını seçersin: sen (sağda, pembe) ya da karakter (solda).
   * "Sırayla" açıksa her mesajdan sonra taraf kendiliğinden değişir. 📝 Not: ortada görünen anlatım satırı.
   * Mesaja dokununca: tepki, cevap ver, düzenle, taraf değiştir, araya ekle, taşı, sil. 📷: fotoğraf mesajı. */
  const REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

  /* ---------- Efektler ve anahtar kelimeler (js/data/effects.js) ---------- */
  const FX = Stories.Effects;
  const fxById = id => FX.bubble.concat(FX.screen).find(f => f.id === id);
  const isScreenFx = id => FX.screen.some(f => f.id === id);
  const keywords = () => (S().keywords = S().keywords || []);
  const lower = s => (s || '').toLocaleLowerCase('tr');

  // Kelimenin metinde kaç kez geçtiği (büyük/küçük harf ve ekler fark etmez: "kahve" → "Kahveyi" de sayılır)
  function countIn(text, word) {
    const t = lower(text), w = lower(word);
    if (!w) return 0;
    let n = 0, i = 0;
    while ((i = t.indexOf(w, i)) !== -1) { n++; i += w.length; }
    return n;
  }

  // Mesajı yazanın kimliği: 'me', karakter id'si ya da null (not)
  const speakerIdOf = (t, m) => m.from === 'me' ? 'me' : m.from === 'her' ? (t.group ? m.who : t.charId) : null;

  // Mesajın efekti: kendisine seçilen > anahtar kelimeden gelen; 'none' = efektsiz.
  // Karaktere özel kelime sadece o karakterin mesajlarına, genel (charId yok) kelime herkese uygulanır.
  function effectOf(m, sid) {
    if (m.from === 'sys' || m.effect === 'none') return null;
    if (m.effect) return fxById(m.effect) ? m.effect : null;
    const k = keywords().find(x => x.effect && (!x.charId || x.charId === sid) && countIn(m.text, x.word));
    return k ? k.effect : null;
  }

  // Sayaç: karakterin kelimeyi kaç kez söylediği ve onunla olan sohbetlerde toplam kaç kez geçtiği
  function kwStats(k) {
    let said = 0, inChats = 0;
    threads().forEach(t => {
      if (k.charId && !(t.group ? t.members.includes(k.charId) : t.charId === k.charId)) return;
      msgsOf(t).forEach(m => {
        const n = countIn(m.text, k.word);
        if (!n) return;
        inChats += n;
        if (k.charId && speakerIdOf(t, m) === k.charId) said += n;
      });
    });
    return { said, inChats };
  }

  function burst(emojis, count = 22) {
    const layer = document.createElement('div');
    layer.className = 'burst';
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.textContent = emojis[i % emojis.length];
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDelay = Math.random() * 0.8 + 's';
      s.style.fontSize = 18 + Math.random() * 24 + 'px';
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 3000);
  }

  // Efekti oynat: ekran efekti emoji yağdırır, baloncuk efekti animasyonu baştan başlatır
  function playFx(el, id) {
    if (!id) return;
    if (isScreenFx(id)) { burst(fxById(id).emojis); return; }
    if (!el) return;
    el.classList.remove('play');
    void el.offsetWidth;
    el.classList.add('play');
  }

  // Efekt seçici. opts: { title, auto: "Otomatik (anahtar kelime)" seçeneği gösterilsin mi }
  function fxSheet(cur, opts, cb) {
    const item = f => `<button type="button" data-fx="${f.id}" class="${cur === f.id ? 'on' : ''}"><span>${f.icon}</span>${esc(f.label)}</button>`;
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>✨ ${esc(opts.title)}</h3>
      <div class="sec-title" style="margin-top:0">Baloncuk efektleri</div>
      <div class="fx-grid">${FX.bubble.map(item).join('')}</div>
      <div class="sec-title">Ekran efektleri</div>
      <div class="fx-grid">${FX.screen.map(item).join('')}</div>
      <div class="fx-grid" style="margin-top:12px">
        ${opts.auto ? `<button type="button" data-fx="auto" class="${!cur ? 'on' : ''}"><span>🔑</span>Otomatik</button>` : ''}
        <button type="button" data-fx="none" class="${cur === 'none' || (!opts.auto && !cur) ? 'on' : ''}"><span>🚫</span>Efekt yok</button>
      </div>
      ${opts.auto ? '<small class="mc-hint">Otomatik: mesajda efekt bağlı bir anahtar kelime geçiyorsa onun efekti kullanılır.</small>' : ''}`, 'light');
    sh.el.onclick = e => {
      const b = e.target.closest('[data-fx]');
      if (!b) return;
      sh.close();
      cb(b.dataset.fx);
    };
  }

  // 🔑 Anahtar kelimeler (karaktere özel): ekle/sil, karakterin kaç kez söylediğini say, efekt bağla.
  // opts: { chars: [karakter id] (verilmezse hepsi + Genel), list, speakerId(m), onChange }
  //   list verilirse o sohbetteki sayı da görünür
  function keywordSheet(opts = {}) {
    const ids = (opts.chars || chars().map(c => c.id)).filter(byId);
    const showGeneral = !opts.chars;
    if (!ids.length) { notify('Önce bir karakter oluştur', '🔑'); return; }
    let target = ids[0];
    const single = ids.length === 1 && !showGeneral;
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>🔑 ${single ? `${esc(byId(ids[0]).name)} · ` : ''}Anahtar kelimeler</h3>
      <p class="kw-help">Her karakterin kendi kelimeleri var. Uygulama karakterin bu kelimeleri kaç kez söylediğini sayar; efekt bağlarsan o karakterin kelimeyi geçirdiği mesajlar efektli görünür.</p>
      ${single ? '' : '<div class="kw-target" id="kwTarget"></div>'}
      <form id="kwForm" class="kw-add" autocomplete="off">
        <input id="kwIn" maxlength="30">
        <button class="btn primary sm" type="submit">Ekle</button>
      </form>
      <div id="kwList"></div>`, 'light');
    const listEl = sh.el.querySelector('#kwList');
    const inp = sh.el.querySelector('#kwIn');

    const row = k => {
      const st = kwStats(k);
      const ch = k.charId && byId(k.charId);
      let here = '';
      if (opts.list) {
        const n = opts.list.reduce((x, m) => x + (!k.charId || opts.speakerId(m) === k.charId ? countIn(m.text, k.word) : 0), 0);
        here = `<small>Bu sohbette <b>${n}</b></small>`;
      }
      const f = fxById(k.effect);
      return `<div class="kw-row">
        <div class="info"><b>${esc(k.word)}</b>
          ${ch ? `<small>${esc(ch.name)} <b>${st.said}</b> kez söyledi · sohbetlerinde toplam ${st.inChats}</small>` : `<small>Tüm sohbetlerde <b>${st.inChats}</b> kez</small>`}${here}</div>
        <button type="button" class="kw-fx ${f ? 'on' : ''}" data-kfx="${k.id}">${f ? `${f.icon} ${esc(f.label)}` : '✨ Efekt ekle'}</button>
        <button type="button" class="kw-del" data-kdel="${k.id}" aria-label="Sil">✕</button>
      </div>`;
    };

    const draw = () => {
      const tg = sh.el.querySelector('#kwTarget');
      if (tg) tg.innerHTML = `<small>Kimin kelimesi?</small><div class="kw-chars">${ids.map(id => `<button type="button" data-kt="${id}" class="${id === target ? 'on' : ''}">${avatar(byId(id), 26)}<span>${esc(byId(id).name)}</span></button>`).join('')}</div>`;
      inp.placeholder = `${byId(target).name} için kelime ekle (ör. kahve)`;
      const groups = ids.map(id => [byId(id), keywords().filter(k => k.charId === id)]).filter(([, ks]) => ks.length);
      const general = showGeneral ? keywords().filter(k => !k.charId) : [];
      listEl.innerHTML = groups.map(([c, ks]) => `${single ? '' : `<div class="kw-sec">${avatar(c, 24)}<b>${esc(c.name)}</b></div>`}${ks.map(row).join('')}`).join('') +
        (general.length ? `<div class="kw-sec">🌐 <b>Genel</b> <small>(tüm karakterler)</small></div>${general.map(row).join('')}` : '') ||
        '<div class="empty" style="padding:18px">Henüz anahtar kelime yok</div>';
    };
    const changed = () => { save(); draw(); if (opts.onChange) opts.onChange(); };
    draw();
    sh.el.onclick = e => {
      const b = e.target.closest('[data-kt]');
      if (b) { target = b.dataset.kt; draw(); inp.focus(); }
    };
    sh.el.querySelector('#kwForm').onsubmit = e => {
      e.preventDefault();
      const w = inp.value.trim();
      if (!w) return;
      if (keywords().some(k => k.charId === target && lower(k.word) === lower(w))) { notify('Bu kelime zaten var', '🔑'); return; }
      keywords().push({ id: Store.uid(), charId: target, word: w, effect: '' });
      inp.value = '';
      changed();
    };
    listEl.onclick = e => {
      const d = e.target.closest('[data-kdel]');
      if (d) { S().keywords = keywords().filter(k => k.id !== d.dataset.kdel); changed(); return; }
      const fb = e.target.closest('[data-kfx]');
      if (!fb) return;
      const k = keywords().find(x => x.id === fb.dataset.kfx);
      fxSheet(k.effect || 'none', { title: `“${k.word}” için efekt${k.charId && byId(k.charId) ? ` · ${byId(k.charId).name}` : ''}` }, v => {
        k.effect = v === 'none' ? '' : v;
        changed();
        if (k.effect && isScreenFx(k.effect)) playFx(null, k.effect);
      });
    };
  }

  // Kelime özeti çipleri: "kahve 3 🎉". c verilirse sadece o karakterinkiler, yoksa karaktere göre gruplu
  function kwSummary(c) {
    const chip = k => {
      const st = kwStats(k), f = fxById(k.effect);
      return `<span class="chip kw-chip">${esc(k.word)} <b>${k.charId ? st.said : st.inChats}</b>${f ? ` ${f.icon}` : ''}</span>`;
    };
    if (c) return `<div class="chips">${keywords().filter(k => k.charId === c.id).map(chip).join('')}</div>`;
    const rows = chars().map(ch => [ch, keywords().filter(k => k.charId === ch.id)]).filter(([, ks]) => ks.length);
    const general = keywords().filter(k => !k.charId);
    return rows.map(([ch, ks]) => `<div class="kw-sum">${avatar(ch, 28)}<div class="chips">${ks.map(chip).join('')}</div></div>`).join('') +
      (general.length ? `<div class="kw-sum"><span class="kw-globe">🌐</span><div class="chips">${general.map(chip).join('')}</div></div>` : '');
  }

  /* Sohbet teması (js/data/themes.js): sohbetin kendi teması > karakterin varsayılanı > Amor */
  const TH = Stories.Themes;
  const themeOf = (th, c) => Object.assign({ bg: 'amor', bubble: 'amor' }, c.theme || {}, th.theme || {});

  function bubbleVars(b, c) {
    const v = (k, val) => (val ? `--${k}:${val};` : '');
    return v('me-bg', b.me) + v('me-fg', b.meFg) + v('her-bg', b.her === 'char' ? grad(c) : b.her) + v('her-fg', b.herFg) +
      v('me-border', b.meBorder) + v('her-border', b.herBorder) + v('b-radius', b.radius) + v('b-tail', b.tail) +
      v('b-font', b.font) + v('b-shadow', b.shadow);
  }

  function themeCss(t, c) {
    const bg = t.bg === 'img' && t.img
      // en altta Amor degradesi: şeffaf (PNG) fotoğrafların arkası boş kalmasın
      ? `linear-gradient(rgba(14, 8, 30, .45), rgba(14, 8, 30, .8)), url("${t.img}") center / cover no-repeat, ${TH.backgrounds[0].css}`
      : (TH.backgrounds.find(b => b.id === t.bg) || TH.backgrounds[0]).css;
    return `background:${bg};` + bubbleVars(TH.bubbles.find(b => b.id === t.bubble) || TH.bubbles[0], c);
  }

  function renderChat(c, th) {
    th.opened = Date.now();
    save();
    const group = !!th.group;
    const list = msgsOf(th);
    const members = () => membersOf(th);
    const look = group ? { theme: null, colors: (members()[0] || {}).colors, name: th.title } : c; // tema için
    const speaker = m => (m.from !== 'her' ? null : group ? byId(m.who) : c) || GHOST;
    const nameOf = m => m.from === 'me' ? userName() : m.from === 'her' ? speaker(m).name : 'Not';
    // Grupta üyeye özel baloncuk rengi (th.memberColors[karakter id] = TH.memberColors sırası)
    const memberColor = ch => { const i = (th.memberColors || {})[ch.id]; return i == null ? null : TH.memberColors[i]; };
    const sidOf = m => speakerIdOf(th, m);
    const fxOf = m => effectOf(m, sidOf(m));
    const ctx = { list, group, speaker, memberColor, sid: sidOf, query: '' };

    // Kim yazıyor: 'me' ya da karakter id'si (grupta üyelerden biri). 'sys' = not.
    const order = () => ['me', ...(group ? th.members.filter(byId) : [c.id])];
    const saved = S().side[th.id];
    const cs = { side: 'me', who: null, before: null, mode: null, reply: null, playing: false, nextFx: null };
    const setKey = k => { if (k === 'me' || k === 'sys') { cs.side = k; } else { cs.side = 'her'; cs.who = k; } };
    if (group) setKey(order().includes(saved) ? saved : 'me');
    else setKey(saved === 'her' ? c.id : 'me');
    const keyOf = () => cs.side === 'her' ? cs.who : cs.side;
    const curChar = () => cs.side === 'her' ? (byId(cs.who) || GHOST) : null;
    const turns = () => S().turns[th.id] !== false;

    ui.undo = ui.undo || {};
    const stack = ui.undo[th.id] = ui.undo[th.id] || [];

    const head = group
      ? `<button class="who" type="button" id="groupHead">${groupAvatar(th, 40)}
          <div><b>${esc(th.title)}</b><small id="chatStatus"></small></div></button>`
      : `<a class="who" href="#/p/${c.id}">${avatar(c, 40)}
          <div><b>${esc(c.name)}</b><small id="chatStatus"></small></div></a>`;
    const meta = c ? [c.age, c.city, c.job, c.zodiac].filter(Boolean).map(esc).join(' | ') : '';
    const hcard = group
      ? `<div class="hcard group">
          <div class="g-members">${members().map(m => `<a class="gm" href="#/p/${m.id}">${avatar(m, 44)}<small>${esc(m.name)}</small></a>`).join('')}</div>
          <button class="mood-btn" id="groupBtn" type="button">👥<small>Düzenle</small></button>
        </div>`
      : `<div class="hcard">
          ${avatar(c, 58)}
          <div class="info">
            <div class="nm">${esc(c.name.toLocaleUpperCase('tr').split('').join(' '))}</div>
            <div class="meta">${meta || esc(c.bio || '')}</div>
            ${c.traits.length ? `<div class="meta traits">${esc(c.traits.slice(0, 4).join(' · '))}</div>` : ''}
            ${c.album.length ? `<div class="thumbs">${c.album.slice(0, 4).map((s, i) => `<img src="${esc(s)}" alt="" data-zoom="${i}">`).join('')}</div>` : ''}
          </div>
          <button class="mood-btn" id="threadBtn" type="button">🗂️<small>${esc(th.title)}</small></button>
        </div>`;

    const chatHtml = `
      <div class="chat">
        <div class="chat-head">
          <a class="icon-btn" href="#/messages" aria-label="Geri">${ICON.arrowLeft}</a>
          ${head}
          <button class="icon-btn" id="searchBtn" aria-label="Sohbette ara">${ICON.search}</button>
          <button class="icon-btn" id="moreBtn" aria-label="Menü">${ICON.more}</button>
        </div>
        <div class="search-bar" id="searchBar" hidden>
          <input id="sq" type="search" placeholder="Sohbette ara…" autocomplete="off">
          <span id="sCount"></span>
          <button type="button" id="sPrev" aria-label="Önceki">↑</button>
          <button type="button" id="sNext" aria-label="Sonraki">↓</button>
          <button type="button" id="sClose" aria-label="Aramayı kapat">✕</button>
        </div>

        ${hcard}

        <div class="msgs-wrap">
          <div class="msgs" id="msgs"></div>
          <button type="button" class="undo-pill" id="undoBtn" hidden></button>
        </div>

        <div class="mode-bar" id="modeBar" hidden></div>
        <div class="reply-bar" id="replyBar" hidden></div>
        ${group ? '<div class="spk-row" id="spkRow"></div>' : ''}
        <div class="side-hint" id="sideHint"></div>
        <form class="composer" id="composer" autocomplete="off">
          <button type="button" class="side-btn" id="sideBtn" aria-label="Kimin yazdığını değiştir"></button>
          <input id="msgInput" type="text" enterkeyhint="send" maxlength="1000">
          <button class="send-btn" type="submit" aria-label="Gönder">${ICON.send}</button>
        </form>
        <div class="chat-tools" id="chatTools">
          <button type="button" data-tool="theme"><span>🎨</span>Tema</button>
          <button type="button" data-tool="turns"><span>⇄</span>Sırayla</button>
          <button type="button" data-tool="photo"><span>📷</span>Fotoğraf</button>
          <button type="button" data-tool="note"><span>📝</span>Not</button>
          <button type="button" data-tool="fx"><span>✨</span>Efekt</button>
          <button type="button" data-tool="play"><span>▶️</span>Oynat</button>
        </div>
        <div class="play-bar" id="playBar" hidden>
          <button class="btn ghost sm" id="playSpeed">1x</button>
          <button class="btn pink sm" id="playStop">■ Durdur</button>
        </div>
      </div>`;

    if (wide()) {
      view.innerHTML = `<div class="split"><aside class="split-list">${messagesPanel(group ? th.id : c.id)}</aside>${chatHtml}</div>`;
      bindRows($('.split-list'));
    } else {
      view.innerHTML = chatHtml;
    }

    const input = $('#msgInput');
    const box = $('#msgs');
    const draw = target => { drawMessages(ctx, cs, target); markHits(); };

    function setStatus(text, cls = '') {
      const el = $('#chatStatus');
      el.textContent = text;
      el.className = cls;
    }

    function drawComposer() {
      const side = cs.side;
      const ch = curChar();
      const who = ch ? ch.name : side === 'me' ? userName() : 'Not';
      $('#composer').className = `composer as-${side}`;
      $('#sideBtn').innerHTML = side === 'sys' ? '<span class="note-ico">📝</span>' : ch ? avatar(ch, 40) : userAvatar(40);
      input.placeholder = side === 'sys' ? 'Anlatım / not yaz…' : `${who} olarak yaz…`;
      $('#sideHint').innerHTML = side === 'sys'
        ? '📝 Not yazıyorsun · ortada görünür'
        : `<b class="${side}">${esc(who)}</b> yazıyor${side === 'her' ? ' · solda' : ' · sağda'}${turns() ? ' · ⇄ sırayla' : ''}`;
      if (group) {
        $('#spkRow').innerHTML = order().map(k => {
          const m = k === 'me' ? null : byId(k);
          return `<button type="button" data-spk="${k}" class="${keyOf() === k ? 'on' : ''}">${m ? avatar(m, 26) : userAvatar(26)}<span>${esc(m ? m.name : userName())}</span></button>`;
        }).join('');
      }
      $('[data-tool=turns]').classList.toggle('on', turns());
      $('[data-tool=note]').classList.toggle('on', side === 'sys');
      // ✨ sonraki mesajın efekti
      const nf = fxById(cs.nextFx);
      $('[data-tool=fx]').classList.toggle('on', !!nf);
      $('#composer .send-btn').classList.toggle('fx-armed', !!nf);
      if (nf) $('#sideHint').innerHTML += ` · <span class="fx-next">${nf.icon} ${esc(nf.label)} ile gidecek <button type="button" id="fxClear" aria-label="Efekti kaldır">✕</button></span>`;
      const fc = $('#fxClear');
      if (fc) fc.onclick = () => { cs.nextFx = null; drawComposer(); };
      const n = list.filter(m => m.from !== 'sys').length;
      setStatus(group ? `${members().map(m => m.name).join(', ')} · ${n} mesaj` : `${th.title} · ${n} mesaj`);
    }

    function setSide(k) {
      setKey(k);
      if (k !== 'sys') { S().side[th.id] = group ? k : (k === 'me' ? 'me' : 'her'); save(); }
      drawComposer();
    }
    // Sıradaki konuşan: sen → karakter (grupta sen → üye 1 → üye 2 → …)
    const nextKey = k => { const o = order(); return o[(o.indexOf(k) + 1) % o.length]; };

    function drawMode() {
      const bar = $('#modeBar');
      if (!cs.mode) { bar.hidden = true; return; }
      const m = list.find(x => x.id === cs.mode.id);
      bar.hidden = false;
      bar.innerHTML = `<span>${cs.mode.type === 'edit' ? (m && m.type === 'photo' ? '✏️ Fotoğraf açıklaması düzenleniyor' : '✏️ Mesaj düzenleniyor') : `➕ “${esc(m ? preview(m) : '')}” mesajının üstüne ekleniyor`}</span><button type="button" id="cancelMode" aria-label="Vazgeç">✕</button>`;
      $('#cancelMode').onclick = cancelMode;
    }

    function drawReply() {
      const bar = $('#replyBar');
      const m = cs.reply && list.find(x => x.id === cs.reply);
      if (!m) { cs.reply = null; bar.hidden = true; return; }
      bar.hidden = false;
      bar.innerHTML = `<div class="rq"><b>↩️ ${esc(nameOf(m))}</b><span>${esc(preview(m))}</span></div><button type="button" id="cancelReply" aria-label="Cevabı iptal et">✕</button>`;
      $('#cancelReply').onclick = () => { cs.reply = null; drawReply(); };
    }

    function cancelMode() {
      if (cs.mode && cs.mode.type === 'edit') input.value = '';
      cs.mode = null;
      drawMode();
      draw();
    }

    /* ---------- Geri alma (↶): her değişiklikten önce mesajların kopyası saklanır ---------- */
    function snap(label) {
      stack.push({ label, msgs: JSON.parse(JSON.stringify(list)) });
      if (stack.length > 40) stack.shift();
      drawUndo();
    }
    function drawUndo() {
      const b = $('#undoBtn');
      if (!b) return;
      const last = stack[stack.length - 1];
      b.hidden = !last || cs.playing;
      if (last) b.innerHTML = `↶ Geri al <small>· ${esc(last.label)}</small>`;
    }
    function undo() {
      const s = stack.pop();
      if (!s) { notify('Geri alınacak bir şey yok', '↶'); return; }
      list.splice(0, list.length, ...s.msgs);
      cs.mode = null;
      cs.reply = null;
      input.value = '';
      save();
      drawMode(); drawReply(); drawComposer(); draw(); drawUndo(); refreshList();
      notify(`Geri alındı: ${s.label}`, '↶');
    }

    function setWho(m) {
      if (cs.side === 'her' && group) m.who = cs.who; else delete m.who;
    }

    // Yeni mesaj ekler ya da düzenlenen mesajı günceller. extra: fotoğraf için { type, src }
    function send(text, extra) {
      const editing = cs.mode && cs.mode.type === 'edit';
      let newId = null;
      snap(editing ? 'Mesaj düzenlendi' : extra ? 'Fotoğraf gönderildi' : cs.side === 'sys' ? 'Not eklendi' : 'Mesaj gönderildi');
      let target = null;
      if (editing) {
        const m = list.find(x => x.id === cs.mode.id);
        if (m) {
          m.text = text;
          if (!(m.type === 'photo' && cs.side === 'sys')) { m.from = cs.side; setWho(m); }
          target = m.id;
        }
        cs.mode = null;
      } else {
        const m = Object.assign({ id: Store.uid(), from: cs.side, text, ts: Date.now() }, extra || {});
        setWho(m);
        if (cs.nextFx && cs.side !== 'sys') { m.effect = cs.nextFx; cs.nextFx = null; }
        newId = m.id;
        if (cs.reply) m.reply = cs.reply;
        cs.reply = null;
        if (cs.mode) {
          // Üstüne ekleme modu açık kalır; art arda eklenenler sırayla hedefin üstüne dizilir
          const i = list.findIndex(x => x.id === cs.mode.id);
          if (i >= 0) m.ts = list[i].ts;
          list.splice(i < 0 ? list.length : i, 0, m);
          target = m.id;
        } else list.push(m);
      }
      save();
      if (cs.side === 'sys') setSide(cs.before || 'me');
      else if (turns() && !editing) setSide(nextKey(keyOf()));
      else drawComposer();
      drawMode();
      drawReply();
      draw(target);
      refreshList();
      if (newId) { const m = list.find(x => x.id === newId); playFx(box.querySelector(`[data-id="${newId}"]`), m && fxOf(m)); }
    }

    $('#composer').onsubmit = e => {
      e.preventDefault();
      const t = input.value.trim();
      const editingPhoto = cs.mode && cs.mode.type === 'edit' && (list.find(x => x.id === cs.mode.id) || {}).type === 'photo';
      if ((!t && !editingPhoto) || cs.playing) return;
      input.value = '';
      send(t);
      input.focus();
    };
    input.onkeydown = e => {
      if (e.key !== 'Escape') return;
      if (cs.mode) cancelMode();
      else if (cs.reply) { cs.reply = null; drawReply(); }
    };

    $('#sideBtn').onclick = () => { setSide(nextKey(cs.side === 'sys' ? (cs.before || 'me') : keyOf())); input.focus(); };
    if (group) $('#spkRow').onclick = e => { const b = e.target.closest('[data-spk]'); if (b) { setSide(b.dataset.spk); input.focus(); } };
    $('#chatTools').onclick = e => {
      const b = e.target.closest('[data-tool]');
      if (!b) return;
      const t = b.dataset.tool;
      if (t === 'theme') themeSheet();
      if (t === 'turns') {
        S().turns[th.id] = !turns();
        save();
        drawComposer();
        notify(turns() ? 'Sırayla: her mesajdan sonra sıradaki kişi yazar' : 'Sırayla kapalı: konuşan sen değiştirene kadar aynı kalır', '⇄');
      }
      if (t === 'note') {
        if (cs.side === 'sys') setSide(cs.before || 'me');
        else { cs.before = keyOf(); setSide('sys'); }
        input.focus();
      }
      if (t === 'photo') photoSheet();
      if (t === 'fx') fxSheet(cs.nextFx, { title: 'Sonraki mesajın efekti' }, v => { cs.nextFx = v === 'none' || v === 'auto' ? null : v; drawComposer(); input.focus(); });
      if (t === 'play') play();
    };
    $('.hcard').onclick = e => {
      const z = e.target.closest('[data-zoom]');
      if (z && c) lightbox(c.album, +z.dataset.zoom);
      if (e.target.closest('#threadBtn')) threadSheet();
      if (e.target.closest('#groupBtn')) groupSheet(th);
    };
    if (group) $('#groupHead').onclick = () => groupSheet(th);
    $('#moreBtn').onclick = e => { e.stopPropagation(); toggleMenu(); };
    $('#undoBtn').onclick = undo;

    /* ---------- 🔍 Arama ---------- */
    const sr = { hits: [], cur: -1 };
    function openSearch() {
      $('#searchBar').hidden = false;
      $('#sq').focus();
      $('#sq').select();
    }
    function closeSearch() {
      $('#searchBar').hidden = true;
      $('#sq').value = '';
      ctx.query = '';
      sr.hits = [];
      draw();
    }
    function runSearch() {
      const q = $('#sq').value.trim().toLocaleLowerCase('tr');
      ctx.query = q;
      sr.hits = q ? list.filter(m => (m.text || '').toLocaleLowerCase('tr').includes(q)).map(m => m.id) : [];
      sr.cur = sr.hits.length - 1; // en yeniden başla
      drawMessages(ctx, cs);
      markHits(true);
    }
    function markHits(jump) {
      const cnt = $('#sCount');
      if (!ctx.query) { cnt.textContent = ''; return; }
      cnt.textContent = sr.hits.length ? `${sr.cur + 1}/${sr.hits.length}` : '0 sonuç';
      box.querySelectorAll('.hit-cur').forEach(x => x.classList.remove('hit-cur'));
      const el = sr.hits.length && box.querySelector(`[data-id="${sr.hits[sr.cur]}"]`);
      if (el) { el.classList.add('hit-cur'); if (jump) el.scrollIntoView({ block: 'center' }); }
    }
    const step = d => { if (!sr.hits.length) return; sr.cur = (sr.cur + d + sr.hits.length) % sr.hits.length; markHits(true); };
    $('#searchBtn').onclick = () => ($('#searchBar').hidden ? openSearch() : closeSearch());
    $('#sq').oninput = runSearch;
    $('#sq').onkeydown = e => {
      if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? 1 : -1); }
      if (e.key === 'Escape') closeSearch();
    };
    $('#sPrev').onclick = () => step(-1);
    $('#sNext').onclick = () => step(1);
    $('#sClose').onclick = closeSearch;

    // Ctrl+Z: geri al, Ctrl+F: ara
    ui.chatKeys = e => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || cs.playing) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !(document.activeElement === input && input.value) && document.activeElement !== $('#sq')) { e.preventDefault(); undo(); }
      if (k === 'f') { e.preventDefault(); openSearch(); }
    };

    // 📷 Fotoğraf: cihazdan ya da albümlerden. Yazma alanındaki metin açıklama olur.
    function photoSheet() {
      if (cs.side === 'sys') setSide(cs.before || 'me');
      if (cs.mode && cs.mode.type === 'edit') cancelMode();
      const ch = curChar();
      const who = ch ? ch.name : userName();
      const albums = (ch ? [ch] : group ? members() : [c]).filter(m => m.album.length);
      const srcs = [];
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>📷 Fotoğraf gönder</h3>
        <div class="photo-who">${esc(who)} olarak gönderilecek${input.value.trim() ? ' · yazdığın metin açıklama olur' : ''}</div>
        <label class="btn ghost block photo-up">📁 Cihazdan seç<input type="file" accept="image/*" id="phFile" hidden></label>
        ${albums.map(m => `<div class="sec-title">${esc(m.name)} albümü</div>
          <div class="pick-photos">${m.album.map(s => `<button type="button" data-ph="${srcs.push(s) - 1}"><img src="${esc(s)}" alt="" loading="lazy"></button>`).join('')}</div>`).join('')}`, 'light');
      const go = src => {
        sh.close();
        const caption = input.value.trim();
        input.value = '';
        send(caption, { type: 'photo', src });
      };
      sh.el.querySelector('#phFile').onchange = async e => {
        const f = e.target.files[0];
        if (!f) return;
        try { go(await readPhoto(f, 720, false)); } catch (err) { notify('Fotoğraf okunamadı', '⚠️'); }
      };
      sh.el.querySelectorAll('[data-ph]').forEach(b => b.onclick = () => go(srcs[+b.dataset.ph]));
    }

    // 🎨 Tema: arka plan (renk, karakter fotoğrafları ya da yüklenen fotoğraf) ve baloncuk stili
    function themeSheet() {
      const cur = () => themeOf(th, look);
      const albums = group ? members().flatMap(m => m.album) : c.album;
      const imgs = [...new Set([look.theme && look.theme.img, th.theme && th.theme.img, ...albums].filter(Boolean))];
      const t0 = cur();
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>🎨 Sohbet teması</h3>
        <div class="sec-title" style="margin-top:0">Arka plan</div>
        <div class="bg-grid">
          ${TH.backgrounds.map(b => `<button type="button" data-bg="${b.id}" class="${t0.bg === b.id ? 'on' : ''}" style="background:${b.css}"><span>${esc(b.label)}</span></button>`).join('')}
          ${imgs.map((src, i) => `<button type="button" data-img="${i}" class="${t0.bg === 'img' && t0.img === src ? 'on' : ''}" style="background:url('${esc(src)}') center / cover no-repeat, ${TH.backgrounds[0].css}"><span>📷</span></button>`).join('')}
          <label class="up">➕<span>Fotoğraf yükle</span><input type="file" accept="image/*" id="bgFile" hidden></label>
        </div>
        <div class="sec-title">Baloncuklar</div>
        <div class="bub-grid">
          ${TH.bubbles.map(b => `<button type="button" data-bub="${b.id}" class="${t0.bubble === b.id ? 'on' : ''}">
            <div class="mini" style="${esc(bubbleVars(b, look))}"><i class="h">Selam 👋</i><i class="m">Merhaba!</i></div><span>${esc(b.id === 'char' && group ? 'Her üye kendi rengi' : b.label)}</span></button>`).join('')}
        </div>
        ${group ? `<div class="sec-title">Üye renkleri</div>
          <div class="mc-list">${members().map(m => {
            const ci = (th.memberColors || {})[m.id];
            return `<div class="mc-row">${avatar(m, 32)}<b>${esc(m.name)}</b><div class="mc-sw">
              <button type="button" class="def ${ci == null ? 'on' : ''}" data-mc="${m.id}" data-ci="-1" title="Baloncuk stiline göre">–</button>
              ${TH.memberColors.map((p, i) => `<button type="button" class="${ci === i ? 'on' : ''}" data-mc="${m.id}" data-ci="${i}" style="background:linear-gradient(135deg,${p[0]},${p[1]})" aria-label="Renk ${i + 1}"></button>`).join('')}
            </div></div>`;
          }).join('')}</div>
          <small class="mc-hint">Seçtiğin renk, baloncuk stilinden bağımsız olarak o üyenin baloncuklarına uygulanır. “–” stile geri döner.</small>`
          : `<label class="flt-row"><span>${esc(c.name)} ile açılacak yeni sohbetlerde de kullan</span><input type="checkbox" id="thDef" checked></label>`}`, 'light');
      const el = sh.el;
      el.querySelectorAll('[data-mc]').forEach(b => b.onclick = () => {
        const id = b.dataset.mc, ci = +b.dataset.ci;
        th.memberColors = th.memberColors || {};
        if (ci < 0) delete th.memberColors[id]; else th.memberColors[id] = ci;
        save();
        el.querySelectorAll(`[data-mc="${id}"]`).forEach(x => x.classList.toggle('on', x === b));
        draw();
      });
      const set = patch => {
        th.theme = Object.assign(cur(), patch);
        const def = el.querySelector('#thDef');
        if (def && def.checked) c.theme = Object.assign({}, th.theme);
        save();
        applyTheme();
        el.querySelectorAll('[data-bg], [data-img]').forEach(b => b.classList.toggle('on',
          b.dataset.bg ? th.theme.bg === b.dataset.bg : th.theme.bg === 'img' && th.theme.img === imgs[+b.dataset.img]));
        el.querySelectorAll('[data-bub]').forEach(b => b.classList.toggle('on', th.theme.bubble === b.dataset.bub));
      };
      el.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => set({ bg: b.dataset.bg }));
      el.querySelectorAll('[data-img]').forEach(b => b.onclick = () => set({ bg: 'img', img: imgs[+b.dataset.img] }));
      el.querySelectorAll('[data-bub]').forEach(b => b.onclick = () => set({ bubble: b.dataset.bub }));
      el.querySelector('#bgFile').onchange = async e => {
        const f = e.target.files[0];
        if (!f) return;
        try { set({ bg: 'img', img: await readPhoto(f, 1080, false) }); sh.close(); notify('Arka plan değişti', '🎨'); }
        catch (err) { notify('Fotoğraf okunamadı', '⚠️'); }
      };
    }

    function applyTheme() {
      const el = $('.chat');
      if (!el) return;
      const t = themeOf(th, look);
      el.style.cssText = themeCss(t, look);
      // grupta "Karakter rengi": her üyenin baloncuğu kendi renginde
      el.classList.toggle('sbub-char', group && t.bubble === 'char');
    }

    // Bu karakterin diğer sohbetleri
    function threadSheet() {
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>🗂️ ${esc(c.name)} ile sohbetler</h3>
        ${threadsOf(c).map(t => `<button class="act ${t.id === th.id ? 'cur' : ''}" data-th="${t.id}">${t.id === th.id ? '💬' : '🗂️'} ${esc(t.title)} <small>· ${msgsOf(t).length} mesaj</small></button>`).join('')}
        ${groupsOf(c).map(t => `<button class="act" data-th="${t.id}">👥 ${esc(t.title)} <small>· grup</small></button>`).join('')}
        <button class="act" data-th="new">➕ Yeni sohbet</button>
        <button class="act" data-th="group">👥 ${esc(c.name)} ile grup kur</button>
        <button class="act" data-th="rename">✏️ Bu sohbetin adını değiştir</button>`, 'light');
      sh.el.onclick = e => {
        const b = e.target.closest('[data-th]');
        if (!b) return;
        sh.close();
        const v = b.dataset.th;
        if (v === 'new') createThread(c);
        else if (v === 'group') groupSheet(null, c.id);
        else if (v === 'rename') renameThread(th, render);
        else if (v !== th.id) location.hash = `#/chat/${v}`;
      };
    }

    // Konuşanı değiştir (grupta: sen ya da üyelerden biri)
    function speakerSheet(m) {
      const cur = m.from === 'me' ? 'me' : m.who;
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>👤 Bu mesajı kim yazsın?</h3>
        ${order().map(k => {
          const ch = k === 'me' ? null : byId(k);
          return `<button class="act spk-act ${k === cur ? 'cur' : ''}" data-k="${k}">${ch ? avatar(ch, 32) : userAvatar(32)} ${esc(ch ? ch.name : userName())}</button>`;
        }).join('')}`, 'light');
      sh.el.onclick = e => {
        const b = e.target.closest('[data-k]');
        if (!b) return;
        sh.close();
        if (b.dataset.k === cur) return;
        snap('Konuşan değişti');
        if (b.dataset.k === 'me') { m.from = 'me'; delete m.who; } else { m.from = 'her'; m.who = b.dataset.k; }
        save(); draw(m.id); refreshList();
      };
    }

    // Mesaja dokununca: tepki, cevap ver, düzenle, konuşanı değiştir, araya ekle, taşı, sil
    box.onclick = e => {
      if (cs.playing) return;
      const q = e.target.closest('[data-q]');
      if (q) {
        const o = box.querySelector(`[data-id="${q.dataset.q}"]`);
        if (o) { o.scrollIntoView({ block: 'center', behavior: 'smooth' }); o.classList.add('flash'); setTimeout(() => o.classList.remove('flash'), 1200); }
        return;
      }
      const el = e.target.closest('[data-id]');
      if (!el) return;
      const m = list.find(x => x.id === el.dataset.id);
      const i = list.indexOf(m);
      const photo = m.type === 'photo';
      // Efekt rozetine dokununca efekt yeniden oynar; görünmez mürekkep ilk dokunuşta açılır
      if (e.target.closest('.fx-tag')) { playFx(el, fxOf(m)); return; }
      if (el.classList.contains('fx-ink') && !el.classList.contains('shown')) { el.classList.add('shown'); return; }
      const fxNow = fxOf(m), fxDef = fxById(fxNow);
      const flipLabel = group ? '👤 Konuşanı değiştir' : `🔁 ${m.from === 'me' ? `${esc(c.name)} yazsın` : 'Ben yazayım'}`;
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <div class="row-act-head msg-prev">${photo ? `<img class="prev-img" src="${esc(m.src)}" alt="">` : ''}${m.from !== 'sys' && group ? `<b>${esc(nameOf(m))}:</b> ` : ''}${esc(m.text)}</div>
        ${m.from !== 'sys' ? `<div class="react-row">${REACTIONS.map(r => `<button type="button" data-react="${r}" class="${m.react === r ? 'on' : ''}">${r}</button>`).join('')}</div>` : ''}
        ${m.from !== 'sys' ? '<button class="act" data-act="reply">↩️ Cevap ver</button>' : ''}
        ${photo ? '<button class="act" data-act="zoom">🔍 Fotoğrafı büyüt</button>' : ''}
        ${m.from !== 'sys' ? `<button class="act" data-act="fx">✨ Efekt${fxDef ? `: ${fxDef.icon} ${esc(fxDef.label)}${m.effect ? '' : ' <small>(anahtar kelime)</small>'}` : ''}</button>` : ''}
        ${fxDef ? '<button class="act" data-act="fxplay">▶️ Efekti oynat</button>' : ''}
        <button class="act" data-act="edit">✏️ ${photo ? 'Açıklamayı düzenle' : 'Düzenle'}</button>
        ${m.from !== 'sys' ? `<button class="act" data-act="flip">${flipLabel}</button>` : ''}
        <button class="act" data-act="insert">➕ Üstüne mesaj ekle</button>
        ${i > 0 ? '<button class="act" data-act="up">⬆️ Yukarı taşı</button>' : ''}
        ${i < list.length - 1 ? '<button class="act" data-act="down">⬇️ Aşağı taşı</button>' : ''}
        <button class="act danger" data-act="del">🗑️ Sil <small>(↶ ile geri alınabilir)</small></button>`, 'light');
      sh.el.onclick = ev => {
        const rb = ev.target.closest('[data-react]');
        if (rb) {
          sh.close();
          snap('Tepki');
          if (m.react === rb.dataset.react) delete m.react; else m.react = rb.dataset.react;
          save();
          draw(m.id);
          return;
        }
        const b = ev.target.closest('[data-act]');
        if (!b) return;
        sh.close();
        const a = b.dataset.act;
        if (a === 'zoom') { lightbox([m.src]); return; }
        if (a === 'fxplay') { playFx(box.querySelector(`[data-id="${m.id}"]`), fxNow); return; }
        if (a === 'fx') {
          fxSheet(m.effect || null, { title: 'Mesaj efekti', auto: true }, v => {
            snap('Efekt');
            if (v === 'auto') delete m.effect; else m.effect = v;
            save();
            draw(m.id);
            playFx(box.querySelector(`[data-id="${m.id}"]`), fxOf(m));
          });
          return;
        }
        if (a === 'reply') {
          cs.reply = m.id;
          if (cs.mode && cs.mode.type === 'edit') { cs.mode = null; input.value = ''; drawMode(); }
          // Kendi mesajına cevap yazmasın: sıradaki kişiye geç
          const mk = m.from === 'me' ? 'me' : (group ? m.who : c.id);
          if (turns() && keyOf() === mk) setSide(nextKey(mk));
          drawReply(); input.focus();
          return;
        }
        if (a === 'edit') {
          cs.mode = { type: 'edit', id: m.id };
          cs.reply = null; drawReply();
          if (m.from === 'sys') cs.before = cs.side === 'sys' ? cs.before : keyOf();
          setSide(m.from === 'sys' ? 'sys' : m.from === 'me' ? 'me' : (group ? m.who : c.id));
          input.value = m.text;
          drawMode(); draw(m.id); input.focus();
          return;
        }
        if (a === 'insert') {
          if (cs.mode && cs.mode.type === 'edit') input.value = '';
          cs.mode = { type: 'insert', id: m.id };
          drawMode(); draw(m.id); input.focus();
          return;
        }
        if (a === 'flip') {
          if (group) { speakerSheet(m); return; }
          snap('Konuşan değişti');
          m.from = m.from === 'me' ? 'her' : 'me';
        }
        if (a === 'up' || a === 'down') {
          snap('Mesaj taşındı');
          const j = a === 'up' ? i - 1 : i + 1;
          const ts = list[i].ts;
          list[i].ts = list[j].ts;
          list[j].ts = ts;
          [list[i], list[j]] = [list[j], list[i]];
        }
        if (a === 'del') {
          snap('Mesaj silindi');
          list.splice(i, 1);
          if (cs.mode && cs.mode.id === m.id) { cs.mode = null; input.value = ''; drawMode(); }
          if (cs.reply === m.id) cs.reply = null;
          drawReply();
        }
        save();
        drawComposer();
        draw(a === 'del' ? null : m.id);
        refreshList();
      };
    };

    function clearAll() {
      if (!list.length || !confirm('Bu sohbetteki tüm mesajlar silinsin mi? (↶ ile geri alınabilir)')) return;
      snap('Sohbet temizlendi');
      list.splice(0, list.length);
      cs.mode = null; cs.reply = null;
      save(); drawMode(); drawReply(); drawComposer(); draw(); refreshList();
    }

    function toggleMenu() {
      const old = $('.menu');
      if (old) { old.remove(); return; }
      const menu = document.createElement('div');
      menu.className = 'menu';
      const pinKey = group ? th.id : c.id;
      menu.innerHTML = (group
        ? '<button data-a="group">👥 Grubu düzenle</button>'
        : `<button data-a="profile">👤 Profili gör</button>
          <button data-a="threads">🗂️ ${esc(c.name)} ile sohbetler</button>
          <button data-a="new">➕ Yeni sohbet</button>
          <button data-a="rename">✏️ Sohbetin adını değiştir</button>`) + `
        <button data-a="search">🔍 Sohbette ara</button>
        <button data-a="keywords">🔑 Anahtar kelimeler</button>
        ${stack.length ? `<button data-a="undo">↶ Geri al · ${esc(stack[stack.length - 1].label)}</button>` : ''}
        <button data-a="pin">📌 ${isPinned(pinKey) ? 'Sabitlemeyi kaldır' : 'En üste sabitle'}</button>
        <button data-a="play">▶️ Sohbeti oynat</button>
        <button data-a="copy">📋 Metin olarak kopyala</button>
        <button data-a="clear" class="danger">🧹 Mesajları temizle</button>
        <button data-a="delete" class="danger">🗑️ ${group ? 'Grubu sil' : 'Sohbeti sil'}</button>`;
      $('.chat').appendChild(menu);
      menu.onclick = e => {
        const b = e.target.closest('button');
        const a = b && b.dataset.a;
        if (a === 'profile') location.hash = `#/p/${c.id}`;
        if (a === 'group') groupSheet(th);
        if (a === 'threads') threadSheet();
        if (a === 'new') createThread(c);
        if (a === 'rename') renameThread(th, render);
        if (a === 'search') openSearch();
        if (a === 'keywords') keywordSheet({ chars: group ? th.members : [c.id], list, speakerId: sidOf, onChange: () => draw() });
        if (a === 'undo') undo();
        if (a === 'pin') togglePin(pinKey);
        if (a === 'play') play();
        if (a === 'copy') copyText(`${group ? th.title : `${c.name} · ${th.title}`}\n\n` + list.map(m => m.from === 'sys' ? `[${m.text}]` : `${nameOf(m)}: ${m.type === 'photo' ? '[📷 Fotoğraf] ' : ''}${m.text}`).join('\n'));
        if (a === 'clear') clearAll();
        if (a === 'delete' && deleteThread(th)) location.hash = group ? '#/messages' : `#/p/${c.id}`;
        menu.remove();
      };
      setTimeout(() => document.addEventListener('click', function off() { menu.remove(); document.removeEventListener('click', off); }), 0);
    }

    /* Oynat: sohbet baştan, karakter "yazıyor…" diye tek tek gelir. Ekrana dokunmak hızlandırır. */
    function play() {
      if (!list.length) { notify('Oynatmak için önce birkaç mesaj yaz', '▶️'); return; }
      if (!$('#searchBar').hidden) closeSearch();
      const all = list.slice();
      cs.playing = true;
      cs.mode = null;
      cs.reply = null;
      drawMode();
      drawReply();
      drawUndo();
      let i = 0, speed = 1, typingEl = null;
      const dock = ['#composer', '#chatTools', '#sideHint', '#spkRow'].map(s => $(s)).filter(Boolean);
      dock.forEach(el => { el.hidden = true; });
      $('#playBar').hidden = false;
      $('#playSpeed').textContent = '1x';
      box.innerHTML = '';

      const reveal = () => {
        clearTimeout(playTimer);
        if (typingEl) { typingEl.remove(); typingEl = null; }
        box.insertAdjacentHTML('beforeend', itemHtml(ctx, all[i], all[i - 1]));
        playFx(box.querySelector(`[data-id="${all[i].id}"]`), fxOf(all[i]));
        i++;
        setStatus(`${i} / ${all.length}`);
        box.scrollTop = box.scrollHeight;
        playTimer = setTimeout(next, 650 / speed);
      };
      const next = () => {
        if (i >= all.length) return stop();
        const m = all[i];
        if (m.from === 'her' && !typingEl) {
          const ch = speaker(m);
          box.insertAdjacentHTML('beforeend', `<div class="msg her" id="typingRow">${avatar(ch, 36)}<div class="bubble"><span class="typing-dots"><i></i><i></i><i></i></span></div></div>`);
          typingEl = $('#typingRow');
          setStatus(group ? `${ch.name} yazıyor…` : 'yazıyor…', 'typing');
          box.scrollTop = box.scrollHeight;
          playTimer = setTimeout(reveal, Math.min(2600, 600 + (m.type === 'photo' ? 40 : m.text.length * 40)) / speed);
        } else playTimer = setTimeout(reveal, (m.from === 'me' ? 500 : 300) / speed);
      };
      function stop() {
        clearTimeout(playTimer);
        cs.playing = false;
        dock.forEach(el => { el.hidden = false; });
        $('#playBar').hidden = true;
        drawComposer();
        draw();
        drawUndo();
      }
      box.onpointerdown = () => { if (cs.playing && i < all.length) reveal(); };
      $('#playStop').onclick = stop;
      $('#playSpeed').onclick = () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; $('#playSpeed').textContent = speed + 'x'; };
      playTimer = setTimeout(next, 500);
    }

    applyTheme();
    drawComposer();
    draw();
    drawUndo();
  }

  function copyText(text) {
    if (!navigator.clipboard) { notify('Kopyalanamadı', '📋'); return; }
    navigator.clipboard.writeText(text).then(() => notify('Kopyalandı', '📋'), () => notify('Kopyalanamadı', '📋'));
  }

  // Aramada eşleşen kısımları <mark> ile işaretler (q küçük harfle gelir)
  function highlight(text, q) {
    if (!q) return esc(text);
    const low = text.toLocaleLowerCase('tr');
    let out = '', i = 0, j;
    while ((j = low.indexOf(q, i)) !== -1) {
      out += esc(text.slice(i, j)) + '<mark>' + esc(text.slice(j, j + q.length)) + '</mark>';
      i = j + q.length;
    }
    return out + esc(text.slice(i));
  }

  // Tek mesaj (gerekirse üstünde saat damgası). ctx: { list, group, speaker(m), query }
  function itemHtml(ctx, m, prev) {
    const { list } = ctx;
    const txt = s => highlight(s || '', ctx.query);
    let html = '';
    if (!prev || m.ts - prev.ts > 10 * 60 * 1000) html += `<div class="stamp">${fmtTime(m.ts)}</div>`;
    if (m.from === 'sys') return html + `<div class="sys" data-id="${m.id}">${txt(m.text)}</div>`;

    const cont = prev && prev.from === m.from && (prev.who || '') === (m.who || '') && !html;
    const o = m.reply && list.find(x => x.id === m.reply);
    const oName = o ? (o.from === 'me' ? userName() : o.from === 'her' ? ctx.speaker(o).name : 'Not') : '';
    const quote = m.reply ? `<div class="quote" data-q="${esc(m.reply)}"><b>${esc(oName)}</b><span>${o ? esc(preview(o)) : 'Silinmiş mesaj'}</span></div>` : '';
    const body = m.type === 'photo'
      ? `<img class="ph" src="${esc(m.src)}" alt="">${m.text ? `<div class="cap">${txt(m.text)}</div>` : ''}`
      : txt(m.text);
    const react = m.react ? `<span class="react">${m.react}</span>` : '';
    // Efekt: baloncuk efekti sınıf olarak, ekran efekti dokununca yeniden oynayan bir rozet olarak
    const fx = effectOf(m, ctx.sid(m));
    const fxTag = fx && isScreenFx(fx) ? `<button type="button" class="fx-tag" aria-label="Efekti oynat">${fxById(fx).icon}</button>` : '';
    const bubble = `<div class="bubble${m.type === 'photo' ? ' photo' : ''}${quote ? ' has-quote' : ''}">${quote}${body}${react}${fxTag}</div>`;
    const cls = `${m.react ? ' reacted' : ''}${ctx.query && (m.text || '').toLocaleLowerCase('tr').includes(ctx.query) ? ' hit' : ''}${fx && !isScreenFx(fx) ? ` fx fx-${fx}` : ''}`;
    if (m.from === 'her') {
      const ch = ctx.speaker(m);
      if (!ctx.group) return html + `<div class="msg her ${cont ? 'cont' : ''}${cls}" data-id="${m.id}">${avatar(ch, 36)}${bubble}</div>`;
      // Grup: ilk mesajda isim, baloncuk rengi için üyenin rengi
      const mc = ctx.memberColor && ctx.memberColor(ch);
      const name = cont ? '' : `<span class="who-name" style="color:${esc((mc || ch.colors)[0])}">${esc(ch.name)}</span>`;
      const bg = mc ? `linear-gradient(135deg,${mc[0]},${mc[1]})` : grad(ch);
      return html + `<div class="msg her ${cont ? 'cont' : ''}${mc ? ' mc' : ''}${cls}" data-id="${m.id}" style="--who-bg:${esc(bg)}">${avatar(ch, 36)}<div class="col">${name}${bubble}</div></div>`;
    }
    return html + `<div class="msg me${cls}" data-id="${m.id}"><span class="seen">${ICON.check}</span>${bubble}</div>`;
  }

  function drawMessages(ctx, cs, target) {
    const box = $('#msgs');
    if (!box) return;
    const msgs = ctx.list;
    box.innerHTML = msgs.length
      ? msgs.map((m, i) => itemHtml(ctx, m, msgs[i - 1])).join('')
      : `<div class="sys">${ctx.group ? 'Grupta' : `${esc(ctx.speaker({ from: 'her' }).name)} ile`} hikayeni yazmaya başla 💌<br>Alttaki avatara dokunarak kimin yazdığını değiştirebilirsin.</div>`;
    if (cs && cs.mode) { const t = box.querySelector(`[data-id="${cs.mode.id}"]`); if (t) t.classList.add('target'); }
    const t = target && box.querySelector(`[data-id="${target}"]`);
    if (t) t.scrollIntoView({ block: 'center' });
    else if (!ctx.query) {
      box.scrollTop = box.scrollHeight;
      // fotoğraflar sonradan yüklenip yüksekliği değiştirince yine en alta in
      box.querySelectorAll('img.ph').forEach(img => img.addEventListener('load', () => { box.scrollTop = box.scrollHeight; }, { once: true }));
    }
  }

  /* ---------- Karakter oluştur / düzenle ---------- */
  const MAX_ALBUM = 8;
  const blankChar = () => ({
    id: null, set: '', name: '', gender: '♀', age: '', city: '', job: '', zodiac: '', bio: '', traits: [], tags: [], about: '',
    photo: '', album: [], colors: T.colors[chars().length % T.colors.length], created: 0
  });

  /* Hazır karakterler: characters/<set>/ klasörlerindeki fotoğraf setleri (js/data/photos.js) */
  const SETS = Stories.PHOTO_SETS || [];
  const P = Stories.Pools;
  const photoUrl = (s, file) => `characters/${encodeURIComponent(s.id)}/${s.dir}${encodeURIComponent(file)}`;
  const setName = s => { const n = s.id.replace(/[_\-\s]*\d+$/, '').replace(/[_-]+/g, ' ').trim(); return n.charAt(0).toLocaleUpperCase('tr') + n.slice(1); };
  const usedSets = d => new Set(chars().filter(c => c.set && c.id !== d.id).map(c => c.set));

  const pick = a => a[Math.floor(Math.random() * a.length)];
  const sample = (a, n) => [...a].sort(() => Math.random() - 0.5).slice(0, n);
  const groupItems = id => T.groups.find(g => g.id === id).items;

  function applySet(d, s) {
    const prev = SETS.find(x => x.id === d.set);
    // İsim boşsa ya da önceki setten geldiyse yeni setin adını al
    if (!d.name || (prev && d.name === setName(prev))) d.name = setName(s);
    d.set = s.id;
    d.mod = 'amor';
    d.photo = photoUrl(s, s.profile);
    d.album = [s.profile, ...s.photos].slice(0, MAX_ALBUM).map(f => photoUrl(s, f));
  }

  /* Modlar (js/data/mods.js): her modun hazır karakter listesi { id, name, thumb, apply(d) } */
  const MODS = Stories.MODS || [];
  const modOf = id => MODS.find(m => m.id === id) || MODS[0];
  const modIcon = m => /^mods\//.test(m.icon) ? `<img class="mi" src="${esc(m.icon)}" alt="">` : `<span class="mi">${m.icon}</span>`;

  // Mod karakteri: profil, kişilik, albüm ve sohbet arka planı hazır gelir
  function applyPreset(d, m, p) {
    Object.assign(d, {
      set: `${m.id}:${p.key}`, mod: m.id, name: p.name, gender: p.gender, age: p.age, city: p.city, job: p.job,
      zodiac: p.zodiac, bio: p.bio, traits: [...p.traits], about: p.about, photo: p.photo,
      album: p.album.slice(0, MAX_ALBUM), colors: p.colors
    });
    if (p.bg) d.theme = { bg: 'img', img: p.bg, bubble: 'amor' };
  }

  function presets(modId) {
    if (modId === 'amor') return SETS.map(s => ({ id: s.id, name: setName(s), thumb: photoUrl(s, s.profile), apply: d => applySet(d, s) }));
    const m = modOf(modId);
    return (m.characters || []).map(p => ({ id: `${m.id}:${p.key}`, name: p.name, thumb: p.photo, apply: d => applyPreset(d, m, p) }));
  }

  // 🎲: tek alanı ya da ('all') hepsini rastgele belirler
  function randomize(d, k) {
    const mod = ui.createMod || 'amor';
    if ((k === 'all' || k === 'set') && mod !== 'amor') {
      // Mod karakterleri tam profil olarak gelir; sadece hangisi olacağı rastgele
      const list = presets(mod);
      const used = usedSets(d);
      const free = list.filter(p => !used.has(p.id) && p.id !== d.set);
      if (list.length) pick(free.length ? free : list).apply(d);
      return;
    }
    if (k === 'all') { delete d.theme; d.traits = []; d.about = ''; }
    if (k === 'all' || k === 'set') {
      if (SETS.length) {
        const used = usedSets(d);
        const free = SETS.filter(s => !used.has(s.id) && s.id !== d.set);
        if (k === 'all') d.name = '';
        applySet(d, pick(free.length ? free : SETS));
      }
      if (k === 'set') return;
      if (!SETS.length) d.name = pick(P.names[d.gender]);
    }
    if (k === 'name') d.name = pick(P.names[d.gender]);
    if (k === 'all' || k === 'age') d.age = String(P.age[0] + Math.floor(Math.random() * (P.age[1] - P.age[0] + 1)));
    if (k === 'all' || k === 'place') { d.city = pick(P.cities); d.job = pick(P.jobs); }
    if (k === 'all' || k === 'zodiac') d.zodiac = pick(T.zodiacs);
    if (k === 'all' || k === 'bio') d.bio = pick(P.bios);
    T.groups.forEach(g => {
      if (k !== 'all' && k !== g.id) return;
      const n = g.id === 'personality' ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
      d.traits = d.traits.filter(t => !g.items.includes(t)).concat(sample(groupItems(g.id), n));
    });
    if (k === 'all' || k === 'color') d.colors = pick(T.colors);
  }

  function renderCreate(id) {
    const key = id || 'new';
    if (!ui.create || ui.create.key !== key) {
      const orig = id && byId(id);
      const d = orig ? JSON.parse(JSON.stringify(orig)) : blankChar();
      if (orig) ui.createMod = orig.mod || 'amor';
      else randomize(d, 'all'); // Amor gibi: yeni karakter hazır bir öneriyle başlar
      ui.create = { key, d };
    }
    const d = ui.create.d;
    const mod = modOf(ui.createMod || 'amor');
    const list = presets(mod.id);
    const back = id ? `#/p/${id}` : '#/home';
    const preset = (val, on, attr) => `<button type="button" ${attr}="${esc(val)}" class="${on ? 'on' : ''}">${esc(val)}</button>`;
    const dice = k => `<button type="button" class="dice-btn" data-dice="${k}" aria-label="Rastgele">🎲</button>`;
    const custom = d.traits.filter(t => !T.all.includes(t));
    const used = usedSets(d);
    const stripScroll = $('.sets') ? $('.sets').scrollLeft : null;

    view.innerHTML = `
      <div class="create">
        <div class="editor-head">
          <a class="icon-btn" href="${back}" aria-label="Geri">${ICON.arrowLeft}</a>
          <h1>${id ? 'Karakteri Düzenle' : 'Karakter Oluştur'}</h1>
          <button class="chip dice-all" id="allDice">🎲 Hepsi</button>
        </div>

        <div class="ctrl">
          <div class="row2"><span>⭐ Hazır karakterler</span>${dice('set')}</div>
          <div class="mod-tabs">${MODS.map(m => `<button type="button" data-mod="${m.id}" class="${m.id === mod.id ? 'on' : ''}">${modIcon(m)}${esc(m.name)}</button>`).join('')}</div>
          <small class="mod-desc">${esc(mod.desc || '')}</small>
          <div class="sets">
            ${list.map(p => `
              <button type="button" class="set ${p.id === d.set ? 'on' : ''} ${used.has(p.id) ? 'used' : ''}" data-set="${esc(p.id)}">
                <img src="${esc(p.thumb)}" alt="" loading="lazy">
                <span>${used.has(p.id) ? 'kullanımda' : esc(p.name)}</span>
              </button>`).join('') || '<div class="empty" style="padding:16px">Bu modda karakter yok</div>'}
          </div>
          ${!id && mod.id !== 'amor' && list.some(p => !used.has(p.id)) ? `<button type="button" class="btn ghost block" id="addAll" style="margin-top:10px">➕ Tüm ${esc(mod.name)} karakterlerini ekle (${list.filter(p => !used.has(p.id)).length})</button>` : ''}
        </div>

        <div class="ctrl">
          <div class="row2"><span>📸 Profil fotoğrafı</span><small>kare kırpılır</small></div>
          <div class="photo-pick">
            <label class="pp">${avatar(Object.assign({}, d, { name: d.name || '+' }), 96)}<span class="cam">📷</span>
              <input type="file" accept="image/*" id="photoIn" hidden></label>
            <div class="pp-side">
              <small>Mesajlarda ve profilde görünür.</small>
              ${d.photo ? '<button type="button" class="chip" id="rmPhoto">Fotoğrafı kaldır</button>' : ''}
            </div>
          </div>
        </div>

        <div class="ctrl">
          <div class="row2"><span>🖼️ Albüm</span><small>${d.album.length}/${MAX_ALBUM} · ilki kapak olur</small></div>
          <div class="album-strip">
            ${d.album.map((src, i) => `<div class="ph"><img src="${esc(src)}" alt=""><button type="button" class="rm" data-rm="${i}" aria-label="Sil">✕</button></div>`).join('')}
            ${d.album.length < MAX_ALBUM ? '<label class="ph add">+<input type="file" accept="image/*" multiple id="albumIn" hidden></label>' : ''}
          </div>
        </div>

        <div class="ctrl">
          <div class="row2"><span>✍️ İsim</span>${dice('name')}</div>
          <input type="text" id="cName" maxlength="24" value="${esc(d.name)}" placeholder="ör. Elif">
        </div>

        <div class="ctrl">
          <div class="row2"><span>👤 Cinsiyet ve yaş</span>${dice('age')}</div>
          <div class="presets">${preset('♀', d.gender === '♀', 'data-gender')}${preset('♂', d.gender === '♂', 'data-gender')}</div>
          <input type="text" id="cAge" inputmode="numeric" maxlength="3" value="${esc(d.age)}" placeholder="Yaş">
        </div>

        <div class="ctrl">
          <div class="row2"><span>📍 Şehir ve meslek</span>${dice('place')}</div>
          <input type="text" id="cCity" maxlength="30" value="${esc(d.city)}" placeholder="Şehir (ör. İzmir)">
          <input type="text" id="cJob" maxlength="30" value="${esc(d.job)}" placeholder="Meslek (ör. Mimar)">
        </div>

        <div class="ctrl">
          <div class="row2"><span>✦ Burç</span>${dice('zodiac')}</div>
          <div class="presets">${T.zodiacs.map(z => preset(z, d.zodiac === z, 'data-zodiac')).join('')}</div>
        </div>

        <div class="ctrl">
          <div class="row2"><span>💬 Durum <small>profilde görünen kısa söz</small></span>${dice('bio')}</div>
          <input type="text" id="cBio" maxlength="80" value="${esc(d.bio)}" placeholder="ör. kahvesiz konuşmam ☕">
        </div>

        ${T.groups.map(g => `
          <div class="ctrl">
            <div class="row2"><span>${esc(g.label)} <small>birden çok seçebilirsin</small></span>${dice(g.id)}</div>
            <div class="presets">${g.items.map(t => preset(t, d.traits.includes(t), 'data-trait')).join('')}</div>
          </div>`).join('')}

        <div class="ctrl">
          <div class="row2"><span>➕ Diğer özellikler</span></div>
          ${custom.length ? `<div class="presets">${custom.map(t => `<button type="button" class="on x" data-trait="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
          <input type="text" id="cCustom" maxlength="30" placeholder="Özellik yaz ve Enter'a bas">
        </div>

        <div class="ctrl">
          <div class="row2"><span>🏷️ Etiketler</span><small>profilde ve ana sayfada görünür</small></div>
          ${(d.tags || []).length ? `<div class="presets">${d.tags.map(t => `<button type="button" class="on x" data-tagrm="${esc(t)}">🏷️ ${esc(t)}</button>`).join('')}</div>` : ''}
          <input type="text" id="cTag" maxlength="24" placeholder="Etiket yaz ve Enter'a bas (ör. ex sevgili, iş arkadaşı)">
        </div>

        <div class="ctrl">
          <div class="row2"><span>📝 Hakkında</span><small>geçmişi, sırları, ilişkileri</small></div>
          <textarea id="cAbout" rows="4" maxlength="2000" placeholder="Nasıl konuşur, neyi sever, kimden hoşlanır...">${esc(d.about)}</textarea>
        </div>

        <div class="ctrl">
          <div class="row2"><span>🎨 Renk <small>fotoğraf yoksa avatar ve kapak</small></span>${dice('color')}</div>
          <div class="swatches">${T.colors.map((p, i) => `<button type="button" class="sw ${p.join() === (d.colors || []).join() ? 'on' : ''}" data-color="${i}" style="background:linear-gradient(135deg,${p[0]},${p[1]})" aria-label="Renk ${i + 1}"></button>`).join('')}</div>
        </div>

        <div class="sec-title" style="margin:18px 16px 8px">Önizleme</div>
        <div class="preview" id="pv">${previewHtml(d)}</div>

        <div class="actions" style="padding-bottom:calc(20px + var(--safe-b))">
          ${id ? '<button class="btn ghost" id="delBtn" style="color:#ff2d55">🗑️ Sil</button>' : '<button class="btn ghost" id="clearBtn">Temizle</button>'}
          <button class="btn primary" id="saveBtn">${id ? '💾 Kaydet' : '✨ Oluştur'}</button>
        </div>
      </div>`;

    if (stripScroll !== null) $('.sets').scrollLeft = stripScroll;
    else if ($('.set.on')) $('.set.on').scrollIntoView({ inline: 'center', block: 'nearest' });

    const redraw = () => { const y = window.scrollY; renderCreate(id); window.scrollTo(0, y); };
    view.querySelectorAll('[data-set]').forEach(b => b.onclick = () => { list.find(p => p.id === b.dataset.set).apply(d); redraw(); });
    view.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => {
      if (ui.createMod === b.dataset.mod) return;
      ui.createMod = b.dataset.mod;
      $('.sets').scrollLeft = 0;
      // yeni karakterde o moddan baştan bir öneri getir
      if (!id) { ui.create.d = blankChar(); randomize(ui.create.d, 'all'); }
      redraw();
    });
    if ($('#addAll')) $('#addAll').onclick = () => {
      const used0 = usedSets({});
      const fresh = list.filter(p => !used0.has(p.id));
      fresh.forEach(p => { const c = blankChar(); p.apply(c); c.id = Store.uid(); c.created = Date.now(); chars().push(c); });
      save();
      ui.create = null;
      notify(`${fresh.length} ${mod.name} karakteri eklendi`, '✨');
      location.hash = '#/home';
    };
    view.querySelectorAll('[data-dice]').forEach(b => b.onclick = () => { randomize(d, b.dataset.dice); redraw(); });
    $('#allDice').onclick = () => { randomize(d, 'all'); redraw(); };
    const pv = () => { $('#pv').innerHTML = previewHtml(d); };
    const bindText = (sel, k, fn) => { const el = $(sel); el.oninput = () => { d[k] = fn ? fn(el) : el.value; }; el.onchange = pv; };
    bindText('#cName', 'name');
    bindText('#cAge', 'age', el => (el.value = el.value.replace(/\D/g, '')));
    bindText('#cCity', 'city');
    bindText('#cJob', 'job');
    bindText('#cBio', 'bio');
    bindText('#cAbout', 'about');

    $('#photoIn').onchange = async e => {
      const f = e.target.files[0];
      if (!f) return;
      try { d.photo = await readPhoto(f, 320, true); d.set = ''; redraw(); } catch (err) { notify('Fotoğraf okunamadı', '⚠️'); }
    };
    if ($('#rmPhoto')) $('#rmPhoto').onclick = () => { d.photo = ''; d.set = ''; redraw(); };
    if ($('#albumIn')) $('#albumIn').onchange = async e => {
      for (const f of [...e.target.files].slice(0, MAX_ALBUM - d.album.length)) {
        try { d.album.push(await readPhoto(f, 720, false)); } catch (err) { notify('Fotoğraf okunamadı', '⚠️'); }
      }
      redraw();
    };
    view.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { d.album.splice(+b.dataset.rm, 1); redraw(); });

    view.querySelectorAll('[data-gender]').forEach(b => b.onclick = () => {
      d.gender = b.dataset.gender;
      view.querySelectorAll('[data-gender]').forEach(x => x.classList.toggle('on', x === b));
      pv();
    });
    view.querySelectorAll('[data-zodiac]').forEach(b => b.onclick = () => {
      d.zodiac = d.zodiac === b.dataset.zodiac ? '' : b.dataset.zodiac;
      view.querySelectorAll('[data-zodiac]').forEach(x => x.classList.toggle('on', x.dataset.zodiac === d.zodiac));
      pv();
    });
    view.querySelectorAll('[data-trait]').forEach(b => b.onclick = () => {
      const t = b.dataset.trait;
      d.traits = d.traits.includes(t) ? d.traits.filter(x => x !== t) : d.traits.concat(t);
      if (T.all.includes(t)) { b.classList.toggle('on'); pv(); } else redraw();
    });
    $('#cCustom').onkeydown = e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const t = e.target.value.trim();
      if (t && !d.traits.includes(t)) { d.traits.push(t); redraw(); $('#cCustom').focus(); }
    };
    $('#cTag').onkeydown = e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const t = e.target.value.trim().replace(/^#/, '');
      d.tags = d.tags || [];
      if (t && !d.tags.some(x => lower(x) === lower(t))) { d.tags.push(t); redraw(); $('#cTag').focus(); }
    };
    view.querySelectorAll('[data-tagrm]').forEach(b => b.onclick = () => { d.tags = d.tags.filter(t => t !== b.dataset.tagrm); redraw(); });
    view.querySelectorAll('[data-color]').forEach(b => b.onclick = () => {
      d.colors = T.colors[+b.dataset.color];
      redraw();
    });
    if ($('#clearBtn')) $('#clearBtn').onclick = () => { ui.create = { key: 'new', d: blankChar() }; renderCreate(null); window.scrollTo(0, 0); };
    if ($('#delBtn')) $('#delBtn').onclick = () => removeChar(byId(id));

    $('#saveBtn').onclick = () => {
      d.name = d.name.trim();
      if (!d.name) { notify('Karaktere bir isim ver', '✍️'); $('#cName').focus(); return; }
      let c = id && byId(id);
      if (c) Object.assign(c, d);
      else {
        c = Object.assign(d, { id: Store.uid(), created: Date.now() });
        chars().push(c);
      }
      save();
      ui.create = null;
      ui.profileTab = 'profile';
      notify(id ? 'Kaydedildi' : `${c.name} oluşturuldu`, '✨');
      location.hash = `#/p/${c.id}`;
    };
  }

  function previewHtml(d) {
    const cover = d.album[0] || d.photo;
    return `
      <div class="pv-photo" style="background:${grad(d)}">
        ${cover ? `<img src="${esc(cover)}" alt="">` : `<div class="pv-letter">${initial(d.name || '?')}</div>`}
        <div class="pv-over">
          <b>${esc(d.name || 'İsim')}</b>
          <div class="chips">${infoChips(d)}${d.job ? `<span class="chip">${esc(d.job)}</span>` : ''}</div>
        </div>
      </div>
      <div class="pv-body">
        ${d.bio ? `<div class="pv-bio">“${esc(d.bio)}”</div>` : ''}
        <div class="chips">${d.traits.map(t => `<span class="chip">💜 ${esc(t)}</span>`).join('') || '<span class="chip">Henüz özellik seçilmedi</span>'}</div>
        ${d.about ? `<div class="about" style="margin-top:10px;white-space:pre-wrap">${esc(d.about)}</div>` : ''}
      </div>`;
  }

  /* ---------- Ben ---------- */
  function renderMe() {
    const u = S().user;
    const chatsCount = threads().length;
    const totalMsgs = chars().reduce((n, c) => n + msgCount(c), 0);

    view.innerHTML = `
      <div class="me-head">
        <div class="row-me">
          <label class="me-photo">${userAvatar(76)}<span class="cam">📷</span><input type="file" accept="image/*" id="uPhoto" hidden></label>
          <div>
            <div class="nm">${esc(u.name || 'İsimsiz')}</div>
            <div class="chips" style="margin-top:6px">
              ${u.age ? `<span class="chip" style="background:#3b82f6;color:#fff">🎂 ${esc(u.age)}</span>` : ''}
              <span class="chip loc">📍 ${esc(u.city || 'Türkiye')}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="me-card card">
        <div class="stats" style="margin-top:0">
          <div><b>${chars().length}</b><span>Karakter</span></div>
          <div><b>${chatsCount}</b><span>Sohbet</span></div>
          <div><b>${totalMsgs}</b><span>Mesaj</span></div>
        </div>
      </div>

      <div class="me-menu card">
        <a href="#/create"><span class="mi">✨</span>Karakter oluştur</a>
        <a href="#/messages"><span class="mi">💬</span>Mesajlar</a>
        <a role="button" data-act="backup"><span class="mi">💾</span>Yedekle</a>
        <a role="button" data-act="restore"><span class="mi">📂</span>Yedekten yükle</a>
      </div>
      <input type="file" id="restoreIn" accept=".json,application/json" hidden>

      <div class="page-pad narrow">
        ${installCard()}
        <div class="card">
          <div class="sec-title" style="margin-top:0">Profilin</div>
          <div class="field"><label>Adın</label><input id="uName" maxlength="20" value="${esc(u.name)}" placeholder="Sohbetlerde senin adın"></div>
          <div class="field"><label>Yaşın</label><input id="uAge" inputmode="numeric" maxlength="2" value="${esc(u.age)}"></div>
          <div class="field"><label>Şehrin</label><input id="uCity" maxlength="20" value="${esc(u.city)}"></div>
          ${u.photo ? '<button class="btn ghost block" id="uPhotoRm" style="margin-top:12px">Fotoğrafımı kaldır</button>' : ''}
        </div>

        <div class="card" style="margin-top:12px">
          <div class="sec-title" style="margin-top:0">🔑 Anahtar kelimeler</div>
          ${keywords().length ? kwSummary(null)
            : '<div class="about">Her karaktere takip etmek istediğin kelimeleri ekle; uygulama karakterin onları kaç kez söylediğini sayar, istersen geçtikleri mesajlara efekt ekler.</div>'}
          <button class="btn ghost block" id="kwBtn" style="margin-top:12px">🔑 Anahtar kelimeleri düzenle</button>
        </div>

        <div class="card" style="margin-top:12px">
          <div class="sec-title" style="margin-top:0">Amor Stories nasıl çalışır?</div>
          <div class="about">
            Burada yapay zeka yok, hikayeyi sen yazarsın.<br><br>
            • <b>Oluştur</b> sekmesinden karakterini fotoğrafı, albümü ve kişilik özellikleriyle oluştur.<br>
            • Sohbette alttaki avatara (ya da 🔁 Taraf) dokunarak <b>kimin yazdığını</b> seç: sen sağda, karakter solda.<br>
            • <b>⇄ Sırayla</b> açıksa her mesajdan sonra taraf kendiliğinden değişir.<br>
            • <b>📝 Not</b> ortada görünen bir anlatım satırı ekler.<br>
            • Bir karakterle birden çok <b>adlı sohbet</b> açabilirsin: profilinde ➕ ya da sohbette 🗂️. Ana sayfadaki 💬 son kaldığın sohbeti açar.<br>
            • Bir mesaja dokunarak ❤️ tepki verebilir, ↩️ cevaplayabilir, düzenleyebilir, tarafını değiştirebilir, üstüne mesaj ekleyebilir ya da taşıyabilirsin.<br>
            • <b>📷 Fotoğraf</b>: cihazından ya da karakterin albümünden fotoğraf mesajı gönder.<br>
            • <b>▶️ Oynat</b> sohbeti baştan, karakter "yazıyor…" diye tek tek gösterir.<br>
            • Tüm veriler sadece bu tarayıcıda (<code>localStorage</code>) saklanır. Başka cihaza taşımak için <b>Yedekle</b>.
          </div>
        </div>

        <button class="btn ghost block" id="resetAll" style="margin-top:14px;color:#ff2d55">Tüm verileri sıfırla</button>
      </div>`;

    const ib = $('#installBtn');
    if (ib) ib.onclick = async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; renderMe(); };
    const bind = (sel, k) => $(sel).onchange = () => { u[k] = $(sel).value.trim(); save(); renderMe(); };
    bind('#uName', 'name'); bind('#uAge', 'age'); bind('#uCity', 'city');
    $('#uPhoto').onchange = async e => {
      const f = e.target.files[0];
      if (!f) return;
      try { u.photo = await readPhoto(f, 320, true); save(); renderMe(); } catch (err) { notify('Fotoğraf okunamadı', '⚠️'); }
    };
    if ($('#uPhotoRm')) $('#uPhotoRm').onclick = () => { u.photo = ''; save(); renderMe(); };

    $('#kwBtn').onclick = () => keywordSheet({ onChange:() => { const y = window.scrollY; renderMe(); window.scrollTo(0, y); } });
    $('[data-act=backup]').onclick = () => {
      const blob = new Blob([JSON.stringify({ format: 'amor-stories-backup', version: 1, state: S() })], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `amor-stories-yedek-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $('[data-act=restore]').onclick = () => $('#restoreIn').click();
    $('#restoreIn').onchange = async e => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!data || data.format !== 'amor-stories-backup' || !data.state) throw new Error('format');
        if (!confirm('Yedek yüklensin mi? Bu cihazdaki karakterlerin ve sohbetlerin yedektekilerle değiştirilir.')) return;
        if (!Store.replace(data.state)) notify('Depolama dolu, yedek tam yüklenemedi', '⚠️');
        else notify('Yedek yüklendi', '📂');
        location.hash = '#/home';
        render();
      } catch (err) {
        notify('Bu dosya bir Amor Stories yedeği değil', '⚠️');
      }
    };
    $('#resetAll').onclick = () => {
      if (!confirm('Tüm karakterler ve sohbetler silinsin mi? Bu geri alınamaz.')) return;
      Store.reset();
      ui.create = null;
      location.hash = '#/home';
      render();
    };
  }

  /* ---------- Telefona yükleme (PWA) ---------- */
  let installPrompt = null;
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    if (ui.route && ui.route.name === 'me') renderMe();
  });

  function installCard() {
    if (standalone() || !installPrompt) return '';
    return `<div class="card install"><span>📲</span><div><b>Amor Stories'i telefonuna yükle</b><small>Ana ekrandan uygulama gibi açılır, internetsiz de çalışır.</small></div><button class="btn sm pink" id="installBtn">Yükle</button></div>`;
  }

  /* ---------- Başlat ---------- */
  window.addEventListener('hashchange', render);
  document.addEventListener('keydown', e => { if (ui.chatKeys) ui.chatKeys(e); });
  wideMQ.addEventListener('change', () => { if (['messages', 'chat'].includes(ui.route.name)) render(); });
  render();
  setTimeout(() => $('#splash').classList.add('hide'), 700);
})();
