
console.log("PRDMS Script Loaded");
// ===============================
// PRDMS Repair Columns
// ===============================

let repairColumns = [

    "Door Repair",
    "Panel Repair",
    "Panel Fitted",
    "Floor Fitted",
    "Lock Lifter Handle Change",
    "Lock Lifter Handle Repair",
    "K/Pin Fitted",
    "Side Frame Key with Nut & Bolt Fitted"

];

// ===============================
// Wagon Data Storage
// ===============================

let wagons = [];

let editingWagonIndex = null;

// =========================================
// FLOOR / PANEL FITTED DETAILS
// =========================================

let fittedDetails = [];
let editingFittedIndex = null;

let fittedDetailType = null;

function openFittedDetailsFor(type) {

    fittedDetailType = type;

    editingFittedIndex = null;

    document.getElementById("fittedItemName").value =
        type;

    document.getElementById("fittedLength").value = "";

    document.getElementById("fittedBreadth").value = "";

    document.getElementById("fittedLengthUnit").value =
        "inch";

    document.getElementById("fittedBreadthUnit").value =
        "inch";

    clearFittedCalculatedValues();

    const modalElement =
        document.getElementById("fittedDetailsModal");

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );

    modal.show();
}

// Open fitted item popup
function openFittedDetails(index = null) {

    editingFittedIndex = index;

    if (index !== null && fittedDetails[index]) {

        const item = fittedDetails[index];

        document.getElementById("fittedItemName").value =
            item.item;

        document.getElementById("fittedLength").value =
            item.length;

        document.getElementById("fittedLengthUnit").value =
            item.lengthUnit;

        document.getElementById("fittedBreadth").value =
            item.breadth;

        document.getElementById("fittedBreadthUnit").value =
            item.breadthUnit;

    } else {

        document.getElementById("fittedItemName").value = "";

        document.getElementById("fittedLength").value = "";

        document.getElementById("fittedBreadth").value = "";

        document.getElementById("fittedLengthUnit").value = "inch";

        document.getElementById("fittedBreadthUnit").value = "inch";

        clearFittedCalculatedValues();

    }

    const modalElement =
        document.getElementById("fittedDetailsModal");

    const modal =
        bootstrap.Modal.getOrCreateInstance(modalElement);

    modal.show();

}


// Convert to inches
function convertToInches(value, unit) {

    if (unit === "feet") {
        return value * 12;
    }

    return value;
}


// Calculate values
function calculateFittedValues() {

    const length =
        Number(
            document.getElementById("fittedLength").value
        );

    const breadth =
        Number(
            document.getElementById("fittedBreadth").value
        );

    const lengthUnit =
        document.getElementById("fittedLengthUnit").value;

    const breadthUnit =
        document.getElementById("fittedBreadthUnit").value;


    if (
        !length ||
        !breadth ||
        length <= 0 ||
        breadth <= 0
    ) {

        clearFittedCalculatedValues();

        return null;

    }


    // Convert both dimensions to inches

    const lengthInches =
        convertToInches(length, lengthUnit);

    const breadthInches =
        convertToInches(breadth, breadthUnit);


    // Area

    const areaSqIn =
        lengthInches * breadthInches;

    const areaSqFt =
        areaSqIn / 144;


    // Welding length
    // Your existing format uses length + breadth

    const weldingCm =
        (lengthInches + breadthInches) * 2.54;


    // Panel/Floor plate weight
    //
    // 4 mm plate factor:
    // 0.0202 kg per square inch
    //
    // This reproduces:
    // 10" x 5" = 1.01 kg
    // 6" x 5 ft = 7.272 kg

    const weightKg =
        areaSqIn * 0.0202;


    document.getElementById("fittedDimension").textContent =
        `${areaSqIn.toFixed(2)} sq.in / ${areaSqFt.toFixed(2)} sq.ft`;

    document.getElementById("fittedWeight").textContent =
        `${weightKg.toFixed(3)} kg`;

    document.getElementById("fittedWelding").textContent =
        `${weldingCm.toFixed(2)} cm`;


    return {

        lengthInches,
        breadthInches,
        areaSqIn,
        areaSqFt,
        weightKg,
        weldingCm

    };

}


// Clear calculated values
function clearFittedCalculatedValues() {

    document.getElementById("fittedDimension").textContent =
        "—";

    document.getElementById("fittedWeight").textContent =
        "—";

    document.getElementById("fittedWelding").textContent =
        "—";

}


// Save fitted item
function saveFittedDetail() {

    const item =
    fittedDetailType ||
    document.getElementById("fittedItemName")
        .value
        .trim();

    const length =
        Number(
            document.getElementById("fittedLength").value
        );

    const breadth =
        Number(
            document.getElementById("fittedBreadth").value
        );

    const lengthUnit =
        document.getElementById("fittedLengthUnit").value;

    const breadthUnit =
        document.getElementById("fittedBreadthUnit").value;


    if (!item) {

        alert(
            "Please enter Panel Fitted or Floor Fitted."
        );

        return;

    }


    if (
        !length ||
        length <= 0 ||
        !breadth ||
        breadth <= 0
    ) {

        alert(
            "Please enter valid Length and Breadth."
        );

        return;

    }


    const calculated =
        calculateFittedValues();


    if (!calculated) {
        return;
    }


    const detail = {

        item: item,

        length: length,
        lengthUnit: lengthUnit,

        breadth: breadth,
        breadthUnit: breadthUnit,

        lengthInches:
            calculated.lengthInches,

        breadthInches:
            calculated.breadthInches,

        areaSqIn:
            calculated.areaSqIn,

        areaSqFt:
            calculated.areaSqFt,

        weightKg:
            calculated.weightKg,

        weldingCm:
            calculated.weldingCm

    };


    if (editingFittedIndex !== null) {

        fittedDetails[editingFittedIndex] =
            detail;

    } else {

        fittedDetails.push(detail);

    }


    renderFittedDetails();

    editingFittedIndex = null;


    const modalElement =
        document.getElementById("fittedDetailsModal");

    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );

    modal.hide();

}


// Render fitted details
function renderFittedDetails() {

    const container =
        document.getElementById("fittedDetailsList");

    if (!container) {
        return;
    }


    if (fittedDetails.length === 0) {

        container.innerHTML = `
            <div class="text-muted small">
                No floor/panel fitted details added.
            </div>
        `;

        return;

    }


    container.innerHTML =
        fittedDetails.map((item, index) => `

        <div
            class="border rounded p-2 mb-2 bg-white">

            <div
                class="d-flex justify-content-between
                       align-items-center">

                <div>

                    <strong>
                        ${item.item}
                    </strong>

                    <div class="small text-muted">

                        ${item.length}${unitLabel(item.lengthUnit)}
                        ×
                        ${item.breadth}${unitLabel(item.breadthUnit)}

                        &nbsp; | &nbsp;

                        ${item.weightKg.toFixed(3)} kg

                        &nbsp; | &nbsp;

                        WD ${item.weldingCm.toFixed(2)} cm

                    </div>

                </div>


                <div>

                    <button
                        type="button"
                        class="btn btn-sm btn-warning me-1"
                        onclick="openFittedDetails(${index})">

                        <i class="bi bi-pencil"></i>

                    </button>


                    <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        onclick="deleteFittedDetail(${index})">

                        <i class="bi bi-trash"></i>

                    </button>

                </div>

            </div>

        </div>

    `).join("");

}


// Unit display
function unitLabel(unit) {

    return unit === "feet"
        ? " ft"
        : " in";

}


// Delete fitted detail
function deleteFittedDetail(index) {

    if (
        !confirm(
            "Delete this fitted item?"
        )
    ) {
        return;
    }

    fittedDetails.splice(index, 1);

    renderFittedDetails();

}


// Calculate while typing
document.addEventListener(
    "input",
    function(event) {

        if (
            event.target.id === "fittedLength" ||
            event.target.id === "fittedBreadth"
        ) {

            calculateFittedValues();

        }

    }
);


// Recalculate when unit changes
document.addEventListener(
    "change",
    function(event) {

        if (
            event.target.id === "fittedLengthUnit" ||
            event.target.id === "fittedBreadthUnit"
        ) {

            calculateFittedValues();

        }

    }
);

function generateRepairFields() {

    const container =
        document.getElementById("repairFields");

    if (!container) return;

    container.innerHTML = "";

    repairColumns.forEach(function(column, index) {

        // =========================================
        // SPECIAL COLUMNS
        // =========================================

        if (
            column === "Panel Fitted" ||
            column === "Floor Fitted"
        ) {

            container.innerHTML += `

                <div class="row mb-2 align-items-center">

                    <div class="col-md-10">

                        <strong>
                            ${column}
                        </strong>

                        <div
                            class="small text-muted"
                            id="${column === "Panel Fitted"
                                ? "panelFittedSummary"
                                : "floorFittedSummary"}">

                            No ${column.toLowerCase()} details added.

                        </div>

                    </div>

                    <div class="col-md-2">

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-primary w-100"
                            onclick="openFittedDetailsFor('${column}')">

                            + Add

                        </button>

                    </div>

                </div>

            `;

            return;
        }


        // =========================================
        // NORMAL REPAIR COLUMNS
        // =========================================

        container.innerHTML += `

            <div class="row mb-2 align-items-center">

                <div class="col-md-10">

                    ${column}

                </div>

                <div class="col-md-2">

                    <input
                        type="number"
                        class="form-control repairQty"
                        id="repair_${index}"
                        min="0"
                        value="0">

                </div>

            </div>

        `;

    });

}

// ===============================
// Save Wagon
// ===============================

function saveWagon(options = {}) {

    const settings = {
        closeModal: options.closeModal !== false,
        clearForm: options.clearForm !== false,
        showAlert: options.showAlert !== false
    };

   const wagon = {
    id: Date.now(),
    orly: document.getElementById("orly").value.trim(),
    wagonNo: document.getElementById("wagonNo").value.trim(),
    wagonType: document.getElementById("wagonType").value.trim(),
    remarks: document.getElementById("remarks").value,
    incomingDamages: document.getElementById("incomingDamages").value.trim(),

    repairs: {},

    // Floor / Panel Fitted Details
    fittedDetails: JSON.parse(
        JSON.stringify(fittedDetails)
    )
};
    // Wagon Number Validation

if (!/^\d{11}$/.test(wagon.wagonNo)) {

    alert("Wagon Number must contain exactly 11 digits.");

    document.getElementById("wagonNo").focus();

    return false;

}

// Duplicate Wagon Number Validation
const duplicateIndex = wagons.findIndex(function(existingWagon, index) {

    return existingWagon.wagonNo === wagon.wagonNo &&
           index !== editingWagonIndex;

});

if (duplicateIndex !== -1) {

    alert(
        "Wagon No. " + wagon.wagonNo +
        " is already entered in the table.\n\n" +
        "Please check the wagon number."
    );

    document.getElementById("wagonNo").focus();

    return false;
}

    repairColumns.forEach(function(column, index) {

    // Panel Fitted and Floor Fitted
    // are handled by the special fittedDetails interface.
    if (
        column === "Panel Fitted" ||
        column === "Floor Fitted"
    ) {

        wagon.repairs[column] = 0;

        return;
    }


    // Normal repair columns
    const input =
        document.getElementById(`repair_${index}`);

    wagon.repairs[column] =
        input ? Number(input.value || 0) : 0;

});

    if (editingWagonIndex !== null) {

    // Update existing wagon
    wagons[editingWagonIndex] = wagon;

    editingWagonIndex = null;

} else {

    // Add new wagon
    wagons.push(wagon);

}

refreshWagonTable();

console.log(wagons);

if (settings.showAlert) {
    alert("Wagon Saved Successfully!");
}

/* Close Add Wagon popup after successful save */
if (settings.closeModal) {
    const modalElement = document.getElementById("addWagonModal");

    if (modalElement && typeof bootstrap !== "undefined") {
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.hide();
    }
}

/* Clear the form only when requested */
if (settings.clearForm) {
    clearWagonForm();
}

return true;

}

function clearWagonForm() {

    document.getElementById("orly").value = "";

    document.getElementById("wagonNo").value = "";

    document.getElementById("wagonType").value = "";

    document.getElementById("remarks").value = "Y/R";

    document.getElementById("incomingDamages").value = "";

    repairColumns.forEach(function(column, index) {

        const input = document.getElementById(`repair_${index}`);

        if (input) {

            input.value = 0;

        }

    });

    editingWagonIndex = null;
    fittedDetails = [];

renderFittedDetails();

clearFittedCalculatedValues();

}

// ===============================
// Refresh Wagon Table
// ===============================

function editWagon(index) {

    const wagon = wagons[index];
    editingWagonIndex = index;

    console.log("Editing Wagon:", wagon);

    // Load wagon details into popup

    document.getElementById("orly").value = wagon.orly;

    document.getElementById("wagonNo").value = wagon.wagonNo;

    document.getElementById("wagonType").value = wagon.wagonType;

    document.getElementById("remarks").value = wagon.remarks;

    document.getElementById("incomingDamages").value = wagon.incomingDamages;


    // Load repair quantities

    repairColumns.forEach(function(column, repairIndex) {

        const input = document.getElementById(`repair_${repairIndex}`);

        if (input) {

            input.value = wagon.repairs[column] || 0;

        }

    });

    // =========================================
// Load Panel / Floor Fitted Details
// =========================================

fittedDetails =
    wagon.fittedDetails
        ? JSON.parse(
            JSON.stringify(wagon.fittedDetails)
          )
        : [];

renderFittedDetails();

    // Open Add Wagon popup

    const modalElement = document.getElementById("addWagonModal");

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

    modal.show();

}

function deleteWagon(index) {

    const wagon = wagons[index];

    const confirmed = confirm(
        "Are you sure you want to delete Wagon No. " +
        wagon.wagonNo +
        "?"
    );

    if (!confirmed) {

        return;

    }

    wagons.splice(index, 1);

    refreshWagonTable();

}

// =========================================
// DYNAMIC YARD REPAIR COLUMNS
// =========================================

function getDisplayedRepairColumns() {

    const populated = [];

    repairColumns.forEach(function(column) {

        // =====================================
        // PANEL FITTED
        // =====================================

        if (column === "Panel Fitted") {

            const hasPanel = wagons.some(function(wagon) {

                return Array.isArray(wagon.fittedDetails) &&
                    wagon.fittedDetails.some(function(item) {

                        return item.item &&
                            item.item.trim().toLowerCase() ===
                            "panel fitted";

                    });

            });

            if (hasPanel) {
                populated.push(column);
            }

            return;
        }


        // =====================================
        // FLOOR FITTED
        // =====================================

        if (column === "Floor Fitted") {

            const hasFloor = wagons.some(function(wagon) {

                return Array.isArray(wagon.fittedDetails) &&
                    wagon.fittedDetails.some(function(item) {

                        return item.item &&
                            item.item.trim().toLowerCase() ===
                            "floor fitted";

                    });

            });

            if (hasFloor) {
                populated.push(column);
            }

            return;
        }


        // =====================================
        // NORMAL REPAIR COLUMN
        // =====================================

        const hasValue = wagons.some(function(wagon) {

            return Number(
                wagon.repairs &&
                wagon.repairs[column]
                    ? wagon.repairs[column]
                    : 0
            ) > 0;

        });

        if (hasValue) {
            populated.push(column);
        }

    });


    // =========================================
    // MINIMUM 6 COLUMNS
    // =========================================

    const displayed = [...populated];


    repairColumns.forEach(function(column) {

        if (
            displayed.length < 6 &&
            !displayed.includes(column)
        ) {

            displayed.push(column);

        }

    });


    return displayed;
}

// ===============================
// Refresh Wagon Table Header
// ===============================


function refreshWagonTableHeader() {

    const header =
        document.getElementById("wagonTableHeader");

    const repairHeader =
        document.getElementById("yardRepairHeader");

    const repairRow =
        document.getElementById("repairColumnHeaderRow");

    if (!header || !repairHeader || !repairRow) {
        return;
    }

    // Get the columns that should currently be displayed
    const displayedColumns =
        getDisplayedRepairColumns();

    // Update Yard Repair Particulars colspan
    repairHeader.colSpan =
        displayedColumns.length;

    // Clear existing repair headings
    repairRow.innerHTML = "";

    // Add only the selected columns
    displayedColumns.forEach(function(column) {

        repairRow.innerHTML += `
            <th>
                ${column}
            </th>
        `;

    });

}

// =========================================
// PANEL / FLOOR FITTED TABLE DISPLAY
// =========================================

function getFittedColumnDisplay(wagon, type) {

    if (
        !wagon ||
        !Array.isArray(wagon.fittedDetails)
    ) {
        return "";
    }

    const items = wagon.fittedDetails.filter(function(item) {

        return (
            item.item &&
            item.item.trim().toLowerCase() ===
            type.trim().toLowerCase()
        );

    });

    if (items.length === 0) {
        return "";
    }

    return items.map(function(item) {

        return `
            <div class="fitted-table-item">
                <strong>
                    ${Number(item.weightKg).toFixed(3)} kg
                </strong>
                <br>
                <span>
                    (WD ${Number(item.weldingCm).toFixed(2)} cm)
                </span>
            </div>
        `;

    }).join("");
}

// =========================================
// AUTO FIT WAGON TABLE TEXT
// =========================================

function autoFitWagonTableText() {

    const cells = document.querySelectorAll(
        "#wagonTableBody td"
    );

    cells.forEach(function(cell) {

        cell.style.whiteSpace = "nowrap";
        cell.style.overflow = "hidden";

        let fontSize = 8;

        cell.style.fontSize = fontSize + "pt";

        while (
            cell.scrollWidth > cell.clientWidth &&
            fontSize > 4
        ) {

            fontSize -= 0.25;

            cell.style.fontSize =
                fontSize + "pt";
        }

    });

}

function refreshWagonTable() {

    refreshWagonTableHeader();

    const tbody = document.getElementById("wagonTableBody");

    tbody.innerHTML = "";

    wagons.forEach(function(wagon, index){

        tbody.innerHTML += `

        <tr>

            <td>${index + 1}</td>

            <td>${wagon.orly}</td>

            <td>${wagon.wagonNo}</td>

            <td>${wagon.wagonType}</td>

            <td>${wagon.incomingDamages}</td>

            <td>${wagon.remarks}</td>

           ${getDisplayedRepairColumns().map(function(column) {

    // =====================================
    // PANEL FITTED
    // =====================================

    if (column === "Panel Fitted") {

        return `
            <td class="fitted-column">
                ${getFittedColumnDisplay(
                    wagon,
                    "Panel Fitted"
                )}
            </td>
        `;

    }


    // =====================================
    // FLOOR FITTED
    // =====================================

    if (column === "Floor Fitted") {

        return `
            <td class="fitted-column">
                ${getFittedColumnDisplay(
                    wagon,
                    "Floor Fitted"
                )}
            </td>
        `;

    }


    // =====================================
    // NORMAL REPAIR COLUMN
    // =====================================

    return `
        <td>
            ${wagon.repairs[column] || 0}
        </td>
    `;

}).join("")}

            <td class="text-center"
    style="width:90px; min-width:90px; white-space:nowrap;">

                <button
    type="button"
    class="btn btn-warning p-0 edit-wagon-btn"
    style="width:24px;height:24px; line-height:1;"
    title="Edit Wagon"
    data-index="${index}">

    <i class="bi bi-pencil" style="font-size:12px;"></i>

</button>

<button
    type="button"
    class="btn btn-danger p-0 delete-wagon-btn"
    style="width:24px;height:24px; line-height:1;"
    title="Delete Wagon"
    data-index="${index}">

    <i class="bi bi-trash" style="font-size:12px;"></i>

</button>
            </td>

        </tr>

        `;


    });

    // =========================================
    // TOTAL ROW - YARD REPAIR PARTICULARS
    // =========================================

    const totalRow = `
        <tr id="wagonTotalRow" class="wagon-total-row">

            <td colspan="6">
                <strong>TOTAL</strong>
            </td>

            ${getDisplayedRepairColumns().map(function(column) {

    // =========================================
    // PANEL FITTED TOTAL
    // =========================================

    if (column === "Panel Fitted") {

        const totalWeight = wagons.reduce(function(sum, wagon) {

            if (!Array.isArray(wagon.fittedDetails)) {
                return sum;
            }

            return sum + wagon.fittedDetails.reduce(function(total, item) {

                if (
                    item.item &&
                    item.item.trim().toLowerCase() ===
                    "panel fitted"
                ) {
                    return total + Number(item.weightKg || 0);
                }

                return total;

            }, 0);

        }, 0);


        const totalWD = wagons.reduce(function(sum, wagon) {

            if (!Array.isArray(wagon.fittedDetails)) {
                return sum;
            }

            return sum + wagon.fittedDetails.reduce(function(total, item) {

                if (
                    item.item &&
                    item.item.trim().toLowerCase() ===
                    "panel fitted"
                ) {
                    return total + Number(item.weldingCm || 0);
                }

                return total;

            }, 0);

        }, 0);


        return `
            <td class="fitted-column">
                <strong>
                    ${totalWeight.toFixed(3)} kg
                </strong>
                <br>
                <span>
                    WD ${totalWD.toFixed(2)} cm
                </span>
            </td>
        `;
    }


    // =========================================
    // FLOOR FITTED TOTAL
    // =========================================

    if (column === "Floor Fitted") {

        const totalWeight = wagons.reduce(function(sum, wagon) {

            if (!Array.isArray(wagon.fittedDetails)) {
                return sum;
            }

            return sum + wagon.fittedDetails.reduce(function(total, item) {

                if (
                    item.item &&
                    item.item.trim().toLowerCase() ===
                    "floor fitted"
                ) {
                    return total + Number(item.weightKg || 0);
                }

                return total;

            }, 0);

        }, 0);


        const totalWD = wagons.reduce(function(sum, wagon) {

            if (!Array.isArray(wagon.fittedDetails)) {
                return sum;
            }

            return sum + wagon.fittedDetails.reduce(function(total, item) {

                if (
                    item.item &&
                    item.item.trim().toLowerCase() ===
                    "floor fitted"
                ) {
                    return total + Number(item.weldingCm || 0);
                }

                return total;

            }, 0);

        }, 0);


        return `
            <td class="fitted-column">
                <strong>
                    ${totalWeight.toFixed(3)} kg
                </strong>
                <br>
                <span>
                    WD ${totalWD.toFixed(2)} cm
                </span>
            </td>
        `;
    }


    // =========================================
    // NORMAL REPAIR TOTAL
    // =========================================

    const total = wagons.reduce(function(sum, wagon) {

        return sum + Number(
            wagon.repairs[column] || 0
        );

    }, 0);


    return `
        <td>
            <strong>${total}</strong>
        </td>
    `;

}).join("")}

            <td></td>

        </tr>
    `;

    tbody.innerHTML += totalRow;

    autoFitWagonTableText();

document.querySelectorAll(".edit-wagon-btn").forEach(function(button) {

    button.addEventListener("click", function() {

        const index = Number(this.dataset.index);

        editWagon(index);

    });

});

document.querySelectorAll(".delete-wagon-btn").forEach(function(button) {

    button.addEventListener("click", function() {

        const index = Number(this.dataset.index);

        deleteWagon(index);

    });

});


}

document.getElementById("wagonNo").addEventListener("input", function () {

    // Remove anything that is not a number
    this.value = this.value.replace(/\D/g, "");

    if (this.value.length === 11) {

        // Prevent repeated alerts for the same 11 digits
        this.dataset.limitReached = "true";

    } else {

        this.dataset.limitReached = "false";

    }

});

document.getElementById("wagonNo").addEventListener("keydown", function (event) {

    if (
        this.value.length >= 11 &&
        !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(event.key)
    ) {

        event.preventDefault();

        if (this.dataset.limitReached !== "alerted") {

            alert("Wagon Number already contains 11 digits.");

            this.dataset.limitReached = "alerted";

        }

    } else if (this.value.length < 11) {

        this.dataset.limitReached = "false";

    }

});

// ===============================
// Repair Columns Modal
// ===============================

function openRepairColumns() {

    const modal = document.getElementById("repairColumnModal");

    if (!modal) {
        console.error("Repair Columns popup not found.");
        return;
    }

    modal.style.display = "block";
    modal.style.visibility = "visible";
    modal.style.opacity = "1";

    document.body.style.overflow = "hidden";
}

function closeRepairColumns() {

    const modal = document.getElementById("repairColumnModal");

    if (!modal) {
        return;
    }

    modal.style.display = "none";
    modal.style.visibility = "hidden";
    modal.style.opacity = "0";

    document.body.style.overflow = "";

}

document.addEventListener("click", function(event) {

    const modal = document.getElementById("repairColumnModal");

    if (
        modal &&
        modal.classList.contains("show") &&
        event.target === modal
    ) {

        closeRepairColumns();

    }

});

function refreshRepairColumnPopup() {

    const tbody = document.getElementById("repairColumnBody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    repairColumns.forEach(function(column, index) {

        tbody.innerHTML += `
            <tr>

                <td>
                    ${column}
                </td>

                <td>

                    <button
                        type="button"
                        class="btn btn-sm btn-warning me-1"
                        onclick="renameRepairColumn(${index})">

                        Rename

                    </button>

                    <button
    type="button"
    class="btn btn-sm btn-danger"
    onclick="deleteRepairColumn(${index})">

    Delete

</button>

                </td>

            </tr>
        `;

    });

}


// ===============================
// Repair Column - Rename
// ===============================

function renameRepairColumn(index) {

    const oldName = repairColumns[index];

    const newName = prompt(
        "Enter new name for repair column:",
        oldName
    );

    if (newName === null) {
        return;
    }

    const trimmedName = newName.trim();

    if (trimmedName === "") {

        alert("Column name cannot be empty.");

        return;

    }

    if (repairColumns.includes(trimmedName)) {

        alert("This repair column already exists.");

        return;

    }

    repairColumns[index] = trimmedName;

    generateRepairFields();

    refreshWagonTable();

    refreshRepairColumnPopup();

}

// ===============================
// Repair Column - Delete
// ===============================

function deleteRepairColumn(index) {

    const columnName = repairColumns[index];

    const confirmed = confirm(
        "Are you sure you want to delete '" +
        columnName +
        "'?"
    );

    if (!confirmed) {
        return;
    }

    repairColumns.splice(index, 1);

    generateRepairFields();

    refreshWagonTable();

    refreshRepairColumnPopup();

}

// ===============================
// Repair Column - Add New
// ===============================

function addRepairColumn() {

    const newName = prompt(
        "Enter new repair column name:"
    );

    if (newName === null) {
        return;
    }

    const trimmedName = newName.trim();

    if (trimmedName === "") {

        alert("Column name cannot be empty.");

        return;

    }

    if (repairColumns.includes(trimmedName)) {

        alert("This repair column already exists.");

        return;

    }

    repairColumns.push(trimmedName);

    generateRepairFields();

    refreshWagonTable();

    refreshRepairColumnPopup();

}

// ===============================
// Save Repair Column Changes
// ===============================

function saveRepairColumnChanges() {

    refreshRepairColumnPopup();

    closeRepairColumns();

    alert("Repair column configuration saved successfully.");

}

document.addEventListener("DOMContentLoaded", function(){

    generateRepairFields();

    refreshRepairColumnPopup();

    refreshWagonTableHeader();

    // existing code continues...

});

/* =========================================
   DAMAGE REPORT PRINT HEADING
   ========================================= */

function updatePrintReportHeading() {

    const trainNo = document.getElementById("trainNo");
    const reportDate = document.getElementById("reportDate");

    const headingTrainNo =
        document.getElementById("printHeadingTrainNo");

    const headingDate =
        document.getElementById("printHeadingDate");

    if (!trainNo || !reportDate || !headingTrainNo || !headingDate) {
        return;
    }


    /* =========================================
       PRINT PARTICULARS - ALL FIELDS
       ========================================= */

    const printFieldMap = {

        trainNo: "printTrainNo",
        rakeID: "printRakeID",
        rakeArrived: "printRakeArrived",

        ibpc: "printIBPC",
        exStation: "printExStation",
        damageOccurrence: "printDamageOccurrence",

        loadingPoint: "printLoadingPoint",
        unloadingPoint: "printUnloadingPoint",

        content: "printContent",
        consignee: "printConsignee",
        consignor: "printConsignor",

        examinedBy: "printExaminedBy",
        examinedBy2: "printExaminedBy2"

    };


    /* Copy every form value to its print field */

    Object.keys(printFieldMap).forEach(function(sourceID) {

        const sourceElement =
            document.getElementById(sourceID);

        const printElement =
            document.getElementById(printFieldMap[sourceID]);

        if (sourceElement && printElement) {

            printElement.textContent =
                sourceElement.value.trim();

        }

    });


    /* =========================================
       REPORT HEADING
       ========================================= */

    headingTrainNo.textContent =
        trainNo.value.trim() || "________________";


    if (reportDate.value) {

        const parts =
            reportDate.value.split("-");

        if (parts.length === 3) {

            headingDate.textContent =
                `${parts[2]}-${parts[1]}-${parts[0]}`;

        } else {

            headingDate.textContent =
                "________________";

        }

    } else {

        headingDate.textContent =
            "________________";

    }


    /* Automatically fit heading to one line */

    fitPrintHeading();

}

function fitPrintHeading() {

    const heading =
        document.getElementById("printReportHeading");

    if (!heading) {
        return;
    }

    // Start with normal heading size
    let fontSize = 15;

    heading.style.fontSize = fontSize + "pt";
    heading.style.whiteSpace = "nowrap";
    heading.style.display = "block";
    heading.style.width = "100%";
    heading.style.textAlign = "center";

    // Available width of the heading itself
    const maxWidth = heading.parentElement.clientWidth;

    // Reduce font until the complete heading fits
    while (
        heading.scrollWidth > maxWidth &&
        fontSize > 7
    ) {

        fontSize -= 0.5;

        heading.style.fontSize =
            fontSize + "pt";
    }

}

/* =========================================
   UPDATE PRINT PARTICULARS
   ========================================= */

document.addEventListener("input", function (event) {

    if (
        event.target.id === "trainNo" ||
        event.target.id === "reportDate" ||
        event.target.id === "rakeID" ||
        event.target.id === "rakeArrived"
    ) {
        updatePrintReportHeading();
    }

});

document.addEventListener("change", function (event) {

    if (
        event.target.id === "trainNo" ||
        event.target.id === "reportDate" ||
        event.target.id === "rakeID" ||
        event.target.id === "rakeArrived"
    ) {
        updatePrintReportHeading();
    }

});

// Update Representative name for print
document.addEventListener("DOMContentLoaded", function () {

    const representativeField =
        document.getElementById("representativeOf");

    const printRepresentative =
        document.getElementById("printRepresentative");

    if (representativeField && printRepresentative) {

        representativeField.addEventListener("input", function () {
            printRepresentative.textContent = this.value;
        });

    }

});

// =========================================
// WAGON SAVE BUTTONS
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    const saveWagonBtn =
        document.getElementById("saveWagonBtn");

    const saveNextBtn =
        document.getElementById("saveNextBtn");

    if (saveWagonBtn) {

        saveWagonBtn.addEventListener("click", function () {
            saveWagon();
        });

    }

    if (saveNextBtn) {

    saveNextBtn.addEventListener("click", function () {

        /* Remember which existing wagon is being edited before saving */
        const currentIndex = editingWagonIndex;

        /* Save without closing or clearing the modal */
        const saved = saveWagon({
            closeModal: false,
            clearForm: false,
            showAlert: false
        });

        if (!saved) {
            return;
        }

        /* For BPC/imported wagons, confirm save and load the next wagon in sequence */
        if (currentIndex !== null && wagons[currentIndex + 1]) {
            alert("Wagon saved successfully!");

            editWagon(currentIndex + 1);

            /* Move focus away from Save & Next and directly to Remarks */
            setTimeout(function () {
                const remarksField = document.getElementById("remarks");

                if (remarksField) {
                    remarksField.focus();
                }
            }, 150);

            return;
        }

        /* Last wagon (or a manually added wagon): finish normally */
        clearWagonForm();

        if (currentIndex !== null) {
            alert("All wagons in this BPC have been completed.");
        } else {
            alert("Wagon saved successfully.");
        }

        setTimeout(function () {
            const modalElement = document.getElementById("addWagonModal");

            if (modalElement && typeof bootstrap !== "undefined") {
                const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
                modal.show();
            }
        }, 100);

    });

}

});

// =========================================
// PRINT ALL DAMAGE REPORT PARTICULARS
// =========================================

function updateAllPrintParticulars() {

    const fields = {
        "ibpc": "printIBPC",
        "exStation": "printExStation",
        "damageOccurrence": "printDamageOccurrence",
        "loadingPoint": "printLoadingPoint",
        "unloadingPoint": "printUnloadingPoint",
        "content": "printContent",
        "consignee": "printConsignee",
        "consignor": "printConsignor",
        "examinedBy": "printExaminedBy"
    };

    Object.keys(fields).forEach(function(sourceId) {

        const source =
            document.getElementById(sourceId);

        const destination =
            document.getElementById(fields[sourceId]);

        if (source && destination) {

            destination.textContent =
                source.value.trim();

        }

    });
}


// Keep the second examiner optional.
// Both examiner names are displayed in ONE "Examination By" cell.
function updateSecondExaminerPrint() {
    const source1 = document.getElementById("examinedBy");
    const source2 = document.getElementById("examinedBy2");
    const destination = document.getElementById("printExaminedBy");
    const signatureBox = document.getElementById("printSignatureExaminer2Box");

    const value1 = source1 ? source1.value.trim() : "";
    const value2 = source2 ? source2.value.trim() : "";

    if (destination) {
        destination.textContent = [value1, value2].filter(Boolean).join("\n");
    }

    const signatureSection = document.getElementById("printSignatureSection");
    if (signatureSection) {
        signatureSection.classList.toggle("two-examiners", !!value2);
    }

    /* CSS controls the print visibility so the @media print rule wins reliably. */
    if (signatureBox) {
        signatureBox.removeAttribute("style");
    }
}

// Update print particulars while typing
document.addEventListener("input", function(event) {

    const printFields = [
        "ibpc",
        "exStation",
        "damageOccurrence",
        "loadingPoint",
        "unloadingPoint",
        "content",
        "consignee",
        "consignor",
        "examinedBy",
        "examinedBy2"
    ];

    if (printFields.includes(event.target.id)) {

        updateAllPrintParticulars();
        updateSecondExaminerPrint();

    }

});


// Make absolutely sure everything is updated before printing
window.addEventListener("beforeprint", function() {

    updatePrintReportHeading();
    updateAllPrintParticulars();
    updateSecondExaminerPrint();

});

// Initialize wagon table headers when page loads
document.addEventListener("DOMContentLoaded", function () {
    refreshWagonTableHeader();
    refreshWagonTable();
    updateSecondExaminerPrint();
});

/* =========================================
   PRDMS REPORT ACTION BUTTONS
   ========================================= */

function collectReportData() {

    return {
        trainNo: document.getElementById("trainNo")?.value.trim() || "",
        reportDate: document.getElementById("reportDate")?.value || "",
        rakeID: document.getElementById("rakeID")?.value.trim() || "",
        rakeArrived: document.getElementById("rakeArrived")?.value.trim() || "",

        ibpcParticulars:
            document.getElementById("ibpcParticulars")?.value.trim() || "",

        exStation:
            document.getElementById("exStation")?.value.trim() || "",

        damageOccurrence:
            document.getElementById("damageOccurrence")?.value.trim() || "",

        loadingPoint:
            document.getElementById("loadingPoint")?.value.trim() || "",

        unloadingPoint:
            document.getElementById("unloadingPoint")?.value.trim() || "",

        content:
            document.getElementById("content")?.value.trim() || "",

        consignee:
            document.getElementById("consignee")?.value.trim() || "",

        consignor:
            document.getElementById("consignor")?.value.trim() || "",

        examinedBy:
            document.getElementById("examinedBy")?.value.trim() || "",

        examinedBy2:
            document.getElementById("examinedBy2")?.value.trim() || "",

        representativeOf:
            document.getElementById("representativeOf")?.value.trim() || "",

        wagons: wagons,
        repairColumns: repairColumns,

        savedAt: new Date().toISOString()
    };
}


/* =========================================
   SAVE PROGRESS
   ========================================= */

function saveProgress() {

    const reportData = collectReportData();

    localStorage.setItem(
        "PRDMS_CURRENT_REPORT",
        JSON.stringify(reportData)
    );

    alert("Report progress saved successfully.");
}


/* =========================================
   SAVE & EXIT
   ========================================= */

function saveAndExit() {

    const reportData = collectReportData();

    localStorage.setItem(
        "PRDMS_CURRENT_REPORT",
        JSON.stringify(reportData)
    );

    alert("Report saved successfully.");

    window.location.href = "../index.html";
}


/* =========================================
   SAVE & PRINT
   ========================================= */

function saveAndPrint() {

    const reportData = collectReportData();

    localStorage.setItem(
        "PRDMS_CURRENT_REPORT",
        JSON.stringify(reportData)
    );

    // Update print heading and particulars
    if (typeof updatePrintReportHeading === "function") {
        updatePrintReportHeading();
    }

    window.print();
}


/* =========================================
   PRINT MANPOWER
   ========================================= */

function printManpower() {

    // Save the current report exactly as it is on the page
    // so the existing Manpower Calculation module can read it.
    const reportData = getReportData();

    localStorage.setItem(
        "PRDMS_CURRENT_REPORT",
        JSON.stringify(reportData)
    );

    // Open the existing Manpower Calculation page.
    // No Damage Report data, calculation logic, or print format is changed.
    window.location.href = "manpower-calculation.html";
}


/* =========================================
   CANCEL REPORT
   ========================================= */

function cancelReport() {

    const confirmed = confirm(
        "Are you sure you want to cancel this damage report?\n\n" +
        "Any unsaved information will be lost."
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem("PRDMS_CURRENT_REPORT");
    if (typeof clearAutoSavedDraft === "function") clearAutoSavedDraft();

    window.location.href = "../index.html";
}

/* =========================================
   PDRMS REPORT ACTION BUTTONS
   ========================================= */

function getReportData() {

    return {
        reportStatus: "draft",

        trainNo:
            document.getElementById("trainNo")?.value.trim() || "",

        reportDate:
            document.getElementById("reportDate")?.value || "",

        rakeID:
            document.getElementById("rakeID")?.value.trim() || "",

        rakeArrived:
            document.getElementById("rakeArrived")?.value.trim() || "",

        ibpc:
            document.getElementById("ibpc")?.value.trim() || "",

        exStation:
            document.getElementById("exStation")?.value.trim() || "",

        damageOccurrence:
            document.getElementById("damageOccurrence")?.value.trim() || "",

        loadingPoint:
            document.getElementById("loadingPoint")?.value.trim() || "",

        unloadingPoint:
            document.getElementById("unloadingPoint")?.value.trim() || "",

        content:
            document.getElementById("content")?.value.trim() || "",

        consignee:
            document.getElementById("consignee")?.value.trim() || "",

        consignor:
            document.getElementById("consignor")?.value.trim() || "",

        examinedBy:
            document.getElementById("examinedBy")?.value.trim() || "",

        examinedBy2:
            document.getElementById("examinedBy2")?.value.trim() || "",

        representativeOf:
            document.getElementById("representativeOf")?.value.trim() || "",

        /* Current wagon data */
        wagons: wagons,

        /* Current repair columns */
        repairColumns: repairColumns,

        savedAt: new Date().toISOString()
    };
}


/* =========================================
   SAVE PROGRESS
   ========================================= */

function saveProgress() {

    const reportData = getReportData();

    reportData.reportStatus = "draft";

    localStorage.setItem(
        "PRDMS_CURRENT_REPORT",
        JSON.stringify(reportData)
    );

    alert("Report progress saved successfully.");
}


/* =========================================
   SAVE & EXIT
   ========================================= */

function saveAndExit() {

    const reportData = getReportData();

    reportData.reportStatus = "saved";

    localStorage.setItem(
        "PRDMS_CURRENT_REPORT",
        JSON.stringify(reportData)
    );

    alert("Damage report saved successfully.");

    window.location.href = "../index.html";
}


/* =========================================
   SAVE & PRINT
   ========================================= */

function saveAndPrint() {

    const reportData = getReportData();

    reportData.reportStatus = "saved";

    localStorage.setItem(
        "PRDMS_CURRENT_REPORT",
        JSON.stringify(reportData)
    );

    /* Update print heading */
    if (typeof updatePrintReportHeading === "function") {
        updatePrintReportHeading();
    }

    /* Give the page a moment to update */
    setTimeout(function () {

        window.print();

    }, 150);
}


/* =========================================
   CANCEL
   ========================================= */

function cancelReport() {

    const confirmed = confirm(
        "Are you sure you want to cancel this damage report?\n\n" +
        "Any unsaved information will be lost."
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem("PRDMS_CURRENT_REPORT");
    if (typeof clearAutoSavedDraft === "function") clearAutoSavedDraft();

    window.location.href = "../index.html";
}
/* =========================================
   BPC PDF IMPORT - WAGON LIST
   Extracts: O/Rly + 11 digit Wagon No. + Wagon Type
   ========================================= */

let importedBpcFileName = "";

function setBpcImportStatus(message, type = "muted") {
    const status = document.getElementById("bpcImportStatus");
    if (!status) return;
    status.className = `small mt-2 text-${type} no-print`;
    status.textContent = message;
}

function extractBpcWagonsFromText(text) {
    const found = [];
    const seen = new Set();

    // In many BPC PDFs, the wagon list is printed in 2 or 3 columns.
    // PDF.js reads each visual row left-to-right, e.g.:
    // 1 NPSL ... 24 NPSL ... 47 NPSL ...
    // Therefore, we capture the BPC S.No. and sort by it so the final
    // PDRMS table follows the original wagon sequence: 1, 2, 3 ... 59.
    const serialPattern = /(?:^|\s)(\d{1,3})\s+([A-Za-z][A-Za-z0-9/&-]{1,15})\s+(\d{11})\s+([A-Za-z][A-Za-z0-9/_-]{1,20})(?=\s|$)/g;
    let match;
    let fallbackOrder = 0;

    while ((match = serialPattern.exec(text)) !== null) {
        const serialNo = Number(match[1]);
        const orly = match[2].trim();
        const wagonNo = match[3].trim();
        const wagonType = match[4].trim();

        // Ignore unrelated 11-digit numbers and keep only the wagon list
        // style records that contain S.No. + O/Rly + Wagon No. + Wagon Type.
        if (serialNo >= 1 && serialNo <= 500 && !seen.has(wagonNo)) {
            seen.add(wagonNo);
            found.push({
                serialNo,
                fallbackOrder: fallbackOrder++,
                id: Date.now() + found.length,
                orly,
                wagonNo,
                wagonType,
                remarks: "Y/R",
                incomingDamages: "",
                repairs: {},
                fittedDetails: []
            });
        }
    }

    // Sort exactly according to the BPC S.No., not PDF column-reading order.
    found.sort((a, b) => a.serialNo - b.serialNo || a.fallbackOrder - b.fallbackOrder);

    return found.map(({ serialNo, fallbackOrder, ...wagon }) => wagon);
}
async function importBpcPdf(file) {
    if (!file) return;

    if (typeof pdfjsLib === "undefined") {
        alert("BPC reader could not be loaded. Please check your internet connection and try again.");
        return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        alert("Please select a valid BPC PDF file.");
        return;
    }

    try {
        setBpcImportStatus("Reading BPC and extracting wagon details...", "primary");

        pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        let fullText = "";

        for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
            const page = await pdf.getPage(pageNo);
            const content = await page.getTextContent();
            fullText += "\n" + content.items.map(item => item.str).join(" ");
        }

        const importedWagons = extractBpcWagonsFromText(fullText);

        if (importedWagons.length === 0) {
            setBpcImportStatus("No wagon details could be detected in this BPC.", "danger");
            alert("No wagon details could be detected. Please check that this is a text-readable BPC PDF.");
            return;
        }

        if (wagons.length > 0) {
            const replace = confirm(
                `The current report already contains ${wagons.length} wagon(s).\n\n` +
                `The BPC contains ${importedWagons.length} wagon(s).\n\n` +
                "Press OK to replace the current wagon list, or Cancel to keep the current list and add only new wagon numbers."
            );

            if (replace) {
                wagons = importedWagons;
            } else {
                const existing = new Set(wagons.map(w => w.wagonNo));
                importedWagons.forEach(wagon => {
                    if (!existing.has(wagon.wagonNo)) {
                        wagons.push(wagon);
                        existing.add(wagon.wagonNo);
                    }
                });
            }
        } else {
            wagons = importedWagons;
        }

        importedBpcFileName = file.name;
        refreshWagonTable();
        if (typeof saveAutoDraft === "function") saveAutoDraft(true);
        setBpcImportStatus(
            `${importedWagons.length} wagon(s) imported from ${file.name}. O/Rly, Wagon No. and Type are auto-filled. Edit Remarks and damage details as required.`,
            "success"
        );

        alert(`${importedWagons.length} wagon(s) imported successfully from the BPC.`);

    } catch (error) {
        console.error("BPC import error:", error);
        setBpcImportStatus("BPC import failed. Please try another BPC PDF.", "danger");
        alert("Unable to read this BPC PDF. Please ensure the PDF is not corrupted and try again.");
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const uploadBtn = document.getElementById("uploadBpcBtn");
    const fileInput = document.getElementById("bpcFileInput");

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener("click", function () {
            fileInput.value = "";
            fileInput.click();
        });

        fileInput.addEventListener("change", function () {
            if (this.files && this.files[0]) {
                importBpcPdf(this.files[0]);
            }
        });
    }
});



/* =========================================
   AUTO-SAVE DRAFT
   ========================================= */

const PRDMS_AUTO_DRAFT_KEY = "PRDMS_AUTO_SAVED_DRAFT";
let prdmsAutoSaveTimer = null;
let prdmsAutoSaveRestoring = false;
let prdmsAutoSaveStarted = false;

function prdmsDraftHasMeaningfulData(data) {
    if (!data) return false;
    return Boolean(
        data.trainNo ||
        data.reportDate ||
        data.rakeID ||
        data.rakeArrived ||
        data.ibpc ||
        data.exStation ||
        data.damageOccurrence ||
        data.loadingPoint ||
        data.unloadingPoint ||
        data.content ||
        data.consignee ||
        data.consignor ||
        data.examinedBy ||
        data.representativeOf ||
        (Array.isArray(data.wagons) && data.wagons.length)
    );
}

function updateAutoSaveStatus(message, state) {
    const box = document.getElementById("autoSaveStatus");
    if (!box) return;
    box.classList.remove("saving", "saved", "error");
    if (state) box.classList.add(state);
    const text = box.querySelector("span");
    if (text) text.textContent = message;
}

function getCurrentReportStatusForDraft() {
    const current = JSON.parse(localStorage.getItem("PRDMS_CURRENT_REPORT") || "null");
    const editingId = window.__editingReportId || localStorage.getItem("PRDMS_EDIT_REPORT_ID") || "";
    if (editingId && current && current.reportId === editingId) {
        return current.reportStatus || "Draft";
    }
    return "Draft";
}

function buildAutoDraftData() {
    const data = typeof getReportData === "function" ? getReportData() : {};
    const current = JSON.parse(localStorage.getItem("PRDMS_CURRENT_REPORT") || "null");
    const editingId = window.__editingReportId || localStorage.getItem("PRDMS_EDIT_REPORT_ID") || "";

    data.reportId = editingId || current?.reportId || data.reportId || "";
    data.reportStatus = getCurrentReportStatusForDraft();
    data.autoSavedAt = new Date().toISOString();
    data.autoSaved = true;

    return data;
}

function saveAutoDraft(force = false) {
    if (prdmsAutoSaveRestoring) return;

    const data = buildAutoDraftData();
    if (!force && !prdmsDraftHasMeaningfulData(data)) {
        updateAutoSaveStatus("Auto-save: Ready");
        return;
    }

    try {
        updateAutoSaveStatus("Auto-save: Saving...", "saving");
        localStorage.setItem(PRDMS_AUTO_DRAFT_KEY, JSON.stringify(data));
        const time = new Date(data.autoSavedAt).toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
        updateAutoSaveStatus("Auto-saved " + time, "saved");
    } catch (error) {
        console.error("Auto-save failed:", error);
        updateAutoSaveStatus("Auto-save failed", "error");
    }
}

function scheduleAutoSaveDraft() {
    if (prdmsAutoSaveRestoring || !prdmsAutoSaveStarted) return;
    clearTimeout(prdmsAutoSaveTimer);
    prdmsAutoSaveTimer = setTimeout(() => saveAutoDraft(false), 900);
}

function clearAutoSavedDraft() {
    localStorage.removeItem(PRDMS_AUTO_DRAFT_KEY);
    updateAutoSaveStatus("Auto-save: Ready");
}

function restoreAutoDraft(data) {
    if (!data) return;

    prdmsAutoSaveRestoring = true;

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
        if (el && data[key] !== undefined) el.value = data[key] || "";
    });

    if (Array.isArray(data.repairColumns) && data.repairColumns.length) {
        repairColumns = JSON.parse(JSON.stringify(data.repairColumns));
    }

    wagons = Array.isArray(data.wagons)
        ? JSON.parse(JSON.stringify(data.wagons))
        : [];

    if (typeof generateRepairFields === "function") generateRepairFields();
    if (typeof refreshRepairColumnPopup === "function") refreshRepairColumnPopup();
    if (typeof refreshWagonTable === "function") refreshWagonTable();
    if (typeof updatePrintReportHeading === "function") updatePrintReportHeading();
    if (typeof updateAllPrintParticulars === "function") updateAllPrintParticulars();
    if (typeof updateSecondExaminerPrint === "function") updateSecondExaminerPrint();

    if (data.reportId) window.__editingReportId = data.reportId;

    prdmsAutoSaveRestoring = false;
    prdmsAutoSaveStarted = true;
    scheduleAutoSaveDraft();

    const when = data.autoSavedAt
        ? new Date(data.autoSavedAt).toLocaleString("en-IN")
        : "just now";
    updateAutoSaveStatus("Draft restored (" + when + ")", "saved");
}

function promptResumeAutoDraft() {
    let draft = null;
    try {
        draft = JSON.parse(localStorage.getItem(PRDMS_AUTO_DRAFT_KEY) || "null");
    } catch (e) {}

    if (!prdmsDraftHasMeaningfulData(draft)) {
        prdmsAutoSaveStarted = true;
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const isHistoryMode = params.has("edit") || params.has("view") || params.has("print");

    // History/View/Print already has an authoritative report to load.
    if (isHistoryMode) {
        prdmsAutoSaveStarted = true;
        return;
    }

    const info = document.getElementById("resumeDraftInfo");
    if (info && draft.autoSavedAt) {
        info.textContent = "Last auto-saved: " +
            new Date(draft.autoSavedAt).toLocaleString("en-IN") +
            ". You can continue from where you stopped.";
    }

    const resumeBtn = document.getElementById("resumeDraftBtn");
    const discardBtn = document.getElementById("discardDraftBtn");
    const modalEl = document.getElementById("resumeDraftModal");

    const resume = () => {
        if (modalEl && window.bootstrap) {
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        }
        restoreAutoDraft(draft);
    };

    const discard = () => {
        clearAutoSavedDraft();
        if (modalEl && window.bootstrap) {
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        }
        prdmsAutoSaveStarted = true;
    };

    if (resumeBtn) resumeBtn.onclick = resume;
    if (discardBtn) discardBtn.onclick = discard;

    if (modalEl && window.bootstrap) {
        bootstrap.Modal.getOrCreateInstance(modalEl, {backdrop: "static", keyboard: false}).show();
    } else if (confirm("An auto-saved draft was found. Resume it?")) {
        restoreAutoDraft(draft);
    } else {
        discard();
    }
}

document.addEventListener("input", function(event) {
    if (event.target.closest && event.target.closest("#changePasswordModal")) return;
    scheduleAutoSaveDraft();
});

document.addEventListener("change", function(event) {
    if (event.target.closest && event.target.closest("#changePasswordModal")) return;
    scheduleAutoSaveDraft();
});

window.addEventListener("beforeunload", function() {
    if (prdmsAutoSaveStarted) saveAutoDraft(true);
});

document.addEventListener("DOMContentLoaded", function() {
    if (!document.getElementById("trainNo")) return;
    setTimeout(promptResumeAutoDraft, 500);
});


/* =====================================================
   MANUAL WAGON ENTRY
   Added separately from BPC and existing Add Wagon flow.
   Each wagon is immediately committed to the report and
   auto-saved when "Add Next Wagon" is clicked.
   ===================================================== */

let manualWagonSequence = [];

function manualSafeText(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function openManualWagonEntry() {
    // Rebuild the visible sequence from already committed manual wagons.
    manualWagonSequence = wagons.filter(w => w.manualEntry === true);

    renderManualWagonSequence();

    const modalElement = document.getElementById("manualWagonEntryModal");
    if (modalElement && typeof bootstrap !== "undefined") {
        bootstrap.Modal.getOrCreateInstance(modalElement).show();
        setTimeout(() => {
            document.getElementById("manualWagonNo")?.focus();
        }, 250);
    }
}

function addManualSequenceWagon() {
    const orlyInput = document.getElementById("manualCommonOrly");
    const typeInput = document.getElementById("manualCommonType");
    const wagonInput = document.getElementById("manualWagonNo");

    const orly = (orlyInput?.value || "").trim();
    const wagonType = (typeInput?.value || "").trim();
    const wagonNo = (wagonInput?.value || "").trim();

    if (!orly) {
        alert("Please enter Owner / Rly first.");
        orlyInput?.focus();
        return;
    }

    if (!wagonType) {
        alert("Please enter Wagon Type first.");
        typeInput?.focus();
        return;
    }

    if (!/^\d{11}$/.test(wagonNo)) {
        alert("Wagon Number must contain exactly 11 digits.");
        wagonInput?.focus();
        return;
    }

    if (wagons.some(w => String(w.wagonNo || "") === wagonNo)) {
        alert("Wagon No. " + wagonNo + " is already entered.");
        wagonInput?.focus();
        wagonInput?.select();
        return;
    }

    // Immediately commit the wagon to the real report table.
    // No damage parameters are opened or entered here.
    const newWagon = {
        id: Date.now(),
        orly: orly,
        wagonNo: wagonNo,
        wagonType: wagonType,
        remarks: "Y/R",
        incomingDamages: "",
        repairs: {},
        fittedDetails: [],
        manualEntry: true
    };

    wagons.push(newWagon);
    manualWagonSequence.push(newWagon);

    // Update the existing main wagon table immediately.
    if (typeof refreshWagonTable === "function") {
        refreshWagonTable();
    }

    // Immediate auto-save: wagon remains safe even if the page closes.
    if (typeof saveAutoDraft === "function") {
        saveAutoDraft(true);
    }

    wagonInput.value = "";
    renderManualWagonSequence();
    wagonInput.focus();
}

function removeManualSequenceWagon(index) {
    const item = manualWagonSequence[index];
    if (!item) return;

    const globalIndex = wagons.findIndex(w =>
        w === item ||
        (w.id === item.id && String(w.wagonNo) === String(item.wagonNo))
    );

    if (globalIndex >= 0) {
        wagons.splice(globalIndex, 1);
    }

    manualWagonSequence.splice(index, 1);

    if (typeof refreshWagonTable === "function") {
        refreshWagonTable();
    }

    if (typeof saveAutoDraft === "function") {
        saveAutoDraft(true);
    }

    renderManualWagonSequence();
}

function renderManualWagonSequence() {
    const body = document.getElementById("manualWagonSequenceBody");
    const count = document.getElementById("manualWagonCount");
    if (!body) return;

    if (count) {
        count.textContent = manualWagonSequence.length + " Wagon" +
            (manualWagonSequence.length === 1 ? "" : "s");
    }

    if (!manualWagonSequence.length) {
        body.innerHTML = `
            <tr>
                <td colspan="5" class="text-muted py-3">
                    No wagons added yet.
                </td>
            </tr>`;
        return;
    }

    body.innerHTML = manualWagonSequence.map((wagon, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${manualSafeText(wagon.orly)}</td>
            <td><strong>${manualSafeText(wagon.wagonNo)}</strong></td>
            <td>${manualSafeText(wagon.wagonType)}</td>
            <td>
                <button type="button" class="btn btn-sm btn-outline-danger"
                        onclick="removeManualSequenceWagon(${index})"
                        title="Remove">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

function clearManualWagonEntry() {
    if (!manualWagonSequence.length) return;

    if (!confirm("Clear all manually entered wagons?")) {
        return;
    }

    const idsToRemove = new Set(manualWagonSequence.map(w => w.id));

    for (let i = wagons.length - 1; i >= 0; i--) {
        if (idsToRemove.has(wagons[i].id) && wagons[i].manualEntry === true) {
            wagons.splice(i, 1);
        }
    }

    manualWagonSequence = [];

    if (typeof refreshWagonTable === "function") {
        refreshWagonTable();
    }

    if (typeof saveAutoDraft === "function") {
        saveAutoDraft(true);
    }

    renderManualWagonSequence();
    document.getElementById("manualWagonNo")?.focus();
}

function proceedManualWagonEntry() {
    if (!manualWagonSequence.length) {
        alert("Please add at least one wagon before proceeding.");
        document.getElementById("manualWagonNo")?.focus();
        return;
    }

    // Wagons are already in the main report table and already auto-saved.
    const modalElement = document.getElementById("manualWagonEntryModal");
    if (modalElement && typeof bootstrap !== "undefined") {
        bootstrap.Modal.getOrCreateInstance(modalElement).hide();
    }

    if (typeof saveAutoDraft === "function") {
        saveAutoDraft(true);
    }

    // Keep existing Edit workflow unchanged. Users can now edit any wagon
    // using the current Edit button to enter/correct damage details.
}

document.addEventListener("keydown", function(event) {
    if (event.key !== "Enter") return;

    const modal = document.getElementById("manualWagonEntryModal");
    const input = document.getElementById("manualWagonNo");

    if (modal && input && document.activeElement === input &&
        modal.classList.contains("show")) {
        event.preventDefault();
        addManualSequenceWagon();
    }
});

