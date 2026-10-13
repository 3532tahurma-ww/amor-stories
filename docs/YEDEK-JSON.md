# Amor Stories yedek dosyası (JSON) formatı

Bu belge, Amor Stories'in **Ben → 💾 Yedekle** ile indirdiği `amor-stories-yedek-YYYY-AA-GG.json` dosyasının yapısını anlatır. Amaç, dosyayı başka bir yapay zekaya verip hikayeyi okumasını, devam ettirmesini, yeni karakter ya da sohbet eklemesini ve sonucu **Ben → 📂 Yedekten yükle** ile geri alabilmektir.

Çalışan, eksiksiz bir örnek: [ornek-yedek.json](ornek-yedek.json) (tekli sohbet, grup, cevap, tepki, fotoğraf, efekt ve anahtar kelime içerir).

> **Önemli:** Yedekten yükleme bu cihazdaki **tüm** veriyi dosyadakiyle değiştirir; birleştirme yapmaz. Bir yapay zekaya düzenletirken dosyanın tamamını geri vermesini iste, sadece değişen parçayı değil.

---

## 1. En üst seviye

```json
{
  "format": "amor-stories-backup",
  "version": 1,
  "state": { ... }
}
```

| Alan | Değer | Not |
|---|---|---|
| `format` | `"amor-stories-backup"` | Zorunlu, birebir aynı olmalı. Farklıysa dosya reddedilir. |
| `version` | `1` | Şimdilik hep 1. |
| `state` | nesne | Uygulamanın bütün verisi (aşağıda). |

## 2. `state`

```json
{
  "user": { ... },
  "characters": [ ... ],
  "threads": [ ... ],
  "chats": { "<sohbet id>": [ ... mesajlar ... ] },
  "side": { "<sohbet id>": "me" },
  "turns": { "<sohbet id>": true },
  "pinned": [ "<karakter ya da grup id>" ],
  "keywords": [ ... ]
}
```

Eksik bırakılan üst alanlar boş değerle doldurulur (`[]` / `{}`), ama `characters`, `threads` ve `chats` hikaye için gereklidir.

---

## 3. `user`: kullanıcı ("Sen")

| Alan | Tür | Açıklama |
|---|---|---|
| `name` | metin | Sohbetlerde "Sen" yerine görünen ad. Boşsa "Sen". |
| `age` | metin | Örn. `"24"` (sayı değil, metin). |
| `city` | metin | |
| `photo` | metin | Profil fotoğrafı: dosya yolu ya da `data:image/jpeg;base64,...`. Boş olabilir. |

---

## 4. `characters`: karakterler

```json
{
  "id": "c_mia",
  "set": "dontstop:mia",
  "mod": "dontstop",
  "name": "Mia",
  "gender": "♀",
  "age": "28",
  "city": "",
  "job": "Yoga eğitmeni",
  "zodiac": "Terazi",
  "bio": "Nefes al... nefes ver. Daha iyi mi?",
  "traits": ["Neşeli", "Sakin", "Emoji sever"],
  "tags": ["komşu"],
  "about": "Uzun açıklama...",
  "photo": "mods/dontstop/icon_mia.png",
  "album": ["mods/dontstop/bg_livingroom_mia_sitting.jpg"],
  "colors": ["#b8e69c", "#96d874"],
  "theme": { "bg": "img", "img": "mods/dontstop/bg_livingroom_mia_sitting.jpg", "bubble": "amor" },
  "created": 1760000000000
}
```

| Alan | Tür | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | metin | ✅ | Benzersiz kimlik. Herhangi bir metin olabilir (`"c_mia"`, `"k7x2"`...). Sohbetler ve kelimeler bu kimliğe bağlanır. |
| `name` | metin | ✅ | Karakterin adı. |
| `traits` | metin dizisi | ✅ (boş olabilir) | Kişilik ve yazım tarzı etiketleri. Hazır listeler [§10](#10-hazır-değerler)'da; listede olmayan metinler "Diğer özellikler" olarak görünür. |
| `album` | metin dizisi | ✅ (boş olabilir) | Fotoğraflar, en fazla 8. İlki profil kapağı olur. |
| `gender` | metin | | `"♀"` ya da `"♂"`. |
| `age` | metin | | Örn. `"28"`. |
| `city`, `job`, `zodiac` | metin | | Burç adları [§10](#10-hazır-değerler)'da. |
| `bio` | metin | | Profilde adın altında görünen kısa "durum" sözü. |
| `about` | metin | | Uzun açıklama: geçmişi, nasıl konuştuğu, sırları, diğer karakterlerle ilişkisi. `\n` ile satır atlanabilir. **Bir yapay zekanın karakterin ağzından yazarken en çok dikkat etmesi gereken alan budur.** |
| `tags` | metin dizisi | | Profilde ve ana sayfada görünen etiketler (`"ex sevgili"`, `"komşu"`). |
| `photo` | metin | | Profil fotoğrafı (yol ya da data URL). Boşsa adın baş harfi ve `colors` görünür. |
| `colors` | `[renk1, renk2]` | | Avatar/kapak degradesi, örn. `["#ff6fa8", "#ff3d8b"]`. |
| `theme` | nesne | | Bu karakterle açılacak **yeni** sohbetlerin varsayılan teması ([§6](#6-tema-nesnesi)). |
| `set` | metin | | Hazır karakter kaynağı: Amor fotoğraf setinin klasör adı (`"Aisha"`) ya da `"dontstop:<anahtar>"`. Elle oluşturulanlarda `""`. Sadece "kullanımda" işareti için kullanılır. |
| `mod` | metin | | `"amor"`, `"dontstop"` ya da `"carmen"`. |
| `created` | sayı | | Oluşturulma zamanı (milisaniye, Unix epoch). |

### Fotoğraf yolları

- **Depodaki dosyalar:** `characters/<set>/<dosya>` (Amor fotoğraf setleri), `mods/dontstop/...` (Don't Stop) ve `mods/carmen/<karakter>/<dosya>` (Carmen). Yollar `index.html`'e göredir.
- **Yüklenen fotoğraflar:** `data:image/jpeg;base64,...`. Yedek dosyası büyük olabilir. Bir yapay zekaya verirken bunları kısaltmasını ya da olduğu gibi bırakmasını söyle, değiştirmesin.
- Yeni fotoğraf uyduramaz; sadece var olan yolları kullanmalı ya da alanı boş bırakmalı.

---

## 5. `threads`: sohbetler

Bir karakterle birden çok **adlı sohbet** (bölüm) olabilir. Grup sohbetleri de aynı listededir.

**Tekli sohbet:**

```json
{ "id": "t_aksam", "charId": "c_mia", "title": "1. Bölüm: Çay saati", "created": 1760000100000, "opened": 0 }
```

**Grup sohbeti:**

```json
{
  "id": "g_apartman", "group": true, "members": ["c_mia", "c_kerem"], "title": "Apartman 🏠",
  "created": 1760000200000, "opened": 0,
  "theme": { "bg": "night", "bubble": "char" },
  "memberColors": { "c_kerem": 2 }
}
```

| Alan | Tür | Açıklama |
|---|---|---|
| `id` | metin | Benzersiz kimlik; `chats`, `side`, `turns` bu kimlikle eşleşir. |
| `title` | metin | Sohbetin adı. |
| `charId` | metin | **Tekli sohbet:** karakterin `id`'si. Grupta yok. |
| `group` | `true` | **Grup sohbeti** işareti. |
| `members` | metin dizisi | **Grup:** üye karakter `id`'leri (en az 2). Sıra, yazma sırasını (⇄ Sırayla) belirler: Sen → üye 1 → üye 2 → … |
| `created` | sayı | Oluşturulma zamanı (ms). |
| `opened` | sayı | Son açılma zamanı (ms). "Son kaldığın sohbet" hesaplanırken kullanılır; `0` olabilir. |
| `theme` | nesne | Bu sohbetin teması ([§6](#6-tema-nesnesi)). Yoksa karakterin `theme`'i, o da yoksa Amor varsayılanı kullanılır. |
| `memberColors` | nesne | **Grup:** `{ "<karakter id>": <0-9> }`. Üyenin baloncuk rengi, [§10](#10-hazır-değerler)'daki `memberColors` listesindeki sıra numarası. |

"Son kaldığın sohbet", bir karakterin sohbetleri arasında `opened`, `created` ve son mesajın `ts` değerlerinin en büyüğüne göre seçilir.

---

## 6. Tema nesnesi

```json
{ "bg": "img", "img": "mods/dontstop/bg_office_claire.jpg", "bubble": "comic" }
```

| Alan | Değer |
|---|---|
| `bg` | Arka plan kimliği ([§10](#10-hazır-değerler)) ya da `"img"` |
| `img` | `bg` `"img"` ise fotoğraf yolu ya da data URL |
| `bubble` | Baloncuk stili kimliği ([§10](#10-hazır-değerler)) |

---

## 7. `chats`: mesajlar

`chats` bir nesnedir: anahtar **sohbet id**, değer **mesaj dizisi**. Dizi sırası ekrandaki sıradır (yukarıdan aşağıya).

```json
"chats": {
  "t_aksam": [
    { "id": "m1", "from": "sys", "text": "Salı akşamı, yağmur yağıyor", "ts": 1760000100000 },
    { "id": "m2", "from": "her", "text": "Çay demledim tatlım ☕", "ts": 1760000160000 },
    { "id": "m3", "from": "me", "text": "Geliyorum!", "ts": 1760000220000 },
    { "id": "m4", "from": "her", "text": "Neden sordun?", "ts": 1760000280000, "reply": "m3", "react": "😮" },
    { "id": "m5", "from": "her", "type": "photo", "src": "mods/dontstop/portrait_mia.png", "text": "Bak", "ts": 1760000340000, "effect": "hearts" }
  ],
  "g_apartman": [
    { "id": "g1", "from": "her", "who": "c_kerem", "text": "kapıdaki paket kimin", "ts": 1760000200000 }
  ]
}
```

| Alan | Tür | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | metin | ✅ | Sohbet içinde benzersiz. |
| `from` | `"me"` / `"her"` / `"sys"` | ✅ | `me`: kullanıcı (sağda). `her`: karakter (solda; erkek karakter için de `"her"`). `sys`: ortada görünen anlatım/not satırı. |
| `who` | metin | grupta ✅ | **Sadece grup sohbetinde** ve `from: "her"` iken: yazan üyenin karakter `id`'si. Tekli sohbette yazılmaz. |
| `text` | metin | ✅ | Mesaj metni. Fotoğrafta açıklama (boş olabilir: `""`). |
| `ts` | sayı | ✅ | Zaman damgası (ms, Unix epoch). Art arda iki mesaj arasında 10 dakikadan fazla fark varsa araya saat başlığı çıkar. **Dizi sırasıyla artan** tutulmalı. |
| `type` | `"photo"` | | Fotoğraf mesajı. |
| `src` | metin | `type: "photo"` ise ✅ | Fotoğraf yolu ya da data URL. |
| `reply` | metin | | Cevap verilen mesajın `id`'si (aynı sohbette). Silinmişse "Silinmiş mesaj" görünür. |
| `react` | metin | | Mesaja tepki emojisi: `❤️ 😂 😮 😢 😡 👍` |
| `effect` | metin | | Mesaj efekti kimliği ([§10](#10-hazır-değerler)) ya da `"none"`. `"none"` anahtar kelimeden gelecek efekti kapatır. Yazılmazsa anahtar kelime kuralları uygulanır. |

---

## 8. `side`, `turns`, `pinned`

| Alan | Biçim | Açıklama |
|---|---|---|
| `side` | `{ "<sohbet id>": değer }` | Sohbet açıldığında kimin yazacağı. Tekli: `"me"` ya da `"her"`. Grup: `"me"` ya da üyenin karakter `id`'si. |
| `turns` | `{ "<sohbet id>": true/false }` | ⇄ Sırayla. Yazılmazsa açık (`true`). |
| `pinned` | metin dizisi | Mesaj listesinde en üste sabitlenenler: karakter `id`'leri ve grup sohbeti `id`'leri (en fazla 4). |

---

## 9. `keywords`: anahtar kelimeler

```json
{ "id": "k1", "charId": "c_mia", "word": "tatlım", "effect": "glow" }
```

| Alan | Açıklama |
|---|---|
| `id` | Benzersiz kimlik. |
| `charId` | Kelimenin ait olduğu karakter. **Yazılmazsa "Genel"** olur ve herkese uygulanır. |
| `word` | Kelime. Büyük/küçük harf ve ekler fark etmez ("çay" → "Çayı" da sayılır). |
| `effect` | `""` (sadece sayılır) ya da efekt kimliği. Karaktere özel kelimenin efekti sadece o karakterin mesajlarına uygulanır. |

Sayılar dosyada saklanmaz; uygulama mesajlardan her seferinde yeniden hesaplar:

- **Söyledi:** karakterin kendi mesajlarında (tekli sohbet + gruplar) kaç kez geçtiği.
- **Sohbetlerinde toplam:** o karakterle olan bütün sohbetlerde, kim yazmış olursa olsun.

---

## 10. Hazır değerler

**Kişilik (`traits`):** Neşeli, Utangaç, Alaycı, Soğuk, Flörtöz, Romantik, Kıskanç, Asi, Sakin, Gergin, Meraklı, Gizemli, Dürüst, Sadık, İnatçı, Şımarık, Olgun, Çocuksu, Kibirli, Alçakgönüllü, Duygusal, Mantıklı, Komik, Ciddi, Korumacı, Manipülatif, Güvensiz, Özgüvenli

**Yazım tarzı (`traits`):** Kısa yazar, Uzun yazar, Hep küçük harf, Emoji sever, Emoji kullanmaz, Harf uzatır (canımmm), Noktalama kullanmaz, Resmi konuşur, Argo kullanır, Çok güler (sjsjsj), Geç cevap verir, Sesli mesaj sever

**Burç (`zodiac`):** Koç, Boğa, İkizler, Yengeç, Aslan, Başak, Terazi, Akrep, Yay, Oğlak, Kova, Balık

**Arka plan (`theme.bg`):** `amor`, `rose`, `ocean`, `forest`, `sunset`, `night`, `coffee`, `dark`, `img`

**Baloncuk stili (`theme.bubble`):** `amor`, `imessage`, `whatsapp`, `insta`, `char` (karakter rengi; grupta her üye kendi renginde), `pastel`, `mono`, `neon`, `retro`, `glass`, `cloud`, `comic`, `terminal`, `paper`, `gold`

**Grup üye renkleri (`memberColors`, 0-9):** 0 pembe · 1 mor · 2 mavi · 3 yeşil · 4 turuncu · 5 eflatun · 6 kırmızı · 7 turkuaz · 8 çimen · 9 gri

**Efekt (`effect`, `keywords[].effect`):**

| Baloncuk efektleri | Ekran efektleri |
|---|---|
| `shake` Titreme · `slam` Çarpma · `loud` Bağırma · `gentle` Fısıltı · `glow` Parıltı · `rainbow` Gökkuşağı · `ink` Görünmez mürekkep | `hearts` Kalpler · `confetti` Konfeti · `fireworks` Havai fişek · `rain` Yağmur · `fire` Ateş |

**Don't Stop karakterleri** (`set: "dontstop:<anahtar>"`, `mod: "dontstop"`). Görseller `mods/dontstop/` altında:

| Anahtar | Ad | Meslek | Sahne (`bg_*.jpg`) | Duygu portreleri |
|---|---|---|---|---|
| `ava` | Ava | Ofis yöneticisi | `office_cabinet_ava` | neutral, smile, shy |
| `claire` | Claire | Muhasebeci | `office_claire` | smile, shy, angry |
| `luna` | Luna | Cadı | `house_witches_luna` | smile, angry, flirty |
| `roxy` | Roxy | Atlet | `room_roxy_read` | smile, shy, angry |
| `chloe` | Chloe | Doktor | `hospital_day_chloe` | smile, shy, flirty |
| `scarlett` | Scarlett | Öğretmen | `college_cabinet_day_scarlett` | neutral, smile, angry |
| `liza` | Liza | Yazar | `park_day_liza` | smile, shy, angry |
| `ash` | Ash | Öğrenci | `park_ash` | neutral, smile, shy |
| `mia` | Mia | Yoga eğitmeni | `livingroom_mia_sitting` | smile, shy, flirty |
| `lily` | Lily | Dansçı | `park_day_liza` | smile, shy, extra_shy |

Dosya adları: `icon_<anahtar>.png` (profil), `portrait_<anahtar>.png`, `portrait_<anahtar>_<duygu>.png`, `bg_<sahne>.jpg`.

---

## 11. Yapay zekanın uyması gereken kurallar

1. `format`, `version` ve `state` yapısını koru. Dosyanın **tamamını** geri ver.
2. Var olan `id`'leri değiştirme. Yeni öğelere benzersiz `id` ver (`"m_ek_1"`, `"t_bolum2"` gibi okunur kimlikler olabilir).
3. Her `threads[].id` için `chats` içinde aynı anahtarla bir dizi olsun (boş olabilir).
4. Tekli sohbetin `charId`'si, grubun `members`'ı ve mesajların `who`'su var olan karakter `id`'lerini göstermeli.
5. Grupta karakter mesajlarına `who` yaz; tekli sohbette yazma.
6. `ts` değerleri dizide sırayla artsın. Yeni mesajlara son mesajdan sonraki zamanları ver; gerçekçi aralıklar kullan (ör. 30 sn - 3 dk).
7. `reply`, aynı sohbetteki var olan bir mesajın `id`'si olmalı.
8. `traits`, `album`, `tags` her zaman dizi olsun (boşsa `[]`). Sayı gibi görünen `age` metin olarak yazılsın (`"24"`).
9. Fotoğraf uydurma: sadece [§4](#fotoğraf-yolları)'teki var olan yolları kullan ya da fotoğrafı boş bırak. `data:` ile başlayan uzun metinleri değiştirme.
10. Hazır değerler ([§10](#10-hazır-değerler)) dışında `theme.bg`, `theme.bubble`, `effect` kimliği uydurma.
11. Karakterin ağzından yazarken `about`, `bio`, `traits` (özellikle yazım tarzı: "Hep küçük harf", "Emoji sever", "Kısa yazar"…) ve `tags` alanlarına uy.
12. Geçerli JSON üret: çift tırnak, sonda virgül yok, yorum satırı yok.

---

## 12. Yapay zekaya hazır komut örnekleri

**Hikayeyi devam ettirmek:**

> Ekteki dosya Amor Stories yedeği; yapısı YEDEK-JSON.md'de anlatılıyor. `"t_aksam"` sohbetini 15 mesajla devam ettir: Mia ile kullanıcı (Deniz) arasında, Mia'nın `about` ve `traits` alanlarındaki kişiliğine uygun. Gerilimli bir anda bir `sys` notu ve bir mesaja `reply` ekle. Dosyanın tamamını geçerli JSON olarak geri ver.

**Yeni karakter ve grup eklemek:**

> Bu yedeğe "Selin" adlı yeni bir karakter ekle (fotoğrafsız, `colors` ver, kişilik ve yazım tarzını hazır listelerden seç, uzun bir `about` yaz). Sonra Mia, Kerem ve Selin'den oluşan "Doğum günü 🎂" adlı bir grup sohbeti oluştur ve 20 mesajlık bir sahne yaz; her karakter mesajında `who` olsun.

**Okuyup özetlemek ya da analiz etmek:**

> Bu yedekteki bütün sohbetleri `ts` sırasıyla oku. Her sohbetin olay örgüsünü özetle, karakterlerin birbiriyle ilişkisini çıkar ve tutarsızlıkları listele (ör. bir karakterin `about`'una aykırı konuşması).

---

## 13. Kontrol listesi (yüklemeden önce)

- [ ] Dosya geçerli JSON mu? (bir JSON doğrulayıcıyla dene)
- [ ] `"format": "amor-stories-backup"` var mı?
- [ ] Her sohbetin `chats` karşılığı var mı; `charId` / `members` / `who` var olan karakterleri mi gösteriyor?
- [ ] Mesajlarda `id`, `from`, `text`, `ts` var mı?
- [ ] Önce mevcut verinin yedeğini aldın mı? Yükleme her şeyi değiştirir.

Tarayıcı depolaması yaklaşık 5 MB ile sınırlıdır. Çok sayıda yüklenmiş (data URL) fotoğraf varsa yükleme "Depolama dolu" uyarısı verebilir.
