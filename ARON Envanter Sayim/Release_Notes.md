# Release Notes

## 1.0

Initial Manifest V3 release of the ARON Inventory Counting extension.

### Included

- Chrome extension action with a background service worker that opens or focuses the counting page.
- Inventory loading from the configured MockAPI endpoint.
- Automatic data loading on page open and manual refresh from the toolbar.
- Local persistence of counts in `chrome.storage.local` under `inventoryItems`.
- Preservation of existing counts by stock number when inventory data is refreshed.
- Barcode or keyboard stock-number entry with automatic count increment.
- Manual increment and decrement controls with a zero lower bound.
- Selected-product counter panels with over, under, and equal states.
- Search by stock number, product name, or address.
- Filters for all items, over-counted items, and under-counted items.
- Optional hiding of products with zero warehouse and count quantities.
- Sortable inventory table and row selection.
- Dedicated count, table, and differences views.
- Audible alert and modal feedback for unknown stock numbers.

### Limitations

- Count results are stored locally and are not submitted to the API.
- Fresh data requires access to the configured API endpoint.
- The extension currently expects the API field names documented in the README.
