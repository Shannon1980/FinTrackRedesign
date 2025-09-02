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
        
        # Initialize contract costs data
        if 'odc_items' not in st.session_state:
            st.session_state.odc_items = []
        
        if 'indirect_costs' not in st.session_state:
            st.session_state.indirect_costs = []
        
        if 'indirect_rates' not in st.session_state:
            st.session_state.indirect_rates = {
                'fringe_rate': 25.0,
                'overhead_rate': 45.0,
                'ga_rate': 15.0
            }
        
        if 'contract_settings' not in st.session_state:
            st.session_state.contract_settings = {
                'contract_value': 2000000.0,
                'start_date': datetime.now(),
                'end_date': datetime.now() + timedelta(days=365)
            }
        
        # Initialize enhanced employee data
        if 'enhanced_employees' not in st.session_state:
            st.session_state.enhanced_employees = []
    
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
    
    # Contract Costs Management Methods
    
    def add_odc_item(self, odc_data):
        """Add a new ODC item"""
        odc_data['id'] = len(st.session_state.odc_items) + 1
        odc_data['date_added'] = datetime.now()
        st.session_state.odc_items.append(odc_data)
    
    def get_odc_df(self):
        """Return ODC items as DataFrame"""
        if not st.session_state.odc_items:
            return pd.DataFrame()
        return pd.DataFrame(st.session_state.odc_items)
    
    def update_indirect_rates(self, rates):
        """Update indirect cost rates"""
        st.session_state.indirect_rates.update(rates)
    
    def update_indirect_costs_period(self, period_data):
        """Update indirect costs for a specific period"""
        # Remove existing data for this period
        st.session_state.indirect_costs = [
            item for item in st.session_state.indirect_costs 
            if item.get('period') != period_data['period']
        ]
        
        # Add new data
        period_data['date_updated'] = datetime.now()
        st.session_state.indirect_costs.append(period_data)
    
    def get_indirect_costs_df(self):
        """Return indirect costs as DataFrame"""
        if not st.session_state.indirect_costs:
            return pd.DataFrame()
        df = pd.DataFrame(st.session_state.indirect_costs)
        return df.sort_values('period') if not df.empty else df
    
    def get_indirect_costs_for_period(self, period):
        """Get indirect costs for a specific period"""
        for item in st.session_state.indirect_costs:
            if item.get('period') == period:
                return item
        return {}
    
    def update_contract_settings(self, contract_value, start_date):
        """Update contract settings"""
        st.session_state.contract_settings.update({
            'contract_value': contract_value,
            'start_date': start_date
        })
    
    def get_contract_value(self):
        """Get contract value"""
        return st.session_state.contract_settings.get('contract_value', 0)
    
    def get_contract_start_date(self):
        """Get contract start date"""
        return st.session_state.contract_settings.get('start_date', datetime.now())
    
    def get_cost_summary(self):
        """Calculate comprehensive cost summary"""
        # Labor costs from employees
        employees_df = self.get_employees_df()
        total_labor = employees_df['salary'].sum() if not employees_df.empty else 0
        
        # ODC costs
        odc_df = self.get_odc_df()
        total_odc = odc_df['amount'].sum() if not odc_df.empty else 0
        
        # Indirect costs
        indirect_df = self.get_indirect_costs_df()
        total_indirect = indirect_df['total'].sum() if not indirect_df.empty else 0
        
        # Contract value
        contract_value = self.get_contract_value()
        
        return {
            'total_labor': total_labor,
            'total_odc': total_odc,
            'total_indirect': total_indirect,
            'contract_value': contract_value,
            'labor_variance': 0,  # Can be calculated based on budget vs actual
            'odc_variance': 0,
            'indirect_variance': 0
        }
    
    def get_monthly_costs(self):
        """Get monthly cost breakdown"""
        # This is a simplified version - in practice you'd break down by actual months
        data = []
        for i in range(12):
            month = f"2024-{i+1:02d}"
            data.append({
                'month': month,
                'labor': 50000 + (i * 2000),
                'odc': 8000 + (i * 500),
                'indirect': 25000 + (i * 1000)
            })
        return pd.DataFrame(data)
    
    # Enhanced Employee Management Methods
    
    def add_enhanced_employee(self, employee_data):
        """Add a new enhanced employee with LCAT and financial data"""
        employee_data['id'] = len(st.session_state.enhanced_employees) + 1
        employee_data['date_added'] = datetime.now()
        st.session_state.enhanced_employees.append(employee_data)
    
    def get_enhanced_employees_df(self):
        """Return enhanced employees as DataFrame"""
        if not st.session_state.enhanced_employees:
            return pd.DataFrame()
        return pd.DataFrame(st.session_state.enhanced_employees)
    
    def get_team_cost_summary(self):
        """Get comprehensive team cost summary"""
        enhanced_df = self.get_enhanced_employees_df()
        
        if enhanced_df.empty:
            return {
                'total_priced_salary': 0,
                'total_current_salary': 0,
                'total_monthly_hours': 0,
                'average_hourly_rate': 0,
                'team_size': 0,
                'cost_variance': 0
            }
        
        total_priced = enhanced_df['priced_salary'].sum()
        total_current = enhanced_df['current_salary'].sum()
        total_hours = enhanced_df['hours_per_month'].sum()
        
        return {
            'total_priced_salary': total_priced,
            'total_current_salary': total_current,
            'total_monthly_hours': total_hours,
            'average_hourly_rate': (total_current / 12 / total_hours) if total_hours > 0 else 0,
            'team_size': len(enhanced_df),
            'cost_variance': total_current - total_priced,
            'cost_variance_pct': ((total_current - total_priced) / total_priced * 100) if total_priced > 0 else 0
        }
    
    def get_monthly_burn_rate(self):
        """Calculate monthly burn rate"""
        cost_summary = self.get_cost_summary()
        total_costs = cost_summary['total_labor'] + cost_summary['total_odc'] + cost_summary['total_indirect']
        return total_costs / 12  # Simplified - divide by 12 months
    
    def get_pl_summary(self):
        """Get profit and loss summary"""
        cost_summary = self.get_cost_summary()
        
        return {
            'contract_value': cost_summary['contract_value'],
            'labor_costs': cost_summary['total_labor'],
            'odc_costs': cost_summary['total_odc'],
            'indirect_costs': cost_summary['total_indirect'],
            'total_costs': cost_summary['total_labor'] + cost_summary['total_odc'] + cost_summary['total_indirect']
        }
    
    def get_monthly_pl_data(self):
        """Get monthly P&L data for trending"""
        data = []
        cumulative_pl = 0
        contract_value = self.get_contract_value()
        monthly_revenue = contract_value / 12  # Simplified
        
        for i in range(12):
            month = f"2024-{i+1:02d}"
            labor = 50000 + (i * 2000)
            odc = 8000 + (i * 500)
            indirect = 25000 + (i * 1000)
            monthly_costs = labor + odc + indirect
            monthly_pl = monthly_revenue - monthly_costs
            cumulative_pl += monthly_pl
            
            data.append({
                'period': month,
                'labor': labor,
                'odc': odc,
                'indirect': indirect,
                'revenue': monthly_revenue,
                'monthly_pl': monthly_pl,
                'cumulative_pl': cumulative_pl
            })
        
        return pd.DataFrame(data)
    
    # Enhanced Employee Management Methods
    
    def add_enhanced_employee(self, employee_data):
        """Add a new enhanced employee with LCAT and financial data"""
        employee_data['id'] = len(st.session_state.enhanced_employees) + 1
        employee_data['date_added'] = datetime.now()
        st.session_state.enhanced_employees.append(employee_data)
    
    def get_enhanced_employees_df(self):
        """Return enhanced employees as DataFrame"""
        if not st.session_state.enhanced_employees:
            return pd.DataFrame()
        return pd.DataFrame(st.session_state.enhanced_employees)
    
    def get_team_cost_summary(self):
        """Get comprehensive team cost summary"""
        enhanced_df = self.get_enhanced_employees_df()
        
        if enhanced_df.empty:
            return {
                'total_priced_salary': 0,
                'total_current_salary': 0,
                'total_monthly_hours': 0,
                'average_hourly_rate': 0,
                'team_size': 0,
                'cost_variance': 0
            }
        
        total_priced = enhanced_df['priced_salary'].sum()
        total_current = enhanced_df['current_salary'].sum()
        total_hours = enhanced_df['hours_per_month'].sum()
        
        return {
            'total_priced_salary': total_priced,
            'total_current_salary': total_current,
            'total_monthly_hours': total_hours,
            'average_hourly_rate': (total_current / 12 / total_hours) if total_hours > 0 else 0,
            'team_size': len(enhanced_df),
            'cost_variance': total_current - total_priced,
            'cost_variance_pct': ((total_current - total_priced) / total_priced * 100) if total_priced > 0 else 0
        }
