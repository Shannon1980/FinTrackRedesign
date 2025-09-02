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
        const welcomeScreen = document.getElementById('welcomeScreen');
        const mainContent = document.getElementById('mainContent');
        const authContainer = document.getElementById('authContainer');
        
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (mainContent) mainContent.style.display = 'none';
        if (authContainer) authContainer.style.display = 'block';
    }

    showWelcome() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const mainContent = document.getElementById('mainContent');
        const authContainer = document.getElementById('authContainer');
        
        if (welcomeScreen) welcomeScreen.style.display = 'block';
        if (mainContent) mainContent.style.display = 'none';
        if (authContainer) authContainer.style.display = 'none';
    }

    // UI methods
    showWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const mainContent = document.getElementById('mainContent');
        const userInfo = document.getElementById('userInfo');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const authContainer = document.getElementById('authContainer');
        
        if (welcomeScreen) welcomeScreen.style.display = 'block';
        if (mainContent) mainContent.style.display = 'none';
        if (authContainer) authContainer.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }

    showMainContent() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const mainContent = document.getElementById('mainContent');
        const userInfo = document.getElementById('userInfo');
        const usernameEl = document.getElementById('username');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const authContainer = document.getElementById('authContainer');
        
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        if (authContainer) authContainer.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'inline-block';
            userInfo.textContent = `Welcome, ${this.user.username}`;
        }
        if (usernameEl && this.user) usernameEl.textContent = this.user.username;
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
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
                bill_rate: 95,
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
                bill_rate: 85,
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
                bill_rate: 75,
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
            const hourlyRate = emp.hourly_rate || (emp.current_salary / 12 / 160);
            
            return `
                <tr>
                    <td><strong>${emp.employee_name}</strong></td>
                    <td><span class="badge bg-secondary">${emp.department}</span></td>
                    <td><small>${emp.lcat}</small></td>
                    <td>${emp.years_experience} years</td>
                    <td>$${(emp.priced_salary || 0).toLocaleString()}</td>
                    <td>$${(emp.current_salary || 0).toLocaleString()}</td>
                    <td>$${(emp.bill_rate || 0).toFixed(2)}</td>
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
        const totalHours = this.employees.reduce((sum, emp) => sum + 160, 0);
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
        document.getElementById('employeeBillRate').value = '';
    }

    populateEmployeeForm(employee) {
        document.getElementById('employeeName').value = employee.employee_name || '';
        document.getElementById('employeeDepartment').value = employee.department || '';
        document.getElementById('employeeLCAT').value = employee.lcat || '';
        document.getElementById('employeeEducation').value = employee.education_level || '';
        document.getElementById('employeeExperience').value = employee.years_experience || 0;
        document.getElementById('employeePricedSalary').value = employee.priced_salary || 0;
        document.getElementById('employeeCurrentSalary').value = employee.current_salary || 0;
        document.getElementById('employeeBillRate').value = employee.bill_rate || 0;
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
            role: document.getElementById('employeeRole').value,
            status: document.getElementById('employeeStatus').value,
            lcat: document.getElementById('employeeLCAT').value,
            education_level: document.getElementById('employeeEducation').value,
            years_experience: parseInt(document.getElementById('employeeExperience').value),
            priced_salary: parseFloat(document.getElementById('employeePricedSalary').value),
            current_salary: parseFloat(document.getElementById('employeeCurrentSalary').value),
            bill_rate: parseFloat(document.getElementById('employeeBillRate').value),
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
                this.processCSVFile(file);
            }
        };
        input.click();
    }

    processCSVFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                
                // Validate headers
                const requiredHeaders = ['Employee_Name', 'Department', 'LCAT', 'Education_Level', 'Years_Experience', 'Priced_Salary', 'Current_Salary', 'Bill_Rate'];
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
                
                if (missingHeaders.length > 0) {
                    this.showAlert('danger', `Missing required columns: ${missingHeaders.join(', ')}`);
                    return;
                }
                
                const newEmployees = [];
                let importedCount = 0;
                let skippedCount = 0;
                
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const values = line.split(',').map(v => v.trim());
                    if (values.length < requiredHeaders.length || !values[0]) {
                        skippedCount++;
                        continue;
                    }
                    
                    const employee = {};
                    headers.forEach((header, index) => {
                        if (index < values.length) {
                            const value = values[index];
                            
                            // Map CSV headers to employee object
                            switch (header) {
                                case 'Employee_Name':
                                    employee.employee_name = value;
                                    break;
                                case 'Department':
                                    employee.department = value;
                                    break;
                                case 'LCAT':
                                    employee.lcat = value;
                                    break;
                                case 'Education_Level':
                                    employee.education_level = value;
                                    break;
                                case 'Years_Experience':
                                    employee.years_experience = parseInt(value) || 0;
                                    break;
                                case 'Priced_Salary':
                                    employee.priced_salary = parseFloat(value) || 0;
                                    break;
                                case 'Current_Salary':
                                    employee.current_salary = parseFloat(value) || 0;
                                    break;
                                case 'Bill_Rate':
                                    employee.bill_rate = parseFloat(value) || 0;
                                    break;
                                case 'Start_Date':
                                    employee.start_date = value;
                                    break;
                                case 'End_Date':
                                    employee.end_date = value || null;
                                    break;
                                case 'Notes':
                                    employee.notes = value;
                                    break;
                                default:
                                    // Handle monthly billing data
                                    if (header.includes('_Hours') && value) {
                                        if (!employee.monthly_data) employee.monthly_data = [];
                                        const monthYear = header.replace('_Hours', '').replace('_', '-');
                                        const monthData = employee.monthly_data.find(m => m.month === monthYear) || { month: monthYear };
                                        monthData.actual_hours = parseFloat(value);
                                        if (!employee.monthly_data.find(m => m.month === monthYear)) {
                                            employee.monthly_data.push(monthData);
                                        }
                                    } else if (header.includes('_Revenue') && value) {
                                        if (!employee.monthly_data) employee.monthly_data = [];
                                        const monthYear = header.replace('_Revenue', '').replace('_', '-');
                                        const monthData = employee.monthly_data.find(m => m.month === monthYear) || { month: monthYear };
                                        monthData.actual_revenue = parseFloat(value);
                                        if (!employee.monthly_data.find(m => m.month === monthYear)) {
                                            employee.monthly_data.push(monthData);
                                        }
                                    }
                                    break;
                            }
                        }
                    });
                    
                    // Calculate hourly rate if not provided
                    if (!employee.hourly_rate && employee.current_salary && employee.hours_per_month) {
                        employee.hourly_rate = employee.current_salary / 12 / employee.hours_per_month;
                    }
                    
                    // Add unique ID
                    employee._id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                    
                    newEmployees.push(employee);
                    importedCount++;
                }
                
                // Add imported employees to the current list
                this.employees = [...this.employees, ...newEmployees];
                this.renderEmployeeTable();
                this.updateSummaryCards();
                this.updateAnalyticsCharts();
                
                this.showAlert('success', `CSV import completed! Imported: ${importedCount}, Skipped: ${skippedCount} employees.`);
                
            } catch (error) {
                console.error('CSV parsing error:', error);
                this.showAlert('danger', 'Failed to parse CSV file. Please check the format and try again.');
            }
        };
        
        reader.readAsText(file);
    }

    exportCSV() {
        const csvContent = [
            'Employee_Name,Department,LCAT,Education_Level,Years_Experience,Priced_Salary,Current_Salary,Bill_Rate,Start_Date,End_Date,Notes',
            ...this.employees.map(emp => [
                emp.employee_name,
                emp.department,
                emp.lcat,
                emp.education_level,
                emp.years_experience,
                emp.priced_salary,
                emp.current_salary,
                emp.bill_rate || 0,
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

    downloadTemplate() {
        // Generate comprehensive template with billing period columns
        const currentYear = new Date().getFullYear();
        const periods = ['JAN_FEB', 'FEB_MAR', 'MAR_APR', 'APR_MAY', 'MAY_JUN', 'JUN_JUL', 'JUL_AUG', 'AUG_SEP', 'SEP_OCT', 'OCT_NOV', 'NOV_DEC', 'DEC_JAN'];
        
        // Create header with monthly billing columns
        const baseHeaders = [
            'Employee_Name', 'Department', 'Role', 'Status', 'LCAT', 'Education_Level', 'Years_Experience',
            'Priced_Salary', 'Current_Salary', 'Bill_Rate', 
            'Start_Date', 'End_Date', 'Notes'
        ];
        
        const periodHeaders = [];
        periods.forEach(period => {
            periodHeaders.push(`${period}_${currentYear}_Hours`);
            periodHeaders.push(`${period}_${currentYear}_Revenue`);
        });
        
        const headers = [...baseHeaders, ...periodHeaders];
        
        // Create sample rows
        const sampleRows = [
            [
                'John Smith', 'Engineering', 'Solution Architect/Engineering Lead (SA/Eng Lead)', 
                "Master's Degree", '8', '140000', '145000', '160', '95', '2023-01-15', '',
                'Team lead for core platform', 
                '165', '15675', '158', '15010', '172', '16340', '160', '15200',
                '168', '15960', '155', '14725', '162', '15390', '170', '16150',
                '160', '15200', '165', '15675', '158', '15010', '160', '15200'
            ],
            [
                'Sarah Johnson', 'Data Science', 'AI Engineering Lead (AI Lead)', 
                'PhD', '6', '130000', '135000', '160', '85', '2023-03-01', '',
                'ML model development specialist',
                '162', '13770', '155', '13175', '168', '14280', '160', '13600',
                '164', '13940', '158', '13430', '165', '14025', '172', '14620',
                '160', '13600', '162', '13770', '155', '13175', '160', '13600'
            ],
            // Empty template row
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
        ];
        
        const csvContent = [
            headers.join(','),
            ...sampleRows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employee_template_with_monthly_billing_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showAlert('success', 'Employee template with monthly billing downloaded!');
    }

    downloadIndirectCostTemplate() {
        const currentYear = new Date().getFullYear();
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
        
        const csvContent = [
            'Month,Fringe_Amount,Overhead_Amount,GA_Amount,Profit_Amount,Notes',
            `${currentYear}-${currentMonth},7500.00,12000.00,2500.00,1500.00,Monthly indirect costs for ${currentYear}-${currentMonth}`,
            `${currentYear}-${(parseInt(currentMonth) + 1).toString().padStart(2, '0')},7800.00,12200.00,2600.00,1600.00,Monthly indirect costs for next month`,
            ',,,,,',
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monthly_indirect_costs_template_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showAlert('success', 'Monthly indirect costs template downloaded!');
    }

    downloadOdcTemplate() {
        const currentYear = new Date().getFullYear();
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
        
        const csvContent = [
            'Month,Category,Description,Amount,Notes',
            `${currentYear}-${currentMonth},Travel,Client site visit,2500,Flight and hotel costs`,
            `${currentYear}-${currentMonth},Software,Development tools license,1200,Annual subscription`,
            `${currentYear}-${currentMonth},Equipment,Laptop for new hire,3200,MacBook Pro`,
            `${currentYear}-${currentMonth},Subcontractor,External consultant,5000,Security audit specialist`,
            ',,,,'
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `odc_template_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showAlert('success', 'ODC template downloaded!');
    }

    // Authentication functions

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
            
            let totalHours = this.employees.reduce((sum, emp) => sum + 160, 0);
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

        if (window.departmentChart && typeof window.departmentChart.destroy === 'function') {
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

function showWelcome() {
    app.showWelcome();
}

function login(event) {
    event.preventDefault();
    app.login();
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

// Monthly Billing Management Functions
let currentBillingPeriod = null;

async function loadBillingPeriod() {
    const year = document.getElementById('billingYear').value;
    const period = document.getElementById('billingPeriod').value;
    
    try {
        // Get billing period information
        const response = await fetch(`/api/billing-period/${year}/${month}`, {
            headers: {
                'Authorization': `Bearer ${app.authToken}`
            }
        });
        
        if (response.ok) {
            const periodInfo = await response.json();
            currentBillingPeriod = periodInfo;
            
            // Display period information
            document.getElementById('periodDates').textContent = 
                `${periodInfo.startDate} to ${periodInfo.endDate}`;
            document.getElementById('workingDays').textContent = periodInfo.workingDays;
            document.getElementById('maxHours').textContent = periodInfo.maxHours;
            document.getElementById('holidays').textContent = 
                periodInfo.holidays.join(', ') || 'None';
                
            document.getElementById('billingPeriodInfo').style.display = 'block';
            
            // Load billing summary
            await loadBillingSummary(year, month);
        } else {
            app.showAlert('warning', 'Failed to load billing period information');
        }
    } catch (error) {
        console.error('Error loading billing period:', error);
        app.showAlert('danger', 'Error loading billing period: ' + error.message);
    }
}

async function loadBillingSummary(year, month) {
    try {
        const response = await fetch(`/api/monthly-billing-summary/${year}/${month}`, {
            headers: {
                'Authorization': `Bearer ${app.authToken}`
            }
        });
        
        if (response.ok) {
            const summary = await response.json();
            
            // Update summary cards
            document.getElementById('projectedRevenue').textContent = 
                '$' + summary.totalProjectedRevenue.toLocaleString();
            document.getElementById('actualRevenue').textContent = 
                '$' + summary.totalActualRevenue.toLocaleString();
            document.getElementById('revenueVariance').textContent = 
                '$' + summary.variance.toLocaleString();
            document.getElementById('variancePercent').textContent = 
                summary.variancePercent.toFixed(1) + '%';
                
            // Update variance card color based on value
            const varianceCard = document.getElementById('revenueVariance').closest('.card');
            if (summary.variance >= 0) {
                varianceCard.className = 'card bg-success text-white';
            } else {
                varianceCard.className = 'card bg-danger text-white';
            }
            
            document.getElementById('billingSummaryCards').style.display = 'flex';
            
            // Render employee billing table
            renderBillingTable(summary.employeeDetails, year, month);
        } else {
            app.showAlert('warning', 'Failed to load billing summary');
        }
    } catch (error) {
        console.error('Error loading billing summary:', error);
        app.showAlert('danger', 'Error loading billing summary: ' + error.message);
    }
}

function renderBillingTable(employeeDetails, year, month) {
    const tbody = document.getElementById('billingTable');
    
    tbody.innerHTML = employeeDetails.map(emp => {
        const variance = emp.actual_revenue - emp.projected_revenue;
        const varianceClass = variance >= 0 ? 'text-success' : 'text-danger';
        const maxHours = currentBillingPeriod ? currentBillingPeriod.maxHours : 176;
        
        return `
            <tr>
                <td><strong>${emp.employee_name}</strong></td>
                <td>$${emp.bill_rate.toFixed(2)}</td>
                <td>${emp.projected_hours}</td>
                <td>
                    <input type="number" class="form-control form-control-sm" 
                           value="${emp.actual_hours}" 
                           max="${maxHours}" 
                           min="0" 
                           id="hours-${emp.employee_id || emp.employee_name.replace(/\s+/g, '')}"
                           style="width: 80px; display: inline-block;">
                </td>
                <td>$${emp.projected_revenue.toLocaleString()}</td>
                <td>$${emp.actual_revenue.toLocaleString()}</td>
                <td class="${varianceClass}">$${variance.toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" 
                            onclick="updateMonthlyBilling('${emp.employee_id || emp.employee_name.replace(/\s+/g, '')}', '${year}-${month.toString().padStart(2, '0')}')"
                            title="Update billing for this employee">
                        <i class="fas fa-save"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('billingTableContainer').style.display = 'block';
}

async function updateMonthlyBilling(employeeId, month) {
    const hoursInput = document.getElementById(`hours-${employeeId}`);
    const actualHours = parseFloat(hoursInput.value);
    
    if (currentBillingPeriod && actualHours > currentBillingPeriod.maxHours) {
        app.showAlert('warning', `Hours cannot exceed ${currentBillingPeriod.maxHours} (working days in this period)`);
        return;
    }
    
    try {
        const response = await fetch(`/api/employees/${employeeId}/monthly-billing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${app.authToken}`
            },
            body: JSON.stringify({
                month: month,
                actual_hours: actualHours,
                notes: ''
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            app.showAlert('success', 'Monthly billing updated successfully!');
            
            // Refresh the billing summary
            const [year, monthNum] = month.split('-');
            await loadBillingSummary(year, parseInt(monthNum));
        } else {
            const error = await response.json();
            app.showAlert('danger', 'Failed to update billing: ' + error.message);
        }
    } catch (error) {
        console.error('Error updating monthly billing:', error);
        app.showAlert('danger', 'Error updating billing: ' + error.message);
    }
}

// Import functions for contract costs
async function importDataHelper(endpoint, fileInputId, successMessage) {
        const fileInput = document.getElementById(fileInputId);
        const file = fileInput.files[0];
        
        if (!file) {
            app.showAlert('warning', 'Please select a file to import');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.csv')) {
            app.showAlert('danger', 'Please select a CSV file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            app.showAlert('info', 'Importing data, please wait...');
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${app.authToken}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                app.showAlert('success', result.message);
                fileInput.value = ''; // Clear file input
                
                // Show import details if there were errors
                if (result.results && result.results.failed > 0) {
                    console.log('Import errors:', result.results.errors);
                    app.showAlert('warning', `${result.results.failed} records failed to import. Check console for details.`);
                }
            } else {
                app.showAlert('danger', 'Import failed: ' + result.message);
            }
        } catch (error) {
            console.error('Import error:', error);
            app.showAlert('danger', 'Import failed: ' + error.message);
        }
    }

// Contract Costs and ODC Management Functions
let currentProjectCosts = null;

async function loadIndirectCosts() {
    const monthInput = document.getElementById('indirectCostMonth').value;
    if (!monthInput) {
        app.showAlert('warning', 'Please select a month first');
        return;
    }
    
    const [year, month] = monthInput.split('-');
    
    try {
        const response = await fetch(`/api/indirect-costs/${year}/${month}`, {
            headers: { 'Authorization': `Bearer ${app.authToken}` }
        });
        
        if (response.ok) {
            const amounts = await response.json();
            document.getElementById('fringeAmount').value = amounts.fringe_amount;
            document.getElementById('overheadAmount').value = amounts.overhead_amount;
            document.getElementById('gaAmount').value = amounts.ga_amount;
            document.getElementById('profitAmount').value = amounts.profit_amount || 0;
            document.getElementById('indirectCostNotes').value = amounts.notes || '';
            
            calculateTotalIndirect();
            app.showAlert('success', 'Monthly indirect costs loaded successfully');
        } else {
            app.showAlert('warning', 'No indirect costs found for this month');
        }
    } catch (error) {
        console.error('Error loading indirect costs:', error);
        app.showAlert('danger', 'Error loading indirect costs: ' + error.message);
    }
}

async function saveIndirectCosts() {
    const monthInput = document.getElementById('indirectCostMonth').value;
    if (!monthInput) {
        app.showAlert('warning', 'Please select a month first');
        return;
    }
    
    const data = {
        month: monthInput,
        fringe_amount: parseFloat(document.getElementById('fringeAmount').value) || 0,
        overhead_amount: parseFloat(document.getElementById('overheadAmount').value) || 0,
        ga_amount: parseFloat(document.getElementById('gaAmount').value) || 0,
        profit_amount: parseFloat(document.getElementById('profitAmount').value) || 0,
        notes: document.getElementById('indirectCostNotes').value
    };
    
    try {
        const response = await fetch('/api/indirect-costs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${app.authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            app.showAlert('success', 'Monthly indirect costs saved successfully');
            calculateTotalIndirect();
        } else {
            const error = await response.json();
            app.showAlert('danger', 'Failed to save amounts: ' + error.message);
        }
    } catch (error) {
        console.error('Error saving indirect costs:', error);
        app.showAlert('danger', 'Error saving amounts: ' + error.message);
    }
}

async function loadProjectCosts() {
    const year = document.getElementById('costSummaryYear').value;
    const month = document.getElementById('costSummaryMonth').value;
    
    try {
        const response = await fetch(`/api/project-costs/${year}/${month}`, {
            headers: { 'Authorization': `Bearer ${app.authToken}` }
        });
        
        if (response.ok) {
            const costs = await response.json();
            currentProjectCosts = costs;
            
            // Update cost summary display
            document.getElementById('directLaborCost').textContent = '$' + costs.direct_labor_cost.toLocaleString();
            document.getElementById('totalOdcCost').textContent = '$' + costs.total_odc_cost.toLocaleString();
            document.getElementById('fringeCost').textContent = '$' + costs.fringe_cost.toLocaleString();
            document.getElementById('overheadCost').textContent = '$' + costs.overhead_cost.toLocaleString();
            document.getElementById('gaCost').textContent = '$' + costs.ga_cost.toLocaleString();
            document.getElementById('profitCost').textContent = '$' + costs.profit_cost.toLocaleString();
            document.getElementById('totalProjectCost').textContent = '$' + costs.total_cost.toLocaleString();
            
            document.getElementById('costSummaryDisplay').style.display = 'block';
            
            // Update ODC table
            renderOdcTable(costs.odc_items);
            
            app.showAlert('success', 'Project costs loaded successfully');
        } else {
            app.showAlert('warning', 'No project costs found for this period');
        }
    } catch (error) {
        console.error('Error loading project costs:', error);
        app.showAlert('danger', 'Error loading project costs: ' + error.message);
    }
}

function renderOdcTable(odcItems) {
    const tbody = document.getElementById('odcTable');
    
    if (!odcItems || odcItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No ODC items found. Add some to get started.</td></tr>';
        return;
    }
    
    tbody.innerHTML = odcItems.map((item, index) => {
        return `
            <tr>
                <td>${item.month}</td>
                <td><span class="badge bg-primary">${item.category}</span></td>
                <td>${item.description}</td>
                <td>$${item.amount.toLocaleString()}</td>
                <td>${item.notes || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeOdcItem('${item.month}', ${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function showAddOdcModal() {
    // Set current month as default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    document.getElementById('odcMonth').value = currentMonth;
    
    // Clear form
    document.getElementById('odcForm').reset();
    document.getElementById('odcMonth').value = currentMonth;
    
    new bootstrap.Modal(document.getElementById('odcModal')).show();
}

async function saveOdcItem() {
    const form = document.getElementById('odcForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const data = {
        month: document.getElementById('odcMonth').value,
        category: document.getElementById('odcCategory').value,
        description: document.getElementById('odcDescription').value,
        amount: parseFloat(document.getElementById('odcAmount').value),
        notes: document.getElementById('odcNotes').value
    };
    
    try {
        const response = await fetch('/api/odc-items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${app.authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('odcModal')).hide();
            app.showAlert('success', 'ODC item added successfully');
            
            // Refresh project costs if viewing the same month
            const [year, month] = data.month.split('-');
            const currentYear = document.getElementById('costSummaryYear').value;
            const currentMonth = document.getElementById('costSummaryMonth').value;
            
            if (year === currentYear && parseInt(month) === parseInt(currentMonth)) {
                await loadProjectCosts();
            }
        } else {
            const error = await response.json();
            app.showAlert('danger', 'Failed to add ODC item: ' + error.message);
        }
    } catch (error) {
        console.error('Error adding ODC item:', error);
        app.showAlert('danger', 'Error adding ODC item: ' + error.message);
    }
}

async function removeOdcItem(month, itemIndex) {
    if (!confirm('Are you sure you want to remove this ODC item?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/odc-items/${month}/${itemIndex}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${app.authToken}` }
        });
        
        if (response.ok) {
            app.showAlert('success', 'ODC item removed successfully');
            
            // Refresh project costs
            const [year, monthNum] = month.split('-');
            const currentYear = document.getElementById('costSummaryYear').value;
            const currentMonth = document.getElementById('costSummaryMonth').value;
            
            if (year === currentYear && parseInt(monthNum) === parseInt(currentMonth)) {
                await loadProjectCosts();
            }
        } else {
            const error = await response.json();
            app.showAlert('danger', 'Failed to remove ODC item: ' + error.message);
        }
    } catch (error) {
        console.error('Error removing ODC item:', error);
        app.showAlert('danger', 'Error removing ODC item: ' + error.message);
    }
}

// Calculate total indirect costs
function calculateTotalIndirect() {
    const fringe = parseFloat(document.getElementById('fringeAmount').value) || 0;
    const overhead = parseFloat(document.getElementById('overheadAmount').value) || 0;
    const ga = parseFloat(document.getElementById('gaAmount').value) || 0;
    const profit = parseFloat(document.getElementById('profitAmount').value) || 0;
    
    const total = fringe + overhead + ga + profit;
    document.getElementById('totalIndirectAmount').value = '$' + total.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Global import functions for contract costs
async function importIndirectCosts() {
    await importDataHelper('/api/import/indirect-costs', 'indirectCostFile', 'Indirect costs imported successfully');
    
    // Reload current month's amounts if a month is selected
    const monthInput = document.getElementById('indirectCostMonth').value;
    if (monthInput) {
        await loadIndirectCosts();
    }
}

async function importOdcItems() {
    await importDataHelper('/api/import/odc-items', 'odcFile', 'ODC items imported successfully');
    
    // Refresh current project costs view if loaded
    const costDisplay = document.getElementById('costSummaryDisplay');
    if (costDisplay.style.display !== 'none') {
        await loadProjectCosts();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    app = new FinancialTracker();
    
    // Set current year and month as default
    const now = new Date();
    document.getElementById('billingYear').value = now.getFullYear();
    document.getElementById('billingPeriod').value = 'JAN-FEB';
    
    // Set defaults for contract costs
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    document.getElementById('indirectCostMonth').value = currentMonth;
    document.getElementById('costSummaryYear').value = now.getFullYear();
    document.getElementById('costSummaryMonth').value = now.getMonth() + 1;
});