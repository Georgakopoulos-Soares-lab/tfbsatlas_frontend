import React, { useMemo, useState, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { TreemapChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Import your data files
import speciesMetadata from '../constants/static/joined.json';
import tfHitsData from '../constants/static/genome_tf_hit.json';
import motifMetadata from '../constants/static/motif_metadata.json';

// Register the necessary ECharts components
echarts.use([
  TitleComponent,
  TooltipComponent,
  TreemapChart,
  BarChart,
  GridComponent,
  DataZoomComponent,
  CanvasRenderer,
  VisualMapComponent,
]);

// Helper function to build the treemap data structure.
const processFullChartData = () => {
  const tfHitsMap = new Map();
  tfHitsData.forEach((item) => {
    const accession = item.species;
    if (!accession) return;
    const cleanAccession = accession.split('.')[0];
    const totalHits = Object.entries(item).reduce((sum, [key, value]) => {
      if (key === 'species') return sum;
      const numValue = parseInt(value, 10);
      return sum + (isNaN(numValue) ? 0 : numValue);
    }, 0);
    tfHitsMap.set(cleanAccession, totalHits);
  });

  const taxonomyTree = {};
  speciesMetadata.forEach((species) => {
    if (!species.assembly_accession) return;
    const cleanAccessionKey = species.assembly_accession.split('.')[0];
    const totalHits = tfHitsMap.get(cleanAccessionKey) || 0;
    if (totalHits === 0) return;
    const { order, family, genus, species: speciesName } = species;
    if (!order || !family || !genus || !speciesName) return;
    if (!taxonomyTree[order])
      taxonomyTree[order] = { name: order, children: {} };
    if (!taxonomyTree[order].children[family])
      taxonomyTree[order].children[family] = { name: family, children: {} };
    if (!taxonomyTree[order].children[family].children[genus])
      taxonomyTree[order].children[family].children[genus] = {
        name: genus,
        children: [],
      };
    taxonomyTree[order].children[family].children[genus].children.push({
      name: speciesName,
      value: totalHits,
      children: null,
    });
  });

  const convertNode = (node) => {
    if (Array.isArray(node.children)) {
      const children = node.children;
      const value = children.reduce((sum, child) => sum + child.value, 0);
      return { ...node, children, value };
    } else {
      const children = Object.values(node.children).map(convertNode);
      const value = children.reduce((sum, child) => sum + child.value, 0);
      return { ...node, children, value };
    }
  };
  return Object.values(taxonomyTree).map(convertNode);
};

const findMinMaxValues = (nodes) => {
  let min = Infinity;
  let max = -Infinity;
  const traverse = (node) => {
    if (node.value) {
      if (node.value < min) min = node.value;
      if (node.value > max) max = node.value;
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  };
  nodes.forEach(traverse);
  return { min, max };
};

const TaxonomyTreemap = () => {
  // --- Memoized data for performance ---
  const fullTaxonomyData = useMemo(() => processFullChartData(), []);
  const { min, max } = useMemo(
    () => findMinMaxValues(fullTaxonomyData),
    [fullTaxonomyData]
  );
  const motifMetadataMap = useMemo(
    () => new Map(motifMetadata.map((m) => [m.motif_id, m])),
    []
  );
  const genomeTfHitsMap = useMemo(
    () => new Map(tfHitsData.map((item) => [item.species.split('.')[0], item])),
    []
  );

  // --- State management ---
  const [selectedTaxonomy, setSelectedTaxonomy] = useState(null); // `null` represents the initial "All" state
  const [aggregatedMotifData, setAggregatedMotifData] = useState(new Map());
  const [barChartDrilldownPath, setBarChartDrilldownPath] = useState([]);
  const [barChartOption, setBarChartOption] = useState(null);

  // --- Treemap click handler (Handles both node and breadcrumb clicks) ---
  const onTreemapClick = useCallback((params) => {
    // ECharts `treePathInfo` includes an invisible root node. We need to account for it.
    // A click on "Rodentia" (order) gives a path of length 2: [root, Rodentia].
    // A click on its breadcrumb also fires this event with the same path info.
    if (
      !params.name ||
      !params.treePathInfo ||
      params.treePathInfo.length < 2
    ) {
      // This ignores clicks on the outermost "Back" breadcrumb, which would have a path length of 1.
      // This effectively resets the view to "All Mammalia".
      setSelectedTaxonomy(null);
      return;
    }

    const levelIndex = params.treePathInfo.length - 2;
    const levels = ['order', 'family', 'genus', 'species'];
    if (levelIndex >= levels.length) return;

    const level = levels[levelIndex];
    const taxonomyPath = params.treePathInfo.map((item) => item.name);
    setSelectedTaxonomy({ name: params.name, level, path: taxonomyPath });
  }, []);

  // --- EFFECT 1: Process data based on the current selection ---
  useEffect(() => {
    let accessions;
    let contextName = 'All Mammalia';

    if (selectedTaxonomy) {
      contextName = selectedTaxonomy.name;
      console.group(`[Data Processing] Selected Taxonomy: ${contextName}`);
      console.log('Selection Details:', selectedTaxonomy);

      accessions = new Set();
      speciesMetadata.forEach((species) => {
        const { path, level } = selectedTaxonomy;
        let match = false;
        // The path from echarts includes the root, so we check from path[1]
        if (level === 'order' && species.order === path[1]) match = true;
        else if (
          level === 'family' &&
          species.order === path[1] &&
          species.family === path[2]
        )
          match = true;
        else if (
          level === 'genus' &&
          species.order === path[1] &&
          species.family === path[2] &&
          species.genus === path[3]
        )
          match = true;
        else if (
          level === 'species' &&
          species.order === path[1] &&
          species.family === path[2] &&
          species.genus === path[3] &&
          species.species === path[4]
        )
          match = true;

        if (match && species.assembly_accession) {
          accessions.add(species.assembly_accession.split('.')[0]);
        }
      });
      console.log(
        `Found ${accessions.size} assembly accessions for this category.`
      );
    } else {
      console.group(`[Data Processing] Initial Load / Reset: ${contextName}`);
      accessions = new Set(genomeTfHitsMap.keys());
      console.log(
        `Found ${accessions.size} total assembly accessions in the dataset.`
      );
    }

    const newAggregatedData = new Map();
    for (const accession of accessions) {
      const hits = genomeTfHitsMap.get(accession);
      if (hits) {
        for (const [motifId, countStr] of Object.entries(hits)) {
          if (motifId === 'species') continue;
          const count = parseInt(countStr, 10);
          if (count > 0) {
            newAggregatedData.set(
              motifId,
              (newAggregatedData.get(motifId) || 0) + count
            );
          }
        }
      }
    }
    console.log(`Aggregated ${newAggregatedData.size} unique motifs.`);
    setAggregatedMotifData(newAggregatedData);
    setBarChartDrilldownPath([{ level: 'tf_class', name: 'All' }]);
    console.groupEnd();
  }, [selectedTaxonomy, genomeTfHitsMap]);

  // --- EFFECT 2: Generate/update the bar chart visuals ---
  useEffect(() => {
    if (aggregatedMotifData.size === 0 || barChartDrilldownPath.length === 0) {
      setBarChartOption(null);
      return;
    }

    const currentDrilldown =
      barChartDrilldownPath[barChartDrilldownPath.length - 1];
    const groupBy = currentDrilldown.level;
    const classSelection = barChartDrilldownPath.find(
      (p) => p.level === 'tf_family'
    )?.name;
    const familySelection = barChartDrilldownPath.find(
      (p) => p.level === 'name'
    )?.name;

    const groupedData = new Map();
    for (const [motifId, count] of aggregatedMotifData.entries()) {
      const meta = motifMetadataMap.get(motifId);
      if (!meta) continue;
      if (classSelection && meta.tf_class !== classSelection) continue;
      if (familySelection && meta.tf_family !== familySelection) continue;
      const key = meta[groupBy];
      if (key) {
        groupedData.set(key, (groupedData.get(key) || 0) + count);
      }
    }

    const sortedData = [...groupedData.entries()].sort((a, b) => a[1] - b[1]);
    const categoryData = sortedData.map((item) => item[0]);
    const seriesData = sortedData.map((item) => item[1]);
    const nextLevel =
      groupBy === 'tf_class'
        ? 'tf_family'
        : groupBy === 'tf_family'
          ? 'name'
          : null;
    const chartTitle = `Motif Breakdown for ${selectedTaxonomy ? selectedTaxonomy.name : 'All Mammalia'}`;

    setBarChartOption({
      title: {
        text: chartTitle,
        subtext: barChartDrilldownPath
          .map((p) => (p.name === 'All' ? 'TF Classes' : p.name))
          .map((p) => p + ' (Click any bar for drilldown analysis)')
          .join(' > '),
        left: 'center',
        textStyle: { fontSize: 16 },
        subtextStyle: { fontSize: 12 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}: {c}',
      },
      grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
      xAxis: { type: 'value', boundaryGap: [0, 0.01] },
      yAxis: {
        type: 'category',
        data: categoryData,
        axisLabel: { fontSize: 10, interval: 0 },
      },
      dataZoom: [
        { type: 'inside', yAxisIndex: 0, filterMode: 'none' },
        {
          type: 'slider',
          yAxisIndex: 0,
          filterMode: 'none',
          show: sortedData.length > 25,
        },
      ],
      series: [
        {
          name: 'Count',
          type: 'bar',
          data: seriesData,
          payload: { nextLevel },
        },
      ],
    });
  }, [
    aggregatedMotifData,
    barChartDrilldownPath,
    motifMetadataMap,
    selectedTaxonomy,
  ]);

  // --- Bar chart interaction handlers ---
  const onBarChartClick = useCallback(
    (params) => {
      if (
        !barChartOption ||
        !barChartOption.series ||
        !barChartOption.series[params.seriesIndex]
      )
        return;
      const { nextLevel } = barChartOption.series[params.seriesIndex].payload;
      if (!nextLevel) return;
      setBarChartDrilldownPath((prev) => [
        ...prev,
        { level: nextLevel, name: params.name },
      ]);
    },
    [barChartOption]
  );

  const handleBackClick = () =>
    setBarChartDrilldownPath((prev) => prev.slice(0, -1));

  // --- ECharts option for the Treemap ---
  const treemapOption = {
    title: {
      text: 'Taxonomic Distribution of Transcription Factors',
      subtext: 'Click any rectangle or breadcrumb to explore',
      left: 'center',
    },
    tooltip: {
      /* ... */
    },
    visualMap: {
      type: 'continuous',
      min,
      max,
      inRange: { color: ['#4A90E2', '#50E3C2', '#F5A623', '#D0021B'] },
      show: false,
    },
    series: [
      {
        type: 'treemap',
        data: fullTaxonomyData,
        nodeClick: 'zoomToNode',
        label: { show: true, formatter: '{b}' },
        upperLabel: {
          show: true,
          height: 25,
          color: '#fff',
          textShadow: '1px 1px 2px #000',
        },
        itemStyle: { borderColor: '#fff' },
        leafDepth: 1,
      },
    ],
  };

  if (!fullTaxonomyData.length) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'grey' }}>
        Loading Chart Data...
      </div>
    );
  }

  return (
    <div
      style={{
        width: '90vw',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '20px',
      }}
    >
      <div style={{ flex: '1 1 50%', minWidth: 0 }}>
        <ReactECharts
          echarts={echarts}
          option={treemapOption}
          style={{ height: '800px', width: '100%' }}
          onEvents={{ click: onTreemapClick }}
        />
      </div>

      <div
        style={{
          flex: '1 1 50%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '800px',
        }}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          {barChartOption ? (
            <ReactECharts
              echarts={echarts}
              option={barChartOption}
              style={{ height: '100%', width: '100%' }}
              onEvents={{ click: onBarChartClick }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'grey',
                border: '1px dashed #ccc',
                borderRadius: '8px',
              }}
            >
              <p>Aggregating motif data...</p>
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, padding: '15px 0', textAlign: 'center' }}>
          {barChartDrilldownPath.length > 1 && (
            <button
              onClick={handleBackClick}
              style={{
                cursor: 'pointer',
                padding: '8px 20px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                backgroundColor: '#f0f0f0',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxonomyTreemap;
