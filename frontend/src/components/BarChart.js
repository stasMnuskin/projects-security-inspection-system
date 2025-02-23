import React from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { colors } from '../styles/colors';

const CustomTick = ({ x, y, payload, width, dataLength }) => {
  const maxWidth = width / dataLength - 10;
  
  return (
    <Tooltip title={payload.value} placement="top">
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={12}
          textAnchor="middle"
          fill={colors.text.white}
          style={{
            fontSize: '12px',
            width: maxWidth,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {payload.value.length > maxWidth/8 ? 
            payload.value.substring(0, Math.floor(maxWidth/8) - 3) + '...' :
            payload.value
          }
        </text>
      </g>
    </Tooltip>
  );
};

const CustomBarChart = ({ data, title, onBarClick }) => {
  const [chartWidth, setChartWidth] = React.useState(0);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChartResize = React.useCallback((width) => {
    setChartWidth(width);
  }, []);

  const chartMargins = React.useMemo(() => {
    if (windowWidth < 600) {
      return { top: 5, right: 10, left: 10, bottom: 10 };
    }
    return { top: 0, right: 20, left: 20, bottom: 20 };
  }, [windowWidth]);

  return (
    <Paper sx={{ 
      p: 2, 
      backgroundColor: colors.background.black,
      borderRadius: '4px',
      border: `1px solid ${colors.border.grey}`
    }}>
      <Typography variant="h6" align="center" sx={{ 
        color: colors.text.white,
        marginBottom: { xs: '8px', sm: '12px' },
        fontSize: { xs: '0.875rem', sm: '1rem' },
        fontWeight: 'normal'
      }}>
        {title}
      </Typography>
      <Box sx={{ 
        width: '100%', 
        height: { xs: 250, sm: 300 },
        '& .recharts-wrapper': {
          transform: windowWidth < 600 ? 'scale(0.95)' : 'none'
        }
      }}>
        {/* Custom Legend */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-start',
          gap: 3,
          mb: 2,
          backgroundColor: 'transparent'
        }}>
          <Typography sx={{ 
            color: colors.primary.orange,
            backgroundColor: 'transparent'
          }}>
            תקלות משביתות
          </Typography>
          <Typography sx={{ 
            color: colors.text.grey,
            backgroundColor: 'transparent'
          }}>
            תקלות רגילות
          </Typography>
        </Box>

        {/* Chart */}
        <ResponsiveContainer onResize={handleChartResize}>
          <BarChart 
            data={data}
            barGap={0}
            barCategoryGap="15%"
            margin={chartMargins}
            reverseStackOrder={true}
          >
            <XAxis 
              dataKey="name" 
              tick={<CustomTick width={chartWidth} dataLength={data.length} />}
              height={40}
              axisLine={{ stroke: colors.border.grey }}
              interval={0}
              padding={{ left: 5, right: 5 }}
            />
            <YAxis hide />
            <Bar 
              dataKey="regularCount" 
              name="תקלות רגילות" 
              fill={colors.text.grey} 
              stackId="a"
              onClick={(data) => onBarClick?.({
                site: data.name,
                isCritical: false
              })}
              style={{ cursor: 'pointer' }}
              label={{ 
                position: 'center',
                fill: colors.text.white,
                fontSize: windowWidth < 600 ? 12 : 14,
                fontWeight: 'bold',
                formatter: (value) => value > 0 ? value : ''
              }}
            />
            <Bar 
              dataKey="criticalCount" 
              name="תקלות משביתות" 
              fill={colors.primary.orange} 
              stackId="a"
              onClick={(data) => onBarClick?.({
                site: data.name,
                isCritical: true
              })}
              style={{ cursor: 'pointer' }}
              label={{ 
                position: 'center',
                fill: colors.text.white,
                fontSize: windowWidth < 600 ? 12 : 14,
                fontWeight: 'bold',
                formatter: (value) => value > 0 ? value : ''
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

CustomBarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      criticalCount: PropTypes.number.isRequired,
      regularCount: PropTypes.number.isRequired,
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  onBarClick: PropTypes.func
};

export default CustomBarChart;
