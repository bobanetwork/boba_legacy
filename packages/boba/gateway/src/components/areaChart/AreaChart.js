import { Typography } from '@mui/material';
import React from 'react';
import { AreaChart as ReAreaChart, Area, Tooltip, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';


import * as S from './AreaChart.styles'

function CustomToolTip({
  active,
  payload,
  label
}) {

  if (!active) {
    return null;
  }

  return <S.ToolTipContainer borderRadius={2} p={2}>
    <Typography variant='body2'>Locking period: {label} </Typography>
    <Typography variant='body2'>Convert ratio: {payload[ 0 ].value}</Typography>
  </S.ToolTipContainer>
}

function AreaChart({ data }) {

  return <ResponsiveContainer width="90%" height={300}>
    <ReAreaChart data={data}
      margin={{ top: 20, bottom: 20 }}
    >
      <defs>
        <linearGradient id="MyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(186, 226, 26, 0.3)" />
          <stop offset="100%" stopColor="rgba(186, 226, 26, 0)" />
        </linearGradient>
      </defs>
      <CartesianGrid
        vertical={false}
        strokeDasharray="3 3"
        horizontalFill={[ 'rgba(255, 255, 255, 0.06)' ]}
        fillOpacity={0.2} />
      <XAxis dataKey="name" />
      <YAxis tickFormatter={(n) => `${n}%`} />
      <Tooltip content={<CustomToolTip />} />
      <Area
        type="monotone"
        dataKey="uv"
        stroke="#BAE21A"
        strokeWidth="2"
        fillOpacity="1"
        fill="url(#MyGradient)"
        dot
      />
      <CartesianGrid vertical={false} />
    </ReAreaChart>
  </ResponsiveContainer>

}

export default AreaChart;
