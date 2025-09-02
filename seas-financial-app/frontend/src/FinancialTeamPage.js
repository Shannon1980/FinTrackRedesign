import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton
} from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Custom toolbar for DataGrid
function CustomToolbar({ onImport, onExport, onAdd }) {
  return (
    <GridToolbarContainer>
      <Button
        startIcon={<AddIcon />}
        onClick={onAdd}
        variant="outlined"
        size="small"
        sx={{ mr: 1 }}
      >
        Add Employee
      </Button>
      <Button
        startIcon={<UploadIcon />}
        onClick={onImport}
        variant="outlined"
        size="small"
        sx={{ mr: 1 }}
      >
        Import CSV
      </Button>
      <Button
        startIcon={<DownloadIcon />}
        onClick={onExport}
        variant="outlined"
        size="small"
        sx={{ mr: 1 }}
      >
        Export CSV
      </Button>
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

function FinancialTeamPage() {
  const [employees, setEmployees] = useState([]);
  const [projections, setProjections] = useState([]);
  const [validationOptions, setValidationOptions] = useState({
    departments: [],
    lcats: [],
    education_levels: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    department: 'all',
    lcat: 'all',
    active_only: true
  });
  
  // Dialog states
  const [employeeDialog, setEmployeeDialog] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [projectionDialog, setProjectionDialog] = useState(false);
  
  // Projection settings
  const [projectionSettings, setProjectionSettings] = useState({
    months: 12,
    salary_increase: 3,
    attrition_rate: 10,
    new_hires: 0
  });

  // API token (in production, implement proper authentication)
  const getAuthToken = () => {
    return localStorage.getItem('auth_token') || 'admin-token';
  };

  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  };

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.department !== 'all') params.append('department', filters.department);
      if (filters.lcat !== 'all') params.append('lcat', filters.lcat);
      if (filters.active_only) params.append('active_only', 'true');
      
      const response = await axios.get(`${API_BASE_URL}/employees?${params}`, axiosConfig);
      setEmployees(response.data);
    } catch (err) {
      setError('Failed to fetch employees: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch validation options
  const fetchValidationOptions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/validation-options`);
      setValidationOptions(response.data);
    } catch (err) {
      console.error('Failed to fetch validation options:', err);
    }
  }, []);

  // Generate projections
  const generateProjections = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/projections`, projectionSettings, axiosConfig);
      setProjections(response.data);
      setSuccess('Projections generated successfully');
    } catch (err) {
      setError('Failed to generate projections: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save employee
  const saveEmployee = async (employeeData) => {
    try {
      setLoading(true);
      if (currentEmployee) {
        await axios.put(`${API_BASE_URL}/employees/${currentEmployee._id}`, employeeData, axiosConfig);
        setSuccess('Employee updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/employees`, employeeData, axiosConfig);
        setSuccess('Employee created successfully');
      }
      setEmployeeDialog(false);
      setCurrentEmployee(null);
      fetchEmployees();
    } catch (err) {
      setError('Failed to save employee: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete employee
  const deleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/employees/${employeeId}`, axiosConfig);
      setSuccess('Employee deleted successfully');
      fetchEmployees();
    } catch (err) {
      setError('Failed to delete employee: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import CSV
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/import`, formData, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess(`Import completed: ${response.data.message}`);
      fetchEmployees();
    } catch (err) {
      setError('Import failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Export CSV
  const handleExport = () => {
    const csvContent = [
      'Employee_Name,Department,LCAT,Education_Level,Years_Experience,Priced_Salary,Current_Salary,Hours_Per_Month,Start_Date,End_Date,Notes',
      ...employees.map(emp => [
        emp.employee_name,
        emp.department,
        emp.lcat,
        emp.education_level,
        emp.years_experience,
        emp.priced_salary,
        emp.current_salary,
        emp.hours_per_month,
        format(parseISO(emp.start_date), 'yyyy-MM-dd'),
        emp.end_date ? format(parseISO(emp.end_date), 'yyyy-MM-dd') : '',
        emp.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchEmployees();
    fetchValidationOptions();
  }, [fetchEmployees, fetchValidationOptions]);

  // DataGrid columns
  const columns = [
    { field: 'employee_name', headerName: 'Employee Name', width: 200, editable: true },
    { field: 'department', headerName: 'Department', width: 150, editable: true },
    { field: 'lcat', headerName: 'LCAT', width: 150, editable: true },
    { field: 'education_level', headerName: 'Education', width: 130, editable: true },
    { field: 'years_experience', headerName: 'Years Exp.', width: 100, type: 'number', editable: true },
    { 
      field: 'priced_salary', 
      headerName: 'Priced Salary', 
      width: 130, 
      type: 'number',
      editable: true,
      valueFormatter: (params) => `$${params.value?.toLocaleString() || 0}`
    },
    { 
      field: 'current_salary', 
      headerName: 'Current Salary', 
      width: 130, 
      type: 'number',
      editable: true,
      valueFormatter: (params) => `$${params.value?.toLocaleString() || 0}`
    },
    { 
      field: 'hourly_rate', 
      headerName: 'Hourly Rate', 
      width: 120,
      valueFormatter: (params) => `$${params.value?.toFixed(2) || 0}`
    },
    { field: 'hours_per_month', headerName: 'Hours/Month', width: 120, type: 'number', editable: true },
    {
      field: 'cost_variance',
      headerName: 'Cost Variance',
      width: 130,
      valueGetter: (params) => {
        const current = params.row.current_salary || 0;
        const priced = params.row.priced_salary || 0;
        return current - priced;
      },
      valueFormatter: (params) => {
        const value = params.value || 0;
        const color = value >= 0 ? 'green' : 'red';
        return `$${value.toLocaleString()}`;
      },
      cellClassName: (params) => {
        const value = params.value || 0;
        return value >= 0 ? 'positive-variance' : 'negative-variance';
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            onClick={() => {
              setCurrentEmployee(params.row);
              setEmployeeDialog(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => deleteEmployee(params.row._id)}
          >
            Delete
          </Button>
        </Box>
      )
    }
  ];

  // Chart data for actuals vs projections
  const chartData = {
    labels: projections.map(p => p.month),
    datasets: [
      {
        label: 'Projected Revenue',
        data: projections.map(p => p.total_revenue),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
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
  };

  const chartOptions = {
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
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        SEAS Financial Team Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Team Management" />
        <Tab label="Financial Projections" />
        <Tab label="Analytics Dashboard" />
      </Tabs>

      {selectedTab === 0 && (
        <Box>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Filters</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={filters.department}
                      onChange={(e) => setFilters({...filters, department: e.target.value})}
                    >
                      <MenuItem value="all">All Departments</MenuItem>
                      {validationOptions.departments.map(dept => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>LCAT</InputLabel>
                    <Select
                      value={filters.lcat}
                      onChange={(e) => setFilters({...filters, lcat: e.target.value})}
                    >
                      <MenuItem value="all">All LCATs</MenuItem>
                      {validationOptions.lcats.map(lcat => (
                        <MenuItem key={lcat} value={lcat}>{lcat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Team Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Total Team Size</Typography>
                  <Typography variant="h4">{employees.length}</Typography>
                  <Chip label="Active Employees" color="primary" size="small" />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Total Current Salary</Typography>
                  <Typography variant="h4">
                    ${employees.reduce((sum, emp) => sum + (emp.current_salary || 0), 0).toLocaleString()}
                  </Typography>
                  <Chip label="Annual" color="secondary" size="small" />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Monthly Hours</Typography>
                  <Typography variant="h4">
                    {employees.reduce((sum, emp) => sum + (emp.hours_per_month || 0), 0).toLocaleString()}
                  </Typography>
                  <Chip label="Total Hours" color="success" size="small" />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Cost Variance</Typography>
                  <Typography variant="h4" color={
                    employees.reduce((sum, emp) => sum + ((emp.current_salary || 0) - (emp.priced_salary || 0)), 0) >= 0 
                      ? 'error' : 'success'
                  }>
                    ${employees.reduce((sum, emp) => sum + ((emp.current_salary || 0) - (emp.priced_salary || 0)), 0).toLocaleString()}
                  </Typography>
                  <Chip label="vs Priced" color="warning" size="small" />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* DataGrid */}
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={employees}
              columns={columns}
              getRowId={(row) => row._id}
              loading={loading}
              components={{
                Toolbar: CustomToolbar
              }}
              componentsProps={{
                toolbar: {
                  onAdd: () => {
                    setCurrentEmployee(null);
                    setEmployeeDialog(true);
                  },
                  onImport: () => document.getElementById('csv-import').click(),
                  onExport: handleExport
                }
              }}
              checkboxSelection
              disableRowSelectionOnClick
              sx={{
                '& .positive-variance': {
                  color: 'green'
                },
                '& .negative-variance': {
                  color: 'red'
                }
              }}
            />
          </Paper>

          <input
            id="csv-import"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </Box>
      )}

      {selectedTab === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Financial Projections Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Projection Months"
                    type="number"
                    value={projectionSettings.months}
                    onChange={(e) => setProjectionSettings({
                      ...projectionSettings,
                      months: parseInt(e.target.value)
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Annual Salary Increase (%)"
                    type="number"
                    value={projectionSettings.salary_increase}
                    onChange={(e) => setProjectionSettings({
                      ...projectionSettings,
                      salary_increase: parseFloat(e.target.value)
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Annual Attrition Rate (%)"
                    type="number"
                    value={projectionSettings.attrition_rate}
                    onChange={(e) => setProjectionSettings({
                      ...projectionSettings,
                      attrition_rate: parseFloat(e.target.value)
                    })}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="New Hires per Year"
                    type="number"
                    value={projectionSettings.new_hires}
                    onChange={(e) => setProjectionSettings({
                      ...projectionSettings,
                      new_hires: parseInt(e.target.value)
                    })}
                  />
                </Grid>
              </Grid>
              <Button
                variant="contained"
                startIcon={<AnalyticsIcon />}
                onClick={generateProjections}
                sx={{ mt: 2 }}
                disabled={loading}
              >
                Generate Projections
              </Button>
            </CardContent>
          </Card>

          {projections.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Revenue & Hours Projections</Typography>
              <Line data={chartData} options={chartOptions} />
            </Paper>
          )}
        </Box>
      )}

      {selectedTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Analytics Dashboard
          </Typography>
          {/* Add analytics components here */}
          <Alert severity="info">
            Analytics dashboard with department breakdowns, cost trending, and performance metrics coming soon.
          </Alert>
        </Box>
      )}

      {/* Employee Dialog */}
      <Dialog open={employeeDialog} onClose={() => setEmployeeDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <EmployeeForm
            employee={currentEmployee}
            validationOptions={validationOptions}
            onSave={saveEmployee}
            onCancel={() => setEmployeeDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

// Employee form component
function EmployeeForm({ employee, validationOptions, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    employee_name: '',
    department: '',
    lcat: '',
    education_level: '',
    years_experience: 0,
    priced_salary: 0,
    current_salary: 0,
    hours_per_month: 160,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        start_date: format(parseISO(employee.start_date), 'yyyy-MM-dd'),
        end_date: employee.end_date ? format(parseISO(employee.end_date), 'yyyy-MM-dd') : ''
      });
    }
  }, [employee]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Employee Name"
            value={formData.employee_name}
            onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              required
            >
              {validationOptions.departments.map(dept => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>LCAT</InputLabel>
            <Select
              value={formData.lcat}
              onChange={(e) => setFormData({...formData, lcat: e.target.value})}
              required
            >
              {validationOptions.lcats.map(lcat => (
                <MenuItem key={lcat} value={lcat}>{lcat}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Education Level</InputLabel>
            <Select
              value={formData.education_level}
              onChange={(e) => setFormData({...formData, education_level: e.target.value})}
              required
            >
              {validationOptions.education_levels.map(level => (
                <MenuItem key={level} value={level}>{level}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Years Experience"
            type="number"
            value={formData.years_experience}
            onChange={(e) => setFormData({...formData, years_experience: parseInt(e.target.value)})}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Priced Salary"
            type="number"
            value={formData.priced_salary}
            onChange={(e) => setFormData({...formData, priced_salary: parseFloat(e.target.value)})}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Current Salary"
            type="number"
            value={formData.current_salary}
            onChange={(e) => setFormData({...formData, current_salary: parseFloat(e.target.value)})}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Hours Per Month"
            type="number"
            value={formData.hours_per_month}
            onChange={(e) => setFormData({...formData, hours_per_month: parseFloat(e.target.value)})}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </Grid>
      </Grid>
      <DialogActions sx={{ mt: 3 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained">Save</Button>
      </DialogActions>
    </form>
  );
}

export default FinancialTeamPage;