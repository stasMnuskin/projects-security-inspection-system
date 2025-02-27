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
    fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.925rem', lg: '1rem' },
    fontWeight: 'normal',
    width: '100%',
    textAlign: 'center',
    lineHeight: { xs: 1.2, sm: 1.3, md: 1.4 },
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    maxHeight: { xs: '2.4em', sm: '2.6em', md: '2.8em' },
    padding: { xs: '0 4px', sm: '0 6px', md: '0 8px' }
  },
  '@media (min-width: 900px) and (max-width: 960px)': {
    padding: 1.5,
    '& h6': {
      fontSize: '0.8rem',
      marginBottom: '10px',
      maxHeight: '2.4em',
      lineHeight: 1.2
    }
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
    if (width < 1200) return { size: 250, outer: 90, inner: 65, labelOffset: 4, fontSize: 11 };
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
          onClick={() => onSliceClick?.(data[index])}
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
      <Box 
        sx={{ 
          width: chartSize.size, 
          height: chartSize.size,
          position: 'relative',
          outline: 'none'
        }}
        tabIndex={-1}
      >
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
                  transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'center',
                  transition: 'all 0.2s ease'
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
