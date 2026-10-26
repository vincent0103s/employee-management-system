
const form = document.getElementById("employee-form");
const employeeList = document.getElementById("employee-list");
const searchInput = document.getElementById("search");
const message = document.getElementById("message");
const formTitle = document.getElementById("form-title");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");
const idInput = document.getElementById("employee_id");

let editingId = null;
let searchTimer;

async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Request failed.");
    }

    return data;
}

function showMessage(text, type = "success") {
    message.textContent = text;
    message.className = type;
}

function getFormData() {
    return {
        employee_id: idInput.value.trim(),
        employee_name: document.getElementById("employee_name").value.trim(),
        department: document.getElementById("department").value.trim(),
        designation: document.getElementById("designation").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        salary: document.getElementById("salary").value
    };
}

// View and search
async function loadEmployees(search = "") {
    try {
        const data = await api(
            "/api/employees?search=" + encodeURIComponent(search)
        );

        employeeList.replaceChildren();

        if (data.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 8;
            cell.textContent = "No employees found.";
            row.appendChild(cell);
            employeeList.appendChild(row);
            return;
        }

        data.forEach(employee => {
            const row = document.createElement("tr");

            [
                employee.employee_id,
                employee.employee_name,
                employee.department,
                employee.designation,
                employee.email,
                employee.phone,
                Number(employee.salary).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            const actions = document.createElement("td");

            const edit = document.createElement("button");
            edit.textContent = "Edit";
            edit.className = "edit";
            edit.addEventListener("click", () => editEmployee(employee));

            const del = document.createElement("button");
            del.textContent = "Delete";
            del.className = "delete";
            del.addEventListener("click", () =>
                deleteEmployee(employee.employee_id)
            );

            actions.append(edit, del);
            row.appendChild(actions);
            employeeList.appendChild(row);
        });
    } catch (error) {
        showMessage(error.message, "error");
    }
}

// Add and update
form.addEventListener("submit", async event => {
    event.preventDefault();

    const employee = getFormData();

    try {
        if (editingId === null) {
            await api("/api/employees", {
                method: "POST",
                body: JSON.stringify(employee)
            });
            showMessage("Employee added successfully.");
        } else {
            await api("/api/employees/" + encodeURIComponent(editingId), {
                method: "PUT",
                body: JSON.stringify(employee)
            });
            showMessage("Employee updated successfully.");
        }

        resetForm();
        await loadEmployees(searchInput.value.trim());
    } catch (error) {
        showMessage(error.message, "error");
    }
});

// Edit
function editEmployee(employee) {
    editingId = employee.employee_id;

    idInput.value = employee.employee_id;
    document.getElementById("employee_name").value = employee.employee_name;
    document.getElementById("department").value = employee.department;
    document.getElementById("designation").value = employee.designation;
    document.getElementById("email").value = employee.email;
    document.getElementById("phone").value = employee.phone;
    document.getElementById("salary").value = employee.salary;

    idInput.disabled = true;
    formTitle.textContent = "Update Employee";
    saveButton.textContent = "Save Changes";
    cancelButton.hidden = false;

    showMessage("Editing employee " + employee.employee_id + ".");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Delete
async function deleteEmployee(id) {
    if (!confirm("Delete employee " + id + "?")) return;

    try {
        await api("/api/employees/" + encodeURIComponent(id), {
            method: "DELETE"
        });

        if (editingId === id) resetForm();

        showMessage("Employee deleted successfully.");
        await loadEmployees(searchInput.value.trim());
    } catch (error) {
        showMessage(error.message, "error");
    }
}

// Reset
function resetForm() {
    form.reset();
    editingId = null;
    idInput.disabled = false;
    formTitle.textContent = "Add Employee";
    saveButton.textContent = "Add Employee";
    cancelButton.hidden = true;
}

cancelButton.addEventListener("click", () => {
    resetForm();
    showMessage("Edit cancelled.");
});

// Search
searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        loadEmployees(searchInput.value.trim());
    }, 250);
});

// Load records
loadEmployees();
