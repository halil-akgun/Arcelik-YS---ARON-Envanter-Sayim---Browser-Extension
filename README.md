# ARON Inventory Counting

ARON Inventory Counting is a Manifest V3 Chrome extension for authorized service inventory operations. It loads the current inventory list, lets the operator count products by barcode or manually, and highlights differences between the warehouse quantity and the counted quantity.

The repository contains one loadable extension under `ARON Envanter Sayim/`.

## Features

- Load inventory data from the configured API.
- Preserve counting progress in Chrome local storage by stock number.
- Open saved data from local storage when the page opens or after an F5 reload; fetch fresh data when `Refresh data` is clicked.
- Back up all browser-stored extension data to a JSON file and restore it on another computer.
- Continue counting offline after restoring an inventory backup.
- Scan or enter a stock number and increase its count.
- Select an address when a stock number exists at multiple locations; repeated scans of the same stock number reuse the selected address until another stock number is entered.
- Increase or decrease the selected product manually.
- Keep address-specific counts for products stored at multiple locations.
- Search by stock number, product name, or address.
- Filter products by all, over-counted, or under-counted status.
- Hide products whose warehouse and count quantities are both zero.
- Sort the table by stock number, product, warehouse, address, warehouse quantity, or count.
- View the count screen, the complete table, and products with differences.
- Show a warning and audible alert when an unknown stock number is entered.
- Require an open, authenticated Oasis tab and provide a button to open it when unavailable.
- Provide distinct audio feedback for address selection, count increases, and count decreases.
- Update only the affected table row or difference tile during counting for faster operation with large inventories.
- Reuse an already-open counting tab when the extension icon is clicked.

## Installation

1. Open `chrome://extensions` in Google Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the `ARON Envanter Sayim/` folder.
5. Click the ARON extension icon to open the counting screen.

The extension must be reloaded from the Extensions page after changing its source files.

## Data and storage

The current API endpoint is:

`https://oasis.arcelik.com/YsDepoYonetimiApi/api/DepoYonetimi/GetInventoryReportDetail/6058`

The API response is expected to provide these fields:

| API field | Meaning |
| --- | --- |
| `MALZEME_STOK_NO` | Stock number |
| `MALZEME` | Product name |
| `ADRES` | Address |
| `DEPO_ADI` | Warehouse name |
| `TOPLAM_MEVCUT_ADET` | Warehouse quantity |
| `TEKNISYEN_ZIMMET_ADET` | Technician-assigned quantity |

Counting progress is stored locally in Chrome under the `inventoryItems` key. When refreshed, records matching the same stock number, warehouse, and address keep their existing count; newly returned records start at zero. No server-side count submission is implemented.

The `Back up/restore data` toolbar action exports all keys from `chrome.storage.local` to a JSON file. The browser asks for the save location. A valid backup can be restored on another computer, allowing the cached inventory to be used without network access.

The API request uses the Oasis bearer token from an open, authenticated `https://oasis.arcelik.com/` tab.

## Screenshots

![Count view](sayfa%20-%20sayim%20sekmesi%20aktif.png)

![Table view](sayfa%20-%20tablo%20sekmesi%20aktif.png)

![Diff view](sayfa%20-%20farkli%20olanlar%20sekmesi%20aktif.png)

## Project structure

```text
ARON Envanter Sayim/
	app.js             # Counting UI and application state
	background.js      # Extension icon and tab handling
	index.html         # User interface
	manifest.json      # Manifest V3 configuration
	styles.css         # Interface styles
	icon.svg
	logo.png
	README.md
	README_TR.md
	Release_Notes.md
	Sürüm_Notları.md
```

See [the extension README](ARON%20Envanter%20Sayim/README.md) for implementation-specific details and [the release notes](ARON%20Envanter%20Sayim/Release_Notes.md) for the current version history.
