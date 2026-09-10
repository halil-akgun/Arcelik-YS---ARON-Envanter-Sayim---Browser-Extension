const apiUrl = "https://6538c6baa543859d1bb1e611.mockapi.io/todos";
const storageKey = "inventoryItems";
const state = {
  items: [],
  selected: null,
  sortKey: "stock",
  sortDirection: 1,
  view: "count",
};
const $ = (selector) => document.querySelector(selector);
const normalize = (value) => String(value ?? "").toLocaleLowerCase("tr-TR");
const numberValue = (value) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;
const differenceFor = (item) =>
  item.count > item.stockCount ? 1 : item.count < item.stockCount ? -1 : 0;

async function loadData(force = false) {
  try {
    const stored = await chrome.storage.local.get(storageKey);
    if (
      !force &&
      Array.isArray(stored[storageKey]) &&
      stored[storageKey].length
    ) {
      state.items = stored[storageKey];
      setStatus(`${state.items.length.toLocaleString("tr-TR")} ürün yüklendi`);
      render();
      return;
    }
    setStatus("Veriler alınıyor...");
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    state.items = Array.isArray(payload)
      ? payload.map((item) => ({
          address: item.ADRES ?? "",
          stock: String(item.MALZEME_STOK_NO ?? ""),
          name: item.MALZEME ?? "",
          stockCount: numberValue(item.TOPLAM_MEVCUT_ADET),
          technicianCount: numberValue(item.TEKNISYEN_ZIMMET_ADET),
          warehouse: item.DEPO_ADI ?? "",
          count: 0,
          difference: 0,
        }))
      : [];
    await chrome.storage.local.set({ [storageKey]: state.items });
    setStatus(`${state.items.length.toLocaleString("tr-TR")} ürün yüklendi`);
    render();
  } catch (error) {
    setStatus("Veri alınamadı");
    showAlert(
      "Sunucudan veriler alınamadı. Bağlantıyı ve API adresini kontrol edin.",
    );
  }
}
function setStatus(text) {
  $("#dataStatus").textContent = text;
}
async function saveData() {
  await chrome.storage.local.set({ [storageKey]: state.items });
}
function selectedCount() {
  return state.selected ? state.selected.count : 0;
}
function updateSelected(item, increase = false) {
  state.selected = item;
  if (increase) item.count += 1;
  item.difference = differenceFor(item);
  $("#stockInput").value = "";
  $("#selectedCard").classList.remove("empty");
  $("#selectedStock").textContent = item.stock;
  $("#selectedName").textContent = item.name;
  $("#selectedAddress").textContent = `Adres ${item.address || "-"}`;
  $("#selectedWarehouse").textContent = item.warehouse || "Depo -";
  $("#countOutput").value = item.count;
  $("#countOutput").textContent = item.count;
  render();
  saveData();
  requestAnimationFrame(() => $("#stockInput").focus());
}
function scanStock(rawValue) {
  const value = rawValue.trim();
  if (!value) return;
  const item = state.items.find(
    (entry) => normalize(entry.stock) === normalize(value),
  );
  if (!item) {
    showAlert(`${value} stok numarası listede bulunamadı.`);
    $("#stockInput").select();
    return;
  }
  updateSelected(item, true);
}
function changeCount(amount) {
  if (!state.selected) return;
  state.selected.count = Math.max(0, state.selected.count + amount);
  state.selected.difference = differenceFor(state.selected);
  updateSelected(state.selected);
}
function showAlert(message) {
  $("#alertMessage").textContent = message;
  $("#alertModal").classList.remove("hidden");
  beep();
}
function beep() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 520;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
}
function visibleItems() {
  const query = normalize($("#searchInput").value);
  const filter = $("#filterSelect").value;
  const hideZero = $("#hideZero").checked;
  return state.items
    .filter((item) => {
      const matchesText =
        !query ||
        [item.stock, item.name, item.address].some((value) =>
          normalize(value).includes(query),
        );
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
function render() {
  renderCount();
  renderTable();
}
function renderCount() {
  const changed = state.items.filter((item) => item.difference !== 0);
  $("#countSummary").textContent =
    `${changed.length.toLocaleString("tr-TR")} farklı ürün`;
  $("#countGrid").innerHTML = changed.length
    ? changed
        .map(
          (item) =>
            `<article class="count-tile ${item.difference > 0 ? "over" : "under"}"><div><div class="tile-stock">${escapeHtml(item.stock)}</div><div class="tile-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div></div><div class="tile-numbers"><strong>${item.count}</strong><span>depo ${item.stockCount}</span></div></article>`,
        )
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
        `<tr class="${item.difference > 0 ? "over" : item.difference < 0 ? "under" : ""}" data-stock="${escapeHtml(item.stock)}"><td>${escapeHtml(item.stock)}</td><td title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</td><td>${escapeHtml(item.warehouse)}</td><td>${escapeHtml(item.address)}</td><td>${item.technicianCount}</td><td>${item.stockCount}</td><td><strong>${item.count}</strong></td></tr>`,
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
  $("#decrementButton").addEventListener("click", () => changeCount(-1));
  $("#refreshButton").addEventListener("click", () => loadData(true));
  $("#closeModal").addEventListener("click", () =>
    $("#alertModal").classList.add("hidden"),
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
    }),
  );
  document.addEventListener("click", (event) => {
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
      const item = state.items.find(
        (entry) => entry.stock === row.dataset.stock,
      );
      if (item) updateSelected(item);
    }
  });
}
bindEvents();
loadData();
