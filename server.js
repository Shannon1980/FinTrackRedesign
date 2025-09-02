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
    hourly_rate: { type: Number },
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`SEAS Financial Tracker API running on port ${PORT}`);
});

module.exports = app;