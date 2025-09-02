# SEAS Financial Tracker

A comprehensive project financial management platform built with React/Node.js/Express/MongoDB stack that provides professional-grade financial analytics, team management, contract cost management, and HR capabilities.

![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Framework-Express-000000?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)

## ✨ Features

### 📊 Dashboard Analytics
- **Real-time Financial Overview** with comprehensive KPI tracking
- **Team Performance Metrics** showing active employees and monthly hours
- **Cost Variance Analysis** between priced and current salaries
- **Professional Interface** with Bootstrap 5 styling and Font Awesome icons

### 👥 Team Management
- **Employee Lifecycle Management** with unique ID generation
- **Active/Inactive Status Tracking** for team members
- **Role Management** with Manager and Employee designations
- **SEAS IT Department** integration
- **Advanced Search & Filtering** by department, LCAT, and status
- **CSV Import/Export** capabilities for bulk operations

### 💰 Monthly Billing System
- **Period-based Billing** (JAN-FEB, FEB-MAR, etc.) starting on 12th of each month
- **Working Days Calculation** excluding federal holidays
- **Bill Rate × Hours** revenue calculations
- **Actual vs Projected** billing comparisons
- **Federal Holiday Integration** for accurate hour tracking

### 💼 Contract Cost Management
- **Monthly Dollar-based Indirect Costs** (Fringe, Overhead, G&A, Profit)
- **Other Direct Costs (ODC)** tracking by category and month
- **Project Cost Summaries** combining labor, ODCs, and indirect costs
- **CSV Import/Export** for cost data management

### 📈 Financial Projections
- **Comprehensive Financial Analytics** with salary increase projections
- **Attrition Rate Modeling** and new hire impact analysis
- **Multi-month Forecasting** capabilities
- **Team Growth Planning** tools

## 🛠️ Technology Stack

- **Backend**: Node.js with Express framework
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: Vanilla JavaScript with Bootstrap 5
- **Authentication**: JWT-based security
- **File Processing**: Multer for uploads, Papa Parse for CSV handling
- **Security**: CORS, bcryptjs for password hashing

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ or 20+
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd seas-financial-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file with:
   ```
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret-key
   PORT=5000
   ```

4. **Run the application**
   ```bash
   node server.js
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:5000`
   - Default credentials: admin / admin123

## 📁 Project Structure

```
seas-financial-tracker/
├── server.js                     # Main server and API endpoints
├── public/                       # Static frontend files
│   ├── index.html                # Main application interface
│   └── js/
│       └── app.js                # Frontend JavaScript logic
├── employee_template_with_monthly_billing.csv
├── indirect_costs_template.csv
├── package.json                  # Node.js dependencies
└── README.md
```

## 🎨 User Interface

### Modern Web Application
- **Bootstrap 5 Framework** for responsive design
- **Tabbed Navigation** for intuitive organization
- **Real-time Updates** with AJAX calls
- **Interactive Forms** with validation
- **Professional Styling** with modern colors and typography

### Key Components
- **Team Management Tab**: Employee CRUD operations with unique IDs
- **Monthly Billing Tab**: Period-based billing management
- **Financial Projections Tab**: Advanced analytics and forecasting
- **Contract Costs Tab**: Indirect costs and ODC management
- **Analytics Tab**: Data visualization and insights

## 📊 Data Management

### MongoDB Schema
- **Employee Schema**: Comprehensive team member records with monthly billing data
- **Monthly Indirect Costs**: Dollar-based cost tracking by period
- **Project Costs**: Combined labor, ODC, and indirect cost summaries
- **ODC Items**: Categorized other direct costs with monthly tracking

### Features
- **Automatic ID Generation** for unique employee identification
- **Monthly Period Tracking** with federal holiday calculations
- **Real-time Calculations** for financial metrics
- **Data Import/Export** via CSV templates

## 🔧 Configuration

### Environment Variables
```bash
MONGODB_URI=mongodb://localhost:27017/seas-financial
JWT_SECRET=seas-financial-secret
PORT=5000
```

### Monthly Billing Periods
The system uses 12 billing periods:
- JAN-FEB, FEB-MAR, MAR-APR, APR-MAY
- MAY-JUN, JUN-JUL, JUL-AUG, AUG-SEP
- SEP-OCT, OCT-NOV, NOV-DEC, DEC-JAN

## 📈 Usage Guide

### Getting Started
1. **Login**: Use admin/admin123 credentials
2. **Add Team Members**: Navigate to Team Management and add employees
3. **Set Up Billing**: Configure monthly billing periods and rates
4. **Track Costs**: Manage indirect costs and ODCs
5. **Monitor Analytics**: View financial projections and team analytics

### Key Workflows
- **Employee Management**: Add/edit team members with unique IDs and status tracking
- **Monthly Billing**: Track actual vs projected hours and revenue
- **Cost Management**: Enter monthly indirect costs and ODC items
- **Financial Analysis**: Generate projections and analyze team performance

## 🔐 Security Features

- **JWT Authentication** for secure API access
- **Password Hashing** with bcryptjs
- **CORS Configuration** for cross-origin security
- **Input Validation** for all API endpoints
- **Protected Routes** requiring authentication

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or feature requests:
- 💬 Create an issue in this repository
- 📧 Contact the development team
- 📚 Check the API documentation

---

*© 2025 SEAS Financial Tracker. Built for comprehensive project financial management.*