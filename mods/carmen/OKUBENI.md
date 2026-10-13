# Carmen: resim ekleme

Her karakterin kendi klasörü var:

| Klasör | Karakter |
|---|---|
| `maelys/` | Maëlys Virelle |
| `romilly/` | Romilly Finch |
| `vesper/` | Vesper Laine |
| `anwen/` | Anwen Lorne |
| `cressida/` | Cressida Vale |
| `ottilie/` | Ottilie Wycliffe |
| `lenora/` | Lenora Whitcombe |
| `leonie/` | Leonie Ashcroft |
| `octavia/` | Octavia Gravesend |
| `isabeau/` | Isabeau Quill |

## Dosya adları

Bir karakterin klasörüne istediğin kadar resim koy (`.jpg`, `.png`, `.webp`, `.gif`):

| Dosya adı | Ne olur |
|---|---|
| `profil.png` (ya da `profile`, `avatar`) | Profil fotoğrafı: mesajlarda ve listelerde görünen yuvarlak avatar. Ortadan kırpılır; yüzün ortada olduğu kare bir resim en iyisi. |
| `sahne.jpg` (ya da `bg`, `arka-plan`) | Sohbetin varsayılan arka planı ve profilin kapak fotoğrafı. Yatay bir resim en iyisi. |
| diğer her şey (ör. `01.png`, `gulumseyen.png`) | Albüm: profildeki Albüm sekmesi, sohbette 📷 ile gönderilebilen fotoğraflar. Ad sırasıyla dizilir. |

Uzantı fark etmez (`profil.jpg` de olur). Albüm en fazla 8 fotoğraf alır: sahne + profil + 6 tane daha.

**Boyut önerisi:** GitHub Pages ve telefonlar için resimleri küçük tut. Profil 512×512, sahne en fazla 1280 genişlik, albüm fotoğrafları en fazla ~1000 px uzun kenar olsun; dosya başına 300 KB civarı yeterli.

## Resimleri ekledikten sonra

1. Proje klasöründeki **`fotograflari-guncelle.bat`** dosyasını çalıştır. Klasörleri tarar ve `js/data/mod-photos.js`'i günceller.
2. Uygulamayı yenile. **Oluştur → ⭐ Hazır karakterler → 🌙 Carmen** sekmesinde karakterler resimleriyle görünür.

Resmi olmayan karakter, adının baş harfi ve renginden oluşan bir avatarla görünür; resim eklemeden de kullanılabilir.

> Daha önce eklenmiş bir karakterin resimleri kendiliğinden güncellenmez (karakter oluşturulurken kopyalanır). Yeni resimleri görmek için karakteri düzenleyip **Hazır karakterler**'den aynı karaktere tekrar dokun ve kaydet.

## İsim, meslek, kişilik

`js/data/mods.js` içindeki `carmen` bölümünde her karakterin satırına alan ekleyebilirsin:

```js
scanned(Y, 'vesper', {
  name: 'Vesper Laine', colors: ['#b9a6ff', '#6c4ee0'],
  job: 'Kütüphaneci', age: '26', bio: 'Sessizlik de bir cevaptır.',
  traits: ['Gizemli', 'Sakin', 'Uzun yazar'],
  about: 'Uzun açıklama: geçmişi, nasıl konuştuğu, sırları...'
}),
```

Kategorinin adını değiştirmek için aynı dosyada `name: 'Carmen'` satırını düzenle.
