import React, { useState, useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Slider, CircularProgress } from '@mui/material';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const API_BASE_URL = 'http://localhost:3000'; // Adjust if needed

function calculateAverage(prices) {
  if (!prices.length) return 0;
  const sum = prices.reduce((acc, val) => acc + val, 0);
  return sum / prices.length;
}

export default function StockPage() {
  const [stocks, setStocks] = useState({});
  const [selectedStock, setSelectedStock] = useState('');
  const [timeInterval, setTimeInterval] = useState(30); // default 30 minutes
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchStocks() {
      try {
        const response = await fetch(API_BASE_URL + '/evaluation-service/stocks');
        const data = await response.json();
        setStocks(data.stocks);
        const firstStock = Object.values(data.stocks)[0];
        setSelectedStock(firstStock);
      } catch (error) {
        console.error('Error fetching stocks:', error);
      }
    }
    fetchStocks();
  }, []);

  useEffect(() => {
    if (!selectedStock) return;
    async function fetchPriceHistory() {
      setLoading(true);
      try {
        const response = await fetch(API_BASE_URL + '/evaluation-service/stocks/' + selectedStock + '?minutes=' + timeInterval);
        const data = await response.json();
        setPriceData(data);
      } catch (error) {
        console.error('Error fetching price history:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPriceHistory();
  }, [selectedStock, timeInterval]);

  const prices = priceData.map(item => item.price);
  const timestamps = priceData.map(item => new Date(item.lastUpdatedAt).toLocaleTimeString());
  const averagePrice = calculateAverage(prices);

  const chartData = {
    labels: timestamps,
    datasets: [
      {
        label: 'Price',
        data: prices,
        fill: false,
        borderColor: 'blue',
        tension: 0.1,
      },
      {
        label: 'Average Price',
        data: Array(prices.length).fill(averagePrice),
        fill: false,
        borderColor: 'red',
        borderDash: [5, 5],
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Price',
        },
      },
    },
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Stock Price Chart
      </Typography>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="stock-select-label">Select Stock</InputLabel>
        <Select
          labelId="stock-select-label"
          value={selectedStock}
          label="Select Stock"
          onChange={(e) => setSelectedStock(e.target.value)}
        >
          {Object.entries(stocks).map(([name, ticker]) => (
            <MenuItem key={ticker} value={ticker}>
              {name} ({ticker})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Typography gutterBottom>Time Interval (minutes): {timeInterval}</Typography>
      <Slider
        value={timeInterval}
        min={1}
        max={120}
        step={1}
        onChange={(e, val) => setTimeInterval(val)}
        valueLabelDisplay="auto"
        sx={{ mb: 3 }}
      />
      {loading ? (
        <CircularProgress />
      ) : (
        <Line data={chartData} options={chartOptions} />
      )}
    </Box>
  );
}
