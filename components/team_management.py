import streamlit as st
import pandas as pd
from datetime import datetime
import io
import openpyxl
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment
import plotly.express as px

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

def render_import_team():
    """Render team import functionality with template download"""
    
    st.markdown("### 📥 Import Team Members & Contractors")
    st.markdown("Bulk import employees and contractors from Excel or CSV files")
    
    # Template Download Section
    st.markdown("#### 📋 Download Template")
    st.markdown("Download the employee template to ensure your data is formatted correctly")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("📊 Download Excel Template", type="primary", use_container_width=True):
            excel_template = create_employee_template('excel')
            st.download_button(
                label="⬇️ Download Excel Template",
                data=excel_template,
                file_name=f"employee_template_{datetime.now().strftime('%Y%m%d')}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
    
    with col2:
        if st.button("📄 Download CSV Template", type="secondary", use_container_width=True):
            csv_template = create_employee_template('csv')
            st.download_button(
                label="⬇️ Download CSV Template",
                data=csv_template,
                file_name=f"employee_template_{datetime.now().strftime('%Y%m%d')}.csv",
                mime="text/csv"
            )
    
    st.markdown("---")
    
    # File Upload Section
    st.markdown("#### 📤 Upload Employee Data")
    
    uploaded_file = st.file_uploader(
        "Choose your employee file",
        type=['xlsx', 'xls', 'csv'],
        help="Upload an Excel (.xlsx, .xls) or CSV file with employee data"
    )
    
    if uploaded_file is not None:
        try:
            # Process the uploaded file
            if uploaded_file.name.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(uploaded_file)
            else:
                df = pd.read_csv(uploaded_file)
            
            st.success(f"✅ File uploaded successfully! Found {len(df)} records")
            
            # Preview the data
            st.markdown("#### 👀 Data Preview")
            st.dataframe(df.head(10), use_container_width=True)
            
            # Enhanced validation with specific location feedback
            validation_results = validate_employee_data_detailed(df)
            
            if validation_results['missing_columns']:
                st.error(f"❌ Missing required columns: {', '.join(validation_results['missing_columns'])}")
                st.markdown("**Required columns:** employee_name, labor_category")
                st.markdown("**Optional columns:** department, status, salary, start_date, location, manager, skills, notes")
            else:
                # Show detailed validation results
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric("✅ Valid Records", validation_results['valid_count'])
                
                with col2:
                    st.metric("❌ Invalid Records", validation_results['invalid_count'])
                
                with col3:
                    st.metric("📥 Total Records", len(df))
                
                # Show specific error details
                if validation_results['errors']:
                    st.markdown("#### 🔍 Data Issues Found")
                    st.markdown("The following specific issues were found in your data:")
                    
                    for error in validation_results['errors']:
                        if error['type'] == 'missing_required':
                            st.error(f"**Row {error['row']+2}** (Excel row {error['row']+2}): Missing required field '{error['column']}' - Cell {get_excel_column_letter(error['col_index'])}{error['row']+2}")
                        elif error['type'] == 'invalid_salary':
                            st.warning(f"**Row {error['row']+2}** (Excel row {error['row']+2}): Invalid salary value '{error['value']}' in cell {get_excel_column_letter(error['col_index'])}{error['row']+2}")
                        elif error['type'] == 'invalid_date':
                            st.warning(f"**Row {error['row']+2}** (Excel row {error['row']+2}): Invalid date format '{error['value']}' in cell {get_excel_column_letter(error['col_index'])}{error['row']+2}")
                        elif error['type'] == 'duplicate_name':
                            st.warning(f"**Row {error['row']+2}** (Excel row {error['row']+2}): Duplicate employee name '{error['value']}' in cell {get_excel_column_letter(error['col_index'])}{error['row']+2}")
                    
                    if len(validation_results['errors']) > 10:
                        st.info(f"Showing first 10 errors. Total errors found: {len(validation_results['errors'])}")
                
                # Show column mapping
                st.markdown("#### 📋 Column Mapping")
                col_mapping_df = pd.DataFrame({
                    'Excel Column': [get_excel_column_letter(i) for i in range(len(df.columns))],
                    'Column Name': df.columns.tolist(),
                    'Data Type': [str(df[col].dtype) for col in df.columns],
                    'Sample Value': [str(df[col].iloc[0]) if len(df) > 0 else 'N/A' for col in df.columns]
                })
                st.dataframe(col_mapping_df, use_container_width=True)
                
                # Import options
                st.markdown("#### ⚙️ Import Options")
                
                col1, col2 = st.columns(2)
                
                with col1:
                    import_mode = st.selectbox(
                        "Import Mode",
                        ["Append to existing", "Replace all existing"],
                        help="Choose whether to add to current team or replace all data"
                    )
                
                with col2:
                    validate_data = st.checkbox("Validate data before import", value=True)
                
                # Import button
                if st.button("🚀 Import Employee Data", type="primary", use_container_width=True):
                    if import_employees_from_dataframe(df, import_mode, validate_data):
                        st.success(f"✅ Successfully imported {len(df)} employees!")
                        st.rerun()
                    else:
                        st.error("❌ Import failed. Please check your data format.")
        
        except Exception as e:
            st.error(f"❌ Error processing file: {str(e)}")
            st.markdown("**Common issues:**")
            st.markdown("- File format not supported")
            st.markdown("- Missing required columns")
            st.markdown("- Invalid data types")
    
    # Import Guidelines
    st.markdown("---")
    st.markdown("#### 📖 Import Guidelines")
    
    with st.expander("📋 Required Fields", expanded=False):
        st.markdown("""
        **Required columns:**
        - `employee_name`: Full name of the employee/contractor
        - `labor_category`: Job role (Senior Engineer, Junior Engineer, Project Manager, etc.)
        
        **Optional columns:**
        - `department`: Department name (Engineering, Marketing, Sales, etc.)
        - `status`: Employment status (Active, On Leave, Contractor, Part-time)
        - `salary`: Annual salary in USD
        - `start_date`: Employment start date (YYYY-MM-DD format)
        - `location`: Work location (e.g., New York, Remote)
        - `manager`: Direct manager name
        - `skills`: Comma-separated list of skills
        - `notes`: Additional notes or comments
        """)
    
    with st.expander("💡 Tips for Successful Import", expanded=False):
        st.markdown("""
        1. **Use the template**: Download our template to ensure correct formatting
        2. **Check data types**: Ensure salary is numeric, dates are in YYYY-MM-DD format
        3. **Validate names**: Employee names should be unique
        4. **Preview first**: Always review the data preview before importing
        5. **Backup**: Export current data before doing a full replacement
        """)

def create_employee_template(format_type='excel'):
    """Create an employee template file for download"""
    
    # Template data with sample entries
    template_data = {
        'employee_name': [
            'John Smith', 
            'Sarah Johnson', 
            'Mike Chen',
            'Emily Davis',
            'Robert Wilson'
        ],
        'labor_category': [
            'Senior Engineer',
            'Project Manager', 
            'Junior Engineer',
            'Consultant',
            'Contractor'
        ],
        'department': [
            'Engineering',
            'Operations',
            'Engineering', 
            'Finance',
            'Marketing'
        ],
        'status': [
            'Active',
            'Active',
            'Active',
            'Contractor',
            'Part-time'
        ],
        'salary': [
            95000,
            85000,
            65000,
            80000,
            50000
        ],
        'start_date': [
            '2024-01-15',
            '2024-02-01',
            '2024-03-01',
            '2024-01-10',
            '2024-04-15'
        ],
        'location': [
            'New York',
            'Remote',
            'San Francisco',
            'Remote',
            'Chicago'
        ],
        'manager': [
            'Alice Brown',
            'David Lee',
            'John Smith',
            'Sarah Johnson',
            'Emily Davis'
        ],
        'skills': [
            'Python, React, AWS',
            'Project Management, Agile, Scrum',
            'JavaScript, Node.js, MongoDB',
            'Financial Analysis, Excel, PowerBI',
            'Digital Marketing, SEO, Analytics'
        ],
        'notes': [
            'Lead developer for main product',
            'PMP certified',
            'Recent graduate, high potential',
            'Specializes in cost analysis',
            'Part-time social media specialist'
        ]
    }
    
    df = pd.DataFrame(template_data)
    
    if format_type == 'excel':
        # Create Excel file with formatting
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Employee_Template', index=False)
            
            # Get workbook and worksheet
            workbook = writer.book
            worksheet = writer.sheets['Employee_Template']
            
            # Style the header row
            header_fill = PatternFill(start_color='366092', end_color='366092', fill_type='solid')
            header_font = Font(color='FFFFFF', bold=True)
            
            for cell in worksheet[1]:
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal='center')
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 30)
                worksheet.column_dimensions[column_letter].width = adjusted_width
            
            # Add instructions sheet
            instructions_data = {
                'Column': [
                    'employee_name', 'labor_category', 'department', 'status', 'salary',
                    'start_date', 'location', 'manager', 'skills', 'notes'
                ],
                'Required': [
                    'Yes', 'Yes', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No'
                ],
                'Description': [
                    'Full name of employee/contractor',
                    'Job role or position',
                    'Department or division',
                    'Employment status',
                    'Annual salary in USD',
                    'Start date (YYYY-MM-DD)',
                    'Work location',
                    'Direct manager name',
                    'Comma-separated skills',
                    'Additional notes'
                ],
                'Example': [
                    'John Smith',
                    'Senior Engineer',
                    'Engineering',
                    'Active',
                    '75000',
                    '2024-01-15',
                    'New York',
                    'Jane Doe',
                    'Python, AWS, React',
                    'Team lead'
                ]
            }
            
            instructions_df = pd.DataFrame(instructions_data)
            instructions_df.to_excel(writer, sheet_name='Instructions', index=False)
            
            # Style instructions sheet
            inst_sheet = writer.sheets['Instructions']
            for cell in inst_sheet[1]:
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal='center')
            
            for column in inst_sheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 40)
                inst_sheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        return output.getvalue()
    
    else:  # CSV format
        return df.to_csv(index=False)

def get_excel_column_letter(col_index):
    """Convert column index to Excel column letter (A, B, C, etc.)"""
    result = ""
    while col_index >= 0:
        result = chr(col_index % 26 + ord('A')) + result
        col_index = col_index // 26 - 1
    return result

def validate_employee_data_detailed(df):
    """Perform detailed validation of employee data with specific error locations"""
    
    errors = []
    required_columns = ['employee_name', 'labor_category']
    
    # Check for missing required columns
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        return {
            'missing_columns': missing_columns,
            'errors': [],
            'valid_count': 0,
            'invalid_count': len(df)
        }
    
    valid_count = 0
    
    # Check each row for data issues
    for row_idx, row in df.iterrows():
        row_has_errors = False
        
        # Check required fields
        for col in required_columns:
            col_idx = df.columns.get_loc(col)
            if pd.isna(row[col]) or str(row[col]).strip() == '':
                errors.append({
                    'type': 'missing_required',
                    'row': row_idx,
                    'col_index': col_idx,
                    'column': col,
                    'value': row[col]
                })
                row_has_errors = True
        
        # Check salary field if present
        if 'salary' in df.columns and not pd.isna(row['salary']):
            col_idx = df.columns.get_loc('salary')
            try:
                salary_val = float(row['salary'])
                if salary_val < 0:
                    errors.append({
                        'type': 'invalid_salary',
                        'row': row_idx,
                        'col_index': col_idx,
                        'column': 'salary',
                        'value': row['salary']
                    })
                    row_has_errors = True
            except (ValueError, TypeError):
                errors.append({
                    'type': 'invalid_salary',
                    'row': row_idx,
                    'col_index': col_idx,
                    'column': 'salary',
                    'value': row['salary']
                })
                row_has_errors = True
        
        # Check date field if present
        if 'start_date' in df.columns and not pd.isna(row['start_date']):
            col_idx = df.columns.get_loc('start_date')
            try:
                if isinstance(row['start_date'], str):
                    pd.to_datetime(row['start_date'])
            except (ValueError, TypeError):
                errors.append({
                    'type': 'invalid_date',
                    'row': row_idx,
                    'col_index': col_idx,
                    'column': 'start_date',
                    'value': row['start_date']
                })
                row_has_errors = True
        
        if not row_has_errors:
            valid_count += 1
    
    # Check for duplicate employee names
    if 'employee_name' in df.columns:
        name_col_idx = df.columns.get_loc('employee_name')
        name_counts = df['employee_name'].value_counts()
        duplicates = name_counts[name_counts > 1].index.tolist()
        
        for duplicate_name in duplicates:
            duplicate_rows = df[df['employee_name'] == duplicate_name].index.tolist()
            for row_idx in duplicate_rows[1:]:  # Skip first occurrence
                errors.append({
                    'type': 'duplicate_name',
                    'row': row_idx,
                    'col_index': name_col_idx,
                    'column': 'employee_name',
                    'value': duplicate_name
                })
    
    # Limit errors shown to first 10 for performance
    limited_errors = errors[:10]
    
    return {
        'missing_columns': missing_columns,
        'errors': limited_errors,
        'valid_count': valid_count,
        'invalid_count': len(df) - valid_count
    }

def import_employees_from_dataframe(df, import_mode, validate_data):
    """Import employees from a pandas DataFrame"""
    
    try:
        # Data validation
        if validate_data:
            # Check for required columns
            required_columns = ['employee_name', 'labor_category']
            if not all(col in df.columns for col in required_columns):
                return False
            
            # Remove rows with missing required data
            df = df.dropna(subset=required_columns)
        
        # Standardize column names and data
        df = df.copy()
        
        # Ensure required columns exist with defaults
        column_defaults = {
            'department': 'Engineering',
            'status': 'Active',
            'salary': 75000,
            'start_date': datetime.now().strftime('%Y-%m-%d'),
            'location': 'Not specified',
            'manager': 'Not assigned',
            'skills': '',
            'notes': ''
        }
        
        for col, default_val in column_defaults.items():
            if col not in df.columns:
                df[col] = default_val
            else:
                df[col] = df[col].fillna(default_val)
        
        # Convert data types
        if 'salary' in df.columns:
            df['salary'] = pd.to_numeric(df['salary'], errors='coerce').fillna(75000)
        
        # Handle import mode
        if import_mode == "Replace all existing":
            st.session_state.employees = []
        
        # Convert DataFrame to employee records
        for _, row in df.iterrows():
            employee_data = {
                'employee_name': str(row['employee_name']).strip(),
                'labor_category': str(row['labor_category']).strip(),
                'department': str(row['department']).strip(),
                'status': str(row['status']).strip(),
                'salary': float(row['salary']),
                'start_date': pd.to_datetime(row['start_date']).date() if pd.notna(row['start_date']) else datetime.now().date(),
                'location': str(row['location']).strip(),
                'manager': str(row['manager']).strip(),
                'skills': str(row['skills']).strip(),
                'notes': str(row['notes']).strip()
            }
            
            st.session_state.data_manager.add_employee(employee_data)
        
        return True
        
    except Exception as e:
        st.error(f"Import error: {str(e)}")
        return False
