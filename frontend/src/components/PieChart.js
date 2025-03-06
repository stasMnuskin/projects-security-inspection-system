import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PieChart as RechartsPieChart, Pie, Cell, Sector } from 'recharts';
import { Box, Typography } from '@mui/material';
import { colors } from '../styles/colors';

// Clean container styles
const containerStyles = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  position: 'relative',
  padding: 0,
  boxSizing: 'border-box',
  '& h6': {
    color: colors.text.white,
    marginBottom: '10px',
    fontWeight: 'normal',
    width: '100%',
    textAlign: 'center'
  }
};

/**
 * Custom Pie Chart component with sophisticated label placement algorithm
 */
const CustomPieChart = ({ data, title, chartColors = [colors.primary.orange, colors.text.grey], onSliceClick }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  
  // Filter out zero values to prevent empty segments
  const validData = data.filter(item => item.value > 0);
  
  // Calculate total value for percentage computation
  const totalValue = validData.reduce((sum, item) => sum + item.value, 0);
  
  // Add percentage to each data item
  const dataWithPercent = validData.map(item => ({
    ...item,
    percent: totalValue > 0 ? item.value / totalValue : 0
  }));
  
  useEffect(() => {
    const currentRef = containerRef.current;
    if (!currentRef) return;
    
    const updateDimensions = () => {
      const { clientWidth, clientHeight } = currentRef;
      setChartDimensions({
        width: clientWidth,
        height: clientHeight
      });
    };
    
    // Initial update
    updateDimensions();
    
    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(currentRef);
    
    // Use local variable in cleanup
    return () => {
      resizeObserver.unobserve(currentRef);
    };
  }, []);
  
  // Calculate chart dimensions based on container
  const getChartSize = () => {
    const { width, height } = chartDimensions;
    if (!width || !height) return { size: 0, outerRadius: 0, innerRadius: 0 }; 
    const minDimension = Math.min(width, height * 0.9);
    const size = Math.min(450, Math.max(220, minDimension));
    const outerRadius = size * 0.42; 
    const innerRadius = outerRadius * 0.58; 
    
    return { size, outerRadius, innerRadius };
  };
  
  // Render active shape with highlight effect
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 4}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke={colors.background.black}
          strokeWidth={2}
          style={{cursor:'pointer'}}
        />
      </g>
    );
  };
  
  const renderCustomizedLabel = (props) => {
    const { cx, cy, midAngle, outerRadius, name, value, percent, index } = props;
    const { size } = getChartSize();
    
    // Constants
    const RADIAN = Math.PI / 180;
    
    // Determine if this is a small slice (less than 10% of the pie)
    const isSmallSlice = percent < 0.1;
    const isTinySlice = percent < 0.05;
    const isMicroSlice = percent < 0.03;
    
    // Dynamic radius based on slice size
    let radiusMultiplier;
    if (isMicroSlice) {
      radiusMultiplier = 1.8; 
    } else if (isTinySlice) {
      radiusMultiplier = 1.5; 
    } else if (isSmallSlice) {
      radiusMultiplier = 1.3; 
    } else {
      radiusMultiplier = 1.1; 
    }
    
    // Calculate position with dynamic radius
    const sin = Math.sin(-midAngle * RADIAN);
    const cos = Math.cos(-midAngle * RADIAN);
    const labelRadius = outerRadius * radiusMultiplier;
    const x = cx + labelRadius * cos;
    const y = cy + labelRadius * sin;
    
    // Calculate font size based on available space and slice size
    const getTextSize = () => {
      if (chartDimensions.width > 1500) {
        return Math.min(20, size * 0.06); 
      } else if (chartDimensions.width > 1200) {
        return Math.min(18, size * 0.055); 
      }
      return Math.min(14, size * 0.045); 
    };
    
    const baseFontSize = getTextSize();
    // Slightly adjust font size for small slices to ensure visibility
    const fontSize = isMicroSlice ? baseFontSize * 0.9 : 
                    isTinySlice ? baseFontSize * 0.95 : 
                    baseFontSize;
    
    // Format text based on chart type
    let displayText;
    if (title === "תרגילים") {
      displayText = `${name} ${(percent * 100).toFixed(0)}%`;
    } else {
      displayText = `${name} (${value})`;
    }
    
    const textAnchor = cos >= 0 ? 'start' : 'end';
    const pathId = `label-path-${index}`;
    // Create two-segment connecting line paths between slice and label
    // First segment from slice to midpoint
    const midPointRadius = outerRadius * (1 + (radiusMultiplier - 1) * 0.3);
    const midX = cx + midPointRadius * cos;
    const midY = cy + midPointRadius * sin;
    
    // Second segment is from midpoint to label
    let xOffset = 0;
    let yOffset = 0;
    
    if (isMicroSlice) {
      // Calculate offset perpendicular to the radial line
      const perpAngle = midAngle + 90;
      const offsetMagnitude = fontSize * 0.5;
      xOffset = offsetMagnitude * Math.cos(-perpAngle * RADIAN);
      yOffset = offsetMagnitude * Math.sin(-perpAngle * RADIAN);
      
      // Apply the offset to avoid overlapping with other micro-slice labels
      const offsetDirection = (index % 2 === 0) ? 1 : -1;
      xOffset *= offsetDirection;
      yOffset *= offsetDirection;
    }
    
    return (
      <g>
        <path
          d={`M${cx + outerRadius * cos},${cy + outerRadius * sin}
              L${midX},${midY}
              L${x + xOffset},${y + yOffset}`}
          stroke={colors.text.lightGrey}
          strokeWidth={1}
          fill="none"
          id={pathId}
        />
        
        <rect
          x={textAnchor === 'end' ? x - displayText.length * fontSize * 0.55 : x}
          y={y - fontSize * 0.7}
          width={displayText.length * fontSize * 0.55}
          height={fontSize * 1.4}
          rx={3}
          fill="rgba(0,0,0,0)"
          fillOpacity={0}
        />
        
        <text
          x={x + xOffset}
          y={y + yOffset}
          textAnchor={textAnchor}
          dominantBaseline="central"
          fill={colors.text.white}
          fontSize={fontSize}
          fontWeight="bold"
          style={{
            cursor: 'pointer', 
            fontSize: '11px',
            textShadow: '0 0 1px rgba(0,0,0,0.7)' 
          }}
        >
          {displayText}
        </text>
      </g>
    );
  };
  
  // Get chart dimensions
  const { size, outerRadius, innerRadius } = getChartSize();
  const centerX = size / 2;
  const centerY = size / 2;
  
  return (
    <Box sx={containerStyles} ref={containerRef}>
      <Typography variant="h6">
        {title}
      </Typography>
      
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          position: 'relative',
          '& svg *': { cursor: 'pointer' },
          '&:focus, & *:focus': {
            cursor: 'pointer',
            outline: 'none !important', 
          }
        }}
        tabIndex={-1}
      >
        {size > 0 && (
          <RechartsPieChart
            width={size}
            height={size}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <Pie
              data={dataWithPercent}
              cx={centerX}
              cy={centerY}
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              dataKey="value"
              startAngle={180}
              endAngle={-180}
              isAnimationActive={false}
              paddingAngle={1}
              minAngle={3}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={(_, index) => onSliceClick && onSliceClick(dataWithPercent[index])}
              style={{ cursor: 'pointer' }} 
            >
              {dataWithPercent.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                  cursor="pointer" 
                  style={{
                    filter: activeIndex === index ? 'brightness(1.2)' : 'none', 
                    transition: 'filter 0.2s ease',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Pie>
          </RechartsPieChart>
        )}
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
