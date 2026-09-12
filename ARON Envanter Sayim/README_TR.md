# ARON Envanter Sayım

Bu klasör, ARON servis envanter sayımı için yüklenebilir Chrome eklentisini içerir. Manifest V3 kullanır; ürün seçme, sayım kaydetme ve depo adedi ile sayım adedi arasındaki farkları inceleme akışını sağlar.

## Kullanım

Kurulumdan sonra eklenti sayım ekranıyla açılır. Bir stok numarası girin veya barkod okutun ve Enter'a basın. Ürün bulunursa seçilir ve sayımı bir artar. Seçili ürünün sayımını manuel değiştirmek için `+` ve `-` düğmelerini kullanabilirsiniz; sayım sıfırın altına inmez.

Stok numarası birden fazla adreste bulunuyorsa önce adres seçin; aynı stok numarası art arda okutulduğunda seçilen adres kullanılır, araya başka stok numarası girildiğinde adres seçimi yeniden istenir.

Arayüz üç görünümden oluşur:

- **Sayım ekranı:** Seçili ürün, depo adedi, mevcut sayım ve fark durumunu gösterir.
- **Tablo:** Arama, fark filtreleri, sıfır değerleri gizleme, satır seçme ve sıralanabilir sütunları içerir.
- **Farklı olanlar:** Depo adedi ile sayım adedi eşleşmeyen ürünleri gösterir.

Güncel ürün listesini almak için `Verileri yenile` düğmesine basın. Aynı yenileme sayfa ilk açıldığında ve F5 ile yenilendiğinde otomatik olarak yapılır. Yenileme sırasında mevcut sayımlar stok numarası, depo ve adres eşleşmesine göre korunur.

Barkod okutma sırasında açık ve giriş yapılmış bir Oasis sekmesi gerekir. Birden fazla adreste bulunan ürünler ayrı ayrı sayılır; seçili ürün alanındaki adres butonuyla aktif adres değiştirilebilir. Tablo satırından seçim yapıldığında adres doğrudan seçilir ve adres penceresi açılmaz.

## Veri sözleşmesi

Eklenti JSON verisini `https://oasis.arcelik.com/YsDepoYonetimiApi/api/DepoYonetimi/GetInventoryReportDetail/6058` adresinden alır. Her ürün aşağıdaki alanlardan oluşturulur:

| Alan | Açıklama |
| --- | --- |
| `MALZEME_STOK_NO` | Eşleştirme ve yerel kayıt için kullanılan stok numarası |
| `MALZEME` | Malzeme adı |
| `ADRES` | Ürün adresi |
| `DEPO_ADI` | Depo adı |
| `TOPLAM_MEVCUT_ADET` | Depodaki mevcut adet |
| `TEKNISYEN_ZIMMET_ADET` | Tabloda gösterilen teknisyen zimmet adedi |

Eksik veya sayısal olmayan değerler uygun yerlerde boş metin ya da sıfır olarak değerlendirilir.

## Yerel kayıt ve yenileme davranışı

Sayım verileri `inventoryItems` anahtarıyla `chrome.storage.local` içinde saklanır. Yenileme sırasında ürün bilgileri API'nin güncel yanıtıyla değiştirilir; stok numarası, depo ve adresi aynı olan kaydın yerel sayımı korunur. Yeni kayıtlar sıfır sayımla başlar. Sayım sonuçları API'ye geri gönderilmez.

API isteği başarısız olursa sayfa hata durumunu ve uyarı penceresini gösterir. Güncel verileri almak için giriş yapılmış Oasis sekmesi ve ağ bağlantısı gerekir. Tablo veya farklı olanlar görünümünde sayım değiştiğinde yalnızca ilgili satır ya da kart güncellenir.

## Geliştirme

Bu klasörü `chrome://extensions` üzerinden paketlenmemiş eklenti olarak yükleyebilirsiniz. Eklenti; statik HTML, CSS, JavaScript arayüzü ve Manifest V3 service worker'dan oluşur. Paket yöneticisi veya build adımı yoktur.

Depo kurulumu ve ekran görüntüleri için [kök README'ye](../README_TR.md), sürüm geçmişi için [Sürüm Notları'na](Sürüm_Notları.md) bakabilirsiniz.
