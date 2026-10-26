
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "employees.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Read employee records
function readEmployees() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, "[]", "utf8");
    }

    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

// Save employee records
function saveEmployees(employees) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(employees, null, 2),
        "utf8"
    );
}

// View and search employees
app.get("/api/employees", (req, res) => {
    try {
        const employees = readEmployees();
        const search = String(req.query.search || "").toLowerCase();

        const results = employees.filter(employee =>
            [
                employee.employee_id,
                employee.employee_name,
                employee.department,
                employee.designation,
                employee.email,
                employee.phone
            ].some(value =>
                String(value).toLowerCase().includes(search)
            )
        );

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not read employees." });
    }
});

// Add employee
app.post("/api/employees", (req, res) => {
    try {
        const {
            employee_id, employee_name, department,
            designation, email, phone, salary
        } = req.body;

        if (
            [employee_id, employee_name, department, designation, email, phone]
                .some(value => typeof value !== "string" || !value.trim()) ||
            salary === "" || salary === null || salary === undefined ||
            !Number.isFinite(Number(salary)) || Number(salary) < 0
        ) {
            return res.status(400).json({
                error: "Please enter valid values in all fields."
            });
        }

        if (!/^[A-Za-z0-9_-]{1,20}$/.test(employee_id.trim())) {
            return res.status(400).json({ error: "Invalid employee ID." });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({ error: "Invalid email address." });
        }

        const employees = readEmployees();

        if (employees.some(employee =>
            employee.employee_id.toLowerCase() === employee_id.trim().toLowerCase() ||
            employee.email.toLowerCase() === email.trim().toLowerCase()
        )) {
            return res.status(409).json({
                error: "Employee ID or email already exists."
            });
        }

        employees.push({
            employee_id: employee_id.trim(),
            employee_name: employee_name.trim(),
            department: department.trim(),
            designation: designation.trim(),
            email: email.trim(),
            phone: phone.trim(),
            salary: Number(salary)
        });

        saveEmployees(employees);

        res.status(201).json({ message: "Employee added successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not add employee." });
    }
});

// Update employee
app.put("/api/employees/:id", (req, res) => {
    try {
        const {
            employee_name, department, designation,
            email, phone, salary
        } = req.body;

        if (
            [employee_name, department, designation, email, phone]
                .some(value => typeof value !== "string" || !value.trim()) ||
            salary === "" || salary === null || salary === undefined ||
            !Number.isFinite(Number(salary)) || Number(salary) < 0
        ) {
            return res.status(400).json({ error: "Please complete all fields." });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({ error: "Invalid email address." });
        }

        const employees = readEmployees();
        const index = employees.findIndex(
            employee => employee.employee_id === req.params.id
        );

        if (index === -1) {
            return res.status(404).json({ error: "Employee not found." });
        }

        if (employees.some(employee =>
            employee.employee_id !== req.params.id &&
            employee.email.toLowerCase() === email.trim().toLowerCase()
        )) {
            return res.status(409).json({ error: "Email already exists." });
        }

        employees[index] = {
            ...employees[index],
            employee_name: employee_name.trim(),
            department: department.trim(),
            designation: designation.trim(),
            email: email.trim(),
            phone: phone.trim(),
            salary: Number(salary)
        };

        saveEmployees(employees);

        res.json({ message: "Employee updated successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not update employee." });
    }
});

// Delete employee
app.delete("/api/employees/:id", (req, res) => {
    try {
        const employees = readEmployees();
        const updated = employees.filter(
            employee => employee.employee_id !== req.params.id
        );

        if (updated.length === employees.length) {
            return res.status(404).json({ error: "Employee not found." });
        }

        saveEmployees(updated);

        res.json({ message: "Employee deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not delete employee." });
    }
});

// Start application
app.listen(PORT, () => {
    console.log(`Employee Management System running at http://localhost:${PORT}`);
});
