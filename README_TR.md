# ARON Envanter Sayım

ARON Envanter Sayım, yetkili servis envanter operasyonları için hazırlanmış Manifest V3 tabanlı bir Chrome eklentisidir. Güncel ürün listesini alır; operatörün barkodla veya manuel olarak sayım yapmasını ve depo adediyle sayım adedi arasındaki farkları izlemesini sağlar.

Depoda yüklenebilir tek eklenti `ARON Envanter Sayim/` klasöründe bulunur.

## Özellikler

- Ürün listesini yapılandırılmış API'den alma.
- Sayım ilerlemesini stok numarasına göre Chrome yerel belleğinde koruma.
- Sayfa açılışında, F5 yenilemesinde ve `Verileri yenile` düğmesine basıldığında güncel verileri alma.
- Stok numarasını barkodla okutma veya elle girme ve sayımı artırma.
- Bir stok numarası birden fazla adreste bulunuyorsa adres seçme; aynı stok numarası art arda okutulduğunda seçilen adresi kullanma.
- Seçili ürünün sayımını manuel olarak artırma veya azaltma.
- Birden fazla adreste bulunan ürünlerin adres bazlı sayımlarını ayrı tutma.
- Stok numarası, malzeme adı veya adrese göre arama.
- Tüm ürünler, sayımı fazla olanlar ve sayımı eksik olanlar için filtreleme.
- Depo adedi ve sayımı sıfır olan ürünleri gizleme.
- Stok numarası, malzeme, depo, adres, depo adedi veya sayım adedine göre sıralama.
- Sayım ekranı, tam tablo ve farklı olan ürünler görünümleri.
- Listede olmayan stok numarası için uyarı penceresi ve sesli bildirim.
- Oasis sekmesi açık ve giriş yapılmış değilse uyarı gösterme ve Oasis'i yeni sekmede açma.
- Adres seçimi, sayım artırma ve azaltma için farklı sesli bildirimler.
- Büyük listelerde sayım sırasında yalnızca değişen tablo satırını veya fark kartını güncelleme.
- Eklenti ikonuna tekrar basıldığında açık olan sayım sekmesini öne getirme.

## Kurulum

1. Google Chrome'da `chrome://extensions` adresini açın.
2. **Geliştirici modu**nu etkinleştirin.
3. **Paketlenmemiş öğe yükle** seçeneğine tıklayın.
4. `ARON Envanter Sayim/` klasörünü seçin.
5. Sayım ekranını açmak için ARON eklenti ikonuna tıklayın.

Kaynak dosyalarda değişiklik yaptıktan sonra Chrome Eklentiler sayfasından eklentiyi yeniden yükleyin.

## Veri ve yerel kayıt

Güncel API adresi:

`https://oasis.arcelik.com/YsDepoYonetimiApi/api/DepoYonetimi/GetInventoryReportDetail/6058`

API yanıtında aşağıdaki alanların bulunması beklenir:

| API alanı | Anlamı |
| --- | --- |
| `MALZEME_STOK_NO` | Stok numarası |
| `MALZEME` | Malzeme adı |
| `ADRES` | Adres |
| `DEPO_ADI` | Depo adı |
| `TOPLAM_MEVCUT_ADET` | Depodaki mevcut adet |
| `TEKNISYEN_ZIMMET_ADET` | Teknisyene zimmetli adet |

Sayım ilerlemesi Chrome içinde `inventoryItems` anahtarıyla yerel olarak saklanır. Yenileme sırasında stok numarası, depo ve adresi aynı olan kayıtların mevcut sayımı korunur; yeni gelen kayıtlar sıfır sayımla başlar. Sunucuya sayım sonucu gönderme özelliği henüz bulunmamaktadır.

API isteği, açık ve giriş yapılmış `https://oasis.arcelik.com/` sekmesinden alınan Oasis bearer token ile gönderilir.

## Ekran görüntüleri

![Sayım ekranı](sayfa%20-%20sayim%20sekmesi%20aktif.png)

![Tablo ekranı](sayfa%20-%20tablo%20sekmesi%20aktif.png)

![Fark ekranı](sayfa%20-%20farkli%20olanlar%20sekmesi%20aktif.png)

## Proje yapısı

```text
ARON Envanter Sayim/
	app.js             # Sayım arayüzü ve uygulama durumu
	background.js      # Eklenti ikonu ve sekme yönetimi
	index.html         # Kullanıcı arayüzü
	manifest.json      # Manifest V3 yapılandırması
	styles.css         # Arayüz stilleri
	icon.svg
	logo.png
	README.md
	README_TR.md
	Release_Notes.md
	Sürüm_Notları.md
```

Teknik ayrıntılar için [eklenti README'sine](ARON%20Envanter%20Sayim/README_TR.md), sürüm geçmişi için [sürüm notlarına](ARON%20Envanter%20Sayim/S%C3%BCr%C3%BCm_Notlar%C4%B1.md) bakabilirsiniz.
