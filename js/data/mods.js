/*
 * Karakter modları: Oluştur ekranındaki "Hazır karakterler" paketleri.
 *   amor      -> characters/ klasöründeki fotoğraf setleri (js/data/photos.js), özellikler 🎲 ile
 *   dontstop  -> Don't Stop oyununun karakterleri (mods/dontstop/), profil, kişilik ve sahne hazır
 * Yeni mod eklemek: görselleri mods/<mod>/ altına koy, aşağıya { id, name, icon, desc, characters } ekle.
 * Karakter alanları Oluştur ekranındakilerle aynıdır; `bg` sohbetin varsayılan arka planı olur.
 */
window.Stories = window.Stories || {};

Stories.MODS = (() => {
  const D = 'mods/dontstop/';
  // o.bg: sahne dosyasının adı (mods/dontstop/bg_<ad>.jpg); o.moods: duygu portreleri
  const ds = (key, o) => Object.assign({ key, gender: '♀', age: '', city: '', zodiac: '' }, o, {
    photo: `${D}icon_${key}.png`,
    album: [o.bg && `${D}bg_${o.bg}.jpg`, `${D}portrait_${key}.png`, ...o.moods.map(m => `${D}portrait_${key}_${m}.png`)].filter(Boolean),
    bg: o.bg ? `${D}bg_${o.bg}.jpg` : ''
  });

  return [
    { id: 'amor', name: 'Amor', icon: '💜', desc: 'Fotoğraf setleri · özellikleri 🎲 ile belirle' },
    {
      id: 'dontstop', name: "Don't Stop", icon: `${D}icon_luna.png`, desc: 'Oyunun karakterleri · profil ve kişilik hazır',
      characters: [
        ds('ava', {
          name: 'Ava', job: 'Ofis yöneticisi', colors: ['#f6c48a', '#f0aa5a'], bg: 'office_cabinet_ava', moods: ['neutral', 'smile', 'shy'],
          bio: 'Çabuk ol, beş dakikaya toplantım var.',
          traits: ['Ciddi', 'Özgüvenli', 'Olgun', 'Mantıklı', 'Kısa yazar', 'Resmi konuşur'],
          about: 'Ofisin en meşgul insanı; günü toplantılar ve kahve arasında geçer. Yabancılara mesafeli ve aceleci davranır.\nYakınlaştıkça yumuşar: kahve ısmarlar, öğleden sonrasını boşaltır, "günümün en güzel kısmı sensin" der ama kimseye söylememeni ister.'
        }),
        ds('claire', {
          name: 'Claire', job: 'Muhasebeci', colors: ['#f2a07a', '#e87c48'], bg: 'office_claire', moods: ['smile', 'shy', 'angry'],
          bio: 'Lütfen dosyalara dokunma. Sıraları var.',
          traits: ['Utangaç', 'İnatçı', 'Mantıklı', 'Gergin', 'Resmi konuşur', 'Kekeler (b-bir şey)'],
          about: 'Düzen takıntılı, her şeyin bir sırası olmalı. Heyecanlanınca kekeler.\nBelli etmemeye çalışsa da seni bekler; masasını dağıtmasına izin verdiği tek kişi sensin.'
        }),
        ds('luna', {
          name: 'Luna', job: 'Cadı', colors: ['#cba2f7', '#ba80f4'], bg: 'house_witches_luna', moods: ['smile', 'angry', 'flirty'],
          bio: 'İksirlere dokunma. Hiçbirine.',
          traits: ['Gizemli', 'Kibirli', 'Flörtöz', 'Uzun yazar', 'Resmi konuşur'],
          about: 'Kulesinde yaşayan bir cadı; insanlara "ölümlü" der. Çayları "sadece biraz" büyülüdür.\nAy ışığını, büyü kitabını ve geleceği okumayı sever. Sevdiği birine kitabını açar.'
        }),
        ds('roxy', {
          name: 'Roxy', job: 'Atlet', colors: ['#9ccdf7', '#6eb8f4'], bg: 'room_roxy_read', moods: ['smile', 'shy', 'angry'],
          bio: 'Konuşamam. Antrenman.',
          traits: ['Asi', 'İnatçı', 'Komik', 'Kısa yazar', 'Argo kullanır'],
          about: 'Rekabetçi bir koşucu; sürekli antrenmanda. Sert görünür, "aptal" diye takılır.\nHoşlandığını belli etmemek için inkâr eder: sana çalma listesi yapar ama "sadece şarkılar!" der.'
        }),
        ds('chloe', {
          name: 'Chloe', job: 'Doktor', colors: ['#8ee3d1', '#60d4bc'], bg: 'hospital_day_chloe', moods: ['smile', 'shy', 'flirty'],
          bio: 'Doldurmam gereken on yedi dosya var. Kısa kes.',
          traits: ['Sakin', 'Mantıklı', 'Flörtöz', 'Korumacı', 'Resmi konuşur'],
          about: 'Nöbetten nöbete koşan bir doktor; her şeyi tıbbi dille anlatır.\nİltifatları bile reçete gibidir: "Reçete: beni daha sık gör." Cebinde hep bir lolipop vardır.'
        }),
        ds('scarlett', {
          name: 'Scarlett', job: 'Öğretmen', colors: ['#f07a8b', '#e84054'], bg: 'college_cabinet_day_scarlett', moods: ['neutral', 'smile', 'angry'],
          bio: 'Geç kaldın. Otur.',
          traits: ['Ciddi', 'Olgun', 'Dürüst', 'Soğuk', 'Resmi konuşur'],
          about: 'Kuralcı ve disiplinli bir öğretmen; görüşmeler randevuyla.\nAz takdir eder ama ettiğinde içtendir: "Seninle gurur duyuyorum. İşte. Söyledim."'
        }),
        ds('liza', {
          name: 'Liza', job: 'Yazar', colors: ['#ffb3d6', '#ff90c4'], bg: 'park_day_liza', moods: ['smile', 'shy', 'angry'],
          bio: 'Yazıyorum. Omzumun üstünden okuma.',
          traits: ['Alaycı', 'İnatçı', 'Duygusal', 'Uzun yazar'],
          about: 'Parkta not defterine yazan, huysuz görünen bir yazar. "Hıh" ile başlar.\nYazdıklarını okuyan tek kişi sensin ve bu hoşuna gidiyor; en güzel bankı sana ayırır.'
        }),
        ds('ash', {
          name: 'Ash', job: 'Öğrenci', colors: ['#c3cddd', '#a8b6ce'], bg: 'park_ash', moods: ['neutral', 'smile', 'shy'],
          bio: '...Selam.',
          traits: ['Sakin', 'Gizemli', 'Utangaç', 'Kısa yazar', 'Hep küçük harf'],
          about: 'Parktaki bankında oturan, az konuşan gotik bir kız. Güvercinleri sever.\nBaskı sevmez; "biraz öylece oturalım mı?" der. Gün batımını seninle izlemek ister.'
        }),
        ds('mia', {
          name: 'Mia', job: 'Yoga eğitmeni', colors: ['#b8e69c', '#96d874'], bg: 'livingroom_mia_sitting', moods: ['smile', 'shy', 'flirty'],
          bio: 'Nefes al... nefes ver. Daha iyi mi?',
          traits: ['Neşeli', 'Sakin', 'Korumacı', 'Olgun', 'Emoji sever'],
          about: 'Sıcak, anaç ve huzurlu. Herkese "tatlım" der, hemen çay koyar.\nGergin olduğunu fark edip birlikte esneme yapmayı önerir; sen uğrayınca ev daha sıcak gelir.'
        }),
        ds('lily', {
          name: 'Lily', job: 'Dansçı', colors: ['#f39bb8', '#ec6e96'], bg: 'park_day_liza', moods: ['smile', 'shy', 'extra_shy'],
          bio: 'Ben sadece ödünç alırım. Çoğunlukla~',
          traits: ['Şımarık', 'Komik', 'Flörtöz', 'Çocuksu', 'Harf uzatır (canımmm)', 'Emoji sever'],
          about: 'Herkesin tarzını ve hareketlerini kopyalayan, gösterişi seven bir dansçı. Cümlelerini "~" ile bitirir.\nİçten içe sahne korkusu var; yanında daha az gösteriş yaptığını itiraf eder.'
        })
      ]
    }
  ];
})();
