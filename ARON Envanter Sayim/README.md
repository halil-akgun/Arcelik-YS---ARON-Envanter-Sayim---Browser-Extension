# ARON Inventory Counting

This folder contains the loadable Chrome extension for ARON service inventory counting. It uses Manifest V3 and provides a focused workflow for selecting a stock item, recording its count, and reviewing warehouse/count differences.

## Usage

After installation, the extension opens on the count view. Enter or scan a stock number and press Enter. A valid item becomes selected and its count increases by one. The `+` and `-` controls change the selected count manually; the count cannot go below zero.

The interface has three views:

- **Count screen:** Shows the selected product, warehouse quantity, current count, and difference state.
- **Table:** Lists all products with search, status filters, zero-value hiding, row selection, and sortable columns.
- **Differences:** Shows only products whose count differs from the warehouse quantity.

Use `Refresh data` to fetch the latest product list. The same refresh is performed automatically when the page opens, including after an F5 reload. Existing counts are matched by stock number and retained across a refresh.

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

Counting data is stored in `chrome.storage.local` under the `inventoryItems` key. A refresh replaces the inventory metadata with the latest API response while preserving the local count for matching stock numbers. New products start with a count of zero. The extension does not write count results back to the API.

If the API request fails, the current page shows an error status and an alert. The extension requires network access to load fresh data.

## Development

Load this folder as an unpacked extension from `chrome://extensions`. The extension consists of a static HTML, CSS, and JavaScript interface plus a Manifest V3 service worker. There is no package manager or build step.

For the repository-level setup and screenshots, see [the root README](../README.md). For version history, see [Release Notes](Release_Notes.md).
