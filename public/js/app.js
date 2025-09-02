// SEAS Financial Tracker Frontend Application
class FinancialTracker {
    constructor() {
        this.authToken = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('user_data') || 'null');
        this.employees = [];
        this.validationOptions = {
            departments: [],
            lcats: [],
            education_levels: []
        };
        this.apiBase = '/api';
        
        this.init();
    }

    init() {
        // Check authentication status
        if (this.authToken && this.user) {
            this.showMainContent();
            this.loadEmployees();
            this.loadValidationOptions();
        } else {
            this.showWelcomeScreen();
        }

        // Set today's date as default for start date
        const today = new Date().toISOString().split('T')[0];
        const startDateInput = document.getElementById('employeeStartDate');
        if (startDateInput) {
            startDateInput.value = today;
        }
    }

    // Authentication methods
    async login() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        
        try {
            this.showLoading(true);
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.authToken = data.token;
                this.user = data.user;
                localStorage.setItem('auth_token', this.authToken);
                localStorage.setItem('user_data', JSON.stringify(this.user));
                
                bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
                this.showMainContent();
                this.loadEmployees();
                this.loadValidationOptions();
                this.showAlert('success', 'Login successful!');
            } else {
                errorDiv.textContent = data.message || 'Login failed';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.textContent = 'Login failed: ' + error.message;
            errorDiv.style.display = 'block';
        } finally {
            this.showLoading(false);
        }
    }

    logout() {
        this.authToken = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        this.showWelcomeScreen();
        this.showAlert('info', 'Logged out successfully');
    }

    showLogin() {
        new bootstrap.Modal(document.getElementById('loginModal')).show();
    }

    // UI methods
    showWelcomeScreen() {
        document.getElementById('welcomeScreen').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('loginBtn').style.display = 'inline-block';
        document.getElementById('logoutBtn').style.display = 'none';
    }

    showMainContent() {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('userInfo').style.display = 'inline-block';
        document.getElementById('username').textContent = this.user.username;
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'inline-block';
    }

    showLoading(show) {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(el => {
            el.style.display = show ? 'inline-block' : 'none';
        });
    }

    showAlert(type, message) {
        const alertContainer = document.getElementById('alertContainer');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show alert-custom`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        alertContainer.appendChild(alert);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    // API methods
    async apiCall(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            },
            ...options
        };

        const response = await fetch(`${this.apiBase}${endpoint}`, config);
        
        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }
        
        return response.json();
    }

    // Employee management methods
    async loadEmployees() {
        try {
            this.employees = await this.apiCall('/employees');
            this.renderEmployeeTable();
            this.updateSummaryCards();
            this.updateAnalyticsCharts();
        } catch (error) {
            console.error('Failed to load employees:', error);
            this.showAlert('warning', 'Failed to load employees. Using demo data.');
            this.loadDemoData();
        }
    }

    async loadValidationOptions() {
        try {
            this.validationOptions = await this.apiCall('/validation-options');
            this.populateDropdowns();
        } catch (error) {
            console.error('Failed to load validation options:', error);
            this.loadDefaultValidationOptions();
        }
    }

    loadDemoData() {
        this.employees = [
            {
                _id: '1',
                employee_name: 'John Smith',
                department: 'Engineering',
                lcat: 'Solution Architect/Engineering Lead (SA/Eng Lead)',
                education_level: "Master's Degree",
                years_experience: 8,
                priced_salary: 140000,
                current_salary: 145000,
                hours_per_month: 160,
                hourly_rate: 56.64,
                start_date: '2023-01-15',
                notes: 'Team lead for core platform'
            },
            {
                _id: '2',
                employee_name: 'Sarah Johnson',
                department: 'Data Science',
                lcat: 'AI Engineering Lead (AI Lead)',
                education_level: 'PhD',
                years_experience: 6,
                priced_salary: 130000,
                current_salary: 135000,
                hours_per_month: 160,
                hourly_rate: 52.73,
                start_date: '2023-03-01',
                notes: 'ML model development specialist'
            },
            {
                _id: '3',
                employee_name: 'Mike Wilson',
                department: 'Engineering',
                lcat: 'Senior Software Engineer (Sr. SWE)',
                education_level: "Bachelor's Degree",
                years_experience: 5,
                priced_salary: 110000,
                current_salary: 115000,
                hours_per_month: 160,
                hourly_rate: 44.92,
                start_date: '2023-06-01',
                notes: 'Full-stack development'
            }
        ];
        
        this.validationOptions = {
            departments: ['Engineering', 'Data Science', 'Product Management', 'Operations'],
            lcats: [
                'Program Manager (PM)',
                'Solution Architect/Engineering Lead (SA/Eng Lead)',
                'AI Engineering Lead (AI Lead)',
                'Senior Software Engineer (Sr. SWE)',
                'Software Engineer (SWE)',
                'Junior Software Engineer (Jr. SWE)'
            ],
            education_levels: ['High School', "Bachelor's Degree", "Master's Degree", 'PhD']
        };
        
        this.renderEmployeeTable();
        this.updateSummaryCards();
        this.populateDropdowns();
        this.updateAnalyticsCharts();
    }

    loadDefaultValidationOptions() {
        this.validationOptions = {
            departments: ['Engineering', 'Data Science', 'Product Management', 'Operations'],
            lcats: [
                'Program Manager (PM)',
                'Solution Architect/Engineering Lead (SA/Eng Lead)',
                'AI Engineering Lead (AI Lead)',
                'Senior Software Engineer (Sr. SWE)',
                'Software Engineer (SWE)',
                'Junior Software Engineer (Jr. SWE)'
            ],
            education_levels: ['High School', "Bachelor's Degree", "Master's Degree", 'PhD']
        };
        this.populateDropdowns();
    }

    populateDropdowns() {
        // Populate filter dropdowns
        const deptFilter = document.getElementById('departmentFilter');
        const lcatFilter = document.getElementById('lcatFilter');
        
        // Clear existing options (except "All" option)
        deptFilter.innerHTML = '<option value="all">All Departments</option>';
        lcatFilter.innerHTML = '<option value="all">All LCATs</option>';
        
        this.validationOptions.departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            deptFilter.appendChild(option);
        });
        
        this.validationOptions.lcats.forEach(lcat => {
            const option = document.createElement('option');
            option.value = lcat;
            option.textContent = lcat;
            lcatFilter.appendChild(option);
        });

        // Populate employee form dropdowns
        const employeeDept = document.getElementById('employeeDepartment');
        const employeeLCAT = document.getElementById('employeeLCAT');
        const employeeEducation = document.getElementById('employeeEducation');

        if (employeeDept) {
            this.validationOptions.departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                employeeDept.appendChild(option);
            });
        }

        if (employeeLCAT) {
            this.validationOptions.lcats.forEach(lcat => {
                const option = document.createElement('option');
                option.value = lcat;
                option.textContent = lcat;
                employeeLCAT.appendChild(option);
            });
        }

        if (employeeEducation) {
            this.validationOptions.education_levels.forEach(level => {
                const option = document.createElement('option');
                option.value = level;
                option.textContent = level;
                employeeEducation.appendChild(option);
            });
        }
    }

    renderEmployeeTable() {
        const tbody = document.getElementById('employeeTable');
        
        if (this.employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">No employees found. Add some employees to get started.</td></tr>';
            return;
        }

        tbody.innerHTML = this.employees.map(emp => {
            const variance = (emp.current_salary || 0) - (emp.priced_salary || 0);
            const varianceClass = variance >= 0 ? 'text-danger' : 'text-success';
            const hourlyRate = emp.hourly_rate || (emp.current_salary / 12 / emp.hours_per_month);
            
            return `
                <tr>
                    <td><strong>${emp.employee_name}</strong></td>
                    <td><span class="badge bg-secondary">${emp.department}</span></td>
                    <td><small>${emp.lcat}</small></td>
                    <td>${emp.years_experience} years</td>
                    <td>$${(emp.priced_salary || 0).toLocaleString()}</td>
                    <td>$${(emp.current_salary || 0).toLocaleString()}</td>
                    <td>${emp.hours_per_month || 160}</td>
                    <td>$${hourlyRate.toFixed(2)}</td>
                    <td class="${varianceClass}">$${variance.toLocaleString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="app.editEmployee('${emp._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deleteEmployee('${emp._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateSummaryCards() {
        const teamSize = this.employees.length;
        const totalSalary = this.employees.reduce((sum, emp) => sum + (emp.current_salary || 0), 0);
        const totalHours = this.employees.reduce((sum, emp) => sum + (emp.hours_per_month || 0), 0);
        const totalPriced = this.employees.reduce((sum, emp) => sum + (emp.priced_salary || 0), 0);
        const costVariance = totalSalary - totalPriced;

        document.getElementById('teamSize').textContent = teamSize;
        document.getElementById('totalSalary').textContent = '$' + totalSalary.toLocaleString();
        document.getElementById('totalHours').textContent = totalHours.toLocaleString();
        document.getElementById('costVariance').textContent = '$' + costVariance.toLocaleString();
        document.getElementById('costVariance').className = costVariance >= 0 ? 'text-danger' : 'text-success';
    }

    showAddEmployee() {
        this.clearEmployeeForm();
        document.getElementById('employeeModalTitle').textContent = 'Add New Employee';
        new bootstrap.Modal(document.getElementById('employeeModal')).show();
    }

    editEmployee(employeeId) {
        const employee = this.employees.find(emp => emp._id === employeeId);
        if (!employee) return;

        this.populateEmployeeForm(employee);
        document.getElementById('employeeModalTitle').textContent = 'Edit Employee';
        new bootstrap.Modal(document.getElementById('employeeModal')).show();
    }

    clearEmployeeForm() {
        document.getElementById('employeeForm').reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('employeeStartDate').value = today;
        document.getElementById('employeeHours').value = 160;
    }

    populateEmployeeForm(employee) {
        document.getElementById('employeeName').value = employee.employee_name || '';
        document.getElementById('employeeDepartment').value = employee.department || '';
        document.getElementById('employeeLCAT').value = employee.lcat || '';
        document.getElementById('employeeEducation').value = employee.education_level || '';
        document.getElementById('employeeExperience').value = employee.years_experience || 0;
        document.getElementById('employeePricedSalary').value = employee.priced_salary || 0;
        document.getElementById('employeeCurrentSalary').value = employee.current_salary || 0;
        document.getElementById('employeeHours').value = employee.hours_per_month || 160;
        document.getElementById('employeeStartDate').value = employee.start_date ? employee.start_date.split('T')[0] : '';
        document.getElementById('employeeEndDate').value = employee.end_date ? employee.end_date.split('T')[0] : '';
        document.getElementById('employeeNotes').value = employee.notes || '';
    }

    async saveEmployee() {
        const form = document.getElementById('employeeForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const employeeData = {
            employee_name: document.getElementById('employeeName').value,
            department: document.getElementById('employeeDepartment').value,
            lcat: document.getElementById('employeeLCAT').value,
            education_level: document.getElementById('employeeEducation').value,
            years_experience: parseInt(document.getElementById('employeeExperience').value),
            priced_salary: parseFloat(document.getElementById('employeePricedSalary').value),
            current_salary: parseFloat(document.getElementById('employeeCurrentSalary').value),
            hours_per_month: parseFloat(document.getElementById('employeeHours').value),
            start_date: document.getElementById('employeeStartDate').value,
            end_date: document.getElementById('employeeEndDate').value || null,
            notes: document.getElementById('employeeNotes').value
        };

        try {
            this.showLoading(true);
            
            // For demo purposes, add to local array
            if (document.getElementById('employeeModalTitle').textContent === 'Add New Employee') {
                employeeData._id = Date.now().toString();
                employeeData.hourly_rate = employeeData.current_salary / 12 / employeeData.hours_per_month;
                this.employees.push(employeeData);
                this.showAlert('success', 'Employee added successfully!');
            } else {
                // Update existing employee
                const index = this.employees.findIndex(emp => emp.employee_name === employeeData.employee_name);
                if (index !== -1) {
                    employeeData._id = this.employees[index]._id;
                    employeeData.hourly_rate = employeeData.current_salary / 12 / employeeData.hours_per_month;
                    this.employees[index] = employeeData;
                    this.showAlert('success', 'Employee updated successfully!');
                }
            }
            
            bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();
            this.renderEmployeeTable();
            this.updateSummaryCards();
            this.updateAnalyticsCharts();
        } catch (error) {
            this.showAlert('danger', 'Failed to save employee: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async deleteEmployee(employeeId) {
        if (!confirm('Are you sure you want to delete this employee?')) {
            return;
        }

        try {
            // For demo purposes, remove from local array
            this.employees = this.employees.filter(emp => emp._id !== employeeId);
            this.showAlert('success', 'Employee deleted successfully!');
            this.renderEmployeeTable();
            this.updateSummaryCards();
            this.updateAnalyticsCharts();
        } catch (error) {
            this.showAlert('danger', 'Failed to delete employee: ' + error.message);
        }
    }

    applyFilters() {
        // This would filter the employee table based on selected filters
        // For demo purposes, just refresh the table
        this.renderEmployeeTable();
        this.showAlert('info', 'Filters applied');
    }

    importCSV() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.showAlert('info', 'CSV import functionality will parse and validate employee data from your file.');
            }
        };
        input.click();
    }

    exportCSV() {
        const csvContent = [
            'Employee_Name,Department,LCAT,Education_Level,Years_Experience,Priced_Salary,Current_Salary,Hours_Per_Month,Start_Date,End_Date,Notes',
            ...this.employees.map(emp => [
                emp.employee_name,
                emp.department,
                emp.lcat,
                emp.education_level,
                emp.years_experience,
                emp.priced_salary,
                emp.current_salary,
                emp.hours_per_month,
                emp.start_date,
                emp.end_date || '',
                emp.notes || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showAlert('success', 'Employee data exported to CSV!');
    }

    // Financial projections
    async generateProjections() {
        const months = parseInt(document.getElementById('projectionMonths').value);
        const salaryIncrease = parseFloat(document.getElementById('salaryIncrease').value);
        const attritionRate = parseFloat(document.getElementById('attritionRate').value);
        const newHires = parseInt(document.getElementById('newHires').value);

        // Generate demo projection data
        const projections = [];
        const currentDate = new Date();
        
        for (let i = 0; i < months; i++) {
            const projectionDate = new Date(currentDate);
            projectionDate.setMonth(projectionDate.getMonth() + i);
            
            let totalHours = this.employees.reduce((sum, emp) => sum + (emp.hours_per_month || 160), 0);
            let totalRevenue = this.employees.reduce((sum, emp) => {
                const adjustedSalary = (emp.current_salary || 0) * Math.pow(1 + salaryIncrease / 100, i / 12);
                return sum + (adjustedSalary / 12);
            }, 0);
            
            // Apply attrition
            if (i > 0) {
                const monthlyAttritionRate = attritionRate / 12 / 100;
                totalHours *= (1 - monthlyAttritionRate);
                totalRevenue *= (1 - monthlyAttritionRate);
            }
            
            // Add new hires
            if (i > 0 && newHires > 0) {
                const monthlyNewHires = newHires / 12;
                totalHours += monthlyNewHires * 160;
                totalRevenue += monthlyNewHires * 8000; // Average monthly cost
            }
            
            projections.push({
                month: projectionDate.toISOString().slice(0, 7),
                total_hours: Math.round(totalHours),
                total_revenue: Math.round(totalRevenue),
                active_employees: Math.round(this.employees.length * (1 - attritionRate / 100 * i / 12) + newHires * i / 12)
            });
        }

        this.renderProjectionChart(projections);
        this.showAlert('success', 'Financial projections generated successfully!');
    }

    renderProjectionChart(projections) {
        const ctx = document.getElementById('projectionCanvas').getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.projectionChart) {
            window.projectionChart.destroy();
        }
        
        window.projectionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: projections.map(p => p.month),
                datasets: [
                    {
                        label: 'Projected Revenue ($)',
                        data: projections.map(p => p.total_revenue),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Projected Hours',
                        data: projections.map(p => p.total_hours),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Revenue ($)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Hours'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Financial Projections: Revenue & Hours Forecast'
                    }
                }
            }
        });
    }

    updateAnalyticsCharts() {
        this.renderDepartmentChart();
        this.renderLCATChart();
    }

    renderDepartmentChart() {
        const ctx = document.getElementById('departmentChart');
        if (!ctx) return;
        
        const deptCounts = {};
        this.employees.forEach(emp => {
            deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
        });

        if (window.departmentChart) {
            window.departmentChart.destroy();
        }

        window.departmentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(deptCounts),
                datasets: [{
                    data: Object.values(deptCounts),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Team Distribution by Department'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderLCATChart() {
        const ctx = document.getElementById('lcatChart');
        if (!ctx) return;
        
        const lcatCounts = {};
        this.employees.forEach(emp => {
            const shortLCAT = emp.lcat.split('(')[1]?.replace(')', '') || emp.lcat;
            lcatCounts[shortLCAT] = (lcatCounts[shortLCAT] || 0) + 1;
        });

        if (window.lcatChart) {
            window.lcatChart.destroy();
        }

        window.lcatChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(lcatCounts),
                datasets: [{
                    label: 'Number of Employees',
                    data: Object.values(lcatCounts),
                    backgroundColor: '#1976d2'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Team Distribution by LCAT'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Employees'
                        }
                    }
                }
            }
        });
    }
}

// Global functions for HTML event handlers
let app;

function login() {
    app.login();
}

function logout() {
    app.logout();
}

function showLogin() {
    app.showLogin();
}

function showAddEmployee() {
    app.showAddEmployee();
}

function saveEmployee() {
    app.saveEmployee();
}

function applyFilters() {
    app.applyFilters();
}

function importCSV() {
    app.importCSV();
}

function exportCSV() {
    app.exportCSV();
}

function generateProjections() {
    app.generateProjections();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    app = new FinancialTracker();
});