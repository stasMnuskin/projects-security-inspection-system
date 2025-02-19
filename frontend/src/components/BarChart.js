import React from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { colors } from '../styles/colors';

const CustomBarChart = ({ data, title, onBarClick }) => {
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
      <Box sx={{ width: '100%', height: { xs: 250, sm: 300 } }}>
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
        <ResponsiveContainer>
          <BarChart 
            data={data}
            barGap={0}
            barCategoryGap="15%"
            margin={{ top: 0, right: 20, left: 20, bottom: 5 }}
            reverseStackOrder={true}
          >
            <XAxis 
              dataKey="name" 
              tick={{ 
                fill: colors.text.white,
                backgroundColor: 'transparent'
              }}
              axisLine={{ stroke: colors.border.grey }}
              interval={0}
              padding={{ left: 10, right: 10 }}
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
                fontSize: 14,
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
                fontSize: 14,
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
