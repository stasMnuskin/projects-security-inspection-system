import React from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Box, Typography } from '@mui/material';
import { colors } from '../styles/colors';

const chartContainerStyles = {
  width: '100%',
  height: { xs: 250, sm: 300 },
  '& h6': {
    color: colors.text.white,
    marginBottom: { xs: '8px', sm: '12px' },
    fontSize: { xs: '0.875rem', sm: '1rem' },
    fontWeight: 'normal'
  }
};

const CustomPieChart = ({ data, title, chartColors = [colors.primary.orange, colors.primary.blue] }) => {
  const RADIAN = Math.PI / 180;
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Custom label renderer
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }) => {
    const radius = outerRadius * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    const isRightSide = x > cx;
    const textAnchor = isRightSide ? 'end' : 'start';
    const adjustedX = isRightSide ? x - 10 : x + 10;
    
    return (
      <text 
        x={adjustedX}
        y={y}
        fill={colors.text.white}
        textAnchor={textAnchor}
        dominantBaseline="central"
        style={{ 
          direction: 'rtl', 
          unicodeBidi: 'bidi-override',
          fontSize: windowWidth < 600 ? '12px' : '14px'
        }}
      >
        {`${name} (${value})`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: `1px solid ${colors.border.orange}`,
            p: 1,
          }}
        >
          <Typography sx={{ color: 'white' }}>
            {`${payload[0].name}: ${payload[0].value}`}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={chartContainerStyles}>
      <Typography variant="h6" align="center">
        {title}
      </Typography>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={renderCustomizedLabel}
            outerRadius={windowWidth < 600 ? 60 : 70}
            innerRadius={windowWidth < 600 ? 40 : 45}
            fill="#8884d8"
            dataKey="value"
            startAngle={180}
            endAngle={-180}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={chartColors[index % chartColors.length]}
                style={{
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'opacity 0.2s ease',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
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
};

export default CustomPieChart;
