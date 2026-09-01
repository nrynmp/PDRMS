/* =========================================
   PDRMS CENTRAL DATABASE BRIDGE
   Google Apps Script + Google Sheet
   ========================================= */

const PDRMS_API_URL = "https://script.google.com/macros/s/AKfycbxmZZWjtknJ6hVI1SK174OA86n5fzP_K3n9xNbcqTv6p6wTbmXfPG1Gi5Cz7dHnlCPL/exec";
const PDRMS_CLOUD_REPORTS_KEY = "PRDMS_REPORT_HISTORY";
const PDRMS_CLOUD_MANPOWER_KEY = "PRDMS_MANPOWER_MASTER";

async function pdrmsApiGet(action, params = {}) {
    const url = new URL(PDRMS_API_URL);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    if (!response.ok) throw new Error(`API request failed (${response.status})`);
    return await response.json();
}

async function pdrmsApiPost(payload) {
    const response = await fetch(PDRMS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`API request failed (${response.status})`);
    return await response.json();
}

window.PRDMSCloud = {
    apiUrl: PDRMS_API_URL,
    ready: null,

    async getReports() {
        const result = await pdrmsApiGet("getReports");
        if (!result.ok) throw new Error(result.error || "Unable to load reports.");
        const reports = Array.isArray(result.reports) ? result.reports : [];
        localStorage.setItem(PDRMS_CLOUD_REPORTS_KEY, JSON.stringify(reports));
        return reports;
    },

    async saveReport(report) {
        const user = window.PRDMSAuth?.current?.() || { id: "Unknown", name: "Unknown", role: "User" };
        const result = await pdrmsApiPost({ action: "saveReport", report, user });
        if (!result.ok) throw new Error(result.error || "Unable to save report.");
        const saved = result.report;
        const list = JSON.parse(localStorage.getItem(PDRMS_CLOUD_REPORTS_KEY) || "[]");
        const index = list.findIndex(r => String(r.reportId) === String(saved.reportId));
        if (index >= 0) list[index] = saved; else list.unshift(saved);
        localStorage.setItem(PDRMS_CLOUD_REPORTS_KEY, JSON.stringify(list));
        return result;
    },

    async deleteReport(reportId) {
        const user = window.PRDMSAuth?.current?.() || { id: "Unknown", name: "Unknown", role: "User" };
        const result = await pdrmsApiPost({ action: "deleteReport", reportId, user });
        if (!result.ok) throw new Error(result.error || "Unable to delete report.");
        const list = JSON.parse(localStorage.getItem(PDRMS_CLOUD_REPORTS_KEY) || "[]")
            .filter(r => String(r.reportId) !== String(reportId));
        localStorage.setItem(PDRMS_CLOUD_REPORTS_KEY, JSON.stringify(list));
        return result;
    },

    async getManpower() {
        const result = await pdrmsApiGet("getManpower");
        if (!result.ok) throw new Error(result.error || "Unable to load manpower master.");
        const items = Array.isArray(result.items) ? result.items : [];
        if (items.length) localStorage.setItem(PDRMS_CLOUD_MANPOWER_KEY, JSON.stringify(items));
        return items;
    },

    async saveManpower(items) {
        const user = window.PRDMSAuth?.current?.() || { id: "Unknown", name: "Unknown", role: "User" };
        const result = await pdrmsApiPost({ action: "saveManpower", items, user });
        if (!result.ok) throw new Error(result.error || "Unable to save manpower master.");
        localStorage.setItem(PDRMS_CLOUD_MANPOWER_KEY, JSON.stringify(items));
        return result;
    }
};

// Do NOT block page rendering on the cloud.
// Pages can render immediately from local cache; individual modules
// synchronize with the central database in the background when needed.
PRDMSCloud.ready = Promise.resolve(true);

PRDMSCloud.syncReportsInBackground = function () {
    return PRDMSCloud.getReports().catch(error => {
        console.warn("PDRMS central report sync failed. Local cache will be used.", error);
        return null;
    });
};

PRDMSCloud.syncManpowerInBackground = function () {
    return PRDMSCloud.getManpower().catch(error => {
        console.warn("PDRMS central manpower sync failed. Local cache will be used.", error);
        return null;
    });
};
