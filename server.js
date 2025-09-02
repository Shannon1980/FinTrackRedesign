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

const employeeSchema = new mongoose.Schema({
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
    monthly_data: [monthlyDataSchema],
    notes: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Calculate hourly rate before saving
employeeSchema.pre('save', function(next) {
    if (this.current_salary && this.hours_per_month) {
        this.hourly_rate = this.current_salary / 12 / this.hours_per_month;
    }
    this.updated_at = new Date();
    next();
});

const Employee = mongoose.model('Employee', employeeSchema);

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
                    monthly_data: [
                        { month: '2024-01', hours: 168, revenue: 15960, actual_hours: 165, actual_revenue: 15675 },
                        { month: '2024-02', hours: 160, revenue: 15200, actual_hours: 158, actual_revenue: 15010 }
                    ],
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
    // Billing period starts on 12th of month unless it's a weekend
    let startDate = new Date(year, month - 1, 12); // month is 1-indexed
    
    // If 12th is Saturday (6) or Sunday (0), move to next Monday
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek === 6) { // Saturday
        startDate.setDate(startDate.getDate() + 2); // Move to Monday
    } else if (dayOfWeek === 0) { // Sunday
        startDate.setDate(startDate.getDate() + 1); // Move to Monday
    }
    
    // End date is 11th of next month (or previous working day)
    let endDate = new Date(year, month, 11); // Next month's 11th
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

// GET /api/billing-period/:year/:month - Get billing period info
app.get('/api/billing-period/:year/:month', authMiddleware, async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        
        const { startDate, endDate } = getMonthlyBillingPeriod(year, month);
        const workingDays = calculateWorkingDays(startDate, endDate);
        const maxHours = workingDays * 8; // 8 hours per working day
        
        res.json({
            period: `${year}-${month.toString().padStart(2, '0')}`,
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`SEAS Financial Tracker API running on port ${PORT}`);
});

module.exports = app;