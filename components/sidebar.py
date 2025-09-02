import streamlit as st
from datetime import datetime

def render_sidebar():
    """Render the collapsible sidebar sections"""
    with st.sidebar:
        st.markdown("## 🛠️ Quick Actions")
        
        # Project Settings Section
        with st.expander("📋 Project Settings", expanded=True):
            project_name = st.text_input("Project Name", 
                                       value=st.session_state.project_settings['project_name'])
            
            total_budget = st.number_input("Total Budget ($)", 
                                         min_value=0.0, 
                                         value=st.session_state.project_settings['total_budget'],
                                         step=1000.0)
            
            department = st.selectbox("Department", 
                                    ["Engineering", "Marketing", "Sales", "Operations", "HR"],
                                    index=0 if st.session_state.project_settings['department'] == 'Engineering' else 0)
            
            if st.button("💾 Save Settings", type="primary"):
                st.session_state.data_manager.update_project_settings({
                    'project_name': project_name,
                    'total_budget': total_budget,
                    'department': department
                })
                st.success("✅ Settings saved successfully!")
                st.rerun()
        
        # Financial Parameters Section
        with st.expander("💰 Financial Parameters"):
            st.markdown("**Budget Categories**")
            
            # Display current budget allocation
            budget_cats = st.session_state.financial_data['budget_categories']
            for category, amount in budget_cats.items():
                st.metric(category, f"${amount:,.2f}")
            
            st.markdown("---")
            
            # Quick expense entry
            st.markdown("**Quick Expense Entry**")
            expense_category = st.selectbox("Category", list(budget_cats.keys()))
            expense_amount = st.number_input("Amount ($)", min_value=0.0, step=1.0)
            expense_description = st.text_input("Description")
            
            if st.button("➕ Add Expense"):
                if expense_amount > 0:
                    st.session_state.data_manager.add_expense({
                        'category': expense_category,
                        'amount': expense_amount,
                        'description': expense_description
                    })
                    st.success("✅ Expense added successfully!")
                    st.rerun()
                else:
                    st.error("❌ Please enter a valid amount")
        
        # Quick Actions Section
        with st.expander("⚡ Quick Actions"):
            col1, col2 = st.columns(2)
            
            with col1:
                if st.button("📊 Refresh Data"):
                    st.rerun()
                
                if st.button("🔄 Reset Demo"):
                    # Reset to initial state
                    for key in ['employees', 'financial_data']:
                        if key in st.session_state:
                            del st.session_state[key]
                    st.session_state.data_manager.initialize_session_state()
                    st.success("✅ Demo data reset!")
                    st.rerun()
            
            with col2:
                if st.button("💾 Export CSV"):
                    csv_data = st.session_state.data_manager.export_data('csv')
                    st.download_button(
                        label="⬇️ Download",
                        data=csv_data,
                        file_name=f"seas_financial_data_{datetime.now().strftime('%Y%m%d')}.csv",
                        mime="text/csv"
                    )
                
                if st.button("📄 Export JSON"):
                    json_data = st.session_state.data_manager.export_data('json')
                    st.download_button(
                        label="⬇️ Download",
                        data=json_data,
                        file_name=f"seas_financial_data_{datetime.now().strftime('%Y%m%d')}.json",
                        mime="application/json"
                    )
        
        # System Status
        st.markdown("---")
        st.markdown("### 📊 System Status")
        
        financial_summary = st.session_state.data_manager.get_financial_summary()
        
        # Status indicators
        budget_health = "🟢 Healthy" if financial_summary['budget_utilization'] < 80 else "🟡 Warning" if financial_summary['budget_utilization'] < 100 else "🔴 Over Budget"
        st.markdown(f"**Budget Status:** {budget_health}")
        
        employee_count = len(st.session_state.employees)
        st.markdown(f"**Team Size:** {employee_count} employees")
        
        st.markdown(f"**Last Updated:** {datetime.now().strftime('%H:%M:%S')}")
