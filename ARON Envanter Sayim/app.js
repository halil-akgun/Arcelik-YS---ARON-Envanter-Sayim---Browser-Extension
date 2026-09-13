const apiUrl = "https://oasis.arcelik.com/YsDepoYonetimiApi/api/DepoYonetimi/GetInventoryReportDetail/6058";
const oasisUrl = "https://oasis.arcelik.com/";
const storageKey = "inventoryItems";
const state = {
  items: [],
  selected: null,
  sortKey: "stock",
  sortDirection: 1,
  view: "count",
};
const itemByStock = new Map();
const itemById = new Map();
const searchTextByItem = new WeakMap();
let saveTimer;
let oasisToken;
let tokenResolver;
let lastScannedStock = null;
let retryLoadAfterAlert = false;
let audioContext;
const $ = (selector) => document.querySelector(selector);
const normalize = (value) => String(value ?? "").toLocaleLowerCase("tr-TR");
const numberValue = (value) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;
const differenceFor = (item) =>
  item.count > item.stockCount ? 1 : item.count < item.stockCount ? -1 : 0;
const locationKey = (stock, warehouse, address) =>
  normalize(`${stock}\u0000${warehouse}\u0000${address}`);

function indexItems() {
  itemByStock.clear();
  itemById.clear();
  state.items.forEach((item) => {
    const stockKey = normalize(item.stock);
    item.id ||= encodeURIComponent(
      `${item.stock}\u0000${item.warehouse}\u0000${item.address}`,
    );
    if (!itemByStock.has(stockKey)) itemByStock.set(stockKey, []);
    itemByStock.get(stockKey).push(item);
    itemById.set(item.id, item);
    searchTextByItem.set(
      item,
      normalize(`${item.stock} ${item.name} ${item.address}`),
    );
  });
}

// Create a port for communication with the background script.
const port = chrome.runtime.connect({ name: "oasis-get-token" });

function requestToken() {
  return new Promise((resolve) => {
    tokenResolver = resolve;
    port.postMessage({ action: "getTokenFromOasis" });
  });
}

// Listen for messages from the background script.
port.onMessage.addListener((message) => {
  oasisToken = message.token || null;
  if (tokenResolver) {
    tokenResolver(oasisToken);
    tokenResolver = null;
  }
  if (!oasisToken) console.error("Oasis token bulunamadı.");
});

requestToken();

function hasCachedItems(stored) {
  return Array.isArray(stored[storageKey]) && stored[storageKey].length > 0;
}

function useCachedData(items) {
  state.items = items;
  indexItems();
  setStatus(
    `${state.items.length.toLocaleString("tr-TR")} ürün (veriler güncel olmayabilir)`,
    "warning",
  );
  syncSelected();
  renderActiveView();
}

async function loadData(force = false, retryAttempt = false) {
  try {
    const stored = await chrome.storage.local.get(storageKey);

    if (
      !force &&
      hasCachedItems(stored)
    ) {
      // Use cached data when a forced refresh is not requested.
      useCachedData(stored[storageKey]);
      return;
    }

    if (!oasisToken) oasisToken = await requestToken();
    if (!oasisToken) throw new Error("Oasis token bulunamadı");

    setStatus("Veriler alınıyor...");

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${oasisToken}`,
      },
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error("Oasis oturumu geçersiz");
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();

    // Match previously saved products by stock number.
    const oldItems = Array.isArray(stored[storageKey])
      ? stored[storageKey]
      : [];

    const oldItemsMap = new Map(
      oldItems.map((item) => [
        locationKey(item.stock, item.warehouse, item.address),
        item,
      ]),
    );

    state.items = Array.isArray(payload)
      ? payload.map((item) => {
        const stock = String(item.MALZEME_STOK_NO ?? "");
        const oldItem = oldItemsMap.get(
          locationKey(stock, item.DEPO_ADI ?? "", item.ADRES ?? ""),
        );

        return {
          address: item.ADRES ?? "",
          stock,
          name: item.MALZEME ?? "",
          stockCount: numberValue(item.TOPLAM_MEVCUT_ADET),
          technicianCount: numberValue(item.TEKNISYEN_ZIMMET_ADET),
          warehouse: item.DEPO_ADI ?? "",

          // Preserve the count for existing products; start new products at zero.
          count: oldItem ? numberValue(oldItem.count) : 0,

          // Recalculate the difference against the latest stock quantity.
          difference: 0,
        };
      })
      : [];

    // Recalculate differences after loading the latest stock data.
    state.items.forEach((item) => {
      item.difference = differenceFor(item);
    });
    indexItems();

    await chrome.storage.local.set({ [storageKey]: state.items });

    setStatus(`${state.items.length.toLocaleString("tr-TR")} ürün yüklendi`);
    syncSelected();
    renderActiveView();
  } catch (error) {
    console.error(error);

    const stored = await chrome.storage.local.get(storageKey);
    if (retryAttempt && hasCachedItems(stored)) {
      useCachedData(stored[storageKey]);
      showAlert(
        "Sunucuya bağlanılamadığı için önceden kayıtlı veriler kullanılıyor. Bu veriler güncel olmayabilir.",
        "Kayıtlı veriler kullanılıyor",
      );
      return;
    }

    setStatus("Veri alınamadı", "warning");

    if (
      error.message === "Oasis token bulunamadı" ||
      error.message === "Oasis oturumu geçersiz"
    ) {
      showOasisRequired(hasCachedItems(stored));
    } else {
      showAlert(
        "Sunucudan veriler alınamadı. Bağlantıyı ve API adresini kontrol edin.",
      );
      retryLoadAfterAlert = hasCachedItems(stored);
    }
  }
}

async function exportBackup() {
  const data = await chrome.storage.local.get(null);
  const backup = {
    format: "aron-inventory-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    data,
  };
  const blobUrl = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
  );

  try {
    await chrome.downloads.download({
      url: blobUrl,
      filename: "aron-envanter-yedegi.json",
      saveAs: true,
      conflictAction: "uniquify",
    });
    setStatus("Yedek dosyası kaydedildi");
    closeBackupModal();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function importBackup(file) {
  try {
    const backup = JSON.parse(await file.text());
    if (
      !backup ||
      backup.format !== "aron-inventory-backup" ||
      backup.version !== 1 ||
      !backup.data ||
      typeof backup.data !== "object" ||
      !Array.isArray(backup.data[storageKey])
    ) {
      throw new Error("Geçersiz yedek dosyası");
    }

    await chrome.storage.local.clear();
    await chrome.storage.local.set(backup.data);
    state.items = backup.data[storageKey];
    indexItems();
    state.selected = null;
    setStatus(`${state.items.length.toLocaleString("tr-TR")} ürün yüklendi`);
    renderActiveView();
    closeBackupModal();
    showAlert("Yedek başarıyla geri yüklendi.", "Yedek geri yüklendi");
  } catch (error) {
    console.error(error);
    showAlert("Yedek dosyası okunamadı veya dosya bu eklentiye ait değil.");
  }
}
function openBackupModal() {
  $("#backupModal").classList.remove("hidden");
}
function closeBackupModal() {
  $("#backupModal").classList.add("hidden");
}

function setStatus(text, tone = "") {
  const status = $("#dataStatus");
  status.textContent = text;
  status.classList.toggle("warning", tone === "warning");
}
async function saveData() {
  await chrome.storage.local.set({ [storageKey]: state.items });
}
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveData(), 300);
}
async function resetCounts() {
  if (!state.items.length) return;
  if (!window.confirm("Tüm ürünlerin sayımlarını sıfırlamak istediğinizden emin misiniz?")) return;

  state.items.forEach((item) => {
    item.count = 0;
    item.difference = differenceFor(item);
  });
  await saveData();
  setStatus(`${state.items.length.toLocaleString("tr-TR")} ürün yüklendi`);
  if (state.selected) renderSelected(state.selected);
  renderActiveView();
}
function selectedCount() {
  return state.selected ? state.selected.count : 0;
}
function syncSelected() {
  if (!state.selected) return;

  // Refresh the selected object because a forced load replaces the item list.
  const selectedStock = state.selected.stock;
  const selectedItems = itemByStock.get(normalize(selectedStock)) || [];
  state.selected = selectedItems.find(
    (item) => item.id === state.selected.id,
  ) || selectedItems[0] || null;

  if (state.selected) renderSelected(state.selected);
}
function renderSelected(item) {
  // Keep both counter panels consistent with the selected item.
  item.difference = differenceFor(item);
  $("#selectedCard").classList.remove("empty");
  $("#selectedStock").textContent = item.stock;
  $("#selectedName").textContent = item.name;
  renderLocationButtons(item);
  $("#stockCountOutput").textContent = item.stockCount;
  $("#countOutput").value = item.count;
  $("#countOutput").textContent = item.count;
  const difference = item.count - item.stockCount;
  $("#mainDifferenceValue").textContent =
    `${difference > 0 ? "+" : ""}${difference}`;
  $("#mainStockCount").textContent = item.stockCount;
  $("#mainCount").textContent = item.count;
  $("#counterPanel").classList.remove("under", "over", "equal");
  $("#mainCountPanel").classList.remove("under", "over", "equal");
  const statusClass =
    item.difference < 0 ? "under" : item.difference > 0 ? "over" : "equal";
  $("#counterPanel").classList.add(statusClass);
  $("#mainCountPanel").classList.add(statusClass);
}
function renderLocationButtons(item) {
  const locations = itemByStock.get(normalize(item.stock)) || [item];
  $("#selectedLocations").innerHTML = locations
    .map(
      (location) =>
        `<button type="button" class="location-button${location.id === item.id ? " active" : ""}" data-item-id="${escapeHtml(location.id)}">${escapeHtml(location.address || "Adres -")}${"\u00A0".repeat(4)}${escapeHtml(location.warehouse || "")}</button>`,
    )
    .join("");
}
function updateSelected(item, increase = false) {
  state.selected = item;
  if (increase) {
    item.count += 1;
    beep(760, 0.07);
  }
  renderSelected(item);
  $("#stockInput").value = "";
  updateChangedItem(item);
  scheduleSave();
  requestAnimationFrame(() => $("#stockInput").focus());
}
function scanStock(rawValue) {
  const value = rawValue.trim();
  if (!value) return;
  const stockKey = normalize(value);
  const items = itemByStock.get(stockKey);
  if (!items?.length) {
    lastScannedStock = null;
    showAlert(`${value} stok numarası listede bulunamadı.`);
    $("#stockInput").select();
    return;
  }
  if (items.length > 1 && lastScannedStock === stockKey) {
    const selectedItem = items.some((item) => item.id === state.selected?.id)
      ? state.selected
      : items[0];
    updateSelected(selectedItem, true);
    return;
  }
  if (items.length > 1) {
    lastScannedStock = null;
    openLocationPicker(items);
  } else {
    lastScannedStock = stockKey;
    updateSelected(items[0], true);
  }
}
function openLocationPicker(items) {
  $("#locationOptions").innerHTML = items
    .map(
      (item, index) =>
        `<button type="button" class="location-option" data-item-id="${escapeHtml(item.id)}"${index === 0 ? " autofocus" : ""}>
      <div class="location-line">
        <strong>${escapeHtml(item.address || "Adres -")}</strong>
        <span class="meta">· ${escapeHtml(item.warehouse || "Depo -")}</span>
      </div>
      <span class="meta">Depo ${item.stockCount} · Sayım ${item.count}</span>
      </button>`,
    )
    .join("");
  $("#locationModal").classList.remove("hidden");
  $("#locationOptions .location-option")?.focus();
  beep(680, 0.1);
}
function closeLocationPicker() {
  $("#locationModal").classList.add("hidden");
}
function selectLocation(item, increase = false) {
  lastScannedStock = normalize(item.stock);
  updateSelected(item, increase);
}
function changeCount(amount) {
  if (!state.selected) return;
  state.selected.count = Math.max(0, state.selected.count + amount);
  state.selected.difference = differenceFor(state.selected);
  beep(amount > 0 ? 760 : 360, 0.07);
  updateSelected(state.selected);
}
function openManualCountModal() {
  if (!state.selected) return;
  const input = $("#manualCountInput");
  input.value = state.selected.count;
  $("#manualCountModal").classList.remove("hidden");
  requestAnimationFrame(() => {
    input.focus();
    input.select();
  });
}
function closeManualCountModal() {
  $("#manualCountModal").classList.add("hidden");
}
function submitManualCount() {
  if (!state.selected) return;
  const previousCount = state.selected.count;
  const value = Number($("#manualCountInput").value);
  if (!Number.isInteger(value) || value < 0) return;

  state.selected.count = value;
  state.selected.difference = differenceFor(state.selected);
  if (value > previousCount) beep(760, 0.07);
  else if (value < previousCount) beep(360, 0.07);
  closeManualCountModal();
  updateSelected(state.selected);
}
function showAlert(message, title = "Stok bulunamadı") {
  $("#alertTitle").textContent = title;
  $("#alertMessage").textContent = message;
  $("#openOasisButton").classList.add("hidden");
  $("#alertModal").classList.remove("hidden");
  beep();
}
function showOasisRequired(shouldRetry = false) {
  $("#alertTitle").textContent = "Oasis bağlantısı gerekli";
  $("#alertMessage").textContent =
    "Verileri almak için Oasis sayfasını başka bir sekmede açın ve hesabınıza giriş yapın.";
  $("#openOasisButton").classList.remove("hidden");
  $("#alertModal").classList.remove("hidden");
  retryLoadAfterAlert = shouldRetry;
  beep();
}
function beep(frequency = 520, duration = 0.18) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext ||= new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
  oscillator.addEventListener("ended", () => {
    oscillator.disconnect();
    gain.disconnect();
  }, { once: true });
}
function visibleItems() {
  const query = normalize($("#searchInput").value);
  const filter = $("#filterSelect").value;
  const hideZero = $("#hideZero").checked;
  return state.items
    .filter((item) => {
      const matchesText =
        !query ||
        searchTextByItem.get(item).includes(query);
      const matchesFilter =
        filter === "all" ||
        (filter === "over"
          ? item.stockCount > item.count
          : item.stockCount < item.count);
      const notZero = !hideZero || item.stockCount !== 0 || item.count !== 0;
      return matchesText && matchesFilter && notZero;
    })
    .sort((a, b) => {
      const left = a[state.sortKey];
      const right = b[state.sortKey];
      return (
        (typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), "tr")) *
        state.sortDirection
      );
    });
}
function renderActiveView() {
  if (state.view === "table") renderTable();
  else if (state.view === "diff") renderCount();
}
function isVisibleInTable(item) {
  const query = normalize($("#searchInput").value);
  const filter = $("#filterSelect").value;
  const hideZero = $("#hideZero").checked;
  const matchesText =
    !query || searchTextByItem.get(item).includes(query);
  const matchesFilter =
    filter === "all" ||
    (filter === "over"
      ? item.stockCount > item.count
      : item.stockCount < item.count);
  const notZero = !hideZero || item.stockCount !== 0 || item.count !== 0;
  return matchesText && matchesFilter && notZero;
}
function updateChangedItem(item) {
  if (state.view === "table") updateTableRow(item);
  else if (state.view === "diff") updateDifferenceTile(item);
}
function updateTableRow(item) {
  const row = document.querySelector(
    `#tableBody tr[data-item-id="${CSS.escape(item.id)}"]`,
  );
  const visible = isVisibleInTable(item);

  if (row && visible) {
    row.className = item.difference > 0
      ? "over"
      : item.difference < 0
        ? "under"
        : "";
    row.cells[6].innerHTML = `<strong>${item.count}</strong>`;
    return;
  }

  // A count change can move an item into or out of the active filter.
  if (row || visible) renderTable();
}
function differenceTileHtml(item) {
  return `<article class="count-tile ${item.difference > 0 ? "over" : "under"}" data-item-id="${escapeHtml(item.id)}"><div><div class="tile-stock">${escapeHtml(item.stock)}</div><div class="tile-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div></div><div class="tile-numbers"><strong>${item.count}</strong><span>depo ${item.stockCount}</span></div></article>`;
}
function updateDifferenceTile(item) {
  const tile = document.querySelector(
    `#countGrid article[data-item-id="${CSS.escape(item.id)}"]`,
  );
  const changed = item.difference !== 0;

  if (tile && changed) {
    tile.outerHTML = differenceTileHtml(item);
  } else if (tile && !changed) {
    tile.remove();
  } else if (!tile && changed) {
    $("#countGrid").insertAdjacentHTML("beforeend", differenceTileHtml(item));
  }
  const changedCount = state.items.reduce(
    (total, entry) => total + (entry.difference !== 0 ? 1 : 0),
    0,
  );
  $("#countSummary").textContent =
    `${changedCount.toLocaleString("tr-TR")} farklı ürün`;
  if (!changedCount) {
    $("#countGrid").innerHTML =
      `<div class="empty-state">Henüz fark bulunan ürün yok.</div>`;
  }
}
function renderCount() {
  const changed = state.items.filter((item) => item.difference !== 0);
  $("#countSummary").textContent =
    `${changed.length.toLocaleString("tr-TR")} farklı ürün`;
  $("#countGrid").innerHTML = changed.length
    ? changed
      .map(differenceTileHtml)
      .join("")
    : `<div class="empty-state">Henüz fark bulunan ürün yok.</div>`;
}
function renderTable() {
  const items = visibleItems();
  $("#rowSummary").textContent =
    `${items.length.toLocaleString("tr-TR")} / ${state.items.length.toLocaleString("tr-TR")} kayıt`;
  $("#tableBody").innerHTML = items
    .map(
      (item) =>
        `<tr class="${item.difference > 0 ? "over" : item.difference < 0 ? "under" : ""}" data-item-id="${escapeHtml(item.id)}"><td>${escapeHtml(item.stock)}</td><td title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</td><td>${escapeHtml(item.warehouse)}</td><td>${escapeHtml(item.address)}</td><td>${item.technicianCount}</td><td>${item.stockCount}</td><td><strong>${item.count}</strong></td></tr>`,
    )
    .join("");
  document
    .querySelectorAll(".sort-button")
    .forEach((button) =>
      button.classList.toggle("active", button.dataset.sort === state.sortKey),
    );
}
function escapeHtml(value) {
  return String(value).replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
      char
      ],
  );
}
function bindEvents() {
  $("#stockInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      scanStock(event.target.value);
    }
  });
  $("#clearButton").addEventListener("click", () => {
    $("#stockInput").value = "";
    $("#stockInput").focus();
  });
  $("#incrementButton").addEventListener("click", () => changeCount(1));
  $("#editCountButton").addEventListener("click", openManualCountModal);
  $("#decrementButton").addEventListener("click", () => changeCount(-1));
  $("#refreshButton").addEventListener("click", () => loadData(true));
  $("#resetButton").addEventListener("click", resetCounts);
  $("#backupButton").addEventListener("click", openBackupModal);
  $("#exportBackupButton").addEventListener("click", exportBackup);
  $("#importBackupButton").addEventListener("click", () => $("#backupFileInput").click());
  $("#backupFileInput").addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) importBackup(file);
    event.target.value = "";
  });
  $("#closeBackupModal").addEventListener("click", closeBackupModal);
  $("#manualCountForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitManualCount();
  });
  $("#closeModal").addEventListener("click", () => {
    const shouldRetry = retryLoadAfterAlert;
    retryLoadAfterAlert = false;
    $("#alertModal").classList.add("hidden");
    if (shouldRetry) loadData(true, true);
  });
  $("#openOasisButton").addEventListener("click", () => {
    retryLoadAfterAlert = false;
    chrome.tabs.create({ url: oasisUrl });
    $("#alertModal").classList.add("hidden");
  });
  $("#closeLocationModal").addEventListener("click", closeLocationPicker);
  $("#closeModal2").addEventListener("click", () =>
    $("#manualCountModal").classList.add("hidden"),
  );
  ["searchInput", "filterSelect", "hideZero"].forEach((id) =>
    $("#" + id).addEventListener("input", renderTable),
  );
  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      state.view = tab.dataset.view;
      document
        .querySelectorAll(".tab")
        .forEach((entry) => entry.classList.toggle("active", entry === tab));
      $("#countView").classList.toggle("hidden", state.view !== "count");
      $("#tableView").classList.toggle("hidden", state.view !== "table");
      $("#diffView").classList.toggle("hidden", state.view !== "diff");
      renderActiveView();
    }),
  );
  document.addEventListener("click", (event) => {
    const locationButton = event.target.closest(".location-button");
    if (locationButton) {
      const item = itemById.get(locationButton.dataset.itemId);
      if (item) {
        selectLocation(item);
      }
      return;
    }
    const locationOption = event.target.closest(".location-option");
    if (locationOption) {
      const item = itemById.get(locationOption.dataset.itemId);
      closeLocationPicker();
      if (item) selectLocation(item, true);
      return;
    }
    const sortButton = event.target.closest(".sort-button");
    if (sortButton) {
      if (state.sortKey === sortButton.dataset.sort) state.sortDirection *= -1;
      else {
        state.sortKey = sortButton.dataset.sort;
        state.sortDirection = 1;
      }
      renderTable();
    }
    const row = event.target.closest("tbody tr");
    if (row) {
      const item = itemById.get(row.dataset.itemId);
      if (item) selectLocation(item);
    }
  });
}
bindEvents();
loadData(true);
