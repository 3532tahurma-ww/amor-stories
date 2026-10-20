/*
 * Monia Paneli: senaryo üretmek için zamanlar ve hazır olay havuzu.
 * Mekanlar js/data/places.js'ten gelir.
 *
 * Olay metninde kullanılabilenler: {ben} = karakterin adı, {sen} = senin adın, {mekan}, {zaman}
 * cats: olay kategorileri. items: 'Başlık' ya da { title, text }.
 *   from: 'extra' -> js/data/traits.js'teki "🌟 Ekstra özellikler" listesi olduğu gibi olay olur
 *   (oraya eklediğin her özellik burada da görünür).
 * Uygulamadan eklediğin kalıp olaylar tarayıcıda saklanır (Monia → Olay havuzu → ➕).
 */
window.Stories = window.Stories || {};

Stories.MONIA = {
  parts: [
    { id: 'sabah', icon: '🌅', label: 'Sabah', hour: 9 },
    { id: 'ogle', icon: '☀️', label: 'Öğle', hour: 13 },
    { id: 'aksam', icon: '🌇', label: 'Akşam', hour: 19 },
    { id: 'gece', icon: '🌙', label: 'Gece', hour: 23 },
    { id: 'geceyarisi', icon: '🌌', label: 'Gece yarısı', hour: 2 }
  ],
  days: ['Hafta içi', 'Hafta sonu', 'Tatil günü', 'Doğum günü', 'Yılbaşı', 'Sevgililer Günü'],
  seasons: ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'],
  // senaryo etiketleri (kendi etiketlerini senaryo düzenleyicide ekleyebilirsin)
  scTags: ['Romantik', 'Tutkulu', 'Komik', 'Dram', 'Gerilim', 'Gizem', 'Günlük', 'Fantastik', 'Ofis', 'Tatil'],
  // olay etiketleri (olay editöründe kendi etiketini de yazabilirsin)
  evTags: ['Başlangıç', 'Doruk', 'Final', 'Sürpriz', 'Yakınlaşma', 'Kavga', 'Barışma'],
  // olay editöründeki ton seçenekleri
  tones: ['Romantik', 'Tutkulu', 'Tatlı', 'Komik', 'Utangaç', 'Gergin', 'Kıskanç', 'Dramatik', 'Gizemli', 'Cesur', 'Hüzünlü'],
  cats: [
    { id: 'genel', icon: '💫', label: 'Genel', items: [
      { title: 'Yanlış numara', text: '{ben} yanlışlıkla {sen} kişisine yazıyor.' },
      { title: 'Sürpriz ziyaret', text: '{ben} haber vermeden kapıda beliriyor.' },
      { title: 'Elektrik kesintisi', text: 'Elektrikler gidiyor; ikiniz karanlıkta kalıyorsunuz.' },
      { title: 'Yağmura yakalanmak', text: 'Ani bir yağmur başlıyor, sığınacak bir yer arıyorsunuz.' },
      { title: 'Mahsur kalmak', text: '{mekan} mahsur kalıyorsunuz, bir süre çıkamayacaksınız.' },
      { title: 'Kıskançlık', text: '{ben}, {sen} kişisini başka biriyle görüp kıskanıyor.' },
      { title: 'İtiraf', text: '{ben} uzun zamandır sakladığı bir şeyi itiraf ediyor.' },
      { title: 'Tartışma', text: 'Küçük bir şey yüzünden tartışmaya başlıyorsunuz.' },
      { title: 'Barışma', text: 'Tartışmanın ardından barışıyorsunuz.' },
      { title: 'İlk öpücük', text: '{ben} ile ilk kez öpüşüyorsunuz.' },
      { title: 'Eski sevgili', text: "{ben}'in eski sevgilisi çıkageliyor." },
      { title: 'Sarhoş mesaj', text: '{ben} gece geç saatte biraz içkili yazıyor.' },
      { title: 'Hastalık', text: '{ben} hasta; {sen} ona bakıyor.' },
      { title: 'Doğruluk mu cesaret mi', text: '{ben} doğruluk mu cesaret mi oynamak istiyor.' },
      { title: 'Kayıp anahtar', text: '{ben} anahtarını kaybediyor, geceyi nerede geçireceğini bilmiyor.' },
      { title: 'Yakalanmak', text: 'Biri sizi tam en olmadık anda yakalıyor.' }
    ] },
    { id: 'extra', icon: '🌟', label: 'Ekstra', from: 'extra' }
  ]
};
