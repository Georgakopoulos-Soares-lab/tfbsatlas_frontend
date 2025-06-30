import React, { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

import tfHitsData from '../constants/static/genome_tf_hit.json';
import motifMetadata from '../constants/static/motif_metadata.json';

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  BarChart,
  CanvasRenderer,
]);

const processMotifData = (selectedTaxon) => {
  console.log('[BarChart] Processing data for:', selectedTaxon);
  if (
    !selectedTaxon ||
    !selectedTaxon.accessions ||
    selectedTaxon.accessions.length === 0
  )
    return null;

  const motifMetaMap = new Map();
  motifMetadata.forEach((m) => motifMetaMap.set(m.motif_id, m));

  const relevantHits = tfHitsData.filter((hit) =>
    selectedTaxon.accessions.includes(hit.species.split('.')[0])
  );

  const motifCounts = {};
  relevantHits.forEach((hit) => {
    for (const [motifId, countStr] of Object.entries(hit)) {
      if (motifId === 'species') continue;
      const count = parseInt(countStr, 10);
      if (count > 0) motifCounts[motifId] = (motifCounts[motifId] || 0) + count;
    }
  });

  const hierarchy = {};
  for (const [motifId, totalCount] of Object.entries(motifCounts)) {
    const meta = motifMetaMap.get(motifId);
    const tf_class = meta?.tf_class || 'Unknown Class';
    const tf_family = meta?.tf_family || 'Unknown Family';
    const name = meta?.name || motifId;

    if (!hierarchy[tf_class])
      hierarchy[tf_class] = { name: tf_class, value: 0, children: {} };
    if (!hierarchy[tf_class].children[tf_family])
      hierarchy[tf_class].children[tf_family] = {
        name: tf_family,
        value: 0,
        children: {},
      };
    if (!hierarchy[tf_class].children[tf_family].children[name])
      hierarchy[tf_class].children[tf_family].children[name] = {
        name,
        value: 0,
        children: null,
      };

    hierarchy[tf_class].value += totalCount;
    hierarchy[tf_class].children[tf_family].value += totalCount;
    hierarchy[tf_class].children[tf_family].children[name].value += totalCount;
  }

  // Convert the hierarchy object to an array and sort by value
  const toSortedArray = (obj) =>
    Object.values(obj).sort((a, b) => a.value - b.value);

  const finalData = toSortedArray(hierarchy).map((tfClass) => ({
    ...tfClass,
    children: tfClass.children
      ? toSortedArray(tfClass.children).map((tfFamily) => ({
          ...tfFamily,
          children: tfFamily.children ? toSortedArray(tfFamily.children) : null,
        }))
      : null,
  }));

  return { name: 'TF Classes', children: finalData };
};

const MotifBreakdownBarChart = ({ selectedTaxon }) => {
  const fullMotifHierarchy = useMemo(
    () => processMotifData(selectedTaxon),
    [selectedTaxon]
  );

  const [historyStack, setHistoryStack] = useState([]);
  const [currentData, setCurrentData] = useState(null);

  useEffect(() => {
    if (fullMotifHierarchy) {
      console.log('[BarChart] Setting initial data.');
      setCurrentData(fullMotifHierarchy);
      setHistoryStack([]);
    }
  }, [fullMotifHierarchy]);

  const handleChartClick = (params) => {
    const clickedNode = currentData.children.find(
      (c) => c.name === params.name
    );
    if (
      clickedNode &&
      clickedNode.children &&
      clickedNode.children.length > 0
    ) {
      console.log('[BarChart] Drilling down to:', clickedNode.name);
      setHistoryStack([...historyStack, currentData]);
      setCurrentData({
        name: clickedNode.name,
        children: clickedNode.children,
      });
    }
  };

  const handleGoBack = () => {
    if (historyStack.length > 0) {
      const lastState = historyStack[historyStack.length - 1];
      console.log('[BarChart] Going back to:', lastState.name);
      setCurrentData(lastState);
      setHistoryStack(historyStack.slice(0, -1));
    }
  };

  if (!currentData) {
    return <p>Processing motif data...</p>;
  }

  const categories = currentData.children.map((item) => item.name);
  const values = currentData.children.map((item) => item.value);

  const option = {
    title: {
      text: `Motif Breakdown for "${selectedTaxon.name}"`,
      subtext: `Current Level: ${currentData.name}`,
      left: 'center',
      textStyle: { fontSize: 16 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
    },
    yAxis: {
      type: 'category',
      data: categories,
    },
    // This adds the scrollbar for overflow
    dataZoom: [
      {
        type: 'inside',
        yAxisIndex: 0,
        start: 0,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: true,
      },
      {
        type: 'slider',
        yAxisIndex: 0,
        start: 0,
        end: 100,
      },
    ],
    series: [
      {
        name: 'TF Hits',
        type: 'bar',
        data: values,
      },
    ],
  };

  return (
    <div>
      {historyStack.length > 0 && (
        <button onClick={handleGoBack} style={{ marginBottom: '10px' }}>
          ← Back
        </button>
      )}
      <ReactECharts
        echarts={echarts}
        option={option}
        style={{ height: '700px', width: '100%' }}
        onEvents={{ click: handleChartClick }}
      />
    </div>
  );
};

export default MotifBreakdownBarChart;
