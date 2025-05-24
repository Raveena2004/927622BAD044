import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Tabs, Tab, Box, Container } from '@mui/material';
import StockPage from './StockPage';
import CorrelationHeatmap from './CorrelationHeatmap';

function a11yProps(index) {
  return {
    id: 'tab-' + index,
    'aria-controls': 'tabpanel-' + index,
  };
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={'tabpanel-' + index}
      aria-labelledby={'tab-' + index}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function App() {
  const [tabValue, setTabValue] = useState(0);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Stock Price Aggregation
          </Typography>
          <Tabs value={tabValue} onChange={handleChange} textColor="inherit" indicatorColor="secondary">
            <Tab label="Stock" {...a11yProps(0)} component={Link} to="/" />
            <Tab label="Correlation Heatmap" {...a11yProps(1)} component={Link} to="/heatmap" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<StockPage />} />
          <Route path="/heatmap" element={<CorrelationHeatmap />} />
        </Routes>
      </Container>
    </Router>
  );
}
