import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime, timedelta
import numpy as np

def render_analytics():
    """Render the analytics and reports section"""
    
    st.markdown("## 📈 Analytics & Reports")
    st.markdown("Comprehensive financial analytics and project insights")
    
    # Analytics Tabs
    tab1, tab2, tab3, tab4 = st.tabs(["💰 Financial Analytics", "📊 Project Performance", "👥 Team Insights", "📈 Trends & Forecasting"])
    
    with tab1:
        render_financial_analytics()
    
    with tab2:
        render_project_performance()
    
    with tab3:
        render_team_insights()
    
    with tab4:
        render_trends_forecasting()

def render_financial_analytics():
    """Render financial analytics section"""
    
    st.markdown("### 💰 Financial Analytics")
    
    financial_summary = st.session_state.data_manager.get_financial_summary()
    
    # Financial Health Score
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        # Calculate financial health score (0-100)
        budget_util = financial_summary['budget_utilization']
        if budget_util <= 75:
            health_score = 100 - (budget_util * 0.4)
            health_color = "#28a745"
            health_status = "Excellent"
        elif budget_util <= 90:
            health_score = 85 - ((budget_util - 75) * 2)
            health_color = "#ffc107"
            health_status = "Good"
        elif budget_util <= 100:
            health_score = 70 - ((budget_util - 90) * 3)
            health_color = "#fd7e14"
            health_status = "Caution"
        else:
            health_score = max(0, 40 - ((budget_util - 100) * 2))
            health_color = "#dc3545"
            health_status = "Critical"
        
        # Create gauge chart for financial health
        fig_gauge = go.Figure(go.Indicator(
            mode = "gauge+number+delta",
            value = health_score,
            domain = {'x': [0, 1], 'y': [0, 1]},
            title = {'text': "Financial Health Score"},
            delta = {'reference': 80},
            gauge = {
                'axis': {'range': [None, 100]},
                'bar': {'color': health_color},
                'steps': [
                    {'range': [0, 50], 'color': "lightgray"},
                    {'range': [50, 80], 'color': "gray"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 90
                }
            }
        ))
        
        fig_gauge.update_layout(height=300)
        st.plotly_chart(fig_gauge, use_container_width=True)
    
    with col2:
        st.metric("Health Status", health_status)
        st.metric("Score", f"{health_score:.0f}/100")
    
    with col3:
        st.metric("Budget Utilization", f"{budget_util:.1f}%")
        st.metric("Remaining Days", "N/A")  # Could calculate from project timeline
    
    # Expense breakdown
    st.markdown("---")
    st.markdown("### 💸 Expense Breakdown & Analysis")
    
    expense_data = st.session_state.data_manager.get_expense_by_category()
    
    if not expense_data.empty:
        col1, col2 = st.columns(2)
        
        with col1:
            # Expense pie chart
            fig_expense = px.pie(
                values=expense_data.values,
                names=expense_data.index,
                title="Expense Distribution by Category",
                color_discrete_sequence=['#dc3545', '#ffc107', '#007bff', '#28a745', '#6c757d']
            )
            st.plotly_chart(fig_expense, use_container_width=True)
        
        with col2:
            # Top spending categories
            st.markdown("**Top Spending Categories**")
            for i, (category, amount) in enumerate(expense_data.sort_values(ascending=False).head(5).items()):
                percentage = (amount / expense_data.sum()) * 100
                st.markdown(f"{i+1}. **{category}**: ${amount:,.2f} ({percentage:.1f}%)")
    else:
        st.info("No expense data available yet. Add some expenses to see analytics.")
    
    # Cost per employee analysis
    employees_df = st.session_state.data_manager.get_employees_df()
    if not employees_df.empty and not expense_data.empty:
        st.markdown("---")
        st.markdown("### 👥 Cost Per Employee Analysis")
        
        total_expenses = expense_data.sum()
        employee_count = len(employees_df)
        cost_per_employee = total_expenses / employee_count if employee_count > 0 else 0
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Cost per Employee", f"${cost_per_employee:,.2f}")
        with col2:
            st.metric("Total Team Size", employee_count)
        with col3:
            st.metric("Total Expenses", f"${total_expenses:,.2f}")

def render_project_performance():
    """Render project performance analytics"""
    
    st.markdown("### 📊 Project Performance Dashboard")
    
    # Project timeline progress
    project_settings = st.session_state.project_settings
    start_date = project_settings['start_date']
    end_date = project_settings['end_date']
    current_date = datetime.now()
    
    # Calculate project progress
    total_days = (end_date - start_date).days
    elapsed_days = (current_date - start_date).days
    progress_percentage = min(max((elapsed_days / total_days) * 100, 0), 100) if total_days > 0 else 0
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Project Progress", f"{progress_percentage:.1f}%")
    
    with col2:
        st.metric("Days Elapsed", elapsed_days)
    
    with col3:
        remaining_days = max(0, (end_date - current_date).days)
        st.metric("Days Remaining", remaining_days)
    
    with col4:
        st.metric("Total Duration", f"{total_days} days")
    
    # Project progress bar
    st.markdown("**Project Timeline Progress**")
    st.progress(progress_percentage / 100)
    
    # Performance indicators
    st.markdown("---")
    st.markdown("### 🎯 Key Performance Indicators")
    
    financial_summary = st.session_state.data_manager.get_financial_summary()
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Budget performance vs time performance
        budget_progress = financial_summary['budget_utilization']
        time_progress = progress_percentage
        
        performance_data = pd.DataFrame({
            'Metric': ['Budget Utilization', 'Time Progress'],
            'Percentage': [budget_progress, time_progress]
        })
        
        fig_performance = px.bar(
            performance_data,
            x='Metric',
            y='Percentage',
            title="Budget vs Time Progress",
            color='Percentage',
            color_continuous_scale=['#28a745', '#ffc107', '#dc3545']
        )
        
        fig_performance.add_hline(y=100, line_dash="dash", line_color="red", 
                                annotation_text="Target Line")
        
        st.plotly_chart(fig_performance, use_container_width=True)
    
    with col2:
        # Performance efficiency score
        if time_progress > 0:
            efficiency_score = (budget_progress / time_progress) * 100
        else:
            efficiency_score = 0
        
        if efficiency_score <= 100:
            efficiency_status = "On Track"
            efficiency_color = "#28a745"
        elif efficiency_score <= 120:
            efficiency_status = "Slightly Behind"
            efficiency_color = "#ffc107"
        else:
            efficiency_status = "Behind Schedule"
            efficiency_color = "#dc3545"
        
        st.metric("Efficiency Score", f"{efficiency_score:.1f}")
        st.markdown(f"**Status**: {efficiency_status}")
        
        # Risk assessment
        st.markdown("**Risk Assessment**")
        if budget_progress > 100:
            st.error("🔴 Budget overrun risk")
        elif budget_progress > 85:
            st.warning("🟡 Monitor budget closely")
        else:
            st.success("🟢 Budget on track")

def render_team_insights():
    """Render team insights and analytics"""
    
    employees_df = st.session_state.data_manager.get_employees_df()
    
    if employees_df.empty:
        st.info("No team data available for insights.")
        return
    
    st.markdown("### 👥 Team Insights & Analytics")
    
    # Team composition analysis
    col1, col2 = st.columns(2)
    
    with col1:
        if 'department' in employees_df.columns:
            dept_distribution = employees_df['department'].value_counts()
            fig_dept = px.pie(
                values=dept_distribution.values,
                names=dept_distribution.index,
                title="Team Distribution by Department",
                color_discrete_sequence=px.colors.qualitative.Set3
            )
            st.plotly_chart(fig_dept, use_container_width=True)
    
    with col2:
        if 'status' in employees_df.columns:
            status_distribution = employees_df['status'].value_counts()
            fig_status = px.bar(
                x=status_distribution.index,
                y=status_distribution.values,
                title="Employee Status Distribution",
                color_discrete_sequence=['#007bff']
            )
            st.plotly_chart(fig_status, use_container_width=True)
    
    # Team productivity metrics
    st.markdown("---")
    st.markdown("### 📈 Team Productivity Metrics")
    
    financial_summary = st.session_state.data_manager.get_financial_summary()
    
    if 'salary' in employees_df.columns:
        total_team_cost = employees_df['salary'].sum()
        avg_employee_cost = employees_df['salary'].mean()
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Total Team Cost", f"${total_team_cost:,.0f}")
        
        with col2:
            st.metric("Avg Employee Cost", f"${avg_employee_cost:,.0f}")
        
        with col3:
            if financial_summary['total_budget'] > 0:
                team_budget_ratio = (total_team_cost / financial_summary['total_budget']) * 100
                st.metric("Team Cost % of Budget", f"{team_budget_ratio:.1f}%")

def render_trends_forecasting():
    """Render trends and forecasting analytics"""
    
    st.markdown("### 📈 Trends & Forecasting")
    
    # Generate sample trend data for demonstration
    financial_summary = st.session_state.data_manager.get_financial_summary()
    
    # Monthly spending projection
    st.markdown("#### 📊 Spending Trend Analysis")
    
    # Create sample monthly data
    months = pd.date_range(start='2025-01-01', end='2025-12-31', freq='M')
    current_month_spending = financial_summary['total_expenses'] / max(1, len(months))
    
    # Generate trend data
    monthly_spending = []
    base_spending = current_month_spending
    
    for i, month in enumerate(months):
        # Add some realistic variation
        variation = np.random.normal(0, base_spending * 0.1)
        seasonal_factor = 1 + 0.1 * np.sin(2 * np.pi * i / 12)  # Seasonal variation
        spending = base_spending * seasonal_factor + variation
        monthly_spending.append(max(0, spending))
    
    trend_df = pd.DataFrame({
        'Month': months,
        'Spending': monthly_spending
    })
    
    # Create trend chart
    fig_trend = px.line(
        trend_df,
        x='Month',
        y='Spending',
        title='Monthly Spending Trend (Projected)',
        markers=True
    )
    
    fig_trend.add_hline(
        y=current_month_spending,
        line_dash="dash",
        line_color="red",
        annotation_text="Current Average"
    )
    
    st.plotly_chart(fig_trend, use_container_width=True)
    
    # Forecasting metrics
    st.markdown("---")
    st.markdown("#### 🔮 Budget Forecasting")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        projected_total = sum(monthly_spending)
        st.metric("Projected Annual Spending", f"${projected_total:,.0f}")
    
    with col2:
        budget_variance = projected_total - financial_summary['total_budget']
        variance_percentage = (budget_variance / financial_summary['total_budget']) * 100 if financial_summary['total_budget'] > 0 else 0
        st.metric("Budget Variance", f"${budget_variance:,.0f}", f"{variance_percentage:+.1f}%")
    
    with col3:
        completion_date = st.session_state.project_settings['end_date']
        days_to_completion = (completion_date - datetime.now()).days
        st.metric("Days to Completion", days_to_completion)
    
    # Risk indicators
    st.markdown("---")
    st.markdown("#### ⚠️ Risk Indicators")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**Budget Risks:**")
        if variance_percentage > 10:
            st.error("🔴 High risk of budget overrun")
        elif variance_percentage > 5:
            st.warning("🟡 Moderate budget risk")
        else:
            st.success("🟢 Budget risk is low")
    
    with col2:
        st.markdown("**Timeline Risks:**")
        if days_to_completion < 30:
            st.error("🔴 Project deadline approaching")
        elif days_to_completion < 90:
            st.warning("🟡 Monitor timeline closely")
        else:
            st.success("🟢 Timeline on track")
    
    # Recommendations
    st.markdown("---")
    st.markdown("#### 💡 Recommendations")
    
    recommendations = []
    
    if financial_summary['budget_utilization'] > 90:
        recommendations.append("🔍 Review and optimize spending in high-cost categories")
    
    if variance_percentage > 5:
        recommendations.append("📊 Consider budget reallocation or scope adjustments")
    
    if len(st.session_state.employees) == 0:
        recommendations.append("👥 Add team members to improve project tracking accuracy")
    
    if not recommendations:
        recommendations.append("✅ Project is on track, continue current practices")
    
    for rec in recommendations:
        st.markdown(f"• {rec}")
