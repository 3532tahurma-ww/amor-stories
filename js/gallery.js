/*
 * 🖼️ Lara Gallery: GitHub Pages'te yayındaki galeriden fotoğraf çekme.
 * Albümler galerinin repo'sundaki photos/<albüm>/ klasörleridir; liste GitHub API'den (herkese açık repo, anahtar gerekmez),
 * albüm bilgileri (kategori, etiket, kapak) photos/albums.json'dan, resimler GitHub Pages adresinden gelir.
 * Liste bu tarayıcıda 30 dakika saklanır (GitHub saatte 60 isteğe izin verir); 🔄 ile hemen yenilenir.
 * Başka bir galeri için aşağıdaki ayarları değiştir.
 */
window.Stories = window.Stories || {};

Stories.Gallery = (() => {
  const CFG = {
    name: 'Lara Gallery',
    owner: '3532tahurma-ww', repo: 'lara-gallery', branch: 'main', dir: 'photos',
    site: 'https://3532tahurma-ww.github.io/lara-gallery/'
  };
  const KEY = 'amor-stories:gallery', TTL = 30 * 60 * 1000;
  const IMAGE_RE = /\.(jpe?g|png|gif|webp|avif)$/i;
  const enc = p => p.split('/').map(encodeURIComponent).join('/');
  const url = path => CFG.site + enc(path);

  let data = null, pending = null;
  try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}

  // { albums: [{ name, category, tags, cover, photos: [url] }], ts }
  async function fetchAll() {
    const tree = await fetch(`https://api.github.com/repos/${CFG.owner}/${CFG.repo}/git/trees/${encodeURIComponent(CFG.branch)}?recursive=1`,
      { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
    if (!tree.ok) throw new Error(tree.status === 403 ? 'GitHub istek sınırı doldu, biraz sonra dene' : `Galeri okunamadı (${tree.status})`);
    let meta = {};
    try { const r = await fetch(url(`${CFG.dir}/albums.json`), { cache: 'no-store' }); if (r.ok) meta = (await r.json()).albums || {}; } catch (e) {}
    const by = {};
    (await tree.json()).tree.forEach(i => {
      const parts = i.path.split('/');
      if (i.type !== 'blob' || parts[0] !== CFG.dir || !IMAGE_RE.test(i.path) || parts.length > 3) return;
      const album = parts.length === 3 ? parts[1] : '';
      (by[album] = by[album] || []).push(i.path);
    });
    // dosya adları yükleme zamanıyla başlar: yeniden eskiye
    const stamp = p => Number(p.split('/').pop().split('-')[0]) || 0;
    const albums = Object.keys(by).sort((a, b) => a.localeCompare(b, 'tr')).map(name => {
      const paths = by[name].sort((a, b) => stamp(b) - stamp(a) || a.localeCompare(b));
      const m = meta[name] || {};
      return { name: name || 'Albümsüz', category: m.category || '', tags: m.tags || [],
               cover: m.cover && paths.includes(m.cover) ? url(m.cover) : url(paths[0]), photos: paths.map(url) };
    });
    return { albums, ts: Date.now() };
  }

  // force: önbelleği beklemeden yenile. Hata olursa eldeki liste kullanılır.
  function load(force) {
    if (!force && data && Date.now() - data.ts < TTL) return Promise.resolve(data);
    if (pending) return pending;
    pending = fetchAll().then(d => {
      data = d;
      try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
      return d;
    }).catch(e => { if (data) return data; throw e; }).finally(() => { pending = null; });
    return pending;
  }

  return { name: CFG.name, site: CFG.site, load, cached: () => data };
})();

// Oluştur → Hazır karakterler: her albüm bir karakter seti
if (Stories.MODS) Stories.MODS.push({ id: 'lara', name: 'Lara Gallery', icon: '🖼️', desc: 'Lara Gallery albümleri: her albüm bir karakter (fotoğraflar albüme ve profile gelir).', gallery: true });
