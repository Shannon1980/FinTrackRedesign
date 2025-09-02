import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import streamlit as st

class ChartHelpers:
    
    @staticmethod
    def create_budget_pie_chart(expense_data):
        """Create a pie chart for budget allocation by category"""
        if expense_data.empty:
            # Show budget categories if no expenses yet
            budget_cats = st.session_state.financial_data['budget_categories']
            fig = px.pie(
                values=list(budget_cats.values()),
                names=list(budget_cats.keys()),
                title="Budget Allocation by Category",
                color_discrete_sequence=['#28a745', '#007bff', '#ffc107', '#dc3545', '#6c757d']
            )
        else:
            fig = px.pie(
                values=expense_data.values,
                names=expense_data.index,
                title="Actual Expenses by Category",
                color_discrete_sequence=['#28a745', '#007bff', '#ffc107', '#dc3545', '#6c757d']
            )
        
        fig.update_layout(
            showlegend=True,
            height=400,
            margin=dict(t=50, b=50, l=50, r=50)
        )
        return fig
    
    @staticmethod
    def create_budget_vs_actual_chart():
        """Create a bar chart comparing budget vs actual expenses"""
        budget_cats = st.session_state.financial_data['budget_categories']
        expenses_df = pd.DataFrame(st.session_state.financial_data['expenses'])
        
        if not expenses_df.empty:
            actual_expenses = expenses_df.groupby('category')['amount'].sum()
        else:
            actual_expenses = pd.Series(dtype=float)
        
        categories = list(budget_cats.keys())
        budget_values = [budget_cats[cat] for cat in categories]
        actual_values = [actual_expenses.get(cat, 0) for cat in categories]
        
        fig = go.Figure(data=[
            go.Bar(name='Budget', x=categories, y=budget_values, marker_color='#007bff'),
            go.Bar(name='Actual', x=categories, y=actual_values, marker_color='#28a745')
        ])
        
        fig.update_layout(
            title="Budget vs Actual Expenses",
            barmode='group',
            height=400,
            xaxis_title="Category",
            yaxis_title="Amount ($)"
        )
        return fig
    
    @staticmethod
    def create_progress_bars():
        """Create progress bars for budget utilization"""
        budget_cats = st.session_state.financial_data['budget_categories']
        expenses_df = pd.DataFrame(st.session_state.financial_data['expenses'])
        
        if not expenses_df.empty:
            actual_expenses = expenses_df.groupby('category')['amount'].sum()
        else:
            actual_expenses = pd.Series(dtype=float)
        
        progress_data = []
        for category, budget in budget_cats.items():
            actual = actual_expenses.get(category, 0)
            percentage = (actual / budget * 100) if budget > 0 else 0
            progress_data.append({
                'category': category,
                'budget': budget,
                'actual': actual,
                'percentage': min(percentage, 100)  # Cap at 100%
            })
        
        return progress_data
    
    @staticmethod
    def create_timeline_chart():
        """Create a timeline chart for project progress"""
        # Generate sample timeline data based on project settings
        start_date = st.session_state.project_settings['start_date']
        end_date = st.session_state.project_settings['end_date']
        
        # Create sample milestones
        total_days = (end_date - start_date).days
        milestones = [
            {'task': 'Project Initiation', 'start': start_date, 'finish': start_date + pd.Timedelta(days=total_days*0.1)},
            {'task': 'Planning Phase', 'start': start_date + pd.Timedelta(days=total_days*0.05), 'finish': start_date + pd.Timedelta(days=total_days*0.25)},
            {'task': 'Execution Phase', 'start': start_date + pd.Timedelta(days=total_days*0.2), 'finish': start_date + pd.Timedelta(days=total_days*0.8)},
            {'task': 'Monitoring & Control', 'start': start_date + pd.Timedelta(days=total_days*0.3), 'finish': start_date + pd.Timedelta(days=total_days*0.9)},
            {'task': 'Project Closure', 'start': start_date + pd.Timedelta(days=total_days*0.85), 'finish': end_date}
        ]
        
        fig = px.timeline(
            milestones, 
            x_start="start", 
            x_end="finish", 
            y="task",
            title="Project Timeline",
            color_discrete_sequence=['#007bff']
        )
        
        fig.update_layout(height=300)
        return fig
