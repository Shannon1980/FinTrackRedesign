# SEAS Financial Tracker

## Overview

SEAS Financial Tracker is a comprehensive project financial management platform built with Streamlit. The application provides professional-grade financial analytics, team management, and project oversight capabilities for organizations. It features a modern, Section 508 compliant interface with real-time dashboard analytics, budget tracking, team member management, and comprehensive reporting functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modular Streamlit-based architecture with a component-driven design pattern. The main application (`app.py`) orchestrates multiple specialized components including dashboard overview, team management, analytics, and reports. The UI is organized into tabbed interfaces for intuitive navigation and features a responsive design with a collapsible sidebar for quick actions.

### Component Organization
The system is structured into dedicated components:
- **Dashboard Component**: Provides KPI metrics, financial summaries, and overview charts
- **Team Management Component**: Handles employee data entry, team analytics, and member management with bulk import capabilities
- **Contract Costs Component**: Manages ODC (Other Direct Costs), indirect costs (Fringe, Overhead, G&A), and profit/loss analysis
- **Analytics Component**: Delivers comprehensive financial analytics, project performance metrics, and forecasting
- **Reports Component**: Generates exportable reports and manages system settings
- **Sidebar Component**: Offers quick access to project settings and financial parameters

### Data Management Layer
The application employs a centralized `DataManager` class that handles all data operations through Streamlit's session state. This approach provides persistent data storage during user sessions and manages employee records, project settings, financial data, budget categories, ODC items, and indirect cost tracking. The data layer supports real-time updates and maintains data consistency across components.

### Chart and Visualization System
A dedicated `ChartHelpers` utility class manages all data visualization using Plotly for interactive charts and graphs. This includes budget allocation pie charts, budget vs actual comparison charts, and various financial analytics visualizations with consistent styling and color schemes.

### Session State Management
The application heavily relies on Streamlit's session state for data persistence, maintaining user preferences, project settings, employee records, and financial data throughout the user session. This eliminates the need for external database connections while providing a seamless user experience.

## External Dependencies

### Core Framework
- **Streamlit**: Primary web application framework for building the interactive interface
- **Plotly Express & Graph Objects**: Data visualization library for creating interactive charts and graphs

### Data Processing
- **Pandas**: Data manipulation and analysis library for handling employee records and financial data
- **NumPy**: Numerical computing library for mathematical operations and data calculations

### UI/UX Enhancement
- **Custom CSS**: Inline styling for enhanced visual appeal and professional appearance
- **Bootstrap-inspired Design**: Color schemes and layout patterns following modern design principles

### Development Dependencies
- **datetime**: Built-in Python library for date and time operations
- **json**: Built-in Python library for data serialization and configuration management

The application is designed to be self-contained with minimal external dependencies, making it easy to deploy and maintain while providing enterprise-level functionality for financial project management.