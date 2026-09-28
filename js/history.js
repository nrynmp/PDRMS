/* =========================================
   PDRMS DAMAGE REPORT HISTORY
   ========================================= */

const HISTORY_KEY = "PRDMS_REPORT_HISTORY";

function readHistory() {
    try {
        const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function writeHistory(list) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

function makeReportId(report) {
    return report.reportId || (
        String(report.trainNo || "REPORT") + "_" +
        String(report.reportDate || "") + "_" +
        String(report.savedAt || Date.now())
    );
}

function archiveReport(report) {
    const list = readHistory();
    const id = makeReportId(report);
    report.reportId = id;
    const index = list.findIndex(r => r.reportId === id);
    report.reportStatus = (index >= 0 && list[index]?.reportStatus) ? list[index].reportStatus : (report.reportStatus || "Draft");
    const now = new Date().toISOString();
    const currentUser = window.PRDMSAuth?.current?.() || {id:"Unknown",name:"Unknown"};
    if (index >= 0) {
        const previous = list[index];
        report.createdBy = previous.createdBy || currentUser.name || currentUser.id;
        report.createdById = previous.createdById || currentUser.id;
        report.createdAt = previous.createdAt || previous.savedAt || now;
        report.lastEditedBy = currentUser.name || currentUser.id;
        report.lastEditedById = currentUser.id;
        report.lastEditedAt = now;
        report.savedAt = now;
        list[index] = report;
    } else {
        report.createdBy = currentUser.name || currentUser.id;
        report.createdById = currentUser.id;
        report.createdAt = now;
        report.lastEditedBy = currentUser.name || currentUser.id;
        report.lastEditedById = currentUser.id;
        report.lastEditedAt = now;
        report.savedAt = now;
        list.unshift(report);
    }

    writeHistory(list);
    localStorage.setItem("PRDMS_CURRENT_REPORT", JSON.stringify(report));
    localStorage.setItem("PRDMS_LAST_SAVED_REPORT_ID", id);
    localStorage.removeItem("PRDMS_EDIT_REPORT_ID");
    return report;
}

/* Override the final Save & Exit without touching Damage Report logic. */
function saveAndExit() {
    const reportData = getReportData();
    const existing = JSON.parse(localStorage.getItem("PRDMS_CURRENT_REPORT") || "null");
    reportData.reportId =
        window.__editingReportId ||
        reportData.reportId ||
        existing?.reportId ||
        makeReportId(reportData);
    archiveReport(reportData);
    alert("Damage report saved successfully.");
    window.location.href = "../index.html";
}

function loadReportForEditing(report) {
    if (!report) return;

    window.__editingReportId = report.reportId || null;

    const fieldMap = {
        trainNo: "trainNo",
        reportDate: "reportDate",
        rakeID: "rakeID",
        rakeArrived: "rakeArrived",
        ibpc: "ibpc",
        ibpcParticulars: "ibpcParticulars",
        exStation: "exStation",
        damageOccurrence: "damageOccurrence",
        loadingPoint: "loadingPoint",
        unloadingPoint: "unloadingPoint",
        content: "content",
        consignee: "consignee",
        consignor: "consignor",
        examinedBy: "examinedBy",
        examinedBy2: "examinedBy2",
        representativeOf: "representativeOf"
    };

    Object.entries(fieldMap).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el && report[key] !== undefined) el.value = report[key] || "";
    });

    // Support both the current ibpc field and older saved ibpcParticulars data.
    const ibpcEl = document.getElementById("ibpc");
    if (ibpcEl && !ibpcEl.value && report.ibpcParticulars !== undefined) {
        ibpcEl.value = report.ibpcParticulars || "";
    }

    if (Array.isArray(report.repairColumns) && report.repairColumns.length) {
        repairColumns = JSON.parse(JSON.stringify(report.repairColumns));
    }

    if (Array.isArray(report.wagons)) {
        wagons = JSON.parse(JSON.stringify(report.wagons));
    }

    fittedDetails = [];
    editingWagonIndex = null;

    if (typeof generateRepairFields === "function") generateRepairFields();
    if (typeof refreshRepairColumnPopup === "function") refreshRepairColumnPopup();
    if (typeof refreshWagonTableHeader === "function") refreshWagonTableHeader();
    if (typeof refreshWagonTable === "function") refreshWagonTable();
    if (typeof updatePrintReportHeading === "function") updatePrintReportHeading();
}

function openHistoryReport(reportId, mode) {
    const report = readHistory().find(r => r.reportId === reportId);
    if (!report) {
        alert("Report not found.");
        return;
    }

    localStorage.setItem("PRDMS_CURRENT_REPORT", JSON.stringify(report));

    if (mode === "edit") {
        if ((report.reportStatus || "Draft") === "Closed") {
            alert("This report is Closed. Only an Admin can reopen it before editing.");
            return;
        }
        localStorage.setItem("PRDMS_EDIT_REPORT_ID", report.reportId);
        window.location.href = "new-report.html?edit=1";
        return;
    }

    if (mode === "print") {
        window.location.href = "new-report.html?print=1";
        return;
    }

    if (mode === "manpower") {
        localStorage.setItem("PRDMS_MANPOWER_RETURN", "history");
        window.location.href = "manpower-calculation.html";
        return;
    }

    showHistoryView(report);
}

function showHistoryView(report) {
    const modal = document.getElementById("historyViewModal");
    if (!modal) return;

    document.getElementById("viewTrainNo").textContent = report.trainNo || "-";
    document.getElementById("viewDate").textContent = formatDisplayDate(report.reportDate);
    document.getElementById("viewRake").textContent = report.rakeID || "-";
    document.getElementById("viewWagonCount").textContent = Array.isArray(report.wagons) ? report.wagons.length : 0;
    const fmtAudit = v => v ? new Date(v).toLocaleString("en-IN") : "—";
    const a1=document.getElementById("viewCreatedBy"), a2=document.getElementById("viewCreatedAt"), a3=document.getElementById("viewEditedBy"), a4=document.getElementById("viewEditedAt");
    if(a1) a1.textContent = report.createdBy || "—";
    if(a2) a2.textContent = fmtAudit(report.createdAt);
    if(a3) a3.textContent = report.lastEditedBy || report.createdBy || "—";
    if(a4) a4.textContent = fmtAudit(report.lastEditedAt || report.createdAt);
    const s1=document.getElementById("viewReportStatus"), s2=document.getElementById("viewStatusChangedBy"), s3=document.getElementById("viewStatusChangedAt");
    if(s1) s1.textContent = getReportStatus(report);
    if(s2) s2.textContent = report.statusChangedBy || report.createdBy || "—";
    if(s3) s3.textContent = fmtAudit(report.statusChangedAt || report.createdAt);

    const body = document.getElementById("historyViewBody");
    body.innerHTML = "";
    (report.wagons || []).forEach((w, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${escapeHtmlHistory(w.orly)}</td>
            <td>${escapeHtmlHistory(w.wagonNo)}</td>
            <td>${escapeHtmlHistory(w.wagonType)}</td>
            <td>${escapeHtmlHistory(w.remarks)}</td>
            <td>${escapeHtmlHistory(w.incomingDamages)}</td>`;
        body.appendChild(tr);
    });

    bootstrap.Modal.getOrCreateInstance(modal).show();
}

function escapeHtmlHistory(value) {
    return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function formatDisplayDate(value) {
    if (!value) return "-";
    const p = value.split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : value;
}

function monthKey(date) {
    if (!date) return "Unknown";
    const p = date.split("-");
    if (p.length !== 3) return "Unknown";
    return `${p[0]}-${p[1]}`;
}

function monthLabel(key) {
    if (key === "Unknown") return key;
    const [y,m] = key.split("-");
    return new Date(Number(y), Number(m)-1, 1).toLocaleString("en-IN", {month:"long", year:"numeric"});
}

function applyHistoryFilter() {
    const train = (document.getElementById("historyTrainSearch")?.value || "").trim().toLowerCase();
    const date = document.getElementById("historyDateSearch")?.value || "";
    const month = document.getElementById("historyMonthSearch")?.value || "";
    const status = document.getElementById("historyStatusSearch")?.value || "";

    let reports = readHistory();
    reports = reports.filter(r => {
        const trainOk = !train || String(r.trainNo || "").toLowerCase().includes(train);
        const dateOk = !date || r.reportDate === date;
        const monthOk = !month || monthKey(r.reportDate) === month;
        const statusOk = !status || getReportStatus(r) === status;
        return trainOk && dateOk && monthOk && statusOk;
    });

    renderHistory(reports);
}

function clearHistoryFilter() {
    document.getElementById("historyTrainSearch").value = "";
    document.getElementById("historyDateSearch").value = "";
    document.getElementById("historyMonthSearch").value = "";
    const statusEl = document.getElementById("historyStatusSearch");
    if (statusEl) statusEl.value = "";
    renderHistory(readHistory());
}

function populateMonthFilter(reports) {
    const select = document.getElementById("historyMonthSearch");
    if (!select) return;
    const months = [...new Set(reports.map(r => monthKey(r.reportDate)))].sort().reverse();
    select.innerHTML = `<option value="">All Months</option>` +
        months.map(m => `<option value="${m}">${monthLabel(m)}</option>`).join("");
}

function getStatusClass(status) {
    return ({Draft:"secondary", "In Progress":"warning", Completed:"success", Closed:"dark"})[status] || "secondary";
}
function getReportStatus(report) { return report.reportStatus || "Draft"; }

function updateStatusSelectColor(select) {
    if (!select) return;
    select.classList.remove("status-draft","status-progress","status-completed","status-closed");
    const cls = ({
        "Draft":"status-draft",
        "In Progress":"status-progress",
        "Completed":"status-completed",
        "Closed":"status-closed"
    })[select.value] || "status-draft";
    select.classList.add(cls);
}

async function changeReportStatus(reportId, newStatus) {
    const list = readHistory();
    const index = list.findIndex(r => r.reportId === reportId);
    if (index < 0) return;
    const report = list[index];
    const oldStatus = getReportStatus(report);
    const current = window.PRDMSAuth?.current?.() || {id:"Unknown",name:"Unknown"};
    const isAdmin = window.PRDMSAuth?.isAdmin?.() === true;

    if (oldStatus === "Closed" && !isAdmin) {
        alert("Only Admin can reopen a Closed report.");
        return;
    }
    if (oldStatus === newStatus) return;

    if (newStatus === "Closed" && !confirm("Close this report? Normal users will not be able to edit it.")) return;
    if (oldStatus === "Closed" && newStatus !== "Closed" && !confirm("Reopen this Closed report as " + newStatus + "?")) return;

    report.reportStatus = newStatus;
    report.statusChangedBy = current.name || current.id;
    report.statusChangedById = current.id;
    report.statusChangedAt = new Date().toISOString();
    report.lastEditedBy = current.name || current.id;
    report.lastEditedById = current.id;
    report.lastEditedAt = report.statusChangedAt;
    report.statusHistory = Array.isArray(report.statusHistory) ? report.statusHistory : [];
    report.statusHistory.push({from:oldStatus,to:newStatus,by:current.name || current.id,byId:current.id,at:report.statusChangedAt});
    list[index] = report;
    writeHistory(list);
    populateMonthFilter(list);
    applyHistoryFilter();

    if (window.PRDMSCloud?.saveReport) {
        try {
            await PRDMSCloud.saveReport(report);
        } catch (error) {
            console.error("Central status update failed:", error);
            alert("Status changed locally, but the central database could not be updated.");
        }
    }
}

async function deleteDamageReport(reportId) {
    const id = String(reportId || "").trim();
    if (!id) return;

    const list = readHistory();
    const report = list.find(r => String(r.reportId) === id);
    if (!report) {
        alert("Report not found.");
        return;
    }

    const train = report.trainNo || id;
    if (!confirm(`Delete Damage Report for ${train}?\n\nThis will permanently remove the report from the central PDRMS database.`)) {
        return;
    }

    if (!window.PRDMSCloud?.deleteReport) {
        alert("Central database is not available. Report was not deleted.");
        return;
    }

    const button = document.querySelector(`[data-delete-report="${escapeJs(id)}"]`);
    if (button) {
        button.disabled = true;
        button.textContent = "Deleting...";
    }

    try {
        await window.PRDMSCloud.deleteReport(id);

        const remaining = readHistory().filter(r => String(r.reportId) !== id);
        writeHistory(remaining);
        localStorage.removeItem("PRDMS_CURRENT_REPORT");
        localStorage.removeItem("PRDMS_EDIT_REPORT_ID");

        populateMonthFilter(remaining);
        applyHistoryFilter();
        alert("Damage report deleted successfully.");
    } catch (error) {
        console.error("Central report delete failed:", error);
        if (button) {
            button.disabled = false;
            button.textContent = "Delete";
        }
        alert(error.message || "Unable to delete the damage report.");
    }
}

window.deleteDamageReport = deleteDamageReport;

function renderHistory(reports) {
    const container = document.getElementById("historyList");
    const empty = document.getElementById("historyEmpty");
    if (!container) return;

    container.innerHTML = "";
    if (!reports.length) { empty.classList.remove("d-none"); return; }
    empty.classList.add("d-none");

    const groups = {};
    reports.sort((a,b) => String(b.reportDate||"").localeCompare(String(a.reportDate||"")) || String(b.savedAt||"").localeCompare(String(a.savedAt||"")));
    reports.forEach(r => (groups[monthKey(r.reportDate)] ||= []).push(r));

    Object.keys(groups).sort().reverse().forEach(key => {
        const section = document.createElement("div");
        section.className = "history-month-section mb-4";
        section.innerHTML = `<h4 class="fw-bold border-bottom pb-2">${monthLabel(key)}</h4>`;
        const table = document.createElement("div");
        table.className = "table-responsive";
        table.innerHTML = `<table class="table table-bordered align-middle history-table">
            <colgroup>
                <col style="width:7%">
                <col style="width:20%">
                <col style="width:8%">
                <col style="width:7%">
                <col style="width:7%">
                <col style="width:51%">
            </colgroup>
            <thead class="table-light"><tr>
                <th class="history-date-col">Date</th>
                <th class="history-train-col">Train No.</th>
                <th class="history-wagons-col">Wagons</th>
                <th class="history-yr-col">Y/R</th>
                <th class="history-status-col">Status</th>
                <th class="history-action-heading">Actions</th>
            </tr></thead><tbody></tbody></table>`;
        const tbody = table.querySelector("tbody");
        groups[key].forEach(r => {
            const yr=(r.wagons||[]).filter(w=>String(w.remarks||"").toUpperCase()==="Y/R").length;
            const status=getReportStatus(r);
            const isClosed=status==="Closed";
            const isAdmin=window.PRDMSAuth?.isAdmin?.()===true;
            const statusClass = ({Draft:"status-draft","In Progress":"status-progress",Completed:"status-completed",Closed:"status-closed"})[status] || "status-draft";
            const statusControl = `<select class="form-select form-select-sm status-select ${statusClass}" onchange="changeReportStatus('${escapeJs(r.reportId)}',this.value);updateStatusSelectColor(this)" ${isClosed&&!isAdmin?'disabled':''}>
                ${["Draft","In Progress","Completed","Closed"].map(s=>`<option ${s===status?'selected':''}>${s}</option>`).join("")}
            </select>`;
            const tr=document.createElement("tr");
            tr.innerHTML=`<td class="history-date-col">${formatDisplayDate(r.reportDate)}</td>
                <td class="fw-semibold history-train-col">${escapeHtmlHistory(r.trainNo)}</td>
                <td class="history-wagons-col">${(r.wagons||[]).length}</td><td class="history-yr-col">${yr}</td>
                <td class="history-status-col">${statusControl}</td>
                <td class="history-actions"><div class="history-actions-grid">
                    <button class="btn btn-sm btn-outline-primary" onclick="openHistoryReport('${escapeJs(r.reportId)}','view')">View</button>
                    <button class="btn btn-sm btn-outline-warning" ${isClosed?'disabled title="Closed report"':''} onclick="openHistoryReport('${escapeJs(r.reportId)}','edit')">Edit</button>
                    <button class="btn btn-sm btn-outline-dark" onclick="openHistoryReport('${escapeJs(r.reportId)}','print')">Print</button>
                    <button class="btn btn-sm btn-outline-success" onclick="openHistoryReport('${escapeJs(r.reportId)}','manpower')">Manpower</button>
                    <button class="btn btn-sm btn-outline-danger" data-delete-report="${escapeHtmlHistory(r.reportId)}" onclick="deleteDamageReport('${escapeJs(r.reportId)}')">Delete</button>
                </div></td>`;
            tbody.appendChild(tr);
        });
        section.appendChild(table);container.appendChild(section);
    });
}
function escapeJs(value) {
    return String(value ?? "").replace(/\\/g,"\\\\").replace(/'/g,"\\'");
}

/* New-report loader: restore a history report for editing/printing. */
function loadCurrentReportFromHistory() {
    const report = JSON.parse(localStorage.getItem("PRDMS_CURRENT_REPORT") || "null");
    if (!report) return;

    const params = new URLSearchParams(window.location.search);
    if (!params.has("edit") && !params.has("print") && !params.has("view")) return;

    loadReportForEditing(report);

    if (params.has("print")) {
        window.onafterprint = function () {
            const target = localStorage.getItem("PRDMS_RETURN_AFTER_PRINT");
            if (target === "history") returnToHistory();
            else if (target === "new-report") localStorage.removeItem("PRDMS_RETURN_AFTER_PRINT");
        };
        window.PRDMS_doPrintOnce ? window.PRDMS_doPrintOnce() : window.print();
    }
}

window.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("historyList")) {
        const reports = readHistory();
        populateMonthFilter(reports);
        renderHistory(reports);

        // Refresh shared reports in the background without delaying the page.
        if (window.PRDMSCloud?.syncReportsInBackground) {
            window.PRDMSCloud.syncReportsInBackground().then(shared => {
                if (Array.isArray(shared)) {
                    populateMonthFilter(shared);
                    applyHistoryFilter();
                }
            });
        }
    }

    if (document.getElementById("trainNo") && window.location.pathname.includes("new-report.html")) {
        const params = new URLSearchParams(window.location.search);
        if (params.has("edit") || params.has("print") || params.has("view")) {
            const editId = localStorage.getItem("PRDMS_EDIT_REPORT_ID");
            if (editId) window.__editingReportId = editId;
            loadCurrentReportFromHistory();
        }
    }
});

/* =========================================
   HISTORY WORKFLOW FIXES
   ========================================= */

async function historySaveReport(report, existingId) {
    const data = report || {};
    if (existingId) data.reportId = existingId;

    const list = readHistory();
    const index = data.reportId ? list.findIndex(r => r.reportId === data.reportId) : -1;

    if (index >= 0) {
        const previous = list[index];
        data.reportStatus = previous.reportStatus || data.reportStatus || "Draft";
        data.createdBy = previous.createdBy || data.createdBy;
        data.createdById = previous.createdById || data.createdById;
        data.createdAt = previous.createdAt || data.createdAt;
        data.lastEditedBy = (window.PRDMSAuth?.current?.().name) || data.lastEditedBy || previous.lastEditedBy;
        data.lastEditedById = (window.PRDMSAuth?.current?.().id) || data.lastEditedById || previous.lastEditedById;
        data.lastEditedAt = new Date().toISOString();
        data.savedAt = data.lastEditedAt;
        list[index] = data;
    } else {
        data.reportId = data.reportId || makeReportId(data);
        data.reportStatus = data.reportStatus || "Draft";
        data.savedAt = new Date().toISOString();
        list.unshift(data);
    }

    writeHistory(list);
    localStorage.setItem("PRDMS_CURRENT_REPORT", JSON.stringify(data));
    localStorage.setItem("PRDMS_LAST_SAVED_REPORT_ID", data.reportId);
    if (typeof clearAutoSavedDraft === "function") clearAutoSavedDraft();

    // Central save: Google Sheet becomes the shared source of truth.
    if (window.PRDMSCloud?.saveReport) {
        try {
            const result = await PRDMSCloud.saveReport(data);
            if (result?.report) {
                localStorage.setItem("PRDMS_CURRENT_REPORT", JSON.stringify(result.report));
                localStorage.setItem("PRDMS_LAST_SAVED_REPORT_ID", result.report.reportId);
                return result.report;
            }
        } catch (error) {
            console.error("Central report save failed:", error);
            throw new Error("Report could not be saved to the central PDRMS database. Please check your internet connection and try again.");
        }
    }

    return data;
}


/* =========================================
   DUPLICATE REPORT PREVENTION
   ========================================= */

function findDuplicateReport(reportData, excludeReportId = "") {
    const train = String(reportData?.trainNo || "").trim().toUpperCase();
    const date = String(reportData?.reportDate || "").trim();

    if (!train || !date) return null;

    return readHistory().find(r =>
        String(r.trainNo || "").trim().toUpperCase() === train &&
        String(r.reportDate || "").trim() === date &&
        String(r.reportId || "") !== String(excludeReportId || "")
    ) || null;
}

function openExistingDuplicate(report, mode) {
    if (!report?.reportId) return;

    const modalEl = document.getElementById("duplicateReportModal");
    if (modalEl && window.bootstrap) {
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    }

    localStorage.setItem("PRDMS_EDIT_REPORT_ID", report.reportId);
    localStorage.setItem("PRDMS_CURRENT_REPORT", JSON.stringify(report));

    if (mode === "view") {
        window.location.href = "damage-history.html?view=" + encodeURIComponent(report.reportId);
    } else {
        window.location.href = "new-report.html?edit=" + encodeURIComponent(report.reportId);
    }
}

function showDuplicateReportDialog(report) {
    return new Promise(resolve => {
        const modalEl = document.getElementById("duplicateReportModal");

        // Safe fallback if Bootstrap modal is unavailable.
        if (!modalEl || !window.bootstrap) {
            const choice = confirm(
                "A report already exists for this Train Number and Report Date.\n\n" +
                "Press OK to edit the existing report, or Cancel to stop saving."
            );
            if (choice) {
                openExistingDuplicate(report, "edit");
                resolve("redirected");
            } else {
                resolve("cancel");
            }
            return;
        }

        const trainEl = document.getElementById("duplicateTrainNo");
        const dateEl = document.getElementById("duplicateReportDate");
        if (trainEl) trainEl.textContent = report.trainNo || "-";
        if (dateEl) dateEl.textContent = formatDisplayDate(report.reportDate);

        const modal = bootstrap.Modal.getOrCreateInstance(modalEl, {
            backdrop: "static",
            keyboard: false
        });

        const cancelBtn = document.getElementById("duplicateCancelBtn");
        const viewBtn = document.getElementById("duplicateViewBtn");
        const editBtn = document.getElementById("duplicateEditBtn");

        const cleanup = () => {
            cancelBtn.onclick = null;
            viewBtn.onclick = null;
            editBtn.onclick = null;
        };

        cancelBtn.onclick = () => {
            cleanup();
            modal.hide();
            resolve("cancel");
        };

        viewBtn.onclick = () => {
            cleanup();
            openExistingDuplicate(report, "view");
            resolve("redirected");
        };

        editBtn.onclick = () => {
            cleanup();
            openExistingDuplicate(report, "edit");
            resolve("redirected");
        };

        modal.show();
    });
}

async function preventDuplicateBeforeSave(reportData, existingId = "") {
    const duplicate = findDuplicateReport(reportData, existingId || reportData?.reportId || "");
    if (!duplicate) return true;

    const action = await showDuplicateReportDialog(duplicate);
    return action === "save";
}

/* Central draft save: keep Save Progress shared across computers. */
async function saveProgress() {
    const reportData = typeof collectReportData === "function" ? collectReportData() : {};
    try {
        const saved = await historySaveReport(reportData, window.__editingReportId || reportData.reportId || "");
        if (saved) {
            alert("Report progress saved to the central PDRMS database.");
        }
    } catch (error) {
        alert(error.message || "Unable to save report progress.");
    }
}

/* Save & Exit: when editing a history report, return to that same History page. */
async function saveAndExit() {
    const reportData = typeof collectReportData === "function"
        ? collectReportData()
        : {};
    const editingId = window.__editingReportId || localStorage.getItem("PRDMS_EDIT_REPORT_ID") || "";

    const canSave = await preventDuplicateBeforeSave(reportData, editingId || reportData.reportId);
    if (!canSave) return;

    await historySaveReport(reportData, editingId || reportData.reportId);
    localStorage.removeItem("PRDMS_EDIT_REPORT_ID");

    alert("Damage report saved successfully.");

    if (editingId) {
        window.location.href = "damage-history.html";
    } else {
        window.location.href = "../index.html";
    }
}

/* Save & Print: preserve the same report ID when editing and return to History after printing. */
async function saveAndPrint() {
    const reportData = typeof collectReportData === "function"
        ? collectReportData()
        : {};
    const editingId = window.__editingReportId || localStorage.getItem("PRDMS_EDIT_REPORT_ID") || "";

    const canSave = await preventDuplicateBeforeSave(reportData, editingId || reportData.reportId);
    if (!canSave) return;

    if (editingId) {
        await historySaveReport(reportData, editingId);
        if (typeof clearAutoSavedDraft === "function") clearAutoSavedDraft();
        localStorage.setItem("PRDMS_RETURN_AFTER_PRINT", "history");
    } else {
        await historySaveReport(reportData);
        if (typeof clearAutoSavedDraft === "function") clearAutoSavedDraft();
        localStorage.setItem("PRDMS_RETURN_AFTER_PRINT", "new-report");
    }

    if (typeof updatePrintReportHeading === "function") updatePrintReportHeading();
    window.PRDMS_doPrintOnce ? window.PRDMS_doPrintOnce() : window.print();
}

/* Print Manpower from New Damage Report: preserve the current entered data and return here. */
function printManpower() {
    const reportData = typeof collectReportData === "function"
        ? collectReportData()
        : {};

    const editingId = window.__editingReportId || localStorage.getItem("PRDMS_EDIT_REPORT_ID") || "";
    if (editingId) reportData.reportId = editingId;

    localStorage.setItem("PRDMS_CURRENT_REPORT", JSON.stringify(reportData));
    localStorage.setItem("PRDMS_MANPOWER_RETURN", editingId ? "history-edit" : "new-report");
    window.location.href = "manpower-calculation.html";
}

function returnToHistory() {
    localStorage.removeItem("PRDMS_RETURN_AFTER_PRINT");
    localStorage.removeItem("PRDMS_MANPOWER_RETURN");
    localStorage.removeItem("PRDMS_EDIT_REPORT_ID");
    window.location.href = "damage-history.html";
}

function applyHistoryViewMode() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("view")) return;

    document.title = "View Damage Report - PRDMS";

    document.querySelectorAll("input, select, textarea").forEach(el => {
        el.disabled = true;
    });

    document.querySelectorAll(".edit-wagon-btn, .delete-wagon-btn").forEach(btn => {
        btn.style.display = "none";
    });

    document.querySelectorAll("[data-bs-target=\"#addWagonModal\"], [onclick=\"openRepairColumns()\"]").forEach(btn => {
        btn.style.display = "none";
    });

    const actionBar = document.querySelector(".report-action-bar");
    if (actionBar) actionBar.style.display = "none";

    const nav = document.querySelector("nav .container-fluid");
    if (nav && !document.getElementById("historyBackBtn")) {
        const btn = document.createElement("button");
        btn.id = "historyBackBtn";
        btn.type = "button";
        btn.className = "btn btn-light btn-sm ms-auto";
        btn.innerHTML = '<i class="bi bi-arrow-left"></i> Back to History';
        btn.onclick = returnToHistory;
        nav.appendChild(btn);
    }
}

/* Replace the old partial View modal with the complete New Damage Report in read-only mode. */
function openHistoryReport(reportId, mode) {
    const report = readHistory().find(r => r.reportId === reportId);
    if (!report) {
        alert("Report not found.");
        return;
    }

    localStorage.setItem("PRDMS_CURRENT_REPORT", JSON.stringify(report));

    if (mode === "view") {
        localStorage.removeItem("PRDMS_EDIT_REPORT_ID");
        window.location.href = "new-report.html?view=1";
        return;
    }

    if (mode === "edit") {
        if ((report.reportStatus || "Draft") === "Closed") {
            alert("This report is Closed. Only an Admin can reopen it before editing.");
            return;
        }
        localStorage.setItem("PRDMS_EDIT_REPORT_ID", report.reportId);
        localStorage.setItem("PRDMS_HISTORY_RETURN", "1");
        window.location.href = "new-report.html?edit=1";
        return;
    }

    if (mode === "print") {
        localStorage.setItem("PRDMS_RETURN_AFTER_PRINT", "history");
        window.location.href = "new-report.html?print=1&fromHistory=1";
        return;
    }

    if (mode === "manpower") {
        localStorage.setItem("PRDMS_MANPOWER_RETURN", "history");
        window.location.href = "manpower-calculation.html";
        return;
    }
}

/* Rebuild History from the actual archive every time the page opens. */
window.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("trainNo") && window.location.pathname.includes("new-report.html")) {
        const params = new URLSearchParams(window.location.search);
        if (params.has("edit") || params.has("view") || params.has("print")) {
            const editId = localStorage.getItem("PRDMS_EDIT_REPORT_ID");
            if (editId) window.__editingReportId = editId;
            loadCurrentReportFromHistory();
            setTimeout(applyHistoryViewMode, 250);
        }
    }
});
