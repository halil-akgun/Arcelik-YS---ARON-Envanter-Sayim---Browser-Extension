const apiUrl = "https://6538c6baa543859d1bb1e611.mockapi.io/todos";
const storageKey = "inventoryItems";
const state = { items: [], selected: null, sortKey: "stock", direction: 1 };
const $ = (selector) => document.querySelector(selector);
const text = (value) => String(value ?? "");
const lower = (value) => text(value).toLocaleLowerCase("tr-TR");
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const diff = (item) =>
  item.count > item.stockCount ? 1 : item.count < item.stockCount ? -1 : 0;
const escapeHtml = (value) =>
  text(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );

async function loadData(force = false) {
  try {
    const stored = await chrome.storage.local.get(storageKey);
    if (
      !force &&
      Array.isArray(stored[storageKey]) &&
      stored[storageKey].length
    ) {
      state.items = stored[storageKey];
      status(`${state.items.length.toLocaleString("tr-TR")} ürün hazır`);
      render();
      return;
    }
    status("Veriler alınıyor...");
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(response.status);
    const payload = await response.json();
    state.items = Array.isArray(payload)
      ? payload.map((item) => ({
          address: text(item.ADRES),
          stock: text(item.MALZEME_STOK_NO),
          name: text(item.MALZEME),
          stockCount: num(item.TOPLAM_MEVCUT_ADET),
          technicianCount: num(item.TEKNISYEN_ZIMMET_ADET),
          warehouse: text(item.DEPO_ADI),
          count: 0,
          difference: 0,
        }))
      : [];
    await chrome.storage.local.set({ [storageKey]: state.items });
    status(`${state.items.length.toLocaleString("tr-TR")} ürün hazır`);
    render();
  } catch {
    status("Veri alınamadı");
    alertUser(
      "Sunucudan veriler alınamadı. Bağlantıyı kontrol edip yeniden deneyin.",
    );
  }
}
function status(value) {
  $("#dataStatus").textContent = value;
}
async function save() {
  await chrome.storage.local.set({ [storageKey]: state.items });
}
function choose(item, increment = false) {
  state.selected = item;
  if (increment) item.count += 1;
  item.difference = diff(item);
  $("#stockInput").value = "";
  $("#selectedCard").classList.remove("empty");
  $("#selectedStock").textContent = item.stock;
  $("#selectedName").textContent =
    `${item.name} · ${item.address} · ${item.warehouse}`;
  $("#countOutput").textContent = item.count;
  render();
  save();
  requestAnimationFrame(() => $("#stockInput").focus());
}
function scan(value) {
  const input = value.trim();
  if (!input) return;
  const item = state.items.find((entry) => lower(entry.stock) === lower(input));
  if (!item) {
    alertUser(`${input} stok numarası listede bulunamadı.`);
    $("#stockInput").select();
    return;
  }
  choose(item, true);
}
function change(amount) {
  if (!state.selected) return;
  state.selected.count = Math.max(0, state.selected.count + amount);
  state.selected.difference = diff(state.selected);
  choose(state.selected);
}
function alertUser(message) {
  $("#alertMessage").textContent = message;
  $("#alertModal").classList.remove("hidden");
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (AudioContextClass) {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    oscillator.frequency.value = 500;
    oscillator.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
  }
}
function filtered() {
  const query = lower($("#searchInput").value);
  const filter = $("#filterSelect").value;
  const hideZero = $("#hideZero").checked;
  return state.items
    .filter((item) => {
      const matches =
        !query ||
        [item.stock, item.name, item.address].some((field) =>
          lower(field).includes(query),
        );
      const kind =
        filter === "all" ||
        (filter === "over"
          ? item.stockCount > item.count
          : item.stockCount < item.count);
      const visible = !hideZero || item.stockCount !== 0 || item.count !== 0;
      return matches && kind && visible;
    })
    .sort((a, b) => {
      const aValue = a[state.sortKey];
      const bValue = b[state.sortKey];
      const result =
        typeof aValue === "number"
          ? aValue - bValue
          : text(aValue).localeCompare(text(bValue), "tr");
      return result * state.direction;
    });
}
function render() {
  renderMetrics();
  renderGrid();
  renderTable();
}
function renderMetrics() {
  const under = state.items.filter((item) => diff(item) < 0).length;
  const over = state.items.filter((item) => diff(item) > 0).length;
  $("#metricTotal").textContent = state.items.length.toLocaleString("tr-TR");
  $("#metricChanged").textContent = (under + over).toLocaleString("tr-TR");
  $("#metricUnder").textContent = under.toLocaleString("tr-TR");
  $("#metricOver").textContent = over.toLocaleString("tr-TR");
}
function renderGrid() {
  const changed = state.items.filter((item) => diff(item) !== 0);
  $("#countSummary").textContent =
    `${changed.length.toLocaleString("tr-TR")} fark`;
  $("#countGrid").innerHTML = changed.length
    ? changed
        .map(
          (item) =>
            `<article class="count-tile ${item.difference < 0 ? "under" : "over"}"><div class="tile-top"><strong>${escapeHtml(item.stock)}</strong><em>${item.difference < 0 ? "Eksik" : "Fazla"}</em></div><div class="tile-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div><div class="tile-bottom"><strong>${item.count}</strong><span>depo adedi ${item.stockCount}</span></div></article>`,
        )
        .join("")
    : `<div>Şu anda sayım farkı bulunmuyor.</div>`;
}
function renderTable() {
  const items = filtered();
  $("#rowSummary").textContent =
    `${items.length.toLocaleString("tr-TR")} / ${state.items.length.toLocaleString("tr-TR")} kayıt`;
  $("#tableBody").innerHTML = items
    .map(
      (item) =>
        `<tr class="${item.difference < 0 ? "under" : item.difference > 0 ? "over" : ""}" data-stock="${escapeHtml(item.stock)}"><td>${escapeHtml(item.stock)}</td><td title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</td><td>${escapeHtml(item.warehouse)}</td><td>${escapeHtml(item.address)}</td><td>${item.technicianCount}</td><td>${item.stockCount}</td><td><strong>${item.count}</strong></td><td><span class="status ${item.difference < 0 ? "under" : item.difference > 0 ? "over" : ""}">${item.difference < 0 ? "Eksik" : item.difference > 0 ? "Fazla" : "Eşit"}</span></td></tr>`,
    )
    .join("");
  document
    .querySelectorAll(".sort-button")
    .forEach((button) =>
      button.classList.toggle("active", button.dataset.sort === state.sortKey),
    );
}
function bind() {
  $("#stockInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      scan(event.target.value);
    }
  });
  $("#incrementButton").addEventListener("click", () => change(1));
  $("#decrementButton").addEventListener("click", () => change(-1));
  $("#clearButton").addEventListener("click", () => {
    $("#stockInput").value = "";
    $("#stockInput").focus();
  });
  $("#refreshButton").addEventListener("click", () => loadData(true));
  $("#closeModal").addEventListener("click", () =>
    $("#alertModal").classList.add("hidden"),
  );
  ["searchInput", "filterSelect", "hideZero"].forEach((id) =>
    $("#" + id).addEventListener("input", renderTable),
  );
  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab")
        .forEach((entry) => entry.classList.toggle("active", entry === tab));
      $("#countView").classList.toggle("hidden", tab.dataset.view !== "count");
      $("#tableView").classList.toggle("hidden", tab.dataset.view !== "table");
    }),
  );
  document.addEventListener("click", (event) => {
    const sort = event.target.closest(".sort-button");
    if (sort) {
      if (state.sortKey === sort.dataset.sort) state.direction *= -1;
      else {
        state.sortKey = sort.dataset.sort;
        state.direction = 1;
      }
      renderTable();
    }
    const row = event.target.closest("tbody tr");
    if (row) {
      const item = state.items.find(
        (entry) => entry.stock === row.dataset.stock,
      );
      if (item) choose(item);
    }
  });
}
bind();
loadData();
