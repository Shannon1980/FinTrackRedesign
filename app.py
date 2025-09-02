import streamlit as st
import pandas as pd
import numpy as np
from components.sidebar import render_sidebar
from components.dashboard import render_dashboard
from components.team_management import render_team_management
from components.analytics import render_analytics
from components.reports import render_reports
from utils.data_manager import DataManager

# Configure page
st.set_page_config(
    page_title="SEAS Financial Tracker",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'data_manager' not in st.session_state:
    st.session_state.data_manager = DataManager()

def main():
    # Header
    st.markdown("""
    <div style="background: linear-gradient(90deg, #007bff 0%, #0056b3 100%); padding: 1rem; border-radius: 0.5rem; margin-bottom: 2rem;">
        <h1 style="color: white; text-align: center; margin: 0;">📊 SEAS Project Financial Tracker</h1>
        <p style="color: white; text-align: center; margin: 0; opacity: 0.9;">Professional Financial Management & Analytics Platform</p>
    </div>
    """, unsafe_allow_html=True)

    # Render sidebar
    render_sidebar()
    
    # Main content area with tabs
    tab1, tab2, tab3, tab4 = st.tabs(["🏠 Dashboard Overview", "👥 Team Management", "📈 Analytics & Reports", "⚙️ Settings"])
    
    with tab1:
        render_dashboard()
    
    with tab2:
        render_team_management()
    
    with tab3:
        render_analytics()
    
    with tab4:
        render_reports()

if __name__ == "__main__":
    main()
