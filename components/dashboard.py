import streamlit as st
import plotly.express as px
from utils.chart_helpers import ChartHelpers

def render_dashboard():
    """Render the main dashboard overview"""
    
    # Welcome section
    st.markdown("## 🏠 Welcome to SEAS Financial Tracker")
    st.markdown("Your comprehensive project financial management solution")
    
    # Get financial summary
    financial_summary = st.session_state.data_manager.get_financial_summary()
    
    # KPI Cards Row
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="💰 Total Budget",
            value=f"${financial_summary['total_budget']:,.2f}",
            delta=None
        )
    
    with col2:
        st.metric(
            label="💸 Total Expenses", 
            value=f"${financial_summary['total_expenses']:,.2f}",
            delta=f"-{financial_summary['budget_utilization']:.1f}% of budget"
        )
    
    with col3:
        remaining_color = "normal" if financial_summary['remaining_budget'] >= 0 else "inverse"
        st.metric(
            label="💵 Remaining Budget",
            value=f"${financial_summary['remaining_budget']:,.2f}",
            delta=None
        )
    
    with col4:
        utilization_delta = f"{financial_summary['budget_utilization']:.1f}%"
        utilization_color = "normal" if financial_summary['budget_utilization'] <= 100 else "inverse"
        st.metric(
            label="📊 Budget Utilization",
            value=f"{financial_summary['budget_utilization']:.1f}%",
            delta=utilization_delta
        )
    
    st.markdown("---")
    
    # Charts Section
    col1, col2 = st.columns([1, 1])
    
    with col1:
        # Budget allocation pie chart
        expense_data = st.session_state.data_manager.get_expense_by_category()
        pie_chart = ChartHelpers.create_budget_pie_chart(expense_data)
        st.plotly_chart(pie_chart, use_container_width=True)
    
    with col2:
        # Budget vs Actual bar chart
        bar_chart = ChartHelpers.create_budget_vs_actual_chart()
        st.plotly_chart(bar_chart, use_container_width=True)
    
    # Progress Bars Section
    st.markdown("## 📈 Budget Utilization Progress")
    
    progress_data = ChartHelpers.create_progress_bars()
    
    for item in progress_data:
        col1, col2, col3 = st.columns([2, 1, 1])
        
        with col1:
            # Color-coded progress bar
            if item['percentage'] <= 50:
                color = "#28a745"  # Green
            elif item['percentage'] <= 80:
                color = "#ffc107"  # Yellow
            else:
                color = "#dc3545"  # Red
            
            st.markdown(f"**{item['category']}**")
            st.progress(item['percentage'] / 100)
            
        with col2:
            st.metric("Budget", f"${item['budget']:,.0f}")
        
        with col3:
            st.metric("Spent", f"${item['actual']:,.0f}")
    
    # Timeline Section
    st.markdown("---")
    st.markdown("## 📅 Project Timeline")
    
    timeline_chart = ChartHelpers.create_timeline_chart()
    st.plotly_chart(timeline_chart, use_container_width=True)
    
    # Current Team Overview
    st.markdown("---")
    st.markdown("## 👥 Current Team Overview")
    
    employees_df = st.session_state.data_manager.get_employees_df()
    
    if not employees_df.empty:
        col1, col2, col3 = st.columns(3)
        
        with col1:
            total_employees = len(employees_df)
            st.metric("👨‍💼 Total Employees", total_employees)
        
        with col2:
            if 'salary' in employees_df.columns:
                avg_salary = employees_df['salary'].mean()
                st.metric("💰 Average Salary", f"${avg_salary:,.0f}")
            else:
                st.metric("💰 Average Salary", "N/A")
        
        with col3:
            if 'department' in employees_df.columns:
                departments = employees_df['department'].nunique()
                st.metric("🏢 Departments", departments)
            else:
                st.metric("🏢 Departments", "N/A")
        
        # Recent employees table
        st.markdown("### 📋 Recent Team Members")
        display_df = employees_df.head(5)[['employee_name', 'labor_category', 'status']].copy()
        st.dataframe(display_df, use_container_width=True)
        
    else:
        st.info("👥 No team members added yet. Go to the Team Management tab to add employees.")
    
    # Action Items
    st.markdown("---")
    st.markdown("## ⚡ Quick Actions")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("➕ Add New Employee", type="secondary", use_container_width=True):
            st.switch_page("Team Management")
    
    with col2:
        if st.button("💰 Record Expense", type="secondary", use_container_width=True):
            st.info("Use the sidebar 'Financial Parameters' section to quickly add expenses")
    
    with col3:
        if st.button("📊 View Detailed Reports", type="secondary", use_container_width=True):
            st.switch_page("Analytics & Reports")
