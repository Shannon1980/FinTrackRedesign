import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Alert
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Login as LoginIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import FinancialTeamPage from './FinancialTeamPage';
import axios from 'axios';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '6px',
        },
      },
    },
  },
});

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginDialog, setLoginDialog] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [user, setUser] = useState(null);

  // Check for existing auth token on app load
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginForm);
      const { token, user } = response.data;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
      
      setIsAuthenticated(true);
      setUser(user);
      setLoginDialog(false);
      setLoginForm({ username: '', password: '' });
    } catch (error) {
      setLoginError(error.response?.data?.message || 'Login failed');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Login component
  const LoginPage = () => (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 4,
          backgroundColor: 'white',
          borderRadius: 2,
          boxShadow: 3
        }}
      >
        <AccountBalanceIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography component="h1" variant="h4" gutterBottom>
          SEAS Financial Tracker
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Comprehensive project financial management platform with team analytics, 
          cost tracking, and financial projections.
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<LoginIcon />}
          onClick={() => setLoginDialog(true)}
          sx={{ mb: 2 }}
        >
          Sign In to Continue
        </Button>
        
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, width: '100%' }}>
          <Typography variant="body2" align="center" color="text.secondary">
            <strong>Demo Credentials:</strong><br />
            Username: admin<br />
            Password: admin123
          </Typography>
        </Box>
      </Box>
    </Container>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <AccountBalanceIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SEAS Financial Tracker
          </Typography>
          
          {isAuthenticated && user && (
            <>
              <Typography variant="body2" sx={{ mr: 2 }}>
                Welcome, {user.username}
              </Typography>
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ minHeight: 'calc(100vh - 64px)' }}>
        {isAuthenticated ? (
          <Container maxWidth="xl" sx={{ py: 3 }}>
            <FinancialTeamPage />
          </Container>
        ) : (
          <LoginPage />
        )}
      </Box>

      {/* Login Dialog */}
      <Dialog open={loginDialog} onClose={() => setLoginDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleLogin}>
          <DialogTitle>Sign In</DialogTitle>
          <DialogContent>
            {loginError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {loginError}
              </Alert>
            )}
            
            <TextField
              autoFocus
              margin="dense"
              label="Username"
              fullWidth
              variant="outlined"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLoginDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Sign In
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
