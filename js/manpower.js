/* =========================================
   PRDMS - MANPOWER MASTER
   ========================================= */


/* =========================================
   OFFICIAL MANPOWER MASTER DATA
   ========================================= */

const DEFAULT_MANPOWER_ITEMS = [

    {
        item: "Door repair (Dummy/Door way side & Top Stiffener cut/Welded)",
        changed: null,
        repair: 0.83
    },

    {
        item: "Panel repair (Welded)",
        changed: null,
        repair: 0.58
    },

    {
        item: "Door hinge pin",
        changed: 0.20,
        repair: null
    },

    {
        item: "PANEL PATCH (Less than 1 sq. ft.)",
        changed: null,
        repair: null
    },

    {
        item: "PANEL PATCH (1 sq. ft. To 2.69 sq. ft.)",
        changed: null,
        repair: null
    },

    {
        item: "PANEL PATCH (2.7 sq. ft. To 5.38 sq. ft.)",
        changed: null,
        repair: null
    },

    {
        item: "Floor repair (Welded)",
        changed: null,
        repair: 0.58
    },

    {
        item: "Lock lifter assembly",
        changed: 1.59,
        repair: 0.25
    },

    {
        item: "Bearing piece",
        changed: 0.42,
        repair: null
    },

    {
        item: "Control rod",
        changed: 1.50,
        repair: null
    },

    {
        item: "Knuckle pin with APD",
        changed: 0.20,
        repair: null
    },

    {
        item: "SIDE FRAME KEY WITH BOLT",
        changed: 0.15,
        repair: null
    },

    {
        item: "ELB HANDLE",
        changed: 0.15,
        repair: 0.15
    },

    {
        item: "ELB SIGN BOARD PLATE",
        changed: 1.82,
        repair: null
    },

    {
        item: "ELB C LINK STRAIGHT ROD",
        changed: 0.15,
        repair: 0.15
    },

    {
        item: "ELB C LINK TWIST ROD",
        changed: 0.15,
        repair: 0.15
    },

    {
        item: "ELB CHECK COLLER FOR LONG SHAFT/BUSH",
        changed: 0.50,
        repair: 0.50
    },

    {
        item: "ELB CLUTCH BOX",
        changed: 2.00,
        repair: 1.25
    },

    {
        item: "ELB OPERATING ARM",
        changed: 0.50,
        repair: 0.50
    },

    {
        item: "ELB TEETH SEGMENT",
        changed: 0.50,
        repair: 0.50
    },

    {
        item: "ELB SET",
        changed: 4.50,
        repair: 2.50
    },

    {
        item: "END PULL ROD",
        changed: 0.25,
        repair: null
    },

    {
        item: "INNER & OUTER COIL SPRING",
        changed: 0.66,
        repair: null
    },

    {
        item: "SPLIT PIN",
        changed: 0.10,
        repair: null
    }
];


let manpowerItems = (() => {
    try {
        const saved = localStorage.getItem("PRDMS_MANPOWER_MASTER");
        return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_MANPOWER_ITEMS));
    } catch (error) {
        console.warn("Using default manpower master data.", error);
        return JSON.parse(JSON.stringify(DEFAULT_MANPOWER_ITEMS));
    }
})();

async function saveManpowerMaster() {
    localStorage.setItem(
        "PRDMS_MANPOWER_MASTER",
        JSON.stringify(manpowerItems)
    );
    if (window.PRDMSCloud?.saveManpower) {
        try {
            await PRDMSCloud.saveManpower(manpowerItems);
        } catch (error) {
            console.error("Central manpower save failed:", error);
            alert("Manpower Master was changed locally, but could not be saved to the central database.");
        }
    }
}


/* =========================================
   MANPOWER MASTER ROLE PERMISSIONS
   ========================================= */

function canManageManpowerMaster() {
    return Boolean(window.PRDMSAuth && PRDMSAuth.isAdmin && PRDMSAuth.isAdmin());
}

function denyManpowerMasterChange() {
    alert("Only Admin can add, edit or delete items in Manpower Master.");
}

function applyManpowerRolePermissions() {
    const isAdmin = canManageManpowerMaster();
    const addButton = document.getElementById("addManpowerBtn");
    const notice = document.getElementById("manpowerReadOnlyNotice");

    document.body.classList.toggle("manpower-readonly", !isAdmin);

    if (addButton) addButton.classList.toggle("d-none", !isAdmin);
    if (notice) notice.classList.toggle("d-none", isAdmin);
}

/* =========================================
   DOM ELEMENTS
   ========================================= */

const tableBody =
    document.getElementById("manpowerTableBody");

const searchInput =
    document.getElementById("manpowerSearch");

const addBtn =
    document.getElementById("addManpowerBtn");

const saveBtn =
    document.getElementById("saveManpowerBtn");

const modalElement =
    document.getElementById("manpowerModal");

const modal =
    new bootstrap.Modal(modalElement);

const modalTitle =
    document.getElementById("manpowerModalTitle");

const itemInput =
    document.getElementById("manpowerItem");

const changedInput =
    document.getElementById("changedManHours");

const repairInput =
    document.getElementById("repairManHours");

const editIndexInput =
    document.getElementById("manpowerEditIndex");


/* =========================================
   DISPLAY
   ========================================= */

function displayManpowerItems(list = manpowerItems) {

    tableBody.innerHTML = "";

    list.forEach((data, index) => {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td class="text-center">
                ${manpowerItems.indexOf(data) + 1}
            </td>

            <td>
                ${data.item}
            </td>

            <td class="text-center">
                ${formatRate(data.changed)}
            </td>

            <td class="text-center">
                ${formatRate(data.repair)}
            </td>

            ${canManageManpowerMaster() ? `
            <td class="text-center manpower-action-col">
                <button
                    class="btn btn-sm btn-warning me-1"
                    onclick="editManpowerItem(${manpowerItems.indexOf(data)})">
                    <i class="bi bi-pencil"></i>
                    Edit
                </button>

                <button
                    class="btn btn-sm btn-danger"
                    onclick="deleteManpowerItem(${manpowerItems.indexOf(data)})">
                    <i class="bi bi-trash"></i>
                    Delete
                </button>
            </td>` : ""}

        `;

        tableBody.appendChild(row);

    });

}


/* =========================================
   FORMAT RATE
   ========================================= */

function formatRate(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    return Number(value).toFixed(2);

}


/* =========================================
   ADD ITEM
   ========================================= */

addBtn.addEventListener("click", function () {

    if (!canManageManpowerMaster()) {
        denyManpowerMasterChange();
        return;
    }

    modalTitle.textContent =
        "Add Manpower Item";

    editIndexInput.value = "";

    itemInput.value = "";
    changedInput.value = "";
    repairInput.value = "";

    modal.show();

});


/* =========================================
   SAVE ITEM
   ========================================= */

saveBtn.addEventListener("click", function () {

    if (!canManageManpowerMaster()) {
        denyManpowerMasterChange();
        return;
    }

    const item =
        itemInput.value.trim();

    const changed =
        changedInput.value === ""
            ? null
            : Number(changedInput.value);

    const repair =
        repairInput.value === ""
            ? null
            : Number(repairInput.value);


    if (!item) {

        alert("Please enter the manpower item.");

        return;

    }


    if (
        changed === null &&
        repair === null
    ) {

        alert(
            "Enter at least one Changed or Repair man-hour value."
        );

        return;

    }


    const editIndex =
        editIndexInput.value;


    if (editIndex === "") {

        manpowerItems.push({

            item: item,
            changed: changed,
            repair: repair

        });

        saveManpowerMaster();

    } else {

        manpowerItems[Number(editIndex)] = {

            item: item,
            changed: changed,
            repair: repair

        };

        saveManpowerMaster();

    }


    displayManpowerItems();

    modal.hide();

});


/* =========================================
   EDIT
   ========================================= */

window.editManpowerItem =
    function (index) {

        if (!canManageManpowerMaster()) {
            denyManpowerMasterChange();
            return;
        }

        const data =
            manpowerItems[index];

        modalTitle.textContent =
            "Edit Manpower Item";

        editIndexInput.value =
            index;

        itemInput.value =
            data.item;

        changedInput.value =
            data.changed ?? "";

        repairInput.value =
            data.repair ?? "";

        modal.show();

    };


/* =========================================
   DELETE
   ========================================= */

window.deleteManpowerItem =
    function (index) {

        if (!canManageManpowerMaster()) {
            denyManpowerMasterChange();
            return;
        }

        const data =
            manpowerItems[index];

        const confirmDelete =
            confirm(
                `Delete "${data.item}"?`
            );

        if (!confirmDelete) {
            return;
        }

        manpowerItems.splice(index, 1);

        saveManpowerMaster();
        displayManpowerItems();

    };


/* =========================================
   SEARCH
   ========================================= */

searchInput.addEventListener(
    "input",
    function () {

        const search =
            this.value
                .trim()
                .toLowerCase();

        const filtered =
            manpowerItems.filter(
                item =>
                    item.item
                        .toLowerCase()
                        .includes(search)
            );

        displayManpowerItems(filtered);

    }
);


/* =========================================
   INITIAL LOAD
   ========================================= */

displayManpowerItems();

// Apply role-based UI after the page is ready.
document.addEventListener("DOMContentLoaded", async function () {
    if (window.PRDMSCloud?.ready) await PRDMSCloud.ready;
    try {
        const central = await PRDMSCloud.getManpower();
        if (Array.isArray(central) && central.length) {
            manpowerItems = central;
        }
    } catch (error) {
        console.warn("Using local/default manpower master.", error);
    }
    applyManpowerRolePermissions();
    displayManpowerItems();
});
if (document.readyState !== "loading") applyManpowerRolePermissions();
