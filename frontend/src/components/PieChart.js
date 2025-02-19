import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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

const Legend = ({ data, colors, title, total }) => (
  <Box sx={{
    display: { xs: 'flex', sm: 'none' },
    flexDirection: 'column',
    gap: 1,
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '8px',
    borderRadius: '4px'
  }}>
    {data.map((entry, index) => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ 
          width: 8, 
          height: 8, 
          backgroundColor: colors[index],
          borderRadius: '2px'
        }} />
        <Typography sx={{ 
          fontSize: '10px',
          // color: colors.text.white
        }}>
          {title === "תרגילים" ? 
            `${entry.name} ${(entry.value / total * 100).toFixed(0)}%` : 
            `${entry.name} (${entry.value})`}
        </Typography>
      </Box>
    ))}
  </Box>
);

const CustomPieChart = ({ data, title, chartColors = [colors.primary.orange, colors.primary.blue], onSliceClick }) => {
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [activeIndex, setActiveIndex] = React.useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getTextWidth = (text, fontSize) => {
    try {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const context = canvasRef.current.getContext('2d');
      if (!context) return text.length * (fontSize * 0.6);
      
      context.font = `${fontSize}px Arial`;
      return context.measureText(text).width;
    } catch (error) {
      console.error('Error measuring text width:', error);
      return text.length * (fontSize * 0.6);
    }
  };

  const splitTextToLines = (text, maxWidth, fontSize) => {
    try {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const context = canvasRef.current.getContext('2d');
      if (!context) return [text];
      
      context.font = `${fontSize}px Arial`;
      
      if (context.measureText(text).width <= maxWidth) {
        return [text];
      }
      
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const width = context.measureText(currentLine + ' ' + words[i]).width;
        if (width < maxWidth) {
          currentLine += ' ' + words[i];
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }
      lines.push(currentLine);
      return lines;
    } catch (error) {
      console.error('Error splitting text:', error);
      return [text];
    }
  };

  const getBoxPosition = (cx, cy, midAngle, radius, boxWidth, boxHeight) => {
    const angle = midAngle * Math.PI / 180;
    const x = cx + radius * Math.cos(-angle);
    const y = cy + radius * Math.sin(-angle);

    // Split into quadrants for consistent positioning
    if (midAngle >= -45 && midAngle < 45) {  // right
      return { x: x, y: y - boxHeight/2 };
    } else if (midAngle >= 45 && midAngle < 135) {  // top
      return { x: x - boxWidth/2, y: y - boxHeight - 5 };
    } else if (midAngle >= 135 || midAngle < -135) {  // left
      return { x: x - boxWidth, y: y - boxHeight/2 };
    } else {  // bottom
      return { x: x - boxWidth/2, y: y + 5 };
    }
  };

  const adjustBoxPosition = (boxX, boxY, boxWidth, boxHeight, chartWidth, chartHeight) => {
    let x = boxX;
    let y = boxY;

    // Prevent overflow
    if (x < 5) x = 5;
    if (x + boxWidth > chartWidth - 5) x = chartWidth - boxWidth - 5;
    if (y < 5) y = 5;
    if (y + boxHeight > chartHeight - 5) y = chartHeight - boxHeight - 5;

    return { x, y };
  };

  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  // Custom label renderer
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
    if (windowWidth < 600) return null;

    const fontSize = windowWidth < 900 ? 11 : 12;
    const displayText = title === "תרגילים" ? 
      `${name} ${(percent * 100).toFixed(0)}%` : 
      `${name} (${value})`;

    const lines = splitTextToLines(displayText, 80, fontSize);
    const boxHeight = lines.length > 1 ? 36 : 24;
    const maxLineWidth = Math.max(...lines.map(line => getTextWidth(line, fontSize)));
    const boxWidth = Math.ceil(maxLineWidth) + 30;
    const radius = outerRadius * 1.3;

    let { x: boxX, y: boxY } = getBoxPosition(cx, cy, midAngle, radius, boxWidth, boxHeight);
    const adjusted = adjustBoxPosition(boxX, boxY, boxWidth, boxHeight, cx * 2, cy * 2);
    boxX = adjusted.x;
    boxY = adjusted.y;

    return (
      <g>
        <defs>
          <filter id="blur">
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>
        <rect
          x={boxX}
          y={boxY}
          width={boxWidth}
          height={boxHeight}
          rx={4}
          fill="transparent"
          stroke={colors.primary.orange}
          strokeWidth={1}
          filter="url(#blur)"
        />
        {lines.map((line, index) => (
          <text
            key={index}
            x={boxX + boxWidth/2}
            y={boxY + (index + 1) * (boxHeight / (lines.length + 1))}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={colors.text.white}
            style={{ 
              fontSize: `${fontSize}px`,
              fontWeight: 'bold',
              fontFamily: 'Arial'
            }}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  return (
    <Box sx={chartContainerStyles}>
      <Typography variant="h6" align="center">
        {title}
      </Typography>
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={windowWidth < 600 ? 70 : 80}
              innerRadius={windowWidth < 600 ? 50 : 60}
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
        </ResponsiveContainer>
        <Legend data={data} colors={chartColors} title={title} total={total} />
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
