import React, { useState, useEffect } from 'react';
import { Box, Typography, Slider, CircularProgress, Tooltip } from '@mui/material';
import { HeatMapGrid } from 'react-grid-heatmap';

const API_BASE_URL = 'http://localhost:3000'; // Adjust if needed

function calculateCovariance(X, Y) {
  const n = X.length;
  const meanX = X.reduce((a, b) => a + b, 0) / n;
  const meanY = Y.reduce((a, b) => a + b, 0) / n;
  let cov = 0;
  for (let i = 0; i < n; i++) {
    cov += (X[i] - meanX) * (Y[i] - meanY);
  }
  return cov / (n - 1);
}

function calculateStdDev(X) {
  const n = X.length;
  const meanX = X.reduce((a, b) => a + b, 0) / n;
  let variance = 0;
  for (let i = 0; i < n; i++) {
    variance += (X[i] - meanX) ** 2;
  }
  return Math.sqrt(variance / (n - 1));
}

function calculatePearsonCorrelation(X, Y) {
  const cov = calculateCovariance(X, Y);
  const stdX = calculateStdDev(X);
  const stdY = calculateStdDev(Y);
  return cov / (stdX * stdY);
}

export default function CorrelationHeatmap() {
  const [stocks, setStocks] = useState({});
  const [timeInterval, setTimeInterval] = useState(30);
  const [priceHistories, setPriceHistories] = useState({});
  const [loading, setLoading] = useState(false);
  const [correlationMatrix, setCorrelationMatrix] = useState([]);
  const [stockList, setStockList] = useState([]);

  useEffect(() => {
    async function fetchStocks() {
      try {
        const response = await fetch(API_BASE_URL + '/evaluation-service/stocks');
        const data = await response.json();
        setStocks(data.stocks);
        setStockList(Object.values(data.stocks));
      } catch (error) {
        console.error('Error fetching stocks:', error);
      }
    }
    fetchStocks();
  }, []);

  useEffect(() => {
    if (stockList.length === 0) return;

    async function fetchAllPriceHistories() {
      setLoading(true);
      try {
        const histories = {};
        for (const ticker of stockList) {
          const response = await fetch(API_BASE_URL + '/evaluation-service/stocks/' + ticker + '?minutes=' + timeInterval);
          const data = await response.json();
          histories[ticker] = data.map(item => item.price);
        }
        setPriceHistories(histories);
      } catch (error) {
        console.error('Error fetching price histories:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllPriceHistories();
  }, [stockList, timeInterval]);

  useEffect(() => {
    if (Object.keys(priceHistories).length === 0) return;

    // Calculate correlation matrix
    const matrix = [];
    for (let i = 0; i < stockList.length; i++) {
      const row = [];
      for (let j = 0; j < stockList.length; j++) {
        const X = priceHistories[stockList[i]] || [];
        const Y = priceHistories[stockList[j]] || [];
        if (X.length === 0 || Y.length === 0 || X.length !== Y.length) {
          row.push(0);
        } else {
          const corr = calculatePearsonCorrelation(X, Y);
          row.push(corr);
        }
      }
      matrix.push(row);
    }
    setCorrelationMatrix(matrix);
  }, [priceHistories, stockList]);

  const colorScale = (value) => {
    // Map correlation from -1 to 1 to color from red (negative) to white (zero) to green (positive)
    if (value > 0) {
      const greenIntensity = Math.floor(255 * value);
      return `rgb(255, ${255 - greenIntensity}, 255 - ${greenIntensity})`;
    } else {
      const redIntensity = Math.floor(255 * -value);
      return `rgb(${255 - redIntensity}, 255, 255)`;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Correlation Heatmap
      </Typography>
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
        <Box sx={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th></th>
                {stockList.map((ticker) => (
                  <th key={ticker}>
                    <Tooltip title={`Stock: ${ticker}`}>
                      <span>{ticker}</span>
                    </Tooltip>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlationMatrix.map((row, i) => (
                <tr key={stockList[i]}>
                  <th>
                    <Tooltip title={`Stock: ${stockList[i]}`}>
                      <span>{stockList[i]}</span>
                    </Tooltip>
                  </th>
                  {row.map((value, j) => (
                    <td
                      key={j}
                      style={{
                        backgroundColor: `rgba(0, 123, 255, ${Math.abs(value)})`,
                        color: value > 0.5 ? 'white' : 'black',
                        textAlign: 'center',
                        width: 40,
                        height: 40,
                      }}
                      title={value.toFixed(2)}
                    >
                      {value.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
}
