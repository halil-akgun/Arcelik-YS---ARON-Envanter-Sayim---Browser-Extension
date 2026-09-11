# Sürüm Notları

## 1.0

ARON Envanter Sayım eklentisinin ilk Manifest V3 sürümüdür.

### İçerikler

- Sayım sayfasını açan veya açık sayımı öne getiren arka plan service worker'ı.
- Yapılandırılmış MockAPI adresinden ürün listesi alma.
- Sayfa açılışında otomatik veri alma ve üst araç çubuğundan manuel yenileme.
- Sayımların `inventoryItems` anahtarıyla `chrome.storage.local` içinde saklanması.
- Veri yenilendiğinde mevcut sayımların stok numarasına göre korunması.
- Barkod veya klavye ile stok numarası girme ve sayımı otomatik artırma.
- Sayımı sıfırın altına indirmeyen manuel artırma ve azaltma düğmeleri.
- Seçili ürün için fazla, eksik ve eşit durumlarını gösteren sayaç panelleri.
- Stok numarası, malzeme adı veya adrese göre arama.
- Tüm ürünler, sayımı fazla olanlar ve sayımı eksik olanlar için filtreler.
- Depo adedi ve sayımı sıfır olan ürünleri gizleme seçeneği.
- Sıralanabilir envanter tablosu ve satır seçimi.
- Sayım ekranı, tablo ve farklı olanlar görünümleri.
- Listede olmayan stok numaraları için sesli uyarı ve modal bildirim.

### Sınırlamalar

- Sayım sonuçları yerel olarak saklanır; API'ye gönderilmez.
- Güncel verilerin alınabilmesi için yapılandırılmış API adresine erişim gerekir.
- Eklenti README'de belgelenen API alan adlarını bekler.
