import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import Select from 'react-select';

// Import the static JSON data
import genomeHits from '../constants/static/genome_tf_hit.json';
import assemblyMetadata from '../constants/static/joined.json';
import motifMetadata from '../constants/static/motif_metadata.json'; // Import motif data for the selector

/**
 * Text wrapping function (no changes needed here)
 */
function wrapTextHtml(text, maxChars = 20) {
  // ... (same function as before)
  if (!text || typeof text !== 'string' || text.length <= maxChars) return text;
  const words = text.split(' ');
  let lines = [], currentLine = [];
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

// Prepare options for the motif selector once
const motifOptions = motifMetadata.map(motif => ({
  value: motif.motif_id,
  label: `${motif.motif_id} (${motif.name})`
}));

const MotifDensityBarChart = () => {
  // This component now manages its own selected motif state
  const [selectedMotif, setSelectedMotif] = useState('MA0003.5');

  const plotConfig = useMemo(() => {
    if (!selectedMotif) {
      return { data: [], layout: {} }; // Return empty config if no motif is selected
    }
    
    const assemblyMetadataMap = new Map(assemblyMetadata.map(item => [item.assembly_accession, item]));

    const densities = genomeHits
      .map(hit => {
        const assemblyId = hit.species;
        const metadata = assemblyMetadataMap.get(assemblyId);
        
        // Ensure motif exists for this hit and metadata is available
        if (!metadata || hit[selectedMotif] === undefined) return null;

        const motifCount = Number(hit[selectedMotif]);
        const genomeSizeUngapped = Number(metadata.genome_size_ungapped);
        if (isNaN(motifCount) || isNaN(genomeSizeUngapped) || genomeSizeUngapped === 0) return null;

        return {
          assemblyId,
          density: motifCount / (genomeSizeUngapped / 1_000_000),
          metadata,
        };
      })
      .filter(Boolean);

    const sortedData = densities.sort((a, b) => a.density - b.density).slice(0, 20);
      
    const xValues = sortedData.map(d => d.density);
    const yLabels = sortedData.map(d => wrapTextHtml(d.metadata.organism_name, 20));
    // ... (hover text calculation remains the same, but using the dynamic sortedData)
     const hoverText = sortedData.map(d => {
      const { metadata, density } = d;
      const genomeSizeGb = Number(metadata.genome_size_ungapped) / 1_000_000_000;
      return (
        `<b>${metadata.organism_name}</b><br>` +
        `Assembly: ${metadata.assembly_accession}<br>` +
        `Density: <b>${density.toFixed(3)}</b> motifs/MB<br>` +
        // ... (rest of hover text)
        `<br><b>Genome Info:</b><br>Size (ungapped): ${genomeSizeGb.toFixed(1)} GB<br>GC content: ${metadata.gc_percentage}%<br><br><b>Taxonomic lineage:</b><br>NCBI Taxon ID: ${metadata.taxid}<br>Order: ${metadata.order}<br>Family: ${metadata.family}<br>Genus: ${metadata.genus}<br>`
      );
    });

    const data = [{
      x: xValues,
      y: yLabels,
      hovertext: hoverText,
      hoverinfo: 'text',
      orientation: 'h',
      type: 'bar',
      marker: { color: "#3B4650", opacity: 0.8 },
    }];

    const layout = {
      xaxis: { title: 'Motif Density (motifs per MB)', showgrid: true, zeroline: false, gridcolor: 'lightgray' },
      yaxis: { title: '', showgrid: true, zeroline: false, gridcolor: 'lightgray', automargin: true },
      height: 800,
      width: 500,
      font: { size: 11 },
      margin: { l: 150, r: 20, t: 25, b: 50 },
      plot_bgcolor: 'white',
      dragmode: false,
    };

    return { data, layout };
  }, [selectedMotif]); // Re-run calculation when selectedMotif changes

  return (
    <>
      <div className="selector-container" style={{marginBottom: "1rem"}}>
         <label className="selector-label">Select a Motif</label>
         <Select
            className="custom-select"
            options={motifOptions}
            value={motifOptions.find(o => o.value === selectedMotif)}
            onChange={(option) => setSelectedMotif(option.value)}
            placeholder="Search for a motif..."
            isClearable
        />
      </div>
      <Plot
        data={plotConfig.data}
        layout={plotConfig.layout}
        config={{ responsive: false, displayModeBar: false }}
      />
    </>
  );
};

export default MotifDensityBarChart;