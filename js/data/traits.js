/*
 * Karakter oluşturma seçenekleri: hazır kişilik ve yazım tarzı özellikleri, burçlar, renkler
 * Listeye yeni özellik eklemek için ilgili gruba yazman yeterli.
 */
window.Stories = window.Stories || {};

Stories.Traits = (() => {
  const groups = [
    {
      id: 'personality', label: '💫 Kişilik',
      items: ['Neşeli', 'Utangaç', 'Alaycı', 'Soğuk', 'Flörtöz', 'Romantik', 'Kıskanç', 'Asi', 'Sakin', 'Gergin',
        'Meraklı', 'Gizemli', 'Dürüst', 'Sadık', 'İnatçı', 'Şımarık', 'Olgun', 'Çocuksu', 'Kibirli', 'Alçakgönüllü',
        'Duygusal', 'Mantıklı', 'Komik', 'Ciddi', 'Korumacı', 'Manipülatif', 'Güvensiz', 'Özgüvenli']
    },
    {
      id: 'style', label: '⌨️ Yazım tarzı',
      items: ['Kısa yazar', 'Uzun yazar', 'Hep küçük harf', 'Emoji sever', 'Emoji kullanmaz', 'Harf uzatır (canımmm)',
        'Noktalama kullanmaz', 'Resmi konuşur', 'Argo kullanır', 'Çok güler (sjsjsj)', 'Geç cevap verir', 'Sesli mesaj sever']
    }
  ];

  const zodiacs = ['Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak', 'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık'];

  // Avatar ve profil kapağı için renk çiftleri
  const colors = [
    ['#ff6fa8', '#ff3d8b'], ['#a78bfa', '#7b5cff'], ['#5fb4ff', '#2f6bff'], ['#34e3a8', '#0e9f8e'],
    ['#ffb72b', '#ff7a3d'], ['#c86bff', '#ff5fb0'], ['#8b9bb4', '#4b5670'], ['#ff8a65', '#e0334f']
  ];

  const all = groups.reduce((a, g) => a.concat(g.items), []);

  return { groups, zodiacs, colors, all };
})();
