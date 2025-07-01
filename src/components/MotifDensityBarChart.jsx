import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import Select from 'react-select';

// Import the static JSON data
import genomeHits from '../constants/static/genome_tf_hit.json';
import assemblyMetadata from '../constants/static/joined.json';
import motifMetadata from '../constants/static/motif_metadata.json';
// --- MODIFICATION START ---
// Import the list of motifs to be excluded
import emptyMotifs from '../constants/static/empty_motifs.json';
// --- MODIFICATION END ---

/**
 * Text wrapping function for Plotly labels
 */
function wrapTextHtml(text, maxChars = 20) {
  if (!text || typeof text !== 'string' || text.length <= maxChars) return text;
  const words = text.split(' ');
  let lines = [],
    currentLine = [];
  for (const word of words) {
    if (currentLine.join(' ').length + word.length < maxChars) {
      currentLine.push(word);
    } else {
      lines.push(currentLine.join(' '));
      currentLine = [word];
    }
  }
  lines.push(currentLine.join(' '));
  return lines.join('<br>');
}

// --- MODIFICATION START ---
// Create a Set of empty motif IDs for efficient lookup.
const emptyMotifSet = new Set(emptyMotifs);

// Prepare options for the motif selector, filtering out the empty motifs.
const motifOptions = motifMetadata
  .filter((motif) => !emptyMotifSet.has(motif.motif_id)) // Exclude motifs if they are in the set
  .map((motif) => ({
    value: motif.motif_id,
    label: `${motif.motif_id} (${motif.name})`,
  }));
// --- MODIFICATION END ---

const MotifDensityBarChart = () => {
  // This component now manages its own selected motif state
  const [selectedMotif, setSelectedMotif] = useState('MA0003.5'); // Default to a common motif

  const plotConfig = useMemo(() => {
    if (!selectedMotif) {
      return { data: [], layout: {} }; // Return empty config if no motif is selected
    }

    // Create a lookup map for faster metadata retrieval
    const assemblyMetadataMap = new Map(
      assemblyMetadata.map((item) => [item.assembly_accession, item])
    );

    const densities = genomeHits
      .map((hit) => {
        const assemblyId = hit.species;
        const metadata = assemblyMetadataMap.get(assemblyId);

        // Ensure motif exists for this hit and metadata is available
        if (!metadata || hit[selectedMotif] === undefined) return null;

        const motifCount = Number(hit[selectedMotif]);
        const genomeSizeUngapped = Number(metadata.genome_size_ungapped);
        if (
          isNaN(motifCount) ||
          isNaN(genomeSizeUngapped) ||
          genomeSizeUngapped === 0
        )
          return null;

        return {
          assemblyId,
          density: motifCount / (genomeSizeUngapped / 1_000_000), // motifs per Megabase
          metadata,
        };
      })
      .filter(Boolean); // Filter out null entries

    // --- Sort by density DESCENDING and take the top 20 ---
    const sortedData = densities
      .sort((a, b) => b.density - a.density)
      .slice(0, 20);

    const xValues = sortedData.map((d) => d.density);
    const yLabels = sortedData.map((d) =>
      wrapTextHtml(d.metadata.organism_name, 25)
    ); // Slightly more space for y-labels

    const hoverText = sortedData.map((d) => {
      const { metadata, density } = d;
      const genomeSizeGb =
        Number(metadata.genome_size_ungapped) / 1_000_000_000;
      return (
        `<b>${metadata.organism_name}</b><br>` +
        `Assembly: ${metadata.assembly_accession}<br>` +
        `Density: <b>${density.toFixed(3)}</b> motifs/MB<br>` +
        `<br><b>Genome Info:</b><br>Size (ungapped): ${genomeSizeGb.toFixed(1)} GB<br>GC content: ${metadata.gc_percentage}%<br><br><b>Taxonomic lineage:</b><br>NCBI Taxon ID: ${metadata.tax_id}<br>Order: ${metadata.order}<br>Family: ${metadata.family}<br>Genus: ${metadata.genus}<br>`
      );
    });

    const data = [
      {
        x: xValues,
        y: yLabels,
        hovertext: hoverText,
        hoverinfo: 'text',
        orientation: 'h',
        type: 'bar',
        marker: { color: '#36668C', opacity: 0.9 },
      },
    ];

    const layout = {
      xaxis: {
        title: 'Motif Density (motifs per MB)',
        showgrid: true,
        zeroline: false,
        gridcolor: 'lightgray',
      },
      yaxis: {
        title: '',
        showgrid: false,
        zeroline: false,
        automargin: true,
        type: 'category',
        autorange: 'reversed',
      }, // Reversed so highest is on top
      height: 700,
      font: { family: 'Arial, sans-serif', size: 12 },
      margin: { l: 180, r: 20, t: 25, b: 50 }, // Increased left margin for longer names
      plot_bgcolor: 'transparent',
      paper_bgcolor: 'transparent',
      dragmode: false,
    };

    return { data, layout };
  }, [selectedMotif]); // Re-run calculation when selectedMotif changes

  return (
    <div className="chart-card">
      <h3 className="chart-title">Top 20 Species by Motif Density</h3>
      <p className="chart-description">
        Compares the density of a selected motif across different species.
        Highest densities are shown at the top.
      </p>

      {/* --- Selector for the motif --- */}
      <div className="selector-container" style={{ marginBottom: '1rem' }}>
        <label className="selector-label">Select a Motif to Analyze</label>
        <Select
          className="custom-select"
          options={motifOptions}
          value={motifOptions.find((o) => o.value === selectedMotif)}
          onChange={(option) => setSelectedMotif(option ? option.value : null)}
          placeholder="Search for a motif..."
          isClearable
        />
      </div>

      {/* The plot itself */}
      <Plot
        data={plotConfig.data}
        layout={plotConfig.layout}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{ responsive: true, displayModeBar: false }}
      />
    </div>
  );
};

export default MotifDensityBarChart;
