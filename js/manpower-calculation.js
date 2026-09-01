/* =========================================
   PRDMS - MANPOWER CALCULATION
   Calculation engine + official landscape
   manpower print format.
   ========================================= */

const DEFAULT_MANPOWER_ITEMS = [
    { item: "Door repair (Dummy/Door way side & Top Stiffener cut/Welded)", changed: null, repair: 0.83 },
    { item: "Panel repair (Welded)", changed: null, repair: 0.58 },
    { item: "Door hinge pin", changed: 0.20, repair: null },
    { item: "PANEL PATCH (Less than 1 sq. ft.)", changed: null, repair: null },
    { item: "PANEL PATCH (1 sq. ft. To 2.69 sq. ft.)", changed: null, repair: null },
    { item: "PANEL PATCH (2.7 sq. ft. To 5.38 sq. ft.)", changed: null, repair: null },
    { item: "Floor repair (Welded)", changed: null, repair: 0.58 },
    { item: "Lock lifter assembly", changed: 1.59, repair: 0.25 },
    { item: "Bearing piece", changed: 0.42, repair: null },
    { item: "Control rod", changed: 1.50, repair: null },
    { item: "Knuckle pin with APD", changed: 0.20, repair: null },
    { item: "SIDE FRAME KEY WITH BOLT", changed: 0.15, repair: null },
    { item: "ELB HANDLE", changed: 0.15, repair: 0.15 },
    { item: "ELB SIGN BOARD PLATE", changed: 1.82, repair: null },
    { item: "ELB C LINK STRAIGHT ROD", changed: 0.15, repair: 0.15 },
    { item: "ELB C LINK TWIST ROD", changed: 0.15, repair: 0.15 },
    { item: "ELB CHECK COLLER FOR LONG SHAFT/BUSH", changed: 0.50, repair: 0.50 },
    { item: "ELB CLUTCH BOX", changed: 2.00, repair: 1.25 },
    { item: "ELB OPERATING ARM", changed: 0.50, repair: 0.50 },
    { item: "ELB TEETH SEGMENT", changed: 0.50, repair: 0.50 },
    { item: "ELB SET", changed: 4.50, repair: 2.50 },
    { item: "END PULL ROD", changed: 0.25, repair: null },
    { item: "INNER & OUTER COIL SPRING", changed: 0.66, repair: null },
    { item: "SPLIT PIN", changed: 0.10, repair: null }
];

const MANPOWER_MAP = {
    "Door Repair": { item: "Door repair (Dummy/Door way side & Top Stiffener cut/Welded)", category: "Repair", print: "Door repair", group: "repaired" },
    "Panel Repair": { item: "Panel repair (Welded)", category: "Repair", print: "Panel patch", group: "repaired" },
    "Lock Lifter Handle Change": { item: "Lock lifter assembly", category: "Changed", print: "Lock lifter Handle Fitted", group: "changed" },
    "Lock Lifter Handle Repair": { item: "Lock lifter assembly", category: "Repair", print: "Lock lifter Handle repair", group: "repaired" },
    "K/Pin Fitted": { item: "Knuckle pin with APD", category: "Changed", print: "Knuckle pin fitted", group: "changed" },
    "Side Frame Key with Nut & Bolt Fitted": { item: "SIDE FRAME KEY WITH BOLT", category: "Changed", print: "Side Frame Key with Nut & Bolt Fitted", group: "changed" },
    "Panel Fitted": { item: "PANEL PATCH", category: "Changed", print: "Panel patch fitted (kg)", group: "changed" },
    "Floor Fitted": { item: "Floor repair (Welded)", category: "Changed", print: "Floor patch fitted (kg)", group: "changed" }
};

let currentReport = null;
let calculation = null;

let selectedReportId = null;

function readSavedReports() {
    try {
        const reports = JSON.parse(localStorage.getItem("PRDMS_REPORT_HISTORY") || "[]");
        return Array.isArray(reports) ? reports : [];
    } catch (error) {
        return [];
    }
}

function populateTrainSelector(preferredId = null) {
    const select = document.getElementById("manpowerTrainSelect");
    const search = document.getElementById("manpowerTrainSearch");
    if (!select) return;

    const reports = readSavedReports()
        .slice()
        .sort((a, b) => String(b.reportDate || "").localeCompare(String(a.reportDate || "")) || String(b.savedAt || "").localeCompare(String(a.savedAt || "")));

    select.innerHTML = '<option value="">Select a saved train...</option>' + reports.map((r, index) => {
        const id = r.reportId || `${r.trainNo || "REPORT"}_${r.reportDate || ""}_${index}`;
        const date = r.reportDate || "No date";
        const wagons = Array.isArray(r.wagons) ? r.wagons.length : 0;
        return `<option value="${escapeHtml(id)}">${escapeHtml(r.trainNo || "Unnamed Train")} | ${escapeHtml(date)} | ${wagons} wagons</option>`;
    }).join("");

    if (!reports.length) {
        select.innerHTML = '<option value="">No saved Damage Reports available</option>';
    }

    if (preferredId) {
        select.value = preferredId;
        if (select.value) select.dispatchEvent(new Event("change"));
    }

    if (search) {
        search.addEventListener("input", function () {
            const q = normalise(this.value);
            [...select.options].forEach((option, index) => {
                if (index === 0) { option.hidden = false; return; }
                option.hidden = q && !normalise(option.textContent).includes(q);
            });
            const firstVisible = [...select.options].find((o, i) => i > 0 && !o.hidden);
            if (q && firstVisible && select.value !== firstVisible.value) select.value = firstVisible.value;
        });
    }

    select.addEventListener("change", function () {
        selectedReportId = this.value || null;
        if (!selectedReportId) {
            currentReport = null;
            calculation = null;
            hideManpowerResults();
            return;
        }
        const report = reports.find(r => String(r.reportId || "") === String(selectedReportId));
        if (!report) return;
        localStorage.setItem("PRDMS_CURRENT_REPORT", JSON.stringify(report));
        currentReport = report;
        showManpowerResults();
        calculateManpower();
    });
}

function showManpowerResults() {
    document.getElementById("manpowerResults")?.classList.remove("d-none");
}

function hideManpowerResults() {
    document.getElementById("manpowerResults")?.classList.add("d-none");
    document.getElementById("reportMessage")?.classList.add("d-none");
    clearTables();
    ["trainNo","reportDate","rakeID","printRakeNo","printInspectionDate","printRepairDate"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = id.includes("Date") ? "" : "—";
    });
}

function normalise(text) {
    return String(text || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function findMasterRate(itemName, category) {
    const target = normalise(itemName);
    let master = DEFAULT_MANPOWER_ITEMS;
    try {
        const saved = localStorage.getItem("PRDMS_MANPOWER_MASTER");
        if (saved) master = JSON.parse(saved);
    } catch (error) {
        console.warn("Using default manpower rates.", error);
    }

    const found = master.find(item => normalise(item.item) === target);
    if (!found) return null;
    const value = category === "Changed" ? found.changed : found.repair;
    return value === null || value === undefined || value === "" ? null : Number(value);
}

function getCurrentReport() {
    try {
        return JSON.parse(localStorage.getItem("PRDMS_CURRENT_REPORT") || "null");
    } catch (error) {
        console.error("Unable to read current report", error);
        return null;
    }
}

function fittedWeight(wagon, type) {
    if (!Array.isArray(wagon?.fittedDetails)) return 0;
    return wagon.fittedDetails
        .filter(item => normalise(item.item) === normalise(type))
        .reduce((sum, item) => sum + Number(item.weightKg || 0), 0);
}

function getQuantity(wagon, column) {
    if (column === "Panel Fitted" || column === "Floor Fitted") return fittedWeight(wagon, column);
    return Number(wagon?.repairs?.[column] || 0);
}

function formatDateDDMMYYYY(value) {
    if (!value) return "";
    const text = String(value).trim();

    // Already in DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;

    // ISO date: YYYY-MM-DD
    const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

    const d = new Date(text);
    if (!Number.isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        return `${day}/${month}/${d.getFullYear()}`;
    }

    return text;
}

function loadReportHeader() {
    const report = currentReport || {};
    const sameDate = formatDateDDMMYYYY(report.reportDate || report.repairDate);
    document.getElementById("trainNo").textContent = report.trainNo || "—";
    document.getElementById("reportDate").textContent = sameDate || "—";
    document.getElementById("rakeID").textContent = report.rakeID || "—";
    document.getElementById("printRakeNo").textContent = report.trainNo || "—";
    document.getElementById("printInspectionDate").textContent = sameDate;
    document.getElementById("printRepairDate").textContent = sameDate;
}

function getUsedColumns(wagons) {
    const all = currentReport.repairColumns || [
        "Door Repair", "Panel Repair", "Panel Fitted", "Floor Fitted",
        "Lock Lifter Handle Change", "Lock Lifter Handle Repair",
        "K/Pin Fitted", "Side Frame Key with Nut & Bolt Fitted"
    ];
    return all.filter(column => wagons.some(wagon => getQuantity(wagon, column) > 0));
}

function calculateManpower() {
    if (!selectedReportId && !currentReport) {
        hideManpowerResults();
        return;
    }
    currentReport = getCurrentReport() || currentReport;
    if (!currentReport) {
        setMessage("No saved Damage Report was found. Save a Damage Report first.", "warning");
        clearTables();
        return;
    }

    loadReportHeader();
    const yrWagons = (currentReport.wagons || []).filter(wagon => normalise(wagon.remarks) === "y/r");
    document.getElementById("yrCount").textContent = yrWagons.length;

    if (!yrWagons.length) {
        setMessage("No Y/R wagons are present in the current Damage Report.", "warning");
        clearTables();
        return;
    }

    setMessage("Manpower calculated from Y/R wagons using the Manpower Master rates.", "success");

    const columns = getUsedColumns(yrWagons);
    const wagonRows = [];
    const summary = new Map();
    const unrated = new Set();

    yrWagons.forEach((wagon, wagonIndex) => {
        let wagonTotal = 0;
        const rowItems = [];
        columns.forEach(column => {
            const quantity = getQuantity(wagon, column);
            if (quantity <= 0) return;
            const mapping = MANPOWER_MAP[column];
            if (!mapping) return;
            const rate = findMasterRate(mapping.item, mapping.category);
            if (rate === null) {
                unrated.add(column);
                rowItems.push({ column, quantity, rate: null, total: 0, category: mapping.category, mapping });
                return;
            }
            const total = quantity * rate;
            wagonTotal += total;
            rowItems.push({ column, quantity, rate, total, category: mapping.category, mapping });
            const key = column + "|" + mapping.category;
            if (!summary.has(key)) summary.set(key, { column, item: mapping.item, category: mapping.category, quantity: 0, rate, total: 0 });
            const s = summary.get(key);
            s.quantity += quantity;
            s.total += total;
        });
        wagonRows.push({ wagon, index: wagonIndex, items: rowItems, total: wagonTotal });
    });

    calculation = { columns, wagonRows, summary: [...summary.values()], unrated: [...unrated] };
    renderWagonTable();
    renderSummary();
    renderUnrated();
    renderOfficialPrint();
}

function renderWagonTable() {
    const head = document.getElementById("wagonManpowerHead");
    const body = document.getElementById("wagonManpowerBody");
    const foot = document.getElementById("wagonManpowerFoot");
    const cols = calculation.columns;

    head.innerHTML = `<tr><th>Sl.</th><th>O/Rly</th><th>Wagon No.</th><th>Type</th><th>Remarks</th>${cols.map(c => `<th>${escapeHtml(c)}</th>`).join("")}<th>Wagon Man-Hrs.</th></tr>`;
    body.innerHTML = calculation.wagonRows.map((row, index) => `<tr>
        <td class="text-center">${index + 1}</td><td>${escapeHtml(row.wagon.orly || "")}</td>
        <td>${escapeHtml(row.wagon.wagonNo || "")}</td><td>${escapeHtml(row.wagon.wagonType || "")}</td>
        <td class="text-center">${escapeHtml(row.wagon.remarks || "")}</td>
        ${cols.map(column => {
            const item = row.items.find(x => x.column === column);
            if (!item) return `<td class="text-center">0</td>`;
            const displayQty = column === "Panel Fitted" || column === "Floor Fitted" ? Number(item.quantity).toFixed(3) + " kg" : formatNumber(item.quantity);
            return `<td class="text-center ${item.rate === null ? "unrated" : ""}">${displayQty}</td>`;
        }).join("")}
        <td class="text-center fw-bold">${row.total.toFixed(2)}</td>
    </tr>`).join("");

    const total = calculation.wagonRows.reduce((sum, row) => sum + row.total, 0);
    foot.innerHTML = `<tr class="fw-bold"><td colspan="${5 + cols.length}" class="text-end">TOTAL MAN-HOURS</td><td class="text-center">${total.toFixed(2)}</td></tr>`;
}

function renderSummary() {
    const body = document.getElementById("summaryBody");
    const foot = document.getElementById("summaryFoot");
    body.innerHTML = calculation.summary.map(item => `<tr><td>${escapeHtml(item.item)}</td><td>${item.category}</td><td class="text-center">${formatNumber(item.quantity)}</td><td class="text-center">${item.rate.toFixed(2)}</td><td class="text-center fw-bold">${item.total.toFixed(2)}</td></tr>`).join("");
    const total = calculation.summary.reduce((sum, item) => sum + item.total, 0);
    const changed = calculation.summary.filter(x => x.category === "Changed").reduce((s, x) => s + x.total, 0);
    const repaired = calculation.summary.filter(x => x.category === "Repair").reduce((s, x) => s + x.total, 0);
    foot.innerHTML = `<tr class="fw-bold"><td colspan="4" class="text-end">Repair Man-Hrs.</td><td class="text-center">${repaired.toFixed(2)}</td></tr><tr class="fw-bold"><td colspan="4" class="text-end">Changed Man-Hrs.</td><td class="text-center">${changed.toFixed(2)}</td></tr><tr class="fw-bold"><td colspan="4" class="text-end">TOTAL MAN-HOURS</td><td class="text-center">${total.toFixed(2)}</td></tr>`;
}

function getOfficialPrintColumns(wagons) {
    // Official PDRMS print order. Populated columns are always retained;
    // unused columns are added only until the minimum of six is reached.
    const officialOrder = [
        "Door Repair",
        "Panel Repair",
        "Lock Lifter Handle Repair",
        "K/Pin Fitted",
        "Floor Fitted",
        "Side Frame Key with Nut & Bolt Fitted",
        "Lock Lifter Handle Change",
        "Panel Fitted"
    ];

    const reportOrder = Array.isArray(currentReport?.repairColumns)
        ? currentReport.repairColumns
        : [];

    // Prefer the official departmental order, while still allowing any
    // recognised PDRMS repair/change column from the current report.
    const candidates = [];
    officialOrder.forEach(column => {
        if (MANPOWER_MAP[column] && !candidates.includes(column)) candidates.push(column);
    });
    reportOrder.forEach(column => {
        if (MANPOWER_MAP[column] && !candidates.includes(column)) candidates.push(column);
    });

    const populated = candidates.filter(column =>
        wagons.some(wagon => getQuantity(wagon, column) > 0)
    );

    const selected = [...populated];
    for (const column of candidates) {
        if (selected.length >= 6) break;
        if (!selected.includes(column)) selected.push(column);
    }

    return selected;
}

function renderOfficialPrint() {
    const table = document.getElementById("officialManpowerTable");
    const head = document.getElementById("officialManpowerHead");
    const body = document.getElementById("officialManpowerBody");
    const foot = document.getElementById("officialManpowerFoot");

    const cols = getOfficialPrintColumns(calculation.wagonRows.map(row => row.wagon));
    const repaired = cols.filter(c => MANPOWER_MAP[c]?.group === "repaired");
    const changed = cols.filter(c => MANPOWER_MAP[c]?.group === "changed");
    const printCols = [...repaired, ...changed];

    head.innerHTML = `
        <tr class="group-row">
            <th rowspan="2">Sl.</th>
            <th rowspan="2">owner</th>
            <th rowspan="2">Wagon No.</th>
            <th rowspan="2">Type</th>
            <th rowspan="2">Components damaged</th>
            <th colspan="${Math.max(repaired.length, 1)}">Items Repaired (Qty)</th>
            <th colspan="${Math.max(changed.length, 1)}">Items changed (Qty)</th>
        </tr>
        <tr class="item-header">
            ${repaired.length ? repaired.map(c => `<th>${escapeHtml(MANPOWER_MAP[c].print)}</th>`).join("") : '<th class="blank-group-column">&nbsp;</th>'}
            ${changed.length ? changed.map(c => `<th>${escapeHtml(MANPOWER_MAP[c].print)}</th>`).join("") : '<th class="blank-group-column">&nbsp;</th>'}
        </tr>`;

    body.innerHTML = calculation.wagonRows.map((row, index) => {
        const valueFor = c => {
            const item = row.items.find(x => x.column === c);
            if (!item) return "0";
            if (c === "Panel Fitted" || c === "Floor Fitted") return Number(item.quantity).toFixed(3);
            return formatNumber(item.quantity);
        };
        return `<tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(row.wagon.orly || "")}</td>
            <td>${escapeHtml(row.wagon.wagonNo || "")}</td>
            <td>${escapeHtml(row.wagon.wagonType || "")}</td>
            <td class="damage-cell">${escapeHtml(row.wagon.incomingDamages || "")}</td>
            ${printCols.map(c => `<td>${valueFor(c)}</td>`).join("")}
        </tr>`;
    }).join("");

    const quantityTotal = c => calculation.wagonRows.reduce(
        (sum, row) => sum + (row.items.find(x => x.column === c)?.quantity || 0), 0
    );
    const rateFor = c => {
        const map = MANPOWER_MAP[c];
        return findMasterRate(map.item, map.category);
    };
    const manHourTotal = c => calculation.wagonRows.reduce(
        (sum, row) => sum + (row.items.find(x => x.column === c)?.total || 0), 0
    );

    // The official format has exactly three calculation rows below the
    // wagon data: Total, Changed & Repair Man Hrs. each items, Total Man Hrs.
    // There is deliberately NO extra grand-total row below them.
    const repairGrandTotal = repaired.reduce((sum, c) => sum + manHourTotal(c), 0);
    const changedGrandTotal = changed.reduce((sum, c) => sum + manHourTotal(c), 0);

    foot.innerHTML = `
        <tr class="official-total-row">
            <th colspan="5">Total</th>
            ${printCols.map(c => `<th>${formatPrintQuantity(quantityTotal(c), c)}</th>`).join("")}
        </tr>
        <tr>
            <th colspan="5">Changed &amp; Repair Man Hrs. each items</th>
            ${printCols.map(c => {
                const rate = rateFor(c);
                return `<th>${rate === null ? "-" : rate.toFixed(2)}</th>`;
            }).join("")}
        </tr>
        <tr>
            <th colspan="5">Total Man Hrs.</th>
            ${printCols.map(c => `<th>${manHourTotal(c) ? manHourTotal(c).toFixed(2) : "0"}</th>`).join("")}
        </tr>
        <tr class="official-grand-total-row">
            <th colspan="5" class="final-total-spacer"></th>
            ${repaired.length ? `<th colspan="${repaired.length}">${repairGrandTotal.toFixed(2)}</th>` : ""}
            ${changed.length ? `<th colspan="${changed.length}">${changedGrandTotal.toFixed(2)}</th>` : ""}
        </tr>`;

    table.dataset.repairedCount = repaired.length;
    table.dataset.changedCount = changed.length;
    table.dataset.totalColumns = printCols.length;
}

function formatPrintQuantity(value, column) {
    if (column === "Panel Fitted" || column === "Floor Fitted") return Number(value || 0).toFixed(3);
    return formatNumber(value);
}

function renderUnrated() {
    const box = document.getElementById("unratedBox");
    const list = document.getElementById("unratedItems");
    if (!calculation.unrated.length) { box.classList.add("d-none"); return; }
    box.classList.remove("d-none");
    list.textContent = calculation.unrated.map(c => MANPOWER_MAP[c]?.print || c).join(", ");
}

function clearTables() {
    ["wagonManpowerHead","wagonManpowerBody","wagonManpowerFoot","summaryBody","summaryFoot","officialManpowerHead","officialManpowerBody","officialManpowerFoot"].forEach(id => document.getElementById(id).innerHTML = "");
    document.getElementById("yrCount").textContent = "0";
}

function setMessage(text, type) {
    const el = document.getElementById("reportMessage");
    el.className = `alert alert-${type} no-print`;
    el.textContent = text;
}

function formatNumber(value) {
    const n = Number(value || 0);
    return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.addEventListener("DOMContentLoaded", async function () {
    if (window.PRDMSCloud?.ready) await PRDMSCloud.ready;
    const directReport = getCurrentReport();
    const fromHistory = localStorage.getItem("PRDMS_MANPOWER_RETURN") === "history";
    selectedReportId = fromHistory ? (directReport?.reportId || null) : null;
    currentReport = selectedReportId ? directReport : null;

    populateTrainSelector(selectedReportId);

    if (selectedReportId && currentReport) {
        showManpowerResults();
        loadReportHeader();
        calculateManpower();
    } else {
        hideManpowerResults();
    }
});

/* =========================================
   HISTORY / NEW REPORT RETURN NAVIGATION
   ========================================= */
function getManpowerReturnTarget() {
    return localStorage.getItem("PRDMS_MANPOWER_RETURN") || "new-report";
}

function returnFromManpower() {
    const target = getManpowerReturnTarget();
    localStorage.removeItem("PRDMS_MANPOWER_RETURN");
    if (target === "history") {
        window.location.href = "damage-history.html";
    } else {
        window.location.href = "new-report.html?resume=1";
    }
}

function printManpowerReport() {
    window.onafterprint = function () {
        returnFromManpower();
    };
    window.print();
}
