# Amor Stories 💜

Amor'un görünümüyle, kendi oluşturduğun karakterlerle mesajlaşma şeklinde hikaye yazma uygulaması. Karakterleri profil fotoğrafı ve kişilik özellikleriyle sen oluşturursun; sohbette hem kendi mesajlarını hem karakterin mesajlarını sen yazarsın. Saf HTML + CSS + JS; derleme ya da sunucu gerekmez, GitHub Pages'te doğrudan çalışır.

## Çalıştırma

- **Yerelde:** `index.html` dosyasını tarayıcıda aç.
- **GitHub Pages:** Depoyu GitHub'a gönder → *Settings → Pages → Branch: `main` / root* → kaydet.

## Klasör yapısı

```
index.html          uygulama iskeleti + alt menü
css/style.css       Amor'un tasarımı (Amor'dan aynen kopyalandı)
css/stories.css     Amor Stories'e özel eklemeler
js/store.js         localStorage ile kalıcı veri
js/data/traits.js   hazır kişilik / yazım tarzı özellikleri, burçlar, renkler
js/data/pools.js    🎲 için isim, şehir, meslek, durum havuzları
js/data/photos.js   fotoğraf setleri listesi (otomatik üretilir)
js/data/mods.js     karakter modları (Amor, Don't Stop)
js/data/themes.js   sohbet arka planları ve baloncuk stilleri
mods/dontstop/      Don't Stop karakter görselleri (küçültülmüş)
mods/carmen/      Carmen: karakter başına bir klasör (resimleri sen eklersin)
js/data/mod-photos.js  mod klasörlerinin resim listesi (otomatik üretilir)
tools/build-mods.ps1   mods/<mod>/<karakter>/ klasörlerini tarar
js/app.js           ekranlar: ana sayfa, mesajlar, profil, sohbet, karakter oluştur, ben
characters/<set>/   hazır karakter fotoğraf setleri (Amor'dan)
tools/build-photos.ps1, fotograflari-guncelle.bat   js/data/photos.js'i üretir
```

## Modlar

Oluştur ekranındaki **Hazır karakterler** kartında mod seçilir:

- **Amor:** `characters/` klasöründeki fotoğraf setleri; özellikler 🎲 ile belirlenir.
- **Carmen:** kendi karakter setin (Maëlys Virelle, Romilly Finch, Vesper Laine, Anwen Lorne, Cressida Vale, Ottilie Wycliffe, Lenora Whitcombe, Leonie Ashcroft, Octavia Gravesend, Isabeau Quill). Resimleri `mods/carmen/<karakter>/` klasörlerine koyup `fotograflari-guncelle.bat`'ı çalıştır; ayrıntılar [mods/carmen/OKUBENI.md](mods/carmen/OKUBENI.md).
- **Don't Stop:** oyunun 10 karakteri (Ava, Claire, Luna, Roxy, Chloe, Scarlett, Liza, Ash, Mia, Lily). İkon, portre, duygu portreleri, meslek, kişilik, "Hakkında" ve sohbet arka planı (oyundaki sahnesi) hazır gelir. **➕ Tüm Don't Stop karakterlerini ekle** ile hepsi tek seferde eklenir.

Görseller `mods/<mod>/` altında, mod tanımları `js/data/mods.js` içinde. Yeni mod eklemek için görselleri `mods/<yeni-mod>/` klasörüne koyup `js/data/mods.js`'e bir giriş eklemek yeterli.

## Sohbet teması

Sohbette **🎨 Tema**:

- **Arka plan:** 8 renk/degrade, karakterin albümündeki fotoğraflar ya da cihazdan yüklenen bir fotoğraf.
- **Baloncuklar:** Amor, iMessage, WhatsApp, Instagram, Karakter rengi, Pastel, Siyah beyaz, Neon, Retro, Cam, Bulut, Çizgi roman, Terminal, Not kâğıdı, Altın.
- **Grupta üye renkleri:** her üyenin baloncuğuna ayrı renk verilebilir (stilden bağımsız; "–" stile döner).

Tema her sohbete ayrı kaydedilir; "yeni sohbetlerde de kullan" işaretliyse karakterin varsayılanı olur. Yeni temalar `js/data/themes.js` içine eklenir.

## Hazır karakterler

Oluştur ekranının en üstünde `characters/` klasöründeki fotoğraf setleri **Hazır karakterler** olarak listelenir. Bir sete dokununca profil fotoğrafı, albüm ve isim (klasör adından) dolar. Yeni karakter rastgele bir öneriyle açılır; **🎲 Hepsi** her şeyi, alanların yanındaki **🎲** ise sadece o alanı rastgele değiştirir. Başka karakterin kullandığı setler "kullanımda" görünür.

**Yeni set eklemek:** `characters/<isim>/` klasörüne fotoğrafları koy (adında `profile` geçen dosya profil fotoğrafı olur, yoksa ilki), sonra `fotograflari-guncelle.bat` dosyasını çalıştır.

## Kullanım

1. **Oluştur** sekmesi: hazır karakterlerden birini seç ya da kendi profil fotoğrafını yükle, albüm (ilk fotoğraf kapak olur), isim, cinsiyet, yaş, şehir, meslek, burç, durum, kişilik ve yazım tarzı özellikleri, "Hakkında" notu, renk.
- **🏷️ Etiketler:** profilde **+ etiket**e dokunup yaz (Enter); etikete dokununca kaldırılır. Oluştur ekranında da eklenebilir; ana sayfada da görünür.
2. **Ana sayfa**'da karaktere dokun → profili; **Hi / 💬** → son kaldığın sohbet (satırda adı ve son mesajı görünür).
   - Bir karakterle **birden çok adlı sohbet** açabilirsin: profilde ➕ ya da **Sohbetler** sekmesi, sohbette sağdaki 🗂️ düğmesi.
   - **Mesaj** sekmesinde her karakter tek satırdır ve son kaldığın sohbeti gösterir; birden çok sohbeti varsa 🗂️ sayısı görünür.
   - Sohbetleri karakterin profilindeki **Sohbetler** sekmesinden düzenlersin: ✏️ adını değiştir, 📄 kopyasını oluştur (aynı başlangıçtan farklı bir son için), 🗑️ sil.
3. Sohbette alttaki avatara (ya da **🔁 Taraf**) dokunarak kimin yazdığını seç:
   - **Sen** sağda, pembe baloncuk.
   - **Karakter** solda, kendi avatarıyla.
   - **⇄ Sırayla** açıksa her mesajdan sonra taraf kendiliğinden değişir.
   - **📝 Not** ortada görünen bir anlatım satırı ekler.
   - **📷 Fotoğraf** cihazdan ya da karakterin albümünden fotoğraf mesajı gönderir; yazma alanındaki metin açıklama olur.
4. Bir mesaja dokun: ❤️😂😮😢😡👍 tepki, ↩️ cevap ver (alıntılı balon; alıntıya dokununca asıl mesaja gider), düzenle, tarafını değiştir, üstüne mesaj ekle, yukarı/aşağı taşı, sil.
5. **👥 Grup sohbeti:** Mesaj sekmesinde **👥 Yeni grup** (ya da profilde "grup kur"): ad ver, en az 2 karakter seç. Grupta yazma alanının üstündeki çiplerden kimin yazdığını seçersin; **⇄ Sırayla** açıksa sen → üye 1 → üye 2 → … sırasıyla döner. Her üyenin adı baloncuğun üstünde görünür; 🎨 Tema'da "Karakter rengi" seçilirse her üye kendi renginde yazar. Bir mesaja dokunup "👤 Konuşanı değiştir" ile o mesajı başka bir üyeye verebilirsin.
6. **✨ Efektler:** Bir mesaja dokun → **✨ Efekt**, ya da alt çubuktaki **✨ Efekt** ile sonraki mesajı efektli gönder.
   - Baloncuk efektleri: Titreme, Çarpma, Bağırma, Fısıltı, Parıltı, Gökkuşağı, Görünmez mürekkep (dokununca açılır).
   - Ekran efektleri: Kalpler, Konfeti, Havai fişek, Yağmur, Ateş (mesaj gelince ekrana emoji yağar; baloncuktaki rozete dokununca tekrar oynar).
   - Efektler gönderince, ▶️ Oynat'ta ve "Efekti oynat" ile oynar. Tanımları `js/data/effects.js` içinde.
7. **🔑 Anahtar kelimeler (karaktere özel):** Karakterin profilindeki **Kelimeler** sekmesinden, sohbet ⋮ menüsünden ya da Ben sayfasından. Her karakterin kendi kelimeleri vardır; uygulama karakterin o kelimeyi tüm sohbetlerinde (gruplar dahil) kaç kez söylediğini ve sohbetlerinde toplam kaç kez geçtiğini sayar (ekler sayılır: "kahve" → "kahveyi"). Kelimeye efekt bağlarsan sadece o karakterin kelimeyi geçirdiği mesajlar efektli görünür; tek bir mesajda "Efekt yok" ile kapatabilirsin.
8. **🔍 Arama:** sohbet başlığındaki 🔍 (ya da Ctrl+F); eşleşmeler işaretlenir, ↑ ↓ ile aralarında gezilir.
9. **↶ Geri al:** silme, düzenleme, taşıma, tepki, temizleme gibi her değişiklikten sonra sağ altta **↶ Geri al** çıkar (Ctrl+Z de çalışır). Her sohbette son 40 adım, sayfa yenilenene kadar geri alınabilir.
10. **▶️ Oynat**: sohbet baştan, karakter "yazıyor…" diye tek tek gelir (dokununca hızlanır, 1x/2x/4x).

Sohbet listesinde bir sohbete basılı tut (masaüstünde sağ tık) → en üste sabitle (en fazla 4).

Veriler tarayıcıda (localStorage) saklanır. Başka cihaza taşımak için **Ben → Yedekle / Yedekten yükle**.

## Yedek dosyası ve yapay zeka

**Ben → 💾 Yedekle** ile inen JSON dosyasının yapısı [docs/YEDEK-JSON.md](docs/YEDEK-JSON.md) içinde anlatılıyor; örnek: [docs/ornek-yedek.json](docs/ornek-yedek.json). Dosyayı bu belgeyle birlikte başka bir yapay zekaya verip hikayeyi devam ettirtebilir, yeni karakter ya da grup ekletebilir ve **📂 Yedekten yükle** ile geri alabilirsin.

## Telefona yükleme (PWA)

GitHub Pages'te açınca tarayıcı "Ana ekrana ekle" önerir (Ben sayfasında da buton çıkar; iPhone'da Safari → Paylaş → Ana Ekrana Ekle). Uygulama internetsiz de açılır.
Yeni sürüm yayınlarken `sw.js` içindeki `VERSION` değerini artır (`amor-stories-v3` gibi), yoksa telefonlar eski sürümü önbellekten göstermeye devam eder.

## Yeni özellik eklemek

Karakter oluşturmadaki hazır özellikler `js/data/traits.js` içindeki `groups` listesinde; yeni grup ya da özellik eklemek için oraya yazman yeterli. Avatar renkleri `colors`, burçlar `zodiacs` altında.
