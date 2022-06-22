import React from 'react';
import { AreaChart as ReAreaChart, Area, Tooltip, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { dataFormatter } from './formatter';

/*
TODO:
  - make the chart label to be correct on X-Axis and Y-Axis
  - prepare the tooltip.
*/
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
      <XAxis dataKey="name" />
      <YAxis tickFormatter={dataFormatter} />
      <Tooltip />
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
