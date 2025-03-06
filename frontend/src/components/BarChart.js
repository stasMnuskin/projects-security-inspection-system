import React from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { colors } from '../styles/colors';

// Formatter function for bar labels
const renderLabel = (value) => {
  return value >= 1 ? value : '';
};

const CustomTick = ({ x, y, payload, width, dataLength }) => {
  const maxWidth = width / dataLength - 10;
  const windowWidth = window.innerWidth;
  
  // Truncation for smaller screens
  let charRatio = 8;
  let fontSize = '12px';
  let verticalPosition = 5; 
  
  if (windowWidth < 731) {
    charRatio = 10; 
    fontSize = '11px';
    verticalPosition = 3; 
  }
  
  return (
    <Tooltip title={payload.value} placement="top">
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={verticalPosition}
          textAnchor="middle"
          fill={colors.text.white}
          style={{
            fontSize: fontSize,
            width: maxWidth,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {payload.value.length > maxWidth/charRatio ? 
            payload.value.substring(0, Math.floor(maxWidth/charRatio) - 3) + '...' :
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
  const [activeIndex, setActiveIndex] = React.useState({ dataIndex: null, type: null });

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
      return { top: 15, right: 5, left: 5, bottom: 20 };
    } else if (windowWidth < 731) {
      return { top: 15, right: 10, left: 10, bottom: 40 };
    } else if (windowWidth < 940) {
      return { top: 10, right: 10, left: 10, bottom: 35 };
    }
    return { top: 10, right: 15, left: 15, bottom: 20 };
  }, [windowWidth]);

  const handleMouseOver = (entry, index, type) => {
    setActiveIndex({ dataIndex: index, type });
  };

  const handleMouseLeave = () => {
    setActiveIndex({ dataIndex: null, type: null });
  };

  // Get fill color for a bar based on hover state
  const getBarFillColor = (index, type, defaultColor) => {
    if (activeIndex.dataIndex === index && activeIndex.type === type) {
      return defaultColor === colors.primary.orange ? '#C44620' : 
             defaultColor === colors.primary.orangeMedium ? '#DD7032' : 
             defaultColor === colors.text.lightGrey ? '#8D8D8D' : 
             defaultColor; 
    }
    return defaultColor;
  };

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
        height: { xs: 280, sm: 320, md: 340 },
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
            color: colors.primary.orangeMedium,
            backgroundColor: 'transparent'
          }}>
            תקלות משביתות חלקית
          </Typography>
          <Typography sx={{ 
            color: colors.text.lightGrey,
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
            barCategoryGap="10%"
            margin={chartMargins}
          >
            <XAxis 
              dataKey="name" 
              tick={<CustomTick width={chartWidth} dataLength={data.length} />}
              height={40}
              axisLine={{ stroke: colors.border.grey }}
              interval={0}
              padding={{ left: 2, right: 2 }}
            />
            <YAxis hide />
            
            {/* Critical Faults Bars */}
            <Bar 
              dataKey="criticalCount" 
              name="תקלות משביתות" 
              stackId="a"
              onClick={(data, index) => onBarClick?.({
                site: data.name,
                severity: 'fully_disabling'
              })}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`critical-${index}`}
                  fill={getBarFillColor(index, 'critical', colors.primary.orange)}
                  onMouseOver={() => handleMouseOver(entry, index, 'critical')}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    cursor: 'pointer',
                    transition: 'fill 0.2s ease'
                  }}
                />
              ))}
              <LabelList 
                dataKey="criticalCount" 
                position="center" 
                fill="#FFFFFF" 
                formatter={renderLabel}
                style={{ 
                  fontSize: windowWidth < 600 ? 11 : 13,
                  fontWeight: 'bold'
                }}
              />
            </Bar>
            
            {/* Partially Disabling Faults Bars */}
            <Bar 
              dataKey="partiallyDisablingCount" 
              name="תקלות משביתות חלקית" 
              stackId="a"
              onClick={(data, index) => onBarClick?.({
                site: data.name,
                severity: 'partially_disabling'
              })}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`partial-${index}`}
                  fill={getBarFillColor(index, 'partial', colors.primary.orangeMedium)}
                  onMouseOver={() => handleMouseOver(entry, index, 'partial')}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    cursor: 'pointer',
                    transition: 'fill 0.2s ease'
                  }}
                />
              ))}
              <LabelList 
                dataKey="partiallyDisablingCount" 
                position="center" 
                fill="#FFFFFF" 
                formatter={renderLabel}
                style={{ 
                  fontSize: windowWidth < 600 ? 11 : 13,
                  fontWeight: 'bold'
                }}
              />
            </Bar>
            
            {/* Regular Faults Bars */}
            <Bar 
              dataKey="regularCount" 
              name="תקלות רגילות" 
              stackId="a"
              onClick={(data, index) => onBarClick?.({
                site: data.name,
                severity: 'non_disabling'
              })}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`regular-${index}`}
                  fill={getBarFillColor(index, 'regular', colors.text.lightGrey)}
                  onMouseOver={() => handleMouseOver(entry, index, 'regular')}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    cursor: 'pointer',
                    transition: 'fill 0.2s ease'
                  }}
                />
              ))}
              <LabelList 
                dataKey="regularCount"
                position="center" 
                fill="#FFFFFF" 
                formatter={renderLabel}
                style={{ 
                  fontSize: windowWidth < 600 ? 11 : 13,
                  fontWeight: 'bold'
                }}
              />
            </Bar>
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
      partiallyDisablingCount: PropTypes.number,
      regularCount: PropTypes.number.isRequired,
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  onBarClick: PropTypes.func
};

export default CustomBarChart;
