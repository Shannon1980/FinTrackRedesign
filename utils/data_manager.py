import pandas as pd
import numpy as np
import streamlit as st
from datetime import datetime, timedelta
import json

class DataManager:
    def __init__(self):
        self.initialize_session_state()
    
    def initialize_session_state(self):
        """Initialize all session state variables"""
        if 'employees' not in st.session_state:
            st.session_state.employees = []
        
        if 'project_settings' not in st.session_state:
            st.session_state.project_settings = {
                'project_name': 'SEAS Project',
                'total_budget': 153000.00,
                'start_date': datetime.now(),
                'end_date': datetime.now() + timedelta(days=365),
                'department': 'Engineering',
                'project_manager': 'Not Assigned'
            }
        
        if 'financial_data' not in st.session_state:
            st.session_state.financial_data = {
                'expenses': [],
                'revenue': [],
                'budget_categories': {
                    'Personnel': 80000,
                    'Equipment': 30000,
                    'Software': 15000,
                    'Travel': 10000,
                    'Miscellaneous': 18000
                }
            }
    
    def add_employee(self, employee_data):
        """Add a new employee to the system"""
        employee_data['id'] = len(st.session_state.employees) + 1
        employee_data['date_added'] = datetime.now()
        st.session_state.employees.append(employee_data)
    
    def get_employees_df(self):
        """Return employees as DataFrame"""
        if not st.session_state.employees:
            return pd.DataFrame()
        return pd.DataFrame(st.session_state.employees)
    
    def update_project_settings(self, settings):
        """Update project settings"""
        st.session_state.project_settings.update(settings)
    
    def get_financial_summary(self):
        """Calculate and return financial summary"""
        total_budget = st.session_state.project_settings['total_budget']
        
        # Calculate total expenses
        expenses_df = pd.DataFrame(st.session_state.financial_data['expenses'])
        total_expenses = expenses_df['amount'].sum() if not expenses_df.empty else 0
        
        # Calculate total revenue
        revenue_df = pd.DataFrame(st.session_state.financial_data['revenue'])
        total_revenue = revenue_df['amount'].sum() if not revenue_df.empty else 0
        
        remaining_budget = total_budget - total_expenses
        budget_utilization = (total_expenses / total_budget * 100) if total_budget > 0 else 0
        
        return {
            'total_budget': total_budget,
            'total_expenses': total_expenses,
            'total_revenue': total_revenue,
            'remaining_budget': remaining_budget,
            'budget_utilization': budget_utilization
        }
    
    def add_expense(self, expense_data):
        """Add a new expense"""
        expense_data['id'] = len(st.session_state.financial_data['expenses']) + 1
        expense_data['date'] = datetime.now()
        st.session_state.financial_data['expenses'].append(expense_data)
    
    def get_expense_by_category(self):
        """Get expenses grouped by category"""
        expenses_df = pd.DataFrame(st.session_state.financial_data['expenses'])
        if expenses_df.empty:
            return pd.DataFrame()
        return expenses_df.groupby('category')['amount'].sum()
    
    def export_data(self, format_type='csv'):
        """Export data in various formats"""
        data = {
            'employees': st.session_state.employees,
            'project_settings': st.session_state.project_settings,
            'financial_data': st.session_state.financial_data
        }
        
        if format_type == 'json':
            return json.dumps(data, indent=2, default=str)
        elif format_type == 'csv':
            # Return employees data as CSV for simplicity
            df = self.get_employees_df()
            return df.to_csv(index=False) if not df.empty else "No data to export"
