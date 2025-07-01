import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import Select from 'react-select';

// Import the necessary JSON data files
import genomeHitsData from '../constants/static/genome_tf_hit.json';
import assemblyMetadata from '../constants/static/joined.json';
import motifMetadata from '../constants/static/motif_metadata.json';
// --- MODIFICATION START ---
// Import the file containing lists of empty classes and families
import emptyData from '../constants/static/empty_classes_families.json';
// --- MODIFICATION END ---

// Helper function to calculate the median of an array of numbers
const calculateMedian = (arr) => {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

// --- MODIFICATION START ---
// Create a Set of empty TF classes for efficient filtering.
const emptyClassSet = new Set(emptyData.empty_tf_classes);

// Prepare TF Class options once, filtering out the empty classes.
const tfClassOptions = [...new Set(motifMetadata.map((m) => m.tf_class))]
  .filter((tfClass) => !emptyClassSet.has(tfClass)) // Exclude if the class is in the set
  .map((tfClass) => ({
    value: tfClass,
    label: tfClass,
  }));
// --- MODIFICATION END ---

const TfClassDensityPlot = () => {
  const [plotData, setPlotData] = useState([]);
  const [plotLayout, setPlotLayout] = useState({});
  const [loading, setLoading] = useState(true);

  // State for the selected TF class, defaulting to C2H2
  const [selectedTfClass, setSelectedTfClass] = useState(
    'C2H2 zinc finger factors'
  );

  // Memoize the density calculation to avoid re-running on every render
  const densityData = useMemo(() => {
    const genomeSizeMap = new Map(
      assemblyMetadata.map((item) => [
        item.assembly_accession,
        parseFloat(item.genome_size_ungapped),
      ])
    );

    const calculatedData = {};
    genomeHitsData.forEach((hit) => {
      const assemblyId = hit.species;
      const genomeSize = genomeSizeMap.get(assemblyId);
      if (!genomeSize) return;

      const genomeSizeMb = genomeSize / 1_000_000;
      calculatedData[assemblyId] = {};

      Object.keys(hit).forEach((motifId) => {
        if (motifId !== 'species') {
          const count = parseInt(hit[motifId], 10);
          calculatedData[assemblyId][motifId] = count / genomeSizeMb;
        }
      });
    });
    return calculatedData;
  }, []);

  useEffect(() => {
    if (!selectedTfClass) {
      setPlotData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // --- Data processing logic, now dependent on selectedTfClass ---
    const processData = () => {
      const classMotifIds = new Set(
        motifMetadata
          .filter((m) => m.tf_class === selectedTfClass)
          .map((m) => m.motif_id)
      );

      const classDensityBySpecies = {};
      Object.keys(densityData).forEach((assemblyId) => {
        let totalDensity = 0;
        Object.keys(densityData[assemblyId]).forEach((motifId) => {
          if (classMotifIds.has(motifId)) {
            totalDensity += densityData[assemblyId][motifId];
          }
        });
        classDensityBySpecies[assemblyId] = totalDensity;
      });

      const finalData = assemblyMetadata
        .map((species) => ({
          ...species,
          total_density: classDensityBySpecies[species.assembly_accession] || 0,
        }))
        .filter((species) => species.total_density > 0);

      const groupedByOrder = finalData.reduce((acc, item) => {
        const order = item.order;
        if (!acc[order]) {
          acc[order] = [];
        }
        acc[order].push(item.total_density);
        return acc;
      }, {});

      const orderStats = Object.keys(groupedByOrder)
        .map((order) => ({
          order,
          median: calculateMedian(groupedByOrder[order]),
        }))
        .sort((a, b) => a.median - b.median);

      const orderedCategories = orderStats.map((stat) => stat.order);

      const traces = orderedCategories.map((order) => {
        const orderSubset = finalData.filter((item) => item.order === order);
        const hoverTexts = orderSubset.map(
          (item) =>
            `<b>${item.organism_name}</b><br>` +
            `Assembly: ${item.assembly_accession}<br>` +
            `Size (ungapped): ${(parseFloat(item.genome_size_ungapped) / 1_000_000_000).toFixed(2)} Gb<br>` +
            `GC content: ${parseFloat(item.gc_percentage).toFixed(1)}%<br>` +
            `Class TF Density: <b>${item.total_density.toFixed(3)}</b> per Mb<br>` +
            `<br>` +
            `<b>Taxonomic lineage:</b><br>` +
            `NCBI Taxon ID: ${item.tax_id}<br>` +
            `Order: ${item.order}<br>` +
            `Family: ${item.family}<br>` +
            `Genus: ${item.genus}<br>`
        );

        return {
          type: 'box',
          x: orderSubset.map((item) => item.total_density),
          name: order,
          boxpoints: 'all',
          jitter: 0.3,
          pointpos: 0,
          marker: { color: '#36668C', size: 6, opacity: 0.9 },
          line: { color: '#36668C', width: 2 },
          text: hoverTexts,
          hoverinfo: 'text',
          hovertemplate: '%{text}<extra></extra>',
          opacity: 0.8,
          orientation: 'h',
          y: Array(orderSubset.length).fill(order),
        };
      });

      setPlotData(traces);

      setPlotLayout({
        xaxis: {
          title: 'Total TF Density (per Mb)',
          showgrid: true,
          zeroline: false,
          gridcolor: 'lightgray',
        },
        yaxis: {
          title: '',
          categoryorder: 'array',
          categoryarray: orderedCategories,
          showgrid: true,
          zeroline: false,
          gridcolor: 'lightgray',
        },
        height: 800,
        showlegend: false,
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        font: { size: 12 },
        margin: { l: 150, r: 20, t: 10, b: 50 },
      });

      setLoading(false);
    };

    processData();
  }, [selectedTfClass, densityData]);

  return (
    <div className="chart-card">
      <h3 className="chart-title">
        Transcription factor class density across all species grouped by
        taxonomic species order
      </h3>
      <p className="chart-description">
        Compares the total density of a selected transcription factor class
        across all available species, grouped by taxonomic order.
      </p>

      <div className="selector-container" style={{ marginBottom: '1rem' }}>
        <label className="selector-label">Select a TF Class to Analyze</label>
        <Select
          className="custom-select"
          options={tfClassOptions}
          value={tfClassOptions.find((o) => o.value === selectedTfClass)}
          onChange={(option) =>
            setSelectedTfClass(option ? option.value : null)
          }
          placeholder="Search for a TF Class..."
          isClearable
        />
      </div>

      {loading ? (
        <div className="loading" style={{ height: '800px' }}>
          Calculating Plot...
        </div>
      ) : (
        <Plot
          data={plotData}
          layout={plotLayout}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      )}
    </div>
  );
};

export default TfClassDensityPlot;
