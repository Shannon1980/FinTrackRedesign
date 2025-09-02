# SEAS Financial Tracker

## Overview

SEAS Financial Tracker is a comprehensive project financial management platform built with React/Node.js/Express/MongoDB stack. The application provides professional-grade financial analytics, team management, contract cost management, and project oversight capabilities for organizations. It features a modern interface with real-time dashboard analytics, monthly billing tracking, team member management, and comprehensive indirect cost management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a React-based single-page application architecture with Bootstrap for styling. The main interface (`public/index.html`) orchestrates multiple tabbed components including dashboard overview, team management, monthly billing, contract costs, and analytics. The UI is organized into intuitive navigation tabs with responsive design and real-time data updates.

### Component Organization  
The system is structured into dedicated tabs:
- **Dashboard Component**: Provides employee overview, recent activity, and quick actions
- **Team Management Component**: Handles employee data entry, team analytics, and member management with CSV import/export
- **Monthly Billing Component**: Manages billing periods starting on 12th of month with working days calculation
- **Contract Costs Component**: Manages ODC (Other Direct Costs), indirect costs (Fringe, Overhead, G&A), and total project costs
- **Financial Projections Component**: Delivers comprehensive financial analytics, project performance metrics, and forecasting
- **Analytics Component**: Provides advanced reporting and data visualization capabilities

### Backend Architecture
The application uses Node.js/Express backend with MongoDB for data persistence:
- **Authentication**: JWT-based security with protected API endpoints
- **Employee Management**: CRUD operations with monthly billing data embedded
- **Contract Costs**: Separate collections for indirect costs and project costs with ODC tracking
- **Demo Mode**: Fallback functionality when database is unavailable

### Data Management Layer
The backend employs MongoDB with Mongoose ODM for data operations. Key schemas include:
- **Employee Schema**: Core employee data with embedded monthly billing records
- **Indirect Cost Schema**: Annual rates for fringe, overhead, G&A, and profit
- **Project Cost Schema**: Monthly cost summaries combining direct labor, ODCs, and indirect costs
- **ODC Item Schema**: Categorized other direct costs with monthly tracking

### API Layer
RESTful API endpoints handle all data operations:
- Employee CRUD operations with CSV import/export
- Monthly billing calculations with federal holiday exclusions
- Contract cost management with real-time calculations
- Bulk import functionality for indirect costs and ODC items

## External Dependencies

### Backend Framework
- **Node.js/Express**: Server-side framework for API and web serving
- **MongoDB/Mongoose**: Database and ODM for data persistence
- **JWT**: Authentication and authorization security

### Data Processing
- **Papa Parse**: CSV parsing library for import/export functionality
- **Multer**: File upload handling for CSV imports
- **bcryptjs**: Password hashing for secure authentication

### Frontend Framework
- **Vanilla JavaScript**: Client-side functionality with ES6+ features
- **Bootstrap 5**: Responsive UI framework with modern components
- **Font Awesome**: Icon library for enhanced user experience

### Security & Utilities
- **CORS**: Cross-origin resource sharing configuration
- **dotenv**: Environment variable management for secrets
- **Federal Holidays**: Working days calculation excluding federal holidays

The application provides enterprise-level functionality for comprehensive project financial management with scalable architecture supporting both demo and production environments.