# SEAS Financial Tracker

A comprehensive project financial management platform built with Streamlit that provides professional-grade financial analytics, team management, and project oversight capabilities.

![SEAS Financial Tracker](https://img.shields.io/badge/Built%20with-Streamlit-FF6B6B?style=for-the-badge&logo=streamlit)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)
![Plotly](https://img.shields.io/badge/Charts-Plotly-00D4FF?style=for-the-badge&logo=plotly)

## ✨ Features

### 📊 Enhanced Dashboard
- **Professional KPI Cards** with gradient backgrounds, shadows, and hover effects
- **Color-coded Metrics** for quick status recognition (green/yellow/red)
- **Real-time Financial Overview** with budget vs actual tracking
- **Interactive Charts** using Plotly for budget allocation and expense analysis
- **Project Timeline Visualization** with milestone tracking

### 👥 Team Management
- **Employee Lifecycle Management** with comprehensive forms
- **Team Analytics** with department and role distribution charts
- **Advanced Search & Filtering** by department, status, and skills
- **Salary Analysis** with distribution histograms
- **Bulk Operations** for data export and team reports

### 📈 Advanced Analytics
- **Financial Health Score** with gauge visualization
- **Performance Dashboards** comparing budget vs time progress
- **Expense Breakdown Analysis** with category-wise spending
- **Trends & Forecasting** with risk indicators
- **Cost per Employee Analysis** for resource optimization

### 📋 Reports & Export
- **Comprehensive Report Generation** (Financial, Team, Project Status)
- **Multiple Export Formats** (CSV, JSON, Excel)
- **Data Import/Export** capabilities for backup and migration
- **System Settings** with notification preferences

## 🛠️ Technology Stack

- **Frontend**: Streamlit with custom CSS styling
- **Data Visualization**: Plotly Express & Graph Objects
- **Data Processing**: Pandas & NumPy
- **Session Management**: Streamlit Session State
- **Architecture**: Component-based modular design

## 🚀 Installation & Setup

### Prerequisites
- Python 3.11+
- pip package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd seas-financial-tracker
   ```

2. **Install dependencies**
   ```bash
   pip install streamlit pandas numpy plotly
   ```

3. **Run the application**
   ```bash
   streamlit run app.py --server.port 5000
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:5000`

## 📁 Project Structure

```
seas-financial-tracker/
├── app.py                 # Main application entry point
├── components/            # Modular UI components
│   ├── dashboard.py       # Enhanced dashboard with KPI cards
│   ├── team_management.py # Employee management interface
│   ├── analytics.py       # Advanced analytics and insights
│   ├── reports.py         # Report generation and export
│   └── sidebar.py         # Collapsible sidebar with quick actions
├── utils/                 # Utility classes and helpers
│   ├── data_manager.py    # Centralized data management
│   └── chart_helpers.py   # Plotly chart creation utilities
├── .streamlit/
│   └── config.toml        # Streamlit configuration
└── README.md
```

## 🎨 UI/UX Improvements

### Enhanced Dashboard Design
- **Modern KPI Cards**: Gradient backgrounds with professional styling
- **Consistent Sizing**: All metric cards have uniform 180px height
- **Color Psychology**: 
  - 🟢 Green for positive values and healthy status
  - 🔴 Red for negative values and alerts
  - 🟡 Yellow for warnings and caution states
  - 🔵 Blue for neutral information and primary branding

### Responsive Layout
- **Tab-based Navigation** for intuitive organization
- **Collapsible Sidebar** with grouped controls
- **Mobile-friendly Design** with responsive columns
- **Interactive Elements** with hover effects and smooth transitions

## 📊 Data Management

### Session State Architecture
- **Persistent Data Storage** during user sessions
- **Real-time Updates** across all components
- **Data Consistency** with centralized management
- **No External Database Required** for demonstration purposes

### Supported Data Operations
- Employee records with full profile information
- Financial data with expense tracking by category
- Project settings and timeline management
- Budget allocation and utilization monitoring

## 🔧 Configuration

### Streamlit Configuration
The application includes optimized Streamlit settings in `.streamlit/config.toml`:

```toml
[server]
headless = true
address = "0.0.0.0"
port = 5000

[theme]
primaryColor = "#007bff"
backgroundColor = "#ffffff"
secondaryBackgroundColor = "#f8f9fa"
textColor = "#212529"
```

## 📈 Usage Guide

### Getting Started
1. **Project Setup**: Use the sidebar to configure your project name, budget, and department
2. **Add Team Members**: Navigate to the Team Management tab to add employees
3. **Track Expenses**: Use the sidebar quick actions to record expenses by category
4. **Monitor Progress**: View real-time analytics in the Dashboard and Analytics tabs
5. **Generate Reports**: Export comprehensive reports from the Reports & Settings tab

### Key Workflows
- **Budget Monitoring**: Track spending against allocated budgets with visual progress bars
- **Team Analytics**: Analyze team composition, salary distributions, and productivity metrics
- **Financial Forecasting**: Use trend analysis to project future spending and identify risks
- **Data Export**: Backup your data or share reports with stakeholders

## 🤝 Contributing

This project follows a modular architecture that makes it easy to extend and customize:

- **Add New Components**: Create new files in the `components/` directory
- **Extend Analytics**: Add new chart types in `utils/chart_helpers.py`
- **Enhance Data Models**: Expand the `DataManager` class for additional functionality
- **Custom Styling**: Modify CSS in component files for visual customizations

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or feature requests:
- 📧 Email: support@seastracker.com
- 💬 Create an issue in this repository
- 📚 Check the in-app help documentation

## 🌟 Acknowledgments

- Built with [Streamlit](https://streamlit.io/) for rapid web app development
- Powered by [Plotly](https://plotly.com/) for interactive visualizations
- Uses [Pandas](https://pandas.pydata.org/) for efficient data processing

---

*© 2025 SEAS Financial Tracker. Built with ❤️ for modern project management.*