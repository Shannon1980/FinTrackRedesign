import streamlit as st
import pandas as pd
from datetime import datetime
import io
import openpyxl
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment

def render_team_management():
    """Render the team management interface"""
    
    st.markdown("## 👥 Team Management")
    st.markdown("Manage your project team members and their information")
    
    # Team Management Tabs
    tab1, tab2, tab3, tab4 = st.tabs(["➕ Add Employee", "📥 Import Team", "📋 Current Team", "📊 Team Analytics"])
    
    with tab1:
        render_add_employee_form()
    
    with tab2:
        render_import_team()
    
    with tab3:
        render_current_team()
    
    with tab4:
        render_team_analytics()

def render_add_employee_form():
    """Render the add employee form with improved layout"""
    
    st.markdown("### ➕ Add New Team Member")
    
    with st.form("add_employee_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            employee_name = st.text_input("Employee Name *", placeholder="Enter full name")
            labor_category = st.selectbox(
                "Labor Category *",
                ["Senior Engineer", "Junior Engineer", "Project Manager", "Analyst", "Consultant", "Intern"]
            )
            department = st.selectbox(
                "Department",
                ["Engineering", "Marketing", "Sales", "Operations", "HR", "Finance"]
            )
            status = st.selectbox(
                "Status",
                ["Active", "On Leave", "Contractor", "Part-time"]
            )
        
        with col2:
            salary = st.number_input("Annual Salary ($)", min_value=0, step=1000, value=75000)
            start_date = st.date_input("Start Date", value=datetime.now())
            location = st.text_input("Location", placeholder="e.g., New York, Remote")
            manager = st.text_input("Manager", placeholder="Direct manager name")
        
        # Additional Information
        st.markdown("**Additional Information**")
        skills = st.text_area("Skills & Expertise", placeholder="List key skills, separated by commas")
        notes = st.text_area("Notes", placeholder="Any additional notes or comments")
        
        # Form submission
        col1, col2, col3 = st.columns([1, 1, 2])
        
        with col1:
            submitted = st.form_submit_button("➕ Add Employee", type="primary")
        
        with col2:
            clear = st.form_submit_button("🗑️ Clear Form")
        
        if submitted:
            if employee_name and labor_category:
                employee_data = {
                    'employee_name': employee_name,
                    'labor_category': labor_category,
                    'department': department,
                    'status': status,
                    'salary': salary,
                    'start_date': start_date,
                    'location': location,
                    'manager': manager,
                    'skills': skills,
                    'notes': notes
                }
                
                st.session_state.data_manager.add_employee(employee_data)
                st.success(f"✅ Employee {employee_name} added successfully!")
                st.rerun()
            else:
                st.error("❌ Please fill in all required fields marked with *")
        
        if clear:
            st.rerun()

def render_current_team():
    """Render current team overview with enhanced display"""
    
    employees_df = st.session_state.data_manager.get_employees_df()
    
    if employees_df.empty:
        st.info("👥 No employees found. Add some team members using the form above.")
        return
    
    st.markdown(f"### 📋 Current Team ({len(employees_df)} members)")
    
    # Search and filter options
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        search_term = st.text_input("🔍 Search employees", placeholder="Search by name, department, or skills...")
    
    with col2:
        if 'department' in employees_df.columns:
            departments = ['All'] + list(employees_df['department'].unique())
            selected_dept = st.selectbox("Filter by Department", departments)
        else:
            selected_dept = 'All'
    
    with col3:
        if 'status' in employees_df.columns:
            statuses = ['All'] + list(employees_df['status'].unique())
            selected_status = st.selectbox("Filter by Status", statuses)
        else:
            selected_status = 'All'
    
    # Apply filters
    filtered_df = employees_df.copy()
    
    if search_term:
        mask = (
            filtered_df['employee_name'].str.contains(search_term, case=False, na=False) |
            filtered_df['department'].str.contains(search_term, case=False, na=False) |
            filtered_df['skills'].str.contains(search_term, case=False, na=False)
        )
        filtered_df = filtered_df[mask]
    
    if selected_dept != 'All':
        filtered_df = filtered_df[filtered_df['department'] == selected_dept]
    
    if selected_status != 'All':
        filtered_df = filtered_df[filtered_df['status'] == selected_status]
    
    # Display results
    st.markdown(f"**Showing {len(filtered_df)} of {len(employees_df)} employees**")
    
    # Employee cards
    for index, employee in filtered_df.iterrows():
        with st.expander(f"👤 {employee['employee_name']} - {employee['labor_category']}", expanded=False):
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown(f"**Department:** {employee['department']}")
                st.markdown(f"**Status:** {employee['status']}")
                st.markdown(f"**Location:** {employee.get('location', 'Not specified')}")
                st.markdown(f"**Manager:** {employee.get('manager', 'Not assigned')}")
            
            with col2:
                st.markdown(f"**Salary:** ${employee['salary']:,.0f}")
                st.markdown(f"**Start Date:** {employee['start_date']}")
                if employee.get('skills'):
                    st.markdown(f"**Skills:** {employee['skills']}")
                if employee.get('notes'):
                    st.markdown(f"**Notes:** {employee['notes']}")
    
    # Bulk operations
    st.markdown("---")
    st.markdown("### 🛠️ Bulk Operations")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📊 Export Team Data", use_container_width=True):
            csv_data = filtered_df.to_csv(index=False)
            st.download_button(
                label="⬇️ Download CSV",
                data=csv_data,
                file_name=f"team_data_{datetime.now().strftime('%Y%m%d')}.csv",
                mime="text/csv"
            )
    
    with col2:
        if st.button("📧 Generate Team Report", use_container_width=True):
            st.info("📧 Team report generation feature coming soon!")
    
    with col3:
        if st.button("🔄 Refresh Data", use_container_width=True):
            st.rerun()

def render_team_analytics():
    """Render team analytics and insights"""
    
    employees_df = st.session_state.data_manager.get_employees_df()
    
    if employees_df.empty:
        st.info("📊 No data available for analytics. Add some employees first.")
        return
    
    st.markdown("### 📊 Team Analytics & Insights")
    
    # Key metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        total_employees = len(employees_df)
        st.metric("👥 Total Employees", total_employees)
    
    with col2:
        if 'salary' in employees_df.columns:
            total_payroll = employees_df['salary'].sum()
            st.metric("💰 Total Payroll", f"${total_payroll:,.0f}")
        else:
            st.metric("💰 Total Payroll", "N/A")
    
    with col3:
        if 'department' in employees_df.columns:
            departments = employees_df['department'].nunique()
            st.metric("🏢 Departments", departments)
        else:
            st.metric("🏢 Departments", "N/A")
    
    with col4:
        if 'status' in employees_df.columns:
            active_employees = len(employees_df[employees_df['status'] == 'Active'])
            st.metric("✅ Active Employees", active_employees)
        else:
            st.metric("✅ Active Employees", "N/A")
    
    # Charts
    col1, col2 = st.columns(2)
    
    with col1:
        if 'department' in employees_df.columns:
            dept_counts = employees_df['department'].value_counts()
            fig_dept = px.pie(
                values=dept_counts.values,
                names=dept_counts.index,
                title="Team Distribution by Department",
                color_discrete_sequence=['#007bff', '#28a745', '#ffc107', '#dc3545', '#6c757d']
            )
            st.plotly_chart(fig_dept, use_container_width=True)
    
    with col2:
        if 'labor_category' in employees_df.columns:
            category_counts = employees_df['labor_category'].value_counts()
            fig_category = px.bar(
                x=category_counts.index,
                y=category_counts.values,
                title="Team by Labor Category",
                color_discrete_sequence=['#007bff']
            )
            fig_category.update_layout(xaxis_title="Category", yaxis_title="Count")
            st.plotly_chart(fig_category, use_container_width=True)
    
    # Salary analysis
    if 'salary' in employees_df.columns:
        st.markdown("---")
        st.markdown("### 💰 Salary Analysis")
        
        col1, col2 = st.columns(2)
        
        with col1:
            avg_salary = employees_df['salary'].mean()
            median_salary = employees_df['salary'].median()
            min_salary = employees_df['salary'].min()
            max_salary = employees_df['salary'].max()
            
            st.metric("Average Salary", f"${avg_salary:,.0f}")
            st.metric("Median Salary", f"${median_salary:,.0f}")
            st.metric("Salary Range", f"${min_salary:,.0f} - ${max_salary:,.0f}")
        
        with col2:
            # Salary distribution histogram
            fig_salary = px.histogram(
                employees_df,
                x='salary',
                title="Salary Distribution",
                nbins=10,
                color_discrete_sequence=['#007bff']
            )
            fig_salary.update_layout(xaxis_title="Salary ($)", yaxis_title="Number of Employees")
            st.plotly_chart(fig_salary, use_container_width=True)
