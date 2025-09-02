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
    
    # Enhanced KPI Cards with better styling
    st.markdown("""
    <style>
    .metric-card {
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        padding: 1.5rem;
        border-radius: 15px;
        border: 2px solid #e9ecef;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        text-align: center;
        margin-bottom: 1rem;
        transition: transform 0.2s ease;
    }
    .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
    .metric-icon {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
    }
    .metric-title {
        font-size: 0.9rem;
        font-weight: 600;
        color: #6c757d;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
    .metric-delta {
        font-size: 0.85rem;
        font-weight: 500;
        padding: 0.25rem 0.5rem;
        border-radius: 20px;
        display: inline-block;
    }
    .budget-positive { color: #1e7e34; background-color: #d4edda; }
    .budget-negative { color: #721c24; background-color: #f8d7da; }
    .budget-warning { color: #856404; background-color: #fff3cd; }
    .budget-neutral { color: #0c5460; background-color: #d1ecf1; }
    </style>
    """, unsafe_allow_html=True)
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-icon">💰</div>
            <div class="metric-title">Total Budget</div>
            <div class="metric-value" style="color: #007bff;">${financial_summary['total_budget']:,.0f}</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        expense_color = "#dc3545" if financial_summary['total_expenses'] > 0 else "#6c757d"
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-icon">💸</div>
            <div class="metric-title">Total Expenses</div>
            <div class="metric-value" style="color: {expense_color};">${financial_summary['total_expenses']:,.0f}</div>
            <div class="metric-delta budget-negative">{financial_summary['budget_utilization']:.1f}% of budget</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        remaining_color = "#28a745" if financial_summary['remaining_budget'] >= 0 else "#dc3545"
        remaining_class = "budget-positive" if financial_summary['remaining_budget'] >= 0 else "budget-negative"
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-icon">💵</div>
            <div class="metric-title">Remaining Budget</div>
            <div class="metric-value" style="color: {remaining_color};">${financial_summary['remaining_budget']:,.0f}</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        if financial_summary['budget_utilization'] <= 70:
            util_color = "#28a745"
            util_class = "budget-positive"
        elif financial_summary['budget_utilization'] <= 90:
            util_color = "#ffc107"
            util_class = "budget-warning"
        else:
            util_color = "#dc3545"
            util_class = "budget-negative"
            
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-icon">📊</div>
            <div class="metric-title">Budget Utilization</div>
            <div class="metric-value" style="color: {util_color};">{financial_summary['budget_utilization']:.1f}%</div>
            <div class="metric-delta {util_class}">
                {'On Track' if financial_summary['budget_utilization'] <= 85 else 'Monitor Closely' if financial_summary['budget_utilization'] <= 100 else 'Over Budget'}
            </div>
        </div>
        """, unsafe_allow_html=True)
    
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
