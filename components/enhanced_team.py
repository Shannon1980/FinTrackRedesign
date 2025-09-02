import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
import json
import io
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np

# Configuration from template analysis
LCAT_OPTIONS = ["PM", "SA/Eng Lead", "AI Lead", "HCD Lead", "Scrum Master", "Cloud Data Engineer", "SRE", "Full Stack Dev"]
DEPARTMENT_OPTIONS = ["Management", "Engineering", "AI/ML", "Design", "Agile", "Data Engineering", "DevOps", "Business"]
LOCATION_OPTIONS = ["Remote", "On-site", "Hybrid", "Travel"]
REQUIRED_FIELDS = ["Name", "LCAT", "Priced_Salary", "Current_Salary", "Hours_Per_Month"]

def render_enhanced_team():
    """Render enhanced team management with financial projections"""
    
    st.markdown("## 💼 Enhanced Team & Financial Projections")
    st.markdown("Advanced team management with cost actuals, projections, and LCAT tracking")
    
    # Enhanced Team Management Tabs
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "👥 Team Overview", 
        "📊 Cost Actuals", 
        "🔮 Projections", 
        "📥 Import/Export", 
        "📈 Analytics"
    ])
    
    with tab1:
        render_enhanced_team_overview()
    
    with tab2:
        render_cost_actuals()
    
    with tab3:
        render_financial_projections()
    
    with tab4:
        render_import_export()
    
    with tab5:
        render_enhanced_analytics()

def render_enhanced_team_overview():
    """Enhanced team overview with LCAT and advanced fields"""
    
    st.markdown("### 👥 Enhanced Team Management")
    
    # Add/Edit Employee Form
    with st.expander("➕ Add/Edit Team Member", expanded=False):
        with st.form("enhanced_employee_form"):
            col1, col2, col3 = st.columns(3)
            
            with col1:
                name = st.text_input("Name *", placeholder="Full employee name")
                lcat = st.selectbox("LCAT (Labor Category) *", LCAT_OPTIONS)
                department = st.selectbox("Department", DEPARTMENT_OPTIONS)
                location = st.selectbox("Location", LOCATION_OPTIONS)
            
            with col2:
                priced_salary = st.number_input("Priced Salary ($) *", min_value=0, step=1000, value=100000)
                current_salary = st.number_input("Current Salary ($) *", min_value=0, step=1000, value=100000)
                hours_per_month = st.number_input("Hours Per Month *", min_value=0, max_value=250, value=160)
                start_date = st.date_input("Start Date", value=datetime.now())
            
            with col3:
                manager = st.text_input("Manager", placeholder="Direct manager name")
                skills = st.text_area("Skills", placeholder="Key skills and expertise")
                notes = st.text_area("Notes", placeholder="Additional notes")
            
            # Monthly Hours/Revenue Input
            st.markdown("**Monthly Hours & Revenue (Recent 6 Months)**")
            monthly_data = {}
            
            # Generate recent 6 months
            current_date = datetime.now()
            for i in range(6):
                month_start = current_date - timedelta(days=30*i)
                month_key = month_start.strftime("%m/%y")
                
                col_h, col_r = st.columns(2)
                with col_h:
                    hours = st.number_input(f"Hours {month_key}", min_value=0, max_value=250, value=hours_per_month, key=f"hours_{i}")
                with col_r:
                    revenue = st.number_input(f"Revenue {month_key} ($)", min_value=0, step=1000, value=int(current_salary/12), key=f"revenue_{i}")
                
                monthly_data[f"hours_{month_key}"] = hours
                monthly_data[f"revenue_{month_key}"] = revenue
            
            if st.form_submit_button("💾 Save Team Member", type="primary"):
                if name and lcat and priced_salary > 0 and current_salary > 0:
                    employee_data = {
                        'name': name,
                        'lcat': lcat,
                        'department': department,
                        'location': location,
                        'priced_salary': priced_salary,
                        'current_salary': current_salary,
                        'hours_per_month': hours_per_month,
                        'start_date': start_date,
                        'manager': manager,
                        'skills': skills,
                        'notes': notes,
                        **monthly_data
                    }
                    
                    st.session_state.data_manager.add_enhanced_employee(employee_data)
                    st.success(f"✅ Team member {name} saved successfully!")
                    st.rerun()
                else:
                    st.error("❌ Please fill in all required fields marked with *")
    
    # Current Team Display
    enhanced_df = st.session_state.data_manager.get_enhanced_employees_df()
    
    if enhanced_df.empty:
        st.info("👥 No enhanced team members found. Add some using the form above.")
        return
    
    st.markdown(f"### 📋 Current Enhanced Team ({len(enhanced_df)} members)")
    
    # Filters
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        lcat_filter = st.selectbox("Filter by LCAT", ["All"] + LCAT_OPTIONS)
    with col2:
        dept_filter = st.selectbox("Filter by Department", ["All"] + DEPARTMENT_OPTIONS)
    with col3:
        location_filter = st.selectbox("Filter by Location", ["All"] + LOCATION_OPTIONS)
    with col4:
        search_term = st.text_input("🔍 Search", placeholder="Search name or skills...")
    
    # Apply filters
    filtered_df = enhanced_df.copy()
    
    if lcat_filter != "All":
        filtered_df = filtered_df[filtered_df['lcat'] == lcat_filter]
    if dept_filter != "All":
        filtered_df = filtered_df[filtered_df['department'] == dept_filter]
    if location_filter != "All":
        filtered_df = filtered_df[filtered_df['location'] == location_filter]
    if search_term:
        mask = (
            filtered_df['name'].str.contains(search_term, case=False, na=False) |
            filtered_df['skills'].str.contains(search_term, case=False, na=False)
        )
        filtered_df = filtered_df[mask]
    
    # Team Summary Metrics
    if not filtered_df.empty:
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            total_priced = filtered_df['priced_salary'].sum()
            st.metric("Total Priced Salary", f"${total_priced:,.0f}")
        
        with col2:
            total_current = filtered_df['current_salary'].sum()
            st.metric("Total Current Salary", f"${total_current:,.0f}")
        
        with col3:
            avg_hours = filtered_df['hours_per_month'].mean()
            st.metric("Avg Hours/Month", f"{avg_hours:.0f}")
        
        with col4:
            salary_variance = total_current - total_priced
            st.metric("Salary Variance", f"${salary_variance:,.0f}", delta=f"{(salary_variance/total_priced*100):.1f}%")
        
        # Enhanced Team Table
        display_columns = ['name', 'lcat', 'department', 'location', 'priced_salary', 'current_salary', 'hours_per_month', 'start_date']
        st.dataframe(
            filtered_df[display_columns],
            use_container_width=True,
            column_config={
                'priced_salary': st.column_config.NumberColumn('Priced Salary', format='$%d'),
                'current_salary': st.column_config.NumberColumn('Current Salary', format='$%d'),
                'hours_per_month': st.column_config.NumberColumn('Hours/Month'),
                'start_date': st.column_config.DateColumn('Start Date')
            }
        )

def render_cost_actuals():
    """Render cost actuals tracking and calculations"""
    
    st.markdown("### 📊 Cost Actuals & Variance Analysis")
    
    enhanced_df = st.session_state.data_manager.get_enhanced_employees_df()
    
    if enhanced_df.empty:
        st.info("📊 No employee data available for cost actuals analysis.")
        return
    
    # Cost Calculations
    cost_analysis = calculate_cost_actuals(enhanced_df)
    
    # Summary Metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Budgeted Cost", f"${cost_analysis['total_priced']:,.0f}")
    
    with col2:
        st.metric("Total Actual Cost", f"${cost_analysis['total_actual']:,.0f}")
    
    with col3:
        variance = cost_analysis['total_actual'] - cost_analysis['total_priced']
        st.metric("Cost Variance", f"${variance:,.0f}", delta=f"{(variance/cost_analysis['total_priced']*100):.1f}%")
    
    with col4:
        st.metric("Cost Efficiency", f"{(cost_analysis['total_priced']/cost_analysis['total_actual']*100):.1f}%")
    
    # Individual Employee Cost Analysis
    st.markdown("#### 👤 Individual Cost Analysis")
    
    for _, employee in enhanced_df.iterrows():
        with st.expander(f"📊 {employee['name']} - {employee['lcat']}", expanded=False):
            emp_costs = calculate_employee_costs(employee)
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Budgeted Monthly", f"${emp_costs['budgeted_monthly']:,.0f}")
                st.metric("Actual Monthly", f"${emp_costs['actual_monthly']:,.0f}")
            
            with col2:
                hourly_priced = employee['priced_salary'] / 12 / employee['hours_per_month']
                hourly_current = employee['current_salary'] / 12 / employee['hours_per_month']
                st.metric("Priced Hourly Rate", f"${hourly_priced:.2f}")
                st.metric("Current Hourly Rate", f"${hourly_current:.2f}")
            
            with col3:
                variance_pct = ((emp_costs['actual_monthly'] - emp_costs['budgeted_monthly']) / emp_costs['budgeted_monthly'] * 100)
                st.metric("Variance %", f"{variance_pct:.1f}%")
                st.metric("Hours Utilization", f"{employee['hours_per_month']:.0f}/160")
    
    # Historical Trends Chart
    st.markdown("#### 📈 Cost Trends Analysis")
    
    trends_data = get_cost_trends_data(enhanced_df)
    if not trends_data.empty:
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=trends_data['period'],
            y=trends_data['budgeted_costs'],
            mode='lines+markers',
            name='Budgeted Costs',
            line=dict(color='#2E86AB', width=3)
        ))
        
        fig.add_trace(go.Scatter(
            x=trends_data['period'],
            y=trends_data['actual_costs'],
            mode='lines+markers',
            name='Actual Costs',
            line=dict(color='#A23B72', width=3)
        ))
        
        fig.update_layout(
            title="Cost Actuals vs Budget Trends",
            xaxis_title="Period",
            yaxis_title="Cost ($)",
            hovermode='x unified'
        )
        
        st.plotly_chart(fig, use_container_width=True)

def render_financial_projections():
    """Render financial projections based on historical data"""
    
    st.markdown("### 🔮 Financial Projections & Forecasting")
    
    enhanced_df = st.session_state.data_manager.get_enhanced_employees_df()
    
    if enhanced_df.empty:
        st.info("🔮 No employee data available for projections.")
        return
    
    # Projection Settings
    with st.expander("⚙️ Projection Settings", expanded=False):
        col1, col2, col3 = st.columns(3)
        
        with col1:
            projection_months = st.slider("Projection Period (Months)", 3, 24, 12)
            salary_increase = st.slider("Annual Salary Increase (%)", 0.0, 10.0, 3.0, 0.1)
        
        with col2:
            hours_adjustment = st.slider("Hours Adjustment (%)", -20.0, 20.0, 0.0, 1.0)
            new_hires = st.number_input("Expected New Hires", 0, 10, 0)
        
        with col3:
            inflation_factor = st.slider("Inflation Factor (%)", 0.0, 5.0, 2.0, 0.1)
            attrition_rate = st.slider("Annual Attrition Rate (%)", 0.0, 20.0, 5.0, 0.5)
    
    # Generate Projections
    projections = generate_financial_projections(
        enhanced_df, projection_months, salary_increase, 
        hours_adjustment, new_hires, inflation_factor, attrition_rate
    )
    
    # Projection Summary
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Projected Annual Cost", f"${projections['annual_cost']:,.0f}")
    
    with col2:
        current_annual = enhanced_df['current_salary'].sum()
        growth = ((projections['annual_cost'] - current_annual) / current_annual * 100)
        st.metric("Cost Growth", f"{growth:.1f}%")
    
    with col3:
        st.metric("Projected Team Size", f"{projections['team_size']:.0f}")
    
    with col4:
        st.metric("Avg Cost per Employee", f"${projections['avg_cost_per_employee']:,.0f}")
    
    # Projection Charts
    st.markdown("#### 📊 Projection Visualizations")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Monthly projections
        fig_monthly = go.Figure()
        
        fig_monthly.add_trace(go.Scatter(
            x=projections['monthly_data']['month'],
            y=projections['monthly_data']['total_cost'],
            mode='lines+markers',
            name='Projected Monthly Cost',
            line=dict(color='#27AE60', width=3)
        ))
        
        fig_monthly.update_layout(
            title="Monthly Cost Projections",
            xaxis_title="Month",
            yaxis_title="Total Cost ($)"
        )
        
        st.plotly_chart(fig_monthly, use_container_width=True)
    
    with col2:
        # Team composition projection
        lcat_projection = projections['lcat_breakdown']
        
        fig_lcat = px.pie(
            values=list(lcat_projection.values()),
            names=list(lcat_projection.keys()),
            title="Projected Team Composition by LCAT"
        )
        
        st.plotly_chart(fig_lcat, use_container_width=True)
    
    # Detailed Projections Table
    st.markdown("#### 📋 Detailed Monthly Projections")
    st.dataframe(projections['monthly_data'], use_container_width=True)

def render_import_export():
    """Render import/export functionality"""
    
    st.markdown("### 📥 Import/Export Data")
    
    # Export Section
    st.markdown("#### 📤 Export Data")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📊 Export as CSV", type="primary", use_container_width=True):
            enhanced_df = st.session_state.data_manager.get_enhanced_employees_df()
            if not enhanced_df.empty:
                csv_data = enhanced_df.to_csv(index=False)
                st.download_button(
                    label="⬇️ Download CSV",
                    data=csv_data,
                    file_name=f"enhanced_team_data_{datetime.now().strftime('%Y%m%d')}.csv",
                    mime="text/csv"
                )
    
    with col2:
        if st.button("📋 Export as JSON", type="secondary", use_container_width=True):
            enhanced_df = st.session_state.data_manager.get_enhanced_employees_df()
            if not enhanced_df.empty:
                json_data = enhanced_df.to_json(orient='records', indent=2)
                st.download_button(
                    label="⬇️ Download JSON",
                    data=json_data,
                    file_name=f"enhanced_team_data_{datetime.now().strftime('%Y%m%d')}.json",
                    mime="application/json"
                )
    
    with col3:
        if st.button("📋 Export Template", use_container_width=True):
            template_data = create_import_template()
            st.download_button(
                label="⬇️ Download Template",
                data=template_data,
                file_name=f"team_import_template_{datetime.now().strftime('%Y%m%d')}.csv",
                mime="text/csv"
            )
    
    # Import Section
    st.markdown("#### 📥 Import Data")
    
    uploaded_file = st.file_uploader(
        "Choose your team data file",
        type=['csv', 'json'],
        help="Upload a CSV or JSON file with team data"
    )
    
    if uploaded_file is not None:
        try:
            if uploaded_file.name.endswith('.csv'):
                df = pd.read_csv(uploaded_file)
            else:
                data = json.load(uploaded_file)
                df = pd.DataFrame(data)
            
            st.success(f"✅ File uploaded successfully! Found {len(df)} records")
            
            # Preview
            st.markdown("#### 👀 Data Preview")
            st.dataframe(df.head(10), use_container_width=True)
            
            # Validation
            validation_results = validate_import_data(df)
            
            if validation_results['valid']:
                if st.button("🚀 Import Data", type="primary"):
                    success_count = import_enhanced_team_data(df)
                    st.success(f"✅ Successfully imported {success_count} team members!")
                    st.rerun()
            else:
                st.error("❌ Data validation failed:")
                for error in validation_results['errors']:
                    st.error(f"• {error}")
        
        except Exception as e:
            st.error(f"❌ Error processing file: {str(e)}")

def render_enhanced_analytics():
    """Render enhanced analytics and insights"""
    
    st.markdown("### 📈 Enhanced Team Analytics")
    
    enhanced_df = st.session_state.data_manager.get_enhanced_employees_df()
    
    if enhanced_df.empty:
        st.info("📈 No data available for analytics.")
        return
    
    # Analytics Dashboard
    col1, col2 = st.columns(2)
    
    with col1:
        # LCAT Distribution
        lcat_counts = enhanced_df['lcat'].value_counts()
        fig_lcat = px.bar(
            x=lcat_counts.index,
            y=lcat_counts.values,
            title="Team Distribution by LCAT",
            color_discrete_sequence=['#2E86AB']
        )
        fig_lcat.update_layout(xaxis_title="LCAT", yaxis_title="Count")
        st.plotly_chart(fig_lcat, use_container_width=True)
    
    with col2:
        # Salary Analysis
        fig_salary = px.scatter(
            enhanced_df,
            x='priced_salary',
            y='current_salary',
            color='lcat',
            title="Priced vs Current Salary Analysis",
            hover_data=['name', 'department']
        )
        fig_salary.add_shape(
            type="line",
            x0=enhanced_df['priced_salary'].min(),
            y0=enhanced_df['priced_salary'].min(),
            x1=enhanced_df['priced_salary'].max(),
            y1=enhanced_df['priced_salary'].max(),
            line=dict(dash="dash", color="gray")
        )
        st.plotly_chart(fig_salary, use_container_width=True)
    
    # Department and Location Analysis
    col1, col2 = st.columns(2)
    
    with col1:
        dept_salary = enhanced_df.groupby('department')['current_salary'].mean().sort_values(ascending=False)
        fig_dept = px.bar(
            x=dept_salary.values,
            y=dept_salary.index,
            orientation='h',
            title="Average Salary by Department",
            color_discrete_sequence=['#A23B72']
        )
        st.plotly_chart(fig_dept, use_container_width=True)
    
    with col2:
        location_dist = enhanced_df['location'].value_counts()
        fig_location = px.pie(
            values=location_dist.values,
            names=location_dist.index,
            title="Team Distribution by Location"
        )
        st.plotly_chart(fig_location, use_container_width=True)

# Helper Functions

def calculate_cost_actuals(df):
    """Calculate cost actuals and variances"""
    total_priced = df['priced_salary'].sum()
    total_actual = df['current_salary'].sum()
    
    return {
        'total_priced': total_priced,
        'total_actual': total_actual,
        'variance': total_actual - total_priced,
        'variance_pct': ((total_actual - total_priced) / total_priced * 100) if total_priced > 0 else 0
    }

def calculate_employee_costs(employee):
    """Calculate individual employee costs"""
    budgeted_monthly = employee['priced_salary'] / 12
    actual_monthly = employee['current_salary'] / 12
    
    return {
        'budgeted_monthly': budgeted_monthly,
        'actual_monthly': actual_monthly,
        'variance': actual_monthly - budgeted_monthly
    }

def get_cost_trends_data(df):
    """Generate cost trends data"""
    # Simplified trend data - in practice, you'd use actual historical data
    periods = []
    budgeted_costs = []
    actual_costs = []
    
    base_budgeted = df['priced_salary'].sum() / 12
    base_actual = df['current_salary'].sum() / 12
    
    for i in range(6):
        period = (datetime.now() - timedelta(days=30*i)).strftime('%Y-%m')
        periods.append(period)
        budgeted_costs.append(base_budgeted * (1 + i * 0.02))  # 2% monthly growth
        actual_costs.append(base_actual * (1 + i * 0.025))     # 2.5% monthly growth
    
    return pd.DataFrame({
        'period': periods[::-1],
        'budgeted_costs': budgeted_costs[::-1],
        'actual_costs': actual_costs[::-1]
    })

def generate_financial_projections(df, months, salary_increase, hours_adjustment, new_hires, inflation, attrition):
    """Generate financial projections"""
    current_team_size = len(df)
    annual_attrition = attrition / 100
    monthly_attrition = annual_attrition / 12
    
    monthly_data = []
    total_cost = df['current_salary'].sum()
    
    for month in range(1, months + 1):
        # Apply attrition
        if month > 1:
            current_team_size *= (1 - monthly_attrition)
        
        # Apply salary increases (monthly compound)
        monthly_salary_increase = (1 + salary_increase/100) ** (1/12) - 1
        total_cost *= (1 + monthly_salary_increase)
        
        # Apply inflation
        monthly_inflation = (1 + inflation/100) ** (1/12) - 1
        total_cost *= (1 + monthly_inflation)
        
        # Add new hires (spread evenly)
        if new_hires > 0:
            hires_this_month = new_hires / months
            avg_new_hire_salary = df['current_salary'].mean()
            total_cost += hires_this_month * avg_new_hire_salary
            current_team_size += hires_this_month
        
        monthly_data.append({
            'month': month,
            'total_cost': total_cost,
            'team_size': current_team_size
        })
    
    # LCAT breakdown projection
    lcat_counts = df['lcat'].value_counts()
    lcat_breakdown = {lcat: count * (current_team_size / len(df)) for lcat, count in lcat_counts.items()}
    
    return {
        'annual_cost': total_cost,
        'team_size': current_team_size,
        'avg_cost_per_employee': total_cost / current_team_size if current_team_size > 0 else 0,
        'monthly_data': pd.DataFrame(monthly_data),
        'lcat_breakdown': lcat_breakdown
    }

def create_import_template():
    """Create import template CSV"""
    template_data = {
        'name': ['John Smith', 'Jane Doe'],
        'lcat': ['PM', 'SA/Eng Lead'],
        'department': ['Management', 'Engineering'],
        'location': ['Remote', 'On-site'],
        'priced_salary': [120000, 110000],
        'current_salary': [125000, 115000],
        'hours_per_month': [160, 160],
        'start_date': ['2024-01-15', '2024-02-01'],
        'manager': ['Alice Johnson', 'Bob Wilson'],
        'skills': ['Project Management, Agile', 'Python, AWS, React'],
        'notes': ['Team lead', 'Senior developer']
    }
    
    df = pd.DataFrame(template_data)
    return df.to_csv(index=False)

def validate_import_data(df):
    """Validate imported data"""
    errors = []
    
    # Check required fields
    for field in REQUIRED_FIELDS:
        if field.lower() not in df.columns.str.lower():
            errors.append(f"Missing required field: {field}")
    
    # Check LCAT values
    if 'lcat' in df.columns:
        invalid_lcats = df[~df['lcat'].isin(LCAT_OPTIONS)]['lcat'].unique()
        if len(invalid_lcats) > 0:
            errors.append(f"Invalid LCAT values: {', '.join(invalid_lcats)}")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }

def import_enhanced_team_data(df):
    """Import enhanced team data"""
    success_count = 0
    
    for _, row in df.iterrows():
        try:
            employee_data = {
                'name': str(row.get('name', '')),
                'lcat': str(row.get('lcat', '')),
                'department': str(row.get('department', '')),
                'location': str(row.get('location', '')),
                'priced_salary': float(row.get('priced_salary', 0)),
                'current_salary': float(row.get('current_salary', 0)),
                'hours_per_month': int(row.get('hours_per_month', 160)),
                'start_date': pd.to_datetime(row.get('start_date', datetime.now())).date(),
                'manager': str(row.get('manager', '')),
                'skills': str(row.get('skills', '')),
                'notes': str(row.get('notes', ''))
            }
            
            st.session_state.data_manager.add_enhanced_employee(employee_data)
            success_count += 1
            
        except Exception as e:
            continue
    
    return success_count