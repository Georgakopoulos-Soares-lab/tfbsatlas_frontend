import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import Select from 'react-select';

// Import the static JSON data
import genomeHitsData from '../constants/static/genome_tf_hit.json';
import assemblyMetadata from '../constants/static/joined.json';
import motifMetadata from '../constants/static/motif_metadata.json';

// --- Define the custom color palette ---
// This creates a Plotly-compatible colorscale from the provided hex codes.
const customColors = [
  '#3E9AE6',
  '#337FBD',
  '#2D71A8',
  '#286394',
  '#225680',
  '#1D486B',
  '#173A57',
  '#122D42',
  '#0E2233',
  '#091620',
];
const customColorscale = customColors.map((color, index) => {
  const value = index / (customColors.length - 1);
  return [value, color];
});

const DensityHeatmapPerOrder = () => {
  const [plotConfig, setPlotConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState('Eulipotyphla');

  const orderOptions = useMemo(() => {
    const uniqueOrders = [
      ...new Set(assemblyMetadata.map((d) => d.order).filter(Boolean)),
    ];
    return uniqueOrders.sort().map((order) => ({ value: order, label: order }));
  }, []);

  const densityMap = useMemo(() => {
    const assemblyMap = new Map(
      assemblyMetadata.map((d) => [
        d.assembly_accession,
        { ...d, genome_size_ungapped: Number(d.genome_size_ungapped) },
      ])
    );
    const calculatedDensityMap = new Map();
    genomeHitsData.forEach((genome) => {
      const assemblyInfo = assemblyMap.get(genome.species);
      if (!assemblyInfo || !assemblyInfo.genome_size_ungapped) return;
      const genomeSizeMb = assemblyInfo.genome_size_ungapped / 1_000_000;
      const speciesDensities = new Map();
      for (const motifId in genome) {
        if (motifId !== 'species') {
          speciesDensities.set(motifId, Number(genome[motifId]) / genomeSizeMb);
        }
      }
      calculatedDensityMap.set(genome.species, speciesDensities);
    });
    return calculatedDensityMap;
  }, []);

  const motifClassMap = useMemo(
    () => new Map(motifMetadata.map((d) => [d.motif_id, d.tf_class])),
    []
  );

  useEffect(() => {
    if (!selectedOrder || !densityMap) {
      setIsLoading(false);
      setPlotConfig(null);
      return;
    }
    setIsLoading(true);

    const generatePlotData = () => {
      const mean = (arr) => arr.reduce((acc, val) => acc + val, 0) / arr.length;
      const stdDev = (arr, avg) => {
        if (arr.length < 2) return 0;
        const squareDiffs = arr.map((val) => Math.pow(val - avg, 2));
        return Math.sqrt(mean(squareDiffs));
      };

      const orderAssemblies = assemblyMetadata.filter(
        (d) => d.order === selectedOrder && densityMap.has(d.assembly_accession)
      );

      let classDensitiesPerAssembly = [];
      orderAssemblies.forEach((assembly) => {
        const assemblyDensities = densityMap.get(assembly.assembly_accession);
        const tfClassAgg = {};
        for (const [motifId, density] of assemblyDensities.entries()) {
          const tfClass = motifClassMap.get(motifId);
          if (tfClass) {
            if (!tfClassAgg[tfClass]) tfClassAgg[tfClass] = [];
            tfClassAgg[tfClass].push(density);
          }
        }
        const meanClassDensities = { organism_name: assembly.organism_name };
        for (const tfClass in tfClassAgg) {
          meanClassDensities[tfClass] = mean(tfClassAgg[tfClass]);
        }
        classDensitiesPerAssembly.push(meanClassDensities);
      });

      const organismGroups = classDensitiesPerAssembly.reduce((acc, item) => {
        acc[item.organism_name] = acc[item.organism_name] || [];
        acc[item.organism_name].push(item);
        return acc;
      }, {});

      const groupedData = {};
      const allTfClassesInOrder = new Set();
      for (const organismName in organismGroups) {
        const items = organismGroups[organismName];
        groupedData[organismName] = {};
        const tempClassMeans = {};
        items.forEach((item) => {
          Object.keys(item).forEach((key) => {
            if (key !== 'organism_name') {
              if (!tempClassMeans[key]) tempClassMeans[key] = [];
              tempClassMeans[key].push(item[key]);
              allTfClassesInOrder.add(key);
            }
          });
        });
        for (const tfClass in tempClassMeans) {
          groupedData[organismName][tfClass] = mean(tempClassMeans[tfClass]);
        }
      }

      const tfClassStats = {};
      allTfClassesInOrder.forEach((tfClass) => {
        const values = Object.values(groupedData)
          .map((d) => d[tfClass])
          .filter((v) => v !== undefined);
        if (values.length > 0) {
          const classMean = mean(values);
          tfClassStats[tfClass] = {
            mean: classMean,
            std: stdDev(values, classMean),
          };
        }
      });

      const zScoreData = {};
      const originalValues = {};
      for (const organismName in groupedData) {
        zScoreData[organismName] = {};
        originalValues[organismName] = {};
        for (const tfClass in groupedData[organismName]) {
          const stats = tfClassStats[tfClass];
          if (stats) {
            const value = groupedData[organismName][tfClass];
            zScoreData[organismName][tfClass] =
              stats.std > 0 ? (value - stats.mean) / stats.std : 0;
            originalValues[organismName][tfClass] = value;
          }
        }
      }

      const sortedOrganisms = Object.keys(groupedData).sort();
      const activeTfClasses = Array.from(allTfClassesInOrder).filter(
        (tfClass) => {
          const totalDensity = sortedOrganisms.reduce(
            (sum, org) => sum + (originalValues[org]?.[tfClass] ?? 0),
            0
          );
          return totalDensity > 0;
        }
      );
      const sortedTfClasses = activeTfClasses.sort();

      // *** CHANGE 1: The `z` value for the heatmap is now the original density. ***
      const heatZValues = sortedTfClasses.map((tfClass) =>
        sortedOrganisms.map((org) => originalValues[org]?.[tfClass] ?? null)
      );

      // *** CHANGE 2: The `customdata` for the hover is now the Z-score. ***
      const heatCustomData = sortedTfClasses.map((tfClass) =>
        sortedOrganisms.map((org) => zScoreData[org]?.[tfClass] ?? null)
      );

      setPlotConfig({
        data: [
          {
            // *** CHANGE 3: Apply the new data variables. ***
            z: heatZValues,
            x: sortedOrganisms,
            y: sortedTfClasses,
            customdata: heatCustomData,
            type: 'heatmap',
            colorscale: customColorscale, // This will now apply correctly
            showscale: true,
            hoverongaps: false,
            // *** CHANGE 4: Update the hovertemplate to reflect the data swap. ***
            hovertemplate:
              '<b>TF Class: %{y}</b><br>' +
              '<b>Species: %{x}</b><br>' +
              'Mean TFBS density: %{z:.3f} per Mb<br>' +
              'Z-score: %{customdata:.2f}<br>' +
              '<extra></extra>',
          },
        ],
        layout: {
          xaxis: { title: '', tickfont: { size: 10 } },
          yaxis: { title: '', tickfont: { size: 10 }, automargin: true },
          font: { size: 12 },
          margin: { l: 250, r: 20, t: 10, b: 150 },
          autosize: true,
          plot_bgcolor: 'transparent',
          paper_bgcolor: 'transparent',
        },
      });
      setIsLoading(false);
    };

    generatePlotData();
  }, [selectedOrder, densityMap, motifClassMap]);

  return (
    <div className="chart-card">
      <h3 className="chart-title">
        Transcription Factor Density Heatmap per TF Class
      </h3>
      <p className="chart-description">
        This heatmap shows the absolute TFBS class density (per Mb) for a
        selected taxonomic order. A darker color indicates a higher density for
        that TF class, while a lighter color indicates a lower density.
      </p>

      <div className="selector-container" style={{ marginBottom: '1rem' }}>
        <label className="selector-label">Select a Taxonomic Order</label>
        <Select
          className="custom-select"
          options={orderOptions}
          value={orderOptions.find((o) => o.value === selectedOrder)}
          onChange={(option) => setSelectedOrder(option ? option.value : null)}
          placeholder="Search for an Order..."
          isClearable
        />
      </div>

      {isLoading ? (
        <div className="loading" style={{ height: '800px' }}>
          Generating Heatmap...
        </div>
      ) : plotConfig && plotConfig.data[0].x.length > 0 ? (
        <Plot
          data={plotConfig.data}
          layout={plotConfig.layout}
          style={{ width: '100%', height: '800px' }}
          useResizeHandler={true}
          config={{ responsive: true, displayModeBar: true }}
        />
      ) : (
        <div
          className="placeholder-content"
          style={{
            height: '800px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p>No data available for the selected order.</p>
        </div>
      )}
    </div>
  );
};

export default DensityHeatmapPerOrder;
