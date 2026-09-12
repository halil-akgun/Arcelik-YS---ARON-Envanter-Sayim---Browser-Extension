# Sürüm Notları

## 1.0

ARON Envanter Sayım eklentisinin ilk Manifest V3 sürümüdür.

### İçerikler

- Sayım sayfasını açan veya açık sayımı öne getiren arka plan service worker'ı.
- Yapılandırılmış Oasis API adresinden ürün listesi alma.
- Sayfa açılışında otomatik veri alma ve üst araç çubuğundan manuel yenileme.
- Sayımların `inventoryItems` anahtarıyla `chrome.storage.local` içinde saklanması.
- Veri yenilendiğinde mevcut sayımların stok numarası, depo ve adrese göre korunması.
- Barkod veya klavye ile stok numarası girme ve sayımı otomatik artırma.
- Sayımı sıfırın altına indirmeyen manuel artırma ve azaltma düğmeleri.
- Seçili ürün için fazla, eksik ve eşit durumlarını gösteren sayaç panelleri.
- Stok numarası, malzeme adı veya adrese göre arama.
- Tüm ürünler, sayımı fazla olanlar ve sayımı eksik olanlar için filtreler.
- Depo adedi ve sayımı sıfır olan ürünleri gizleme seçeneği.
- Sıralanabilir envanter tablosu ve satır seçimi.
- Sayım ekranı, tablo ve farklı olanlar görünümleri.
- Listede olmayan stok numaraları için sesli uyarı ve modal bildirim.
- Oasis bearer token doğrulaması; açık ve giriş yapılmış sekme yoksa Oasis'i açma yönlendirmesi.
- Birden fazla adreste bulunan ürünleri adres bazında ayrı sayma ve barkod okutma sırasında adres seçme.
- Aynı stok numarası art arda okutulduğunda seçilen adresi yeniden kullanma.
- Adres seçimi, sayım artırma ve azaltma için farklı sesli bildirimler.
- Büyük envanterlerde sayım sırasında yalnızca değişen tablo satırını veya fark kartını güncelleme.
- Tüm yerel eklenti verilerini JSON olarak dışa aktarma ve başka bilgisayarda geri yükleme seçenekleri.
- Yedek dosyası kaydedilirken tarayıcının kayıt konumu seçme penceresini kullanma.
- Geri yüklenen envanter verileriyle internetsiz sayım yapabilmek için yerel önbellekten açılış.

### Sınırlamalar

- Sayım sonuçları yerel olarak saklanır; API'ye gönderilmez.
- Güncel verilerin alınabilmesi için yapılandırılmış API adresine erişim gerekir; daha önce kaydedilen envanter verileri çevrimdışı kullanılabilir.
- Eklenti README'de belgelenen API alan adlarını bekler.
