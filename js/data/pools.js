/*
 * Rastgele karakter havuzları (🎲 düğmeleri buradan seçer)
 * Yeni isim, şehir, meslek ya da durum eklemek için listeye yazman yeterli.
 */
window.Stories = window.Stories || {};

Stories.Pools = {
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
