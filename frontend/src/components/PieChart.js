import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell } from 'recharts';
import { Box, Typography } from '@mui/material';
import { colors } from '../styles/colors';

const chartContainerStyles = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
  '& h6': {
    color: colors.text.white,
    marginBottom: { xs: '10px', sm: '12px', md: '14px', lg: '16px' },
    fontSize: { xs: '0.875rem', sm: '1rem' },
    fontWeight: 'normal',
    width: '100%'
  }
};

const CustomPieChart = ({ data, title, chartColors = [colors.primary.orange, colors.primary.blue], onSliceClick }) => {
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [activeIndex, setActiveIndex] = React.useState(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getChartSize = (width) => {
    if (width < 600) return { size: 200, outer: 70, inner: 50, labelOffset: 3, fontSize: 10 };
    if (width < 950) return { size: 160, outer: 50, inner: 35, labelOffset: 2, fontSize: 9 };
    if (width < 1200) return { size: 180, outer: 60, inner: 45, labelOffset: 3, fontSize: 10 };
    if (width < 1500) return { size: 220, outer: 80, inner: 60, labelOffset: 4, fontSize: 11 };
    return { size: 250, outer: 100, inner: 80, labelOffset: 5, fontSize: 12 };
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value, index }) => {
    const RADIAN = Math.PI / 180;
    const chartSize = getChartSize(windowWidth);
    const radius = outerRadius + chartSize.labelOffset;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const displayText = title === "תרגילים" ? 
      `${name} ${(percent * 100).toFixed(0)}%` : 
      `${name} (${value})`;

    return (
      <g>
        <text
          x={x}
          y={y}
          fill={colors.text.white}
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          onClick={() => onSliceClick?.({ site: name, isCritical: index === 0 })}
          style={{
            fontSize: `${chartSize.fontSize}px`,
            fontWeight: 'medium',
            filter: 'drop-shadow(0px 0px 1px rgba(0,0,0,0.5))',
            cursor: onSliceClick ? 'pointer' : 'default',
            transition: 'filter 0.2s ease'
          }}
          onMouseEnter={() => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
          filter={activeIndex === index ? 'brightness(1.2)' : undefined}
        >
          {displayText}
        </text>
      </g>
    );
  };

  const chartSize = getChartSize(windowWidth);
  const halfSize = chartSize.size / 2;

  return (
    <Box sx={chartContainerStyles}>
      <Typography variant="h6" align="center">
        {title}
      </Typography>
      <Box sx={{ 
        width: chartSize.size, 
        height: chartSize.size,
        position: 'relative'
      }}>
        <PieChart width={chartSize.size} height={chartSize.size}>
          <Pie
            data={data}
            cx={halfSize}
            cy={halfSize}
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={chartSize.outer}
            innerRadius={chartSize.inner}
            fill="#8884d8"
            dataKey="value"
            startAngle={180}
            endAngle={-180}
            isAnimationActive={false}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            onClick={(_, index) => onSliceClick && onSliceClick(data[index])}
            minAngle={2}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={chartColors[index % chartColors.length]}
                style={{
                  cursor: onSliceClick ? 'pointer' : 'default',
                  outline: 'none',
                  filter: activeIndex === index ? 'brightness(1.2)' : 'none',
                  transition: 'filter 0.2s ease'
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </Box>
    </Box>
  );
};

CustomPieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  chartColors: PropTypes.arrayOf(PropTypes.string),
  onSliceClick: PropTypes.func
};

export default CustomPieChart;
