/*
 * Rastgele karakter havuzları (🎲 düğmeleri buradan seçer)
 * Kadın isimleri, şehirler, meslekler ve isim süsleri Amor'un havuzundan gelir: js/data/amor-pools.js
 * (Amor/js/data/pools.js'in kopyası; Amor'da güncellersen dosyayı tekrar kopyalaman yeterli).
 *   eras   : isim dönemi → isimler (trend, modern, klasik, olgun); eraAge: dönem → yaş aralığı
 *   jobObjs: { title, min, max } meslekler (yaşa uygun olan seçilir)
 *   decos / styles / brackets / nicknames: 🎀 süslü isim için
 * Aşağıdaki listeler Amor havuzu yoksa ya da erkek karakterler için kullanılır; kendin de ekleme yapabilirsin.
 */
window.Stories = window.Stories || {};

Stories.Pools = (() => {
  const A = window.Amor || {};
  const own = {
  names: {
    '♀': ['Elif', 'Zeynep', 'Defne', 'Ece', 'Azra', 'Duru', 'Nehir', 'Melis', 'Ceren', 'Selin', 'İpek', 'Derin',
      'Asya', 'Lara', 'Ada', 'Su', 'Buse', 'Gizem', 'Yaren', 'Damla', 'Irmak', 'Naz', 'Beren', 'Esila'],
    '♂': ['Mert', 'Emir', 'Kerem', 'Arda', 'Can', 'Deniz', 'Ege', 'Kaan', 'Alp', 'Barış', 'Efe', 'Yiğit',
      'Onur', 'Burak', 'Doruk', 'Aras', 'Tuna', 'Umut', 'Ozan', 'Batu']
  },
  age: [18, 32],
  cities: ['İstanbul', 'İzmir', 'Ankara', 'Antalya', 'Bursa', 'Eskişehir', 'Muğla', 'Trabzon', 'Mersin', 'Çanakkale',
    'Kocaeli', 'Adana', 'Samsun', 'Konya', 'Denizli', 'Tekirdağ'],
  jobs: ['Öğrenci', 'Mimar', 'Grafik tasarımcı', 'Hemşire', 'Avukat', 'Barista', 'Yazılımcı', 'Fotoğrafçı',
    'Öğretmen', 'Psikolog', 'Diş hekimi', 'DJ', 'Model', 'Kuaför', 'Muhasebeci', 'Pilot', 'Veteriner',
    'Aşçı', 'İç mimar', 'Sosyal medya uzmanı', 'Doktor', 'Mühendis'],
  bios: ['kahvesiz konuşmam ☕', 'gece kuşu 🌙', 'bir gün her şey güzel olacak', 'deniz kokusu > her şey',
    'az konuşur çok düşünür', 'playlistim ruh halimdir 🎧', 'kitap, kedi, yağmur', 'hayat kısa, tatlı ye 🍰',
    'kendi filminin başrolü 🎬', 'ne olursan ol yine gel', 'sessiz ama derin', 'bugün de güneşi bekliyorum ☀️',
    'yolculuklar ve fotoğraflar 📸', 'dramaya yer yok', 'önce kahve sonra dünya', 'kalbim kırık ama makyajım yerinde 💄']
  };

  const eras = A.NAMES || null;
  const allAmor = eras ? Object.values(eras).reduce((a, l) => a.concat(l), []) : [];
  return Object.assign(own, {
    names: { '♀': allAmor.length ? allAmor : own.names['♀'], '♂': own.names['♂'] },
    eras,
    eraAge: A.NAME_AGE || {},
    cities: A.CITIES ? A.CITIES.map(c => c.name) : own.cities,
    cityObjs: A.CITIES || [],
    jobs: A.JOBS ? [...new Set(A.JOBS.map(j => j.title).concat(own.jobs))] : own.jobs,
    jobObjs: A.JOBS || [],
    decos: A.NAME_DECOS || [],
    styles: A.NAME_STYLES || [['', 1]],
    brackets: A.NAME_BRACKETS || [['(', ')']],
    nicknames: A.NICKNAMES || []
  });
})();
