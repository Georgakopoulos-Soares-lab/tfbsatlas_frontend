import React from 'react';
import ReactECharts from 'echarts-for-react';
import { motif_family_pie_stats } from '../constants/stats';
import '../styles/Visualizations.css';

const MotifPieChart = ({ speciesName }) => {
  // --- 1. DEBUGGING & DATA VALIDATION ---
  console.log('MotifPieChart received speciesName prop:', speciesName);
  const speciesData = motif_family_pie_stats[speciesName];
  console.log(
    'Data found in motif_family_pie_stats for this name:',
    speciesData
  );

  // If no data is found, render a friendly message
  if (!speciesData) {
    return (
      <div className="chart-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '700px',
          }}
        >
          <p style={{ textAlign: 'center', color: '#666' }}>
            No pie chart data available for:
            <br />
            <strong>{speciesName}</strong>
          </p>
        </div>
      </div>
    );
  }

  // --- 2. DATA PROCESSING ---
  const processHierarchicalData = (raw) => {
    if (!raw) return { outer: [], inner: [] };

    const THRESHOLD = 0.02; // 2%
    const total = Object.values(raw).reduce(
      (sum, r) => sum + (r.total || 0),
      0
    );

    const outerRingData = [];
    const innerRingData = [];
    let othersValue = 0;
    const visibleClasses = [];

    Object.entries(raw).forEach(([className, classData]) => {
      const pct = (classData.total || 0) / total;
      if (pct < THRESHOLD) {
        othersValue += classData.total || 0;
      } else {
        visibleClasses.push({
          name: className,
          value: classData.total,
          families: classData.families,
        });
      }
    });

    visibleClasses.forEach((cls) => {
      outerRingData.push({ name: cls.name, value: cls.value });
      if (cls.families) {
        Object.entries(cls.families).forEach(([familyName, familyValue]) => {
          const percentOfParent = ((familyValue / cls.value) * 100).toFixed(1);
          innerRingData.push({
            name: familyName,
            value: familyValue,
            custom: {
              parentClass: cls.name,
              parentPercentage: percentOfParent,
            },
          });
        });
      }
    });

    if (othersValue > 0) {
      outerRingData.push({ name: 'Others', value: othersValue });
    }

    return { outer: outerRingData, inner: innerRingData };
  };

  // --- 3. CHART CONFIGURATION ---
  const chartData = processHierarchicalData(speciesData);
  const option = {
    title: {
      text: `Motif Distribution in ${speciesName}`,
      subtext: 'Outer: Class, Inner: Family',
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: 'bold' },
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.seriesName === 'Families' && params.data.custom) {
          return `<b>${params.name}</b> (Family)<br/>Occurrences: ${params.value.toLocaleString()}<br/>Represents: <b>${params.data.custom.parentPercentage}%</b> of the <em>${params.data.custom.parentClass}</em> class`;
        }
        return `<b>${params.name}</b> (Class)<br/>Occurrences: ${params.value.toLocaleString()}<br/>Represents: <b>${params.percent}%</b> of total`;
      },
    },
    legend: {
      orient: 'horizontal',
      bottom: '0%',
      left: 'center',
      type: 'scroll',
      padding: [30, 10, 10, 10],
    },
    series: [
      {
        name: 'Families',
        type: 'pie',
        radius: ['35%', '55%'],
        center: ['50%', '50%'],
        data: chartData.inner,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
      {
        name: 'Classes',
        type: 'pie',
        radius: ['60%', '80%'],
        center: ['50%', '50%'],
        data: chartData.outer,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  return (
    <div className="chart-card">
      <ReactECharts option={option} style={{ height: '700px' }} />
    </div>
  );
};

export default MotifPieChart;
