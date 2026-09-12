# ARON Inventory Counting

This folder contains the loadable Chrome extension for ARON service inventory counting. It uses Manifest V3 and provides a focused workflow for selecting a stock item, recording its count, and reviewing warehouse/count differences.

## Usage

After installation, the extension opens on the count view. Enter or scan a stock number and press Enter. A valid item becomes selected and its count increases by one. If the stock number exists at multiple addresses, choose an address first; repeated scans of the same stock number reuse that address until another stock number is entered. The `+` and `-` controls change the selected count manually; the count cannot go below zero.

The interface has three views:

- **Count screen:** Shows the selected product, warehouse quantity, current count, and difference state.
- **Table:** Lists all products with search, status filters, zero-value hiding, row selection, and sortable columns.
- **Differences:** Shows only products whose count differs from the warehouse quantity.

Use `Refresh data` to fetch the latest product list. When saved data exists, the page opens from local storage first, including after an F5 reload, so counting can continue without a network connection. Use `Refresh data` when the latest API data is needed. Existing counts are matched by stock number, warehouse, and address and retained across a refresh.

Use `Back up/restore data` in the top toolbar to save all extension data to a JSON file or restore a backup on another computer. The browser asks where the backup file should be saved. To count offline, refresh the inventory while Oasis and the API are available, then create a backup and restore it on the offline computer.

Scanning requires an open and authenticated Oasis tab. Products stored at multiple addresses are counted separately, and the selected address is shown as a button in the selected-product panel. Table-row selection chooses the address directly without opening the address picker.

## Data contract

The extension fetches JSON from `https://oasis.arcelik.com/YsDepoYonetimiApi/api/DepoYonetimi/GetInventoryReportDetail/6058`. Each product is mapped from these fields:

| Field | Description |
| --- | --- |
| `MALZEME_STOK_NO` | Stock number used for matching and persistence |
| `MALZEME` | Product name |
| `ADRES` | Product address |
| `DEPO_ADI` | Warehouse name |
| `TOPLAM_MEVCUT_ADET` | Current warehouse quantity |
| `TEKNISYEN_ZIMMET_ADET` | Technician-assigned quantity shown in the table |

Values that are missing or not numeric are treated as empty text or zero where appropriate.

## Persistence and refresh behavior

Counting data is stored in `chrome.storage.local` under the `inventoryItems` key. A refresh replaces the inventory metadata with the latest API response while preserving the local count for matching stock number, warehouse, and address records. New products start with a count of zero. The extension does not write count results back to the API.

Backups include all keys currently stored in `chrome.storage.local`. Imported files must be valid ARON Inventory Counting backup files and contain an `inventoryItems` list.

If the API request fails, the current page shows an error status and an alert. The extension requires an authenticated Oasis tab and network access to load fresh data. Count changes update only the affected table row or difference tile when those views are active.

## Development

Load this folder as an unpacked extension from `chrome://extensions`. The extension consists of a static HTML, CSS, and JavaScript interface plus a Manifest V3 service worker. There is no package manager or build step.

For the repository-level setup and screenshots, see [the root README](../README.md). For version history, see [Release Notes](Release_Notes.md).
