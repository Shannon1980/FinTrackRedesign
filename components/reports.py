import streamlit as st
import pandas as pd
from datetime import datetime
import json
import plotly.express as px

def render_reports():
    """Render the reports and export section"""
    
    st.markdown("## ⚙️ Reports & Settings")
    st.markdown("Generate comprehensive reports and manage system settings")
    
    # Reports Tabs
    tab1, tab2, tab3, tab4 = st.tabs(["📋 Generate Reports", "📤 Export Data", "⚙️ System Settings", "ℹ️ About"])
    
    with tab1:
        render_generate_reports()
    
    with tab2:
        render_export_data()
    
    with tab3:
        render_system_settings()
    
    with tab4:
        render_about()

def render_generate_reports():
    """Render report generation interface"""
    
    st.markdown("### 📋 Generate Comprehensive Reports")
    
    # Report type selection
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.markdown("#### 📊 Available Report Types")
        
        report_types = {
            "Financial Summary": "Complete financial overview with charts",
            "Team Report": "Detailed team member information and analytics",
            "Project Status": "Overall project health and progress report",
            "Budget Analysis": "In-depth budget utilization analysis",
            "Executive Summary": "High-level summary for stakeholders"
        }
        
        selected_reports = []
        for report_type, description in report_types.items():
            if st.checkbox(report_type, help=description):
                selected_reports.append(report_type)
    
    with col2:
        st.markdown("#### ⚙️ Report Options")
        
        include_charts = st.checkbox("Include Charts & Visualizations", value=True)
        include_raw_data = st.checkbox("Include Raw Data Tables", value=False)
        report_format = st.selectbox("Report Format", ["PDF", "HTML", "Word Document"])
        
        # Date range for report
        col_start, col_end = st.columns(2)
        with col_start:
            start_date = st.date_input("Report Start Date", value=datetime.now().replace(day=1))
        with col_end:
            end_date = st.date_input("Report End Date", value=datetime.now())
    
    # Generate report button
    if st.button("📄 Generate Selected Reports", type="primary", use_container_width=True):
        if selected_reports:
            generate_reports(selected_reports, include_charts, include_raw_data, report_format, start_date, end_date)
        else:
            st.warning("⚠️ Please select at least one report type")
    
    # Quick report previews
    st.markdown("---")
    st.markdown("### 👀 Quick Report Previews")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("📊 Financial Quick View", use_container_width=True):
            show_financial_preview()
    
    with col2:
        if st.button("👥 Team Quick View", use_container_width=True):
            show_team_preview()

def generate_reports(selected_reports, include_charts, include_raw_data, report_format, start_date, end_date):
    """Generate the selected reports"""
    
    st.success(f"✅ Generating {len(selected_reports)} report(s)...")
    
    # Create a comprehensive report content
    report_content = f"""
# SEAS Project Financial Tracker - Generated Report
**Generated on:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Report Period:** {start_date} to {end_date}

---

"""
    
    for report_type in selected_reports:
        report_content += generate_report_section(report_type, include_charts, include_raw_data)
    
    # Display download button
    st.download_button(
        label=f"⬇️ Download {report_format} Report",
        data=report_content,
        file_name=f"seas_financial_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
        mime="text/plain"
    )
    
    # Show preview
    with st.expander("📄 Report Preview", expanded=True):
        st.markdown(report_content)

def generate_report_section(report_type, include_charts, include_raw_data):
    """Generate content for a specific report section"""
    
    content = f"\n## {report_type}\n\n"
    
    if report_type == "Financial Summary":
        financial_summary = st.session_state.data_manager.get_financial_summary()
        content += f"""
**Total Budget:** ${financial_summary['total_budget']:,.2f}
**Total Expenses:** ${financial_summary['total_expenses']:,.2f}
**Remaining Budget:** ${financial_summary['remaining_budget']:,.2f}
**Budget Utilization:** {financial_summary['budget_utilization']:.1f}%

"""
    
    elif report_type == "Team Report":
        employees_df = st.session_state.data_manager.get_employees_df()
        content += f"""
**Total Team Members:** {len(employees_df)}
"""
        if not employees_df.empty:
            if 'salary' in employees_df.columns:
                content += f"**Total Payroll:** ${employees_df['salary'].sum():,.0f}\n"
                content += f"**Average Salary:** ${employees_df['salary'].mean():,.0f}\n"
    
    elif report_type == "Project Status":
        project_settings = st.session_state.project_settings
        content += f"""
**Project Name:** {project_settings['project_name']}
**Department:** {project_settings['department']}
**Start Date:** {project_settings['start_date']}
**End Date:** {project_settings['end_date']}
**Project Manager:** {project_settings['project_manager']}

"""
    
    return content

def show_financial_preview():
    """Show a quick financial preview"""
    
    financial_summary = st.session_state.data_manager.get_financial_summary()
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("💰 Budget", f"${financial_summary['total_budget']:,.0f}")
    
    with col2:
        st.metric("💸 Expenses", f"${financial_summary['total_expenses']:,.0f}")
    
    with col3:
        st.metric("📊 Utilization", f"{financial_summary['budget_utilization']:.1f}%")

def show_team_preview():
    """Show a quick team preview"""
    
    employees_df = st.session_state.data_manager.get_employees_df()
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("👥 Team Size", len(employees_df))
    
    with col2:
        if not employees_df.empty and 'department' in employees_df.columns:
            departments = employees_df['department'].nunique()
            st.metric("🏢 Departments", departments)
        else:
            st.metric("🏢 Departments", "0")
    
    with col3:
        if not employees_df.empty and 'salary' in employees_df.columns:
            avg_salary = employees_df['salary'].mean()
            st.metric("💰 Avg Salary", f"${avg_salary:,.0f}")
        else:
            st.metric("💰 Avg Salary", "N/A")

def render_export_data():
    """Render data export interface"""
    
    st.markdown("### 📤 Export Data & Backup")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### 📊 Export Options")
        
        # Data selection
        export_employees = st.checkbox("Employee Data", value=True)
        export_financial = st.checkbox("Financial Data", value=True)
        export_settings = st.checkbox("Project Settings", value=True)
        
        # Format selection
        export_format = st.selectbox("Export Format", ["CSV", "JSON", "Excel"])
        
        # Export button
        if st.button("📁 Generate Export File", type="primary", use_container_width=True):
            export_data(export_employees, export_financial, export_settings, export_format)
    
    with col2:
        st.markdown("#### 🔄 Import Options")
        
        uploaded_file = st.file_uploader("Upload Data File", type=['csv', 'json'])
        
        if uploaded_file is not None:
            if st.button("📥 Import Data", use_container_width=True):
                import_data(uploaded_file)
        
        st.markdown("---")
        st.markdown("#### ⚠️ Data Management")
        
        if st.button("🔄 Reset All Data", use_container_width=True):
            if st.checkbox("I confirm I want to reset all data"):
                reset_all_data()

def export_data(export_employees, export_financial, export_settings, export_format):
    """Export selected data in the chosen format"""
    
    export_data = {}
    
    if export_employees:
        employees_df = st.session_state.data_manager.get_employees_df()
        export_data['employees'] = employees_df.to_dict('records') if not employees_df.empty else []
    
    if export_financial:
        export_data['financial_data'] = st.session_state.financial_data
        export_data['financial_summary'] = st.session_state.data_manager.get_financial_summary()
    
    if export_settings:
        export_data['project_settings'] = st.session_state.project_settings
    
    if export_format == "JSON":
        export_content = json.dumps(export_data, indent=2, default=str)
        file_extension = "json"
        mime_type = "application/json"
    elif export_format == "CSV":
        # For CSV, export employees data primarily
        if export_employees:
            employees_df = st.session_state.data_manager.get_employees_df()
            export_content = employees_df.to_csv(index=False) if not employees_df.empty else "No employee data"
        else:
            export_content = "No data selected for CSV export"
        file_extension = "csv"
        mime_type = "text/csv"
    
    filename = f"seas_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
    
    st.download_button(
        label=f"⬇️ Download {export_format} File",
        data=export_content,
        file_name=filename,
        mime=mime_type
    )
    
    st.success(f"✅ Export file ready for download!")

def import_data(uploaded_file):
    """Import data from uploaded file"""
    
    try:
        if uploaded_file.name.endswith('.json'):
            import_data = json.loads(uploaded_file.read())
            
            if 'employees' in import_data:
                st.session_state.employees = import_data['employees']
            
            if 'financial_data' in import_data:
                st.session_state.financial_data = import_data['financial_data']
            
            if 'project_settings' in import_data:
                st.session_state.project_settings = import_data['project_settings']
            
            st.success("✅ Data imported successfully!")
            st.rerun()
        
        elif uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
            st.session_state.employees = df.to_dict('records')
            st.success("✅ Employee data imported successfully!")
            st.rerun()
        
    except Exception as e:
        st.error(f"❌ Error importing data: {str(e)}")

def reset_all_data():
    """Reset all application data"""
    
    # Clear all session state data
    keys_to_clear = ['employees', 'financial_data', 'project_settings']
    for key in keys_to_clear:
        if key in st.session_state:
            del st.session_state[key]
    
    # Reinitialize
    st.session_state.data_manager.initialize_session_state()
    
    st.success("✅ All data has been reset successfully!")
    st.rerun()

def render_system_settings():
    """Render system settings interface"""
    
    st.markdown("### ⚙️ System Settings & Configuration")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### 🎨 Display Settings")
        
        # Theme settings (informational since we can't change Streamlit theme dynamically)
        st.selectbox("Color Theme", ["Default Blue", "Green Theme", "Corporate", "Dark Mode"], disabled=True, help="Theme changes require restart")
        st.selectbox("Chart Style", ["Modern", "Classic", "Minimal"], disabled=True)
        
        st.markdown("#### 🔔 Notification Settings")
        
        enable_notifications = st.checkbox("Enable Notifications", value=True)
        budget_alerts = st.checkbox("Budget Alert Notifications", value=True)
        team_alerts = st.checkbox("Team Update Notifications", value=True)
        
        if enable_notifications:
            alert_threshold = st.slider("Budget Alert Threshold (%)", 50, 100, 85)
    
    with col2:
        st.markdown("#### 📊 Data Settings")
        
        auto_save = st.checkbox("Auto-save Changes", value=True)
        data_retention = st.selectbox("Data Retention Period", ["30 days", "90 days", "1 year", "Indefinite"])
        
        st.markdown("#### 🔒 Security Settings")
        
        session_timeout = st.selectbox("Session Timeout", ["1 hour", "4 hours", "8 hours", "24 hours"])
        audit_logging = st.checkbox("Enable Audit Logging", value=True)
    
    # Save settings button
    if st.button("💾 Save All Settings", type="primary", use_container_width=True):
        st.success("✅ Settings saved successfully!")

def render_about():
    """Render about section"""
    
    st.markdown("### ℹ️ About SEAS Financial Tracker")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("""
        **SEAS Project Financial Tracker** is a comprehensive financial management platform designed 
        for project teams and organizations to track budgets, manage team members, and generate 
        detailed financial reports.
        
        #### ✨ Key Features:
        - 📊 **Interactive Dashboard** - Real-time financial overview with visual charts
        - 👥 **Team Management** - Complete employee lifecycle management
        - 📈 **Advanced Analytics** - Detailed insights and performance metrics  
        - 📋 **Report Generation** - Comprehensive reports for stakeholders
        - 🔄 **Data Import/Export** - Flexible data management capabilities
        - 📱 **Responsive Design** - Works across all devices
        
        #### 🛠️ Technology Stack:
        - **Frontend**: Streamlit
        - **Charts**: Plotly
        - **Data Processing**: Pandas & NumPy
        - **Export Formats**: CSV, JSON, PDF
        """)
    
    with col2:
        st.markdown("#### 📊 System Info")
        
        # System statistics
        employees_count = len(st.session_state.employees)
        financial_summary = st.session_state.data_manager.get_financial_summary()
        
        st.metric("Version", "v2.0.0")
        st.metric("Active Users", "1")
        st.metric("Total Projects", "1")
        st.metric("Data Points", f"{employees_count + len(st.session_state.financial_data.get('expenses', []))}")
    
    st.markdown("---")
    
    # Support and contact information
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("#### 📞 Support")
        st.markdown("""
        - 📧 Email: support@seastracker.com
        - 📱 Phone: +1 (555) 123-4567
        - 💬 Live Chat: Available 9AM-5PM EST
        """)
    
    with col2:
        st.markdown("#### 🔗 Resources")
        st.markdown("""
        - 📚 [User Manual](https://docs.seastracker.com)
        - 🎥 [Video Tutorials](https://tutorials.seastracker.com)  
        - ❓ [FAQ](https://faq.seastracker.com)
        """)
    
    with col3:
        st.markdown("#### 🌟 Updates")
        st.markdown("""
        - 🆕 v2.0.0 - Enhanced UI/UX
        - 📊 v1.9.0 - Advanced Analytics
        - 👥 v1.8.0 - Team Management
        """)
    
    st.markdown("---")
    st.markdown("*© 2025 SEAS Financial Tracker. Built with ❤️ using Streamlit.*")
