const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// MongoDB connection with fallback
const connectDB = async () => {
    try {
        let mongoUri = process.env.MONGODB_URI;
        
        // Use local MongoDB for development if MONGODB_URI is not properly configured
        if (!mongoUri || mongoUri === 'your-mongodb-connection-string-here') {
            mongoUri = 'mongodb://localhost:27017/seas-financial';
            console.log('Using local MongoDB for development');
        }
        
        const conn = await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection failed:', error.message);
        console.log('Starting without database connection for demo purposes');
        // Don't exit, continue running for demo
    }
};

// Connect to database
connectDB();

// Employee Schema with embedded monthly data
const monthlyDataSchema = new mongoose.Schema({
    month: { type: String, required: true }, // Format: "2024-01"
    hours: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    actual_hours: { type: Number, default: 0 },
    actual_revenue: { type: Number, default: 0 }
}, { _id: false });

// ODC (Other Direct Costs) schema for monthly tracking
const odcItemSchema = new mongoose.Schema({
    month: { type: String, required: true }, // Format: "YYYY-MM"
    category: { type: String, required: true }, // e.g., "Travel", "Equipment", "Software", "Subcontractor"
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    notes: { type: String, default: '' }
}, { _id: false });

// Monthly indirect costs schema
const monthlyIndirectCostSchema = new mongoose.Schema({
    month: { type: String, required: true }, // Format: "YYYY-MM"
    fringe_amount: { type: Number, required: true }, // Dollar amount
    overhead_amount: { type: Number, required: true }, // Dollar amount
    ga_amount: { type: Number, required: true }, // G&A dollar amount
    profit_amount: { type: Number, default: 0 }, // Profit dollar amount
    total_indirect_amount: { type: Number, required: true }, // Total of all indirect costs
    notes: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Project costs schema combining direct labor, ODCs, and indirect costs
const projectCostSchema = new mongoose.Schema({
    month: { type: String, required: true }, // Format: "YYYY-MM"
    direct_labor_cost: { type: Number, default: 0 },
    direct_labor_hours: { type: Number, default: 0 },
    odc_items: [odcItemSchema],
    total_odc_cost: { type: Number, default: 0 },
    fringe_cost: { type: Number, default: 0 },
    overhead_cost: { type: Number, default: 0 },
    ga_cost: { type: Number, default: 0 },
    profit_cost: { type: Number, default: 0 },
    total_cost: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const employeeSchema = new mongoose.Schema({
    employee_id: { type: String, unique: true }, // Auto-generated unique ID
    employee_name: { type: String, required: true },
    department: { type: String, required: true },
    lcat: { type: String, required: true },
    education_level: { type: String, required: true },
    years_experience: { type: Number, required: true },
    priced_salary: { type: Number, required: true },
    current_salary: { type: Number, required: true },
    hours_per_month: { type: Number, required: true },
    bill_rate: { type: Number, required: true }, // Hourly billing rate to client
    hourly_rate: { type: Number }, // Internal hourly cost
    start_date: { type: Date, required: true },
    end_date: { type: Date },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    role: { type: String, default: 'Employee' }, // Employee, Manager, etc.
    monthly_data: [monthlyDataSchema],
    notes: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Generate unique employee ID and calculate hourly rate before saving
employeeSchema.pre('save', function(next) {
    // Generate unique employee ID if not exists
    if (!this.employee_id) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        this.employee_id = `EMP-${timestamp}-${random}`.toUpperCase();
    }
    
    // Calculate hourly rate
    if (this.current_salary && this.hours_per_month) {
        this.hourly_rate = this.current_salary / 12 / this.hours_per_month;
    }
    
    this.updated_at = new Date();
    next();
});

const Employee = mongoose.model('Employee', employeeSchema);
const MonthlyIndirectCost = mongoose.model('MonthlyIndirectCost', monthlyIndirectCostSchema);
const ProjectCost = mongoose.model('ProjectCost', projectCostSchema);

// JWT Middleware for protected routes
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seas-financial-secret');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Routes

// GET /api/employees - Fetch all employees with filters
app.get('/api/employees', authMiddleware, async (req, res) => {
    try {
        // Return demo data if MongoDB is not connected
        if (mongoose.connection.readyState !== 1) {
            const demoEmployees = [
                {
                    _id: '1',
                    employee_id: 'EMP-LZ9X2M4K-DEMO1',
                    employee_name: 'John Smith',
                    department: 'Engineering',
                    lcat: 'Solution Architect/Engineering Lead (SA/Eng Lead)',
                    education_level: "Master's Degree",
                    priced_salary: 140000,
                    current_salary: 145000,
                    hours_per_month: 160,
                    bill_rate: 95,
                    hourly_rate: 56.64,
                    start_date: '2023-01-15',
                    status: 'Active',
                    role: 'Manager',
                    monthly_data: [
                        { month: '2024-01', hours: 168, revenue: 15960, actual_hours: 165, actual_revenue: 15675 },
                        { month: '2024-02', hours: 160, revenue: 15200, actual_hours: 158, actual_revenue: 15010 }
                    ],
                    notes: 'Team lead for core platform'
                },
                {
                    _id: '2',
                    employee_id: 'EMP-MN8V3L7P-DEMO2',
                    employee_name: 'Sarah Johnson',
                    department: 'SEAS IT',
                    lcat: 'AI Engineering Lead (AI Lead)',
                    education_level: 'PhD',
                    priced_salary: 130000,
                    current_salary: 135000,
                    hours_per_month: 160,
                    bill_rate: 85,
                    hourly_rate: 52.73,
                    start_date: '2023-03-01',
                    status: 'Active',
                    role: 'Employee',
                    monthly_data: [
                        { month: '2024-01', hours: 160, revenue: 13600, actual_hours: 162, actual_revenue: 13770 },
                        { month: '2024-02', hours: 160, revenue: 13600, actual_hours: 155, actual_revenue: 13175 }
                    ],
                    notes: 'ML model development specialist'
                }
            ];
            return res.json(demoEmployees);
        }
        
        const { department, lcat, active_only } = req.query;
        let filter = {};
        
        if (department && department !== 'all') {
            filter.department = department;
        }
        
        if (lcat && lcat !== 'all') {
            filter.lcat = lcat;
        }
        
        if (active_only === 'true') {
            filter.status = 'Active';
            filter.$or = [
                { end_date: { $exists: false } },
                { end_date: null },
                { end_date: { $gte: new Date() } }
            ];
        }
        
        const employees = await Employee.find(filter).sort({ employee_name: 1 });
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/employees/:id - Fetch single employee
app.get('/api/employees/:id', authMiddleware, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/employees - Create new employee
app.post('/api/employees', authMiddleware, async (req, res) => {
    try {
        const employee = new Employee(req.body);
        await employee.save();
        res.status(201).json(employee);
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(400).json({ message: 'Error creating employee', error: error.message });
    }
});

// PUT /api/employees/:id - Update employee
app.put('/api/employees/:id', authMiddleware, async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updated_at: new Date() },
            { new: true, runValidators: true }
        );
        
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        res.json(employee);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(400).json({ message: 'Error updating employee', error: error.message });
    }
});

// DELETE /api/employees/:id - Delete employee
app.delete('/api/employees/:id', authMiddleware, async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/import - Import employees from CSV
const papa = require('papaparse');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/import', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const csvData = req.file.buffer.toString('utf8');
        const parsed = papa.parse(csvData, { header: true, skipEmptyLines: true });
        
        if (parsed.errors.length > 0) {
            return res.status(400).json({ message: 'CSV parse error', errors: parsed.errors });
        }
        
        const employees = [];
        const errors = [];
        
        for (let i = 0; i < parsed.data.length; i++) {
            const row = parsed.data[i];
            try {
                const employee = new Employee({
                    employee_name: row.Employee_Name,
                    department: row.Department,
                    lcat: row.LCAT,
                    education_level: row.Education_Level,
                    years_experience: parseInt(row.Years_Experience) || 0,
                    priced_salary: parseFloat(row.Priced_Salary) || 0,
                    current_salary: parseFloat(row.Current_Salary) || 0,
                    hours_per_month: parseFloat(row.Hours_Per_Month) || 160,
                    start_date: new Date(row.Start_Date),
                    end_date: row.End_Date ? new Date(row.End_Date) : undefined,
                    notes: row.Notes || ''
                });
                
                await employee.save();
                employees.push(employee);
            } catch (error) {
                errors.push({ row: i + 1, error: error.message });
            }
        }
        
        res.json({
            message: `Successfully imported ${employees.length} employees`,
            imported: employees.length,
            errors: errors
        });
    } catch (error) {
        console.error('Error importing employees:', error);
        res.status(500).json({ message: 'Import failed', error: error.message });
    }
});

// POST /api/projections - Generate financial projections
app.post('/api/projections', authMiddleware, async (req, res) => {
    try {
        const { 
            months = 12, 
            salary_increase = 3, 
            attrition_rate = 10, 
            new_hires = 0 
        } = req.body;
        
        const employees = await Employee.find({
            $or: [
                { end_date: { $exists: false } },
                { end_date: null },
                { end_date: { $gte: new Date() } }
            ]
        });
        
        const projections = [];
        const currentDate = new Date();
        
        for (let i = 0; i < months; i++) {
            const projectionDate = new Date(currentDate);
            projectionDate.setMonth(projectionDate.getMonth() + i);
            
            let totalHours = 0;
            let totalRevenue = 0;
            let activeEmployees = employees.length;
            
            // Calculate attrition impact
            if (i > 0) {
                const monthlyAttritionRate = attrition_rate / 12 / 100;
                activeEmployees = Math.max(1, activeEmployees * (1 - monthlyAttritionRate));
            }
            
            // Add new hires
            if (i > 0 && new_hires > 0) {
                const monthlyNewHires = new_hires / 12;
                activeEmployees += monthlyNewHires;
            }
            
            employees.forEach(employee => {
                // Calculate average hours from historical data
                const avgHours = employee.monthly_data.length > 0 
                    ? employee.monthly_data.reduce((sum, data) => sum + (data.actual_hours || data.hours), 0) / employee.monthly_data.length
                    : employee.hours_per_month;
                
                // Apply salary increase
                const adjustedSalary = employee.current_salary * Math.pow(1 + salary_increase / 100, i / 12);
                const hourlyRate = adjustedSalary / 12 / avgHours;
                
                totalHours += avgHours;
                totalRevenue += avgHours * hourlyRate;
            });
            
            // Adjust for attrition and new hires
            totalHours = totalHours * (activeEmployees / employees.length);
            totalRevenue = totalRevenue * (activeEmployees / employees.length);
            
            projections.push({
                month: projectionDate.toISOString().slice(0, 7),
                total_hours: Math.round(totalHours),
                total_revenue: Math.round(totalRevenue),
                active_employees: Math.round(activeEmployees),
                avg_hourly_rate: totalHours > 0 ? totalRevenue / totalHours : 0
            });
        }
        
        res.json(projections);
    } catch (error) {
        console.error('Error generating projections:', error);
        res.status(500).json({ message: 'Projection generation failed', error: error.message });
    }
});

// GET /api/validation-options - Get validation options for dropdowns
app.get('/api/validation-options', async (req, res) => {
    try {
        // Return demo data if MongoDB is not connected
        if (mongoose.connection.readyState !== 1) {
            return res.json({
                departments: ['Engineering', 'Data Science', 'Product Management', 'Operations', 'SEAS IT'],
                lcats: [
                    'Program Manager (PM)',
                    'Solution Architect/Engineering Lead (SA/Eng Lead)',
                    'AI Engineering Lead (AI Lead)',
                    'Senior Software Engineer (Sr. SWE)',
                    'Software Engineer (SWE)',
                    'Junior Software Engineer (Jr. SWE)'
                ],
                education_levels: ['High School', "Bachelor's Degree", "Master's Degree", 'PhD'],
                roles: ['Employee', 'Manager'],
                statuses: ['Active', 'Inactive']
            });
        }
        
        const departments = await Employee.distinct('department');
        const lcats = await Employee.distinct('lcat');
        const educationLevels = await Employee.distinct('education_level');
        
        res.json({
            departments: departments.sort(),
            lcats: lcats.sort(),
            education_levels: educationLevels.sort()
        });
    } catch (error) {
        console.error('Error fetching validation options:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Basic auth endpoint for development
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt:', { 
            username: JSON.stringify(username), 
            password: JSON.stringify(password),
            usernameLength: username?.length,
            passwordLength: password?.length
        });
        
        // Simple auth for development - in production, use proper authentication
        if (username === 'admin' && password === 'admin123') {
            const token = jwt.sign(
                { username: 'admin', role: 'admin' },
                process.env.JWT_SECRET || 'seas-financial-secret',
                { expiresIn: '24h' }
            );
            
            res.json({ token, user: { username: 'admin', role: 'admin' } });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Utility functions for billing periods
function getMonthlyBillingPeriod(year, month) {
    // Validate input parameters
    if (!year || !month || month < 1 || month > 12) {
        throw new Error(`Invalid year or month: year=${year}, month=${month}`);
    }
    
    // Billing period starts on 12th of month unless it's a weekend
    let startDate = new Date(year, month - 1, 12); // month is 1-indexed
    
    // Validate the created date
    if (isNaN(startDate.getTime())) {
        throw new Error(`Invalid start date created: year=${year}, month=${month}`);
    }
    
    // If 12th is Saturday (6) or Sunday (0), move to next Monday
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek === 6) { // Saturday
        startDate.setDate(startDate.getDate() + 2); // Move to Monday
    } else if (dayOfWeek === 0) { // Sunday
        startDate.setDate(startDate.getDate() + 1); // Move to Monday
    }
    
    // End date is 11th of next month (or previous working day)
    let endDate = new Date(year, month, 11); // Next month's 11th
    
    // Validate the end date
    if (isNaN(endDate.getTime())) {
        throw new Error(`Invalid end date created: year=${year}, month=${month}`);
    }
    
    const endDayOfWeek = endDate.getDay();
    if (endDayOfWeek === 6) { // Saturday
        endDate.setDate(endDate.getDate() - 1); // Move to Friday
    } else if (endDayOfWeek === 0) { // Sunday
        endDate.setDate(endDate.getDate() - 2); // Move to Friday
    }
    
    return { startDate, endDate };
}

function getFederalHolidays(year) {
    const holidays = [];
    
    // Fixed date holidays
    holidays.push(new Date(year, 0, 1));   // New Year's Day
    holidays.push(new Date(year, 6, 4));   // Independence Day
    holidays.push(new Date(year, 10, 11)); // Veterans Day
    holidays.push(new Date(year, 11, 25)); // Christmas Day
    
    // MLK Day - 3rd Monday in January
    const mlkDay = new Date(year, 0, 1);
    mlkDay.setDate(1 + (7 - mlkDay.getDay() + 1) % 7 + 14); // 3rd Monday
    holidays.push(mlkDay);
    
    // Presidents Day - 3rd Monday in February
    const presidentsDay = new Date(year, 1, 1);
    presidentsDay.setDate(1 + (7 - presidentsDay.getDay() + 1) % 7 + 14);
    holidays.push(presidentsDay);
    
    // Memorial Day - Last Monday in May
    const memorialDay = new Date(year, 4, 31);
    memorialDay.setDate(31 - (memorialDay.getDay() + 6) % 7);
    holidays.push(memorialDay);
    
    // Labor Day - First Monday in September
    const laborDay = new Date(year, 8, 1);
    laborDay.setDate(1 + (7 - laborDay.getDay() + 1) % 7);
    holidays.push(laborDay);
    
    // Columbus Day - 2nd Monday in October
    const columbusDay = new Date(year, 9, 1);
    columbusDay.setDate(1 + (7 - columbusDay.getDay() + 1) % 7 + 7);
    holidays.push(columbusDay);
    
    // Thanksgiving - 4th Thursday in November
    const thanksgiving = new Date(year, 10, 1);
    thanksgiving.setDate(1 + (7 - thanksgiving.getDay() + 4) % 7 + 21);
    holidays.push(thanksgiving);
    
    return holidays;
}

function calculateWorkingDays(startDate, endDate) {
    const holidays = getFederalHolidays(startDate.getFullYear());
    let workingDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
        const isHoliday = holidays.some(holiday => 
            holiday.getTime() === currentDate.getTime()
        );
        
        if (!isWeekend && !isHoliday) {
            workingDays++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
}

// Function to convert period name to month number
function periodToMonth(period) {
    const periodMap = {
        'JAN-FEB': 1,
        'FEB-MAR': 2,
        'MAR-APR': 3,
        'APR-MAY': 4,
        'MAY-JUN': 5,
        'JUN-JUL': 6,
        'JUL-AUG': 7,
        'AUG-SEP': 8,
        'SEP-OCT': 9,
        'OCT-NOV': 10,
        'NOV-DEC': 11,
        'DEC-JAN': 12
    };
    return periodMap[period] || null;
}

// GET /api/billing-period/:year/:period - Get billing period info
app.get('/api/billing-period/:year/:period', authMiddleware, async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const periodParam = req.params.period;
        
        // Convert period to month number
        let month;
        if (isNaN(parseInt(periodParam))) {
            // It's a period name like "JAN-FEB"
            month = periodToMonth(periodParam);
            if (!month) {
                return res.status(400).json({ 
                    message: 'Invalid period name',
                    period: periodParam,
                    validPeriods: ['JAN-FEB', 'FEB-MAR', 'MAR-APR', 'APR-MAY', 'MAY-JUN', 'JUN-JUL', 'JUL-AUG', 'AUG-SEP', 'SEP-OCT', 'OCT-NOV', 'NOV-DEC', 'DEC-JAN']
                });
            }
        } else {
            // It's a numeric month
            month = parseInt(periodParam);
        }
        
        // Validate input parameters
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ 
                message: 'Invalid year or month parameters',
                year: req.params.year,
                period: periodParam,
                month: month
            });
        }
        
        const { startDate, endDate } = getMonthlyBillingPeriod(year, month);
        const workingDays = calculateWorkingDays(startDate, endDate);
        const maxHours = workingDays * 8; // 8 hours per working day
        
        res.json({
            period: periodParam,
            month: month,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            workingDays,
            maxHours,
            holidays: getFederalHolidays(year).map(h => h.toISOString().split('T')[0])
        });
    } catch (error) {
        console.error('Error calculating billing period:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/profit-loss - Calculate current month profit/loss
app.get('/api/profit-loss', authMiddleware, async (req, res) => {
    try {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        // For demo mode, return sample profit/loss data
        if (mongoose.connection.readyState !== 1) {
            const revenue = 125000;
            const costs = 98500;
            const profit = revenue - costs;
            const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
            
            return res.json({
                revenue,
                costs,
                profit,
                profitMargin: profitMargin.toFixed(1),
                month: `${year}-${month.toString().padStart(2, '0')}`
            });
        }
        
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        
        // Calculate total revenue from employee billing
        const employees = await Employee.find({
            $or: [
                { end_date: { $exists: false } },
                { end_date: null },
                { end_date: { $gte: new Date(year, month - 1, 1) } }
            ]
        });
        
        let totalRevenue = 0;
        employees.forEach(employee => {
            const monthlyData = employee.monthly_data.find(data => data.month === monthKey);
            const actualHours = monthlyData?.actual_hours || employee.hours_per_month || 160;
            const billRate = employee.bill_rate || 85; // Default bill rate
            totalRevenue += actualHours * billRate;
        });
        
        // Calculate total costs using existing project costs calculation
        const projectCosts = await calculateProjectCosts(year, month);
        
        // Get ODC costs for the month
        const odcItems = await ODCItem.find({ month: monthKey });
        const totalOdcCost = odcItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        
        const totalCosts = projectCosts.total_cost + totalOdcCost;
        const profit = totalRevenue - totalCosts;
        const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        
        res.json({
            revenue: totalRevenue,
            costs: totalCosts,
            profit,
            profitMargin: profitMargin.toFixed(1),
            month: monthKey
        });
    } catch (error) {
        console.error('Error calculating profit/loss:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/employees/:id/monthly-billing - Add/update monthly billing data
app.post('/api/employees/:id/monthly-billing', authMiddleware, async (req, res) => {
    try {
        const { month, actual_hours, notes } = req.body;
        const employeeId = req.params.id;
        
        // For demo mode, simulate updating employee data
        if (mongoose.connection.readyState !== 1) {
            return res.json({
                message: 'Monthly billing updated successfully (demo mode)',
                month,
                actual_hours,
                actual_revenue: actual_hours * 85 // Demo bill rate
            });
        }
        
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        
        // Calculate actual revenue based on bill rate
        const actual_revenue = actual_hours * employee.bill_rate;
        
        // Find existing monthly data or create new
        const existingIndex = employee.monthly_data.findIndex(data => data.month === month);
        const monthlyData = {
            month,
            hours: employee.hours_per_month,
            revenue: employee.hours_per_month * employee.bill_rate,
            actual_hours,
            actual_revenue,
            notes
        };
        
        if (existingIndex >= 0) {
            employee.monthly_data[existingIndex] = monthlyData;
        } else {
            employee.monthly_data.push(monthlyData);
        }
        
        await employee.save();
        res.json({ message: 'Monthly billing updated successfully', data: monthlyData });
    } catch (error) {
        console.error('Error updating monthly billing:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/monthly-billing-summary/:year/:month - Get billing summary for all employees
app.get('/api/monthly-billing-summary/:year/:month', authMiddleware, async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        
        // Demo data for when MongoDB is not connected
        if (mongoose.connection.readyState !== 1) {
            const demoSummary = {
                period: monthKey,
                totalEmployees: 2,
                totalProjectedHours: 320,
                totalActualHours: 315,
                totalProjectedRevenue: 28800,
                totalActualRevenue: 28250,
                variance: -550,
                variancePercent: -1.9,
                employeeDetails: [
                    {
                        employee_name: 'John Smith',
                        projected_hours: 160,
                        actual_hours: 158,
                        bill_rate: 95,
                        projected_revenue: 15200,
                        actual_revenue: 15010,
                        variance: -190
                    },
                    {
                        employee_name: 'Sarah Johnson',
                        projected_hours: 160,
                        actual_hours: 157,
                        bill_rate: 85,
                        projected_revenue: 13600,
                        actual_revenue: 13345,
                        variance: -255
                    }
                ]
            };
            return res.json(demoSummary);
        }
        
        const employees = await Employee.find({
            $or: [
                { end_date: { $exists: false } },
                { end_date: null },
                { end_date: { $gte: new Date(year, month - 1, 1) } }
            ]
        });
        
        let totalProjectedHours = 0;
        let totalActualHours = 0;
        let totalProjectedRevenue = 0;
        let totalActualRevenue = 0;
        const employeeDetails = [];
        
        employees.forEach(employee => {
            const monthlyData = employee.monthly_data.find(data => data.month === monthKey);
            const projectedHours = employee.hours_per_month || 160;
            const projectedRevenue = projectedHours * employee.bill_rate;
            const actualHours = monthlyData?.actual_hours || 0;
            const actualRevenue = monthlyData?.actual_revenue || 0;
            
            totalProjectedHours += projectedHours;
            totalActualHours += actualHours;
            totalProjectedRevenue += projectedRevenue;
            totalActualRevenue += actualRevenue;
            
            employeeDetails.push({
                employee_id: employee._id,
                employee_name: employee.employee_name,
                projected_hours: projectedHours,
                actual_hours: actualHours,
                bill_rate: employee.bill_rate,
                projected_revenue: projectedRevenue,
                actual_revenue: actualRevenue,
                variance: actualRevenue - projectedRevenue
            });
        });
        
        const variance = totalActualRevenue - totalProjectedRevenue;
        const variancePercent = totalProjectedRevenue > 0 ? (variance / totalProjectedRevenue) * 100 : 0;
        
        res.json({
            period: monthKey,
            totalEmployees: employees.length,
            totalProjectedHours,
            totalActualHours,
            totalProjectedRevenue,
            totalActualRevenue,
            variance,
            variancePercent,
            employeeDetails
        });
    } catch (error) {
        console.error('Error fetching monthly billing summary:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/indirect-costs/:year/:month - Get monthly indirect costs
app.get('/api/indirect-costs/:year/:month', authMiddleware, async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        
        // Demo data for when MongoDB is not connected
        if (mongoose.connection.readyState !== 1) {
            const demoAmounts = {
                month: monthKey,
                fringe_amount: 7500,
                overhead_amount: 12000,
                ga_amount: 2500,
                profit_amount: 1500,
                total_indirect_amount: 23500,
                notes: 'Demo monthly indirect costs'
            };
            return res.json(demoAmounts);
        }
        
        const indirectCost = await MonthlyIndirectCost.findOne({ month: monthKey });
        if (!indirectCost) {
            return res.status(404).json({ message: 'Monthly indirect costs not found for this period' });
        }
        
        res.json(indirectCost);
    } catch (error) {
        console.error('Error fetching indirect costs:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/indirect-costs - Create or update monthly indirect costs
app.post('/api/indirect-costs', authMiddleware, async (req, res) => {
    try {
        const { month, fringe_amount, overhead_amount, ga_amount, profit_amount, notes } = req.body;
        
        // Calculate total
        const total_indirect_amount = (fringe_amount || 0) + (overhead_amount || 0) + (ga_amount || 0) + (profit_amount || 0);
        
        // Demo mode simulation
        if (mongoose.connection.readyState !== 1) {
            return res.json({
                message: 'Monthly indirect costs updated successfully (demo mode)',
                data: { month, fringe_amount, overhead_amount, ga_amount, profit_amount, total_indirect_amount }
            });
        }
        
        const indirectCostData = {
            month,
            fringe_amount: parseFloat(fringe_amount) || 0,
            overhead_amount: parseFloat(overhead_amount) || 0,
            ga_amount: parseFloat(ga_amount) || 0,
            profit_amount: parseFloat(profit_amount) || 0,
            total_indirect_amount,
            notes: notes || ''
        };
        
        // Update existing or create new
        const indirectCost = await MonthlyIndirectCost.findOneAndUpdate(
            { month },
            indirectCostData,
            { upsert: true, new: true, runValidators: true }
        );
        
        res.json({ message: 'Monthly indirect costs saved successfully', data: indirectCost });
    } catch (error) {
        console.error('Error saving indirect costs:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/project-costs/:year/:month - Get project costs for a specific month
app.get('/api/project-costs/:year/:month', authMiddleware, async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        
        // Demo data for when MongoDB is not connected
        if (mongoose.connection.readyState !== 1) {
            const demoProjectCost = {
                month: monthKey,
                direct_labor_cost: 28800,
                direct_labor_hours: 320,
                odc_items: [
                    { month: monthKey, category: 'Travel', description: 'Client site visit', amount: 2500, notes: 'Flight and hotel' },
                    { month: monthKey, category: 'Software', description: 'Development tools license', amount: 1200, notes: 'Annual subscription' },
                    { month: monthKey, category: 'Equipment', description: 'Laptop for new hire', amount: 3200, notes: 'MacBook Pro' }
                ],
                total_odc_cost: 6900,
                fringe_cost: 7344, // 25.5% of direct labor
                overhead_cost: 11520, // 40% of direct labor
                ga_cost: 2448, // 8.5% of direct labor
                profit_cost: 1440, // 5% of direct labor
                total_cost: 58452
            };
            return res.json(demoProjectCost);
        }
        
        let projectCost = await ProjectCost.findOne({ month: monthKey });
        
        if (!projectCost) {
            // Calculate from current data if not exists
            projectCost = await calculateProjectCosts(year, month);
        }
        
        res.json(projectCost);
    } catch (error) {
        console.error('Error fetching project costs:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/odc-items - Add ODC item
app.post('/api/odc-items', authMiddleware, async (req, res) => {
    try {
        const { month, category, description, amount, notes } = req.body;
        
        // Demo mode simulation
        if (mongoose.connection.readyState !== 1) {
            return res.json({
                message: 'ODC item added successfully (demo mode)',
                data: { month, category, description, amount, notes }
            });
        }
        
        let projectCost = await ProjectCost.findOne({ month });
        
        if (!projectCost) {
            projectCost = new ProjectCost({ month, odc_items: [] });
        }
        
        // Add new ODC item
        projectCost.odc_items.push({
            month,
            category,
            description,
            amount: parseFloat(amount),
            notes: notes || ''
        });
        
        // Recalculate total ODC cost
        projectCost.total_odc_cost = projectCost.odc_items.reduce((sum, item) => sum + item.amount, 0);
        
        // Recalculate total project cost
        await recalculateProjectCost(projectCost);
        
        await projectCost.save();
        res.json({ message: 'ODC item added successfully', data: projectCost });
    } catch (error) {
        console.error('Error adding ODC item:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DELETE /api/odc-items/:projectCostId/:odcItemId - Remove ODC item
app.delete('/api/odc-items/:month/:itemIndex', authMiddleware, async (req, res) => {
    try {
        const { month, itemIndex } = req.params;
        
        // Demo mode simulation
        if (mongoose.connection.readyState !== 1) {
            return res.json({ message: 'ODC item removed successfully (demo mode)' });
        }
        
        const projectCost = await ProjectCost.findOne({ month });
        if (!projectCost) {
            return res.status(404).json({ message: 'Project cost record not found' });
        }
        
        // Remove ODC item by index
        const index = parseInt(itemIndex);
        if (index >= 0 && index < projectCost.odc_items.length) {
            projectCost.odc_items.splice(index, 1);
            
            // Recalculate total ODC cost
            projectCost.total_odc_cost = projectCost.odc_items.reduce((sum, item) => sum + item.amount, 0);
            
            // Recalculate total project cost
            await recalculateProjectCost(projectCost);
            
            await projectCost.save();
            res.json({ message: 'ODC item removed successfully', data: projectCost });
        } else {
            res.status(400).json({ message: 'Invalid ODC item index' });
        }
    } catch (error) {
        console.error('Error removing ODC item:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Utility function to calculate project costs
async function calculateProjectCosts(year, month) {
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Get employees active in this month
    const employees = await Employee.find({
        $or: [
            { end_date: { $exists: false } },
            { end_date: null },
            { end_date: { $gte: new Date(year, month - 1, 1) } }
        ]
    });
    
    let directLaborCost = 0;
    let directLaborHours = 0;
    
    employees.forEach(employee => {
        const monthlyData = employee.monthly_data.find(data => data.month === monthKey);
        const actualHours = monthlyData?.actual_hours || employee.hours_per_month || 160;
        const hourlyCost = employee.hourly_rate || (employee.current_salary / 12 / (employee.hours_per_month || 160));
        
        directLaborHours += actualHours;
        directLaborCost += actualHours * hourlyCost;
    });
    
    // Get monthly indirect costs
    const monthlyIndirect = await MonthlyIndirectCost.findOne({ month: monthKey });
    const fringeCost = monthlyIndirect?.fringe_amount || 0;
    const overheadCost = monthlyIndirect?.overhead_amount || 0;
    const gaCost = monthlyIndirect?.ga_amount || 0;
    const profitCost = monthlyIndirect?.profit_amount || 0;
    
    return {
        month: monthKey,
        direct_labor_cost: directLaborCost,
        direct_labor_hours: directLaborHours,
        odc_items: [],
        total_odc_cost: 0,
        fringe_cost: fringeCost,
        overhead_cost: overheadCost,
        ga_cost: gaCost,
        profit_cost: profitCost,
        total_cost: directLaborCost + fringeCost + overheadCost + gaCost + profitCost
    };
}

// Utility function to recalculate project cost totals
async function recalculateProjectCost(projectCost) {
    // Get monthly indirect costs
    const monthlyIndirect = await MonthlyIndirectCost.findOne({ month: projectCost.month });
    
    if (monthlyIndirect) {
        projectCost.fringe_cost = monthlyIndirect.fringe_amount;
        projectCost.overhead_cost = monthlyIndirect.overhead_amount;
        projectCost.ga_cost = monthlyIndirect.ga_amount;
        projectCost.profit_cost = monthlyIndirect.profit_amount;
    } else {
        // Default to zero if no indirect costs entered
        projectCost.fringe_cost = 0;
        projectCost.overhead_cost = 0;
        projectCost.ga_cost = 0;
        projectCost.profit_cost = 0;
    }
    
    projectCost.total_cost = projectCost.direct_labor_cost + 
                            projectCost.total_odc_cost + 
                            projectCost.fringe_cost + 
                            projectCost.overhead_cost + 
                            projectCost.ga_cost + 
                            projectCost.profit_cost;
}

// POST /api/import/indirect-costs - Bulk import indirect costs from CSV
app.post('/api/import/indirect-costs', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const csvText = req.file.buffer.toString();
        const records = papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim()
        });

        if (records.errors.length > 0) {
            return res.status(400).json({ 
                message: 'CSV parsing error', 
                errors: records.errors 
            });
        }

        const importResults = {
            successful: 0,
            failed: 0,
            errors: []
        };

        // Demo mode simulation
        if (mongoose.connection.readyState !== 1) {
            importResults.successful = records.data.length;
            return res.json({
                message: `Successfully imported ${importResults.successful} indirect cost records (demo mode)`,
                results: importResults
            });
        }

        // Process each record
        for (const [index, record] of records.data.entries()) {
            try {
                if (!record.Month || !record.Fringe_Amount || !record.Overhead_Amount || !record.GA_Amount) {
                    importResults.failed++;
                    importResults.errors.push(`Row ${index + 2}: Missing required fields`);
                    continue;
                }

                const total_indirect_amount = (parseFloat(record.Fringe_Amount) || 0) + 
                                              (parseFloat(record.Overhead_Amount) || 0) + 
                                              (parseFloat(record.GA_Amount) || 0) + 
                                              (parseFloat(record.Profit_Amount) || 0);

                const indirectCostData = {
                    month: record.Month,
                    fringe_amount: parseFloat(record.Fringe_Amount) || 0,
                    overhead_amount: parseFloat(record.Overhead_Amount) || 0,
                    ga_amount: parseFloat(record.GA_Amount) || 0,
                    profit_amount: parseFloat(record.Profit_Amount) || 0,
                    total_indirect_amount,
                    notes: record.Notes || ''
                };

                // Update existing or create new
                await MonthlyIndirectCost.findOneAndUpdate(
                    { month: indirectCostData.month },
                    indirectCostData,
                    { upsert: true, new: true, runValidators: true }
                );

                importResults.successful++;
            } catch (error) {
                importResults.failed++;
                importResults.errors.push(`Row ${index + 2}: ${error.message}`);
            }
        }

        const message = `Import completed: ${importResults.successful} successful, ${importResults.failed} failed`;
        res.json({ message, results: importResults });

    } catch (error) {
        console.error('Error importing indirect costs:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/import/odc-items - Bulk import ODC items from CSV
app.post('/api/import/odc-items', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const csvText = req.file.buffer.toString();
        const records = papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim()
        });

        if (records.errors.length > 0) {
            return res.status(400).json({ 
                message: 'CSV parsing error', 
                errors: records.errors 
            });
        }

        const importResults = {
            successful: 0,
            failed: 0,
            errors: []
        };

        // Demo mode simulation
        if (mongoose.connection.readyState !== 1) {
            importResults.successful = records.data.length;
            return res.json({
                message: `Successfully imported ${importResults.successful} ODC items (demo mode)`,
                results: importResults
            });
        }

        // Process each record
        for (const [index, record] of records.data.entries()) {
            try {
                if (!record.Month || !record.Category || !record.Description || !record.Amount) {
                    importResults.failed++;
                    importResults.errors.push(`Row ${index + 2}: Missing required fields`);
                    continue;
                }

                const month = record.Month;
                let projectCost = await ProjectCost.findOne({ month });
                
                if (!projectCost) {
                    projectCost = new ProjectCost({ month, odc_items: [] });
                }

                // Add new ODC item
                projectCost.odc_items.push({
                    month: month,
                    category: record.Category,
                    description: record.Description,
                    amount: parseFloat(record.Amount),
                    notes: record.Notes || ''
                });

                // Recalculate total ODC cost
                projectCost.total_odc_cost = projectCost.odc_items.reduce((sum, item) => sum + item.amount, 0);
                
                // Recalculate total project cost
                await recalculateProjectCost(projectCost);
                
                await projectCost.save();
                importResults.successful++;

            } catch (error) {
                importResults.failed++;
                importResults.errors.push(`Row ${index + 2}: ${error.message}`);
            }
        }

        const message = `Import completed: ${importResults.successful} successful, ${importResults.failed} failed`;
        res.json({ message, results: importResults });

    } catch (error) {
        console.error('Error importing ODC items:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`SEAS Financial Tracker API running on port ${PORT}`);
});

module.exports = app;