import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

import genomeHitsData from '../constants/static/genome_tf_hit.json';
import assemblyMetadata from '../constants/static/joined.json';
import motifMetadata from '../constants/static/motif_metadata.json';

/**
 * Wraps text with <br> tags for Plotly.
 */
function wrapTextHtml(text, width) {
  if (!text || text.length <= width) return text;
  const words = text.split(' ');
  const lines = [];
  let currentLine = words.shift();
  while (words.length > 0) {
    if (currentLine.length + words[0].length + 1 <= width) {
      currentLine += ' ' + words.shift();
    } else {
      lines.push(currentLine);
      currentLine = words.shift();
    }
  }
  lines.push(currentLine);
  return lines.join('<br>');
}

const TfFamilySunburstChart = ({ speciesAssemblyId }) => {
  const plotConfig = useMemo(() => {
    console.log(
      `\n[Sunburst] --- Recalculating for Assembly ID: "${speciesAssemblyId}" ---`
    );

    // Early guard for empty or undefined prop
    if (!speciesAssemblyId) {
      console.error(
        '[Sunburst] FAIL: Received empty or undefined speciesAssemblyId prop.'
      );
      return { data: [], layout: {}, noData: true };
    }

    const assemblyMetaMap = new Map(
      assemblyMetadata.map((d) => [d.assembly_accession, d])
    );
    const motifMetaMap = new Map(motifMetadata.map((d) => [d.motif_id, d]));

    // 1) Metadata lookup
    const speciesMeta = assemblyMetaMap.get(speciesAssemblyId);
    if (!speciesMeta) {
      console.error(
        `[Sunburst] FAIL: No metadata found in joined.json for assembly: "${speciesAssemblyId}"`
      );
      return { data: [], layout: {}, noData: true };
    }
    console.log(`[Sunburst] OK: Found metadata for "${speciesAssemblyId}"`);

    // 2) Hits lookup
    const speciesHits = genomeHitsData.find(
      (d) => d.species === speciesAssemblyId
    );
    if (!speciesHits) {
      console.error(
        `[Sunburst] FAIL: No entry found in genome_tf_hit.json for assembly: "${speciesAssemblyId}"`
      );
      return { data: [], layout: {}, noData: true };
    }
    console.log(`[Sunburst] OK: Found genome hits for "${speciesAssemblyId}".`);

    // 3) Genome size validation
    const genomeSizeMb = Number(speciesMeta.genome_size_ungapped) / 1_000_000;
    if (isNaN(genomeSizeMb) || genomeSizeMb <= 0) {
      console.error(
        `[Sunburst] FAIL: Invalid genome size for "${speciesAssemblyId}":`,
        speciesMeta.genome_size_ungapped
      );
      return { data: [], layout: {}, noData: true };
    }

    // 4) Build density + annotations
    const densityWithAnnotations = Object.entries(speciesHits)
      .map(([motifId, count]) => {
        if (motifId === 'species') return null;
        const motifMeta = motifMetaMap.get(motifId);
        if (
          !motifMeta ||
          !motifMeta.tf_class ||
          !motifMeta.tf_family ||
          !motifMeta.name
        )
          return null;
        return {
          motif_id: motifId,
          density: Number(count) / genomeSizeMb,
          ...motifMeta,
        };
      })
      .filter(Boolean);

    if (densityWithAnnotations.length === 0) {
      console.error(
        `[Sunburst] FAIL: No valid motifs with complete metadata found for "${speciesAssemblyId}".`
      );
      return { data: [], layout: {}, noData: true };
    }
    console.log(
      `[Sunburst] OK: Successfully processed ${densityWithAnnotations.length} valid motifs for "${speciesAssemblyId}".`
    );

    // --- downstream aggregation and sunburst construction ---
    const classDensities = densityWithAnnotations.reduce((acc, curr) => {
      acc[curr.tf_class] = (acc[curr.tf_class] || 0) + curr.density;
      return acc;
    }, {});

    const sortedClasses = Object.entries(classDensities).sort(
      ([, a], [, b]) => b - a
    );
    const top10Classes = sortedClasses.slice(0, 10).map(([name]) => name);
    const otherClasses = sortedClasses.slice(10).map(([name]) => name);
    const top10Data = densityWithAnnotations.filter((d) =>
      top10Classes.includes(d.tf_class)
    );
    const totalDensity = densityWithAnnotations.reduce(
      (sum, d) => sum + d.density,
      0
    );

    const ids = [],
      labels = [],
      parents = [],
      values = [],
      colors = [],
      hover_labels = [];
    const colorPalette = [
      '#0A1824',
      '#0E2233',
      '#122D42',
      '#173A57',
      '#1D486B',
      '#225680',
      '#286394',
      '#2D71A8',
      '#337FBD',
      '#388CD1',
    ];
    const top10ColorMap = new Map(
      top10Classes.map((name, i) => [
        name,
        colorPalette[i % colorPalette.length],
      ])
    );

    // Root
    ids.push('Total');
    labels.push(`Total<br>${totalDensity.toFixed(2)} motifs/MB`);
    parents.push('');
    values.push(totalDensity);
    colors.push('#FFFFFF');
    hover_labels.push('Total');

    // Classes → Families → Motifs
    top10Classes.forEach((tf_class) => {
      const classData = top10Data.filter((d) => d.tf_class === tf_class);
      const classDensity = classData.reduce((sum, d) => sum + d.density, 0);
      const baseColor = top10ColorMap.get(tf_class);

      ids.push(tf_class);
      labels.push(wrapTextHtml(tf_class, 15));
      parents.push('Total');
      values.push(classDensity);
      colors.push(baseColor);
      hover_labels.push(tf_class);

      const familyDensities = classData.reduce((acc, curr) => {
        acc[curr.tf_family] = (acc[curr.tf_family] || 0) + curr.density;
        return acc;
      }, {});

      Object.entries(familyDensities).forEach(([tf_family, famDensity]) => {
        const familyId = `${tf_class}_${tf_family}`;
        ids.push(familyId);
        labels.push(wrapTextHtml(tf_family, 12));
        parents.push(tf_class);
        values.push(famDensity);
        colors.push(baseColor + '80');
        hover_labels.push(tf_family);

        classData
          .filter((d) => d.tf_family === tf_family)
          .forEach((row) => {
            const motifNodeId = `${familyId}_${row.name}`;
            ids.push(motifNodeId);
            labels.push(wrapTextHtml(row.name, 10));
            parents.push(familyId);
            values.push(row.density);
            colors.push(baseColor + '40');
            hover_labels.push(row.name);
          });
      });
    });

    if (otherClasses.length > 0) {
      const otherDensity = densityWithAnnotations
        .filter((d) => otherClasses.includes(d.tf_class))
        .reduce((sum, d) => sum + d.density, 0);

      ids.push('Other');
      labels.push(`Other<br>(${otherClasses.length} classes)`);
      parents.push('Total');
      values.push(otherDensity);
      colors.push('#C2C2C2');
      hover_labels.push(`Other (${otherClasses.length} classes)`);
    }

    const trace = {
      type: 'sunburst',
      ids,
      labels,
      parents,
      values,
      branchvalues: 'total',
      customdata: hover_labels,
      hovertemplate:
        '<b>%{customdata}</b><br>' +
        'Density: %{value:.3f} motifs/MB<br>' +
        'Of Parent: %{percentParent:.2%}<br>' +
        'Of Total: %{percentRoot:.2%}<extra></extra>',
      maxdepth: 2,
      insidetextorientation: 'auto',
      opacity: 0.9,
      marker: { colors, line: { color: '#FFFFFF', width: 2 } },
    };

    const layout = {
      font_size: 12,
      height: 700,
      width: 700,
      margin: { l: 20, r: 20, t: 20, b: 20 },
      dragmode: false,
    };

    return { data: [trace], layout };
  }, [speciesAssemblyId]);

  if (plotConfig.noData) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '700px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '8px',
        }}
      >
        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          No density data available for this species assembly.
          <br />
          (ID: {speciesAssemblyId})
        </p>
      </div>
    );
  }

  return (
    <Plot
      data={plotConfig.data}
      layout={plotConfig.layout}
      config={{ responsive: true, displayModeBar: false }}
    />
  );
};

export default TfFamilySunburstChart;
