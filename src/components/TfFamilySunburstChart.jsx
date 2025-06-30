import React, { useMemo, useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Select from 'react-select';

/* static data */
import genomeHitsData from '../constants/static/genome_tf_hit.json';
import assemblyMetadata from '../constants/static/joined.json';
import motifMetadata from '../constants/static/motif_metadata.json';

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */
function wrapTextHtml(text, width) {
  if (!text || text.length <= width) return text;
  const words = text.split(' ');
  const lines = [];
  let line = words.shift();
  while (words.length) {
    if (line.length + words[0].length + 1 <= width) {
      line += ' ' + words.shift();
    } else {
      lines.push(line);
      line = words.shift();
    }
  }
  lines.push(line);
  return lines.join('<br>');
}

/* build selector options once */
const speciesOptions = assemblyMetadata.map((s) => ({
  value: s.assembly_accession,
  label: s.organism_name,
}));

/* ------------------------------------------------------------------ */
/* component                                                          */
/* ------------------------------------------------------------------ */
const TfFamilySunburstChart = ({ onSpeciesChange }) => {
  /* local selector state */
  const [currentAssemblyId, setCurrentAssemblyId] = useState(
    speciesOptions.find((o) => o.value === 'GCA_000001405')?.value ||
      speciesOptions[0].value
  );

  const handleSpeciesSelect = (option) => {
    if (!option) return;
    setCurrentAssemblyId(option.value);
    if (typeof onSpeciesChange === 'function') onSpeciesChange(option);
  };

  /* ---------------------------------------------------------------- */
  /* plotly config (memoised)                                         */
  /* ---------------------------------------------------------------- */
  const plotConfig = useMemo(() => {
    const meta = assemblyMetadata.find(
      (d) => d.assembly_accession === currentAssemblyId
    );
    const hitRow = genomeHitsData.find((d) => d.species === currentAssemblyId);

    if (!meta || !hitRow) return { noData: true };

    const genomeSizeMb = Number(meta.genome_size_ungapped) / 1_000_000;
    if (!genomeSizeMb) return { noData: true };

    const motifMetaMap = new Map(motifMetadata.map((d) => [d.motif_id, d]));
    const rows = Object.entries(hitRow)
      .filter(([k]) => k !== 'species')
      .map(([motifId, count]) => {
        const m = motifMetaMap.get(motifId);
        if (!m) return null;
        return {
          density: Number(count) / genomeSizeMb,
          tf_class: m.tf_class,
          tf_family: m.tf_family,
          name: m.name,
        };
      })
      .filter(Boolean);

    if (!rows.length) return { noData: true };

    const classTotals = rows.reduce((acc, r) => {
      acc[r.tf_class] = (acc[r.tf_class] || 0) + r.density;
      return acc;
    }, {});
    const sortedClasses = Object.entries(classTotals).sort(
      ([, a], [, b]) => b - a
    );
    const top10 = sortedClasses.slice(0, 10).map(([c]) => c);
    const other = sortedClasses.slice(10).map(([c]) => c);

    /* palette */
    const palette = [
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
    const colorMap = new Map(
      top10.map((c, i) => [c, palette[i % palette.length]])
    );

    /* hierarchy arrays */
    const ids = [],
      labels = [],
      parents = [],
      values = [],
      colors = [],
      hover = [];

    const totalDensity = rows.reduce((s, r) => s + r.density, 0);
    ids.push('Total');
    labels.push(`Total<br>${totalDensity.toFixed(2)} motifs/MB`);
    parents.push('');
    values.push(totalDensity);
    colors.push('#FFFFFF');
    hover.push('Total');

    top10.forEach((tfClass) => {
      const classDens = classTotals[tfClass];
      const base = colorMap.get(tfClass);

      ids.push(tfClass);
      labels.push(wrapTextHtml(tfClass, 15));
      parents.push('Total');
      values.push(classDens);
      colors.push(base);
      hover.push(tfClass);

      const famTotals = {};
      rows
        .filter((r) => r.tf_class === tfClass)
        .forEach(
          (r) =>
            (famTotals[r.tf_family] = (famTotals[r.tf_family] || 0) + r.density)
        );

      Object.entries(famTotals).forEach(([fam, famDens]) => {
        const famId = `${tfClass}_${fam}`;
        ids.push(famId);
        labels.push(wrapTextHtml(fam, 12));
        parents.push(tfClass);
        values.push(famDens);
        colors.push(base + '80');
        hover.push(fam);

        rows
          .filter((r) => r.tf_class === tfClass && r.tf_family === fam)
          .forEach((r) => {
            const motifId = `${famId}_${r.name}`;
            ids.push(motifId);
            labels.push(wrapTextHtml(r.name, 10));
            parents.push(famId);
            values.push(r.density);
            colors.push(base + '40');
            hover.push(r.name);
          });
      });
    });

    if (other.length) {
      const otherTotal = rows
        .filter((r) => other.includes(r.tf_class))
        .reduce((s, r) => s + r.density, 0);
      ids.push('Other');
      labels.push(`Other<br>(${other.length} classes)`);
      parents.push('Total');
      values.push(otherTotal);
      colors.push('#C2C2C2');
      hover.push(`Other (${other.length} classes)`);
    }

    /* trace + layout */
    return {
      data: [
        {
          type: 'sunburst',
          ids,
          labels,
          parents,
          values,
          branchvalues: 'total',
          customdata: hover,
          hovertemplate:
            '<b>%{customdata}</b><br>' +
            'Density: %{value:.3f} motifs/MB<br>' +
            'Parent pct: %{percentParent:.2%}<br>' +
            'Total pct: %{percentRoot:.2%}<extra></extra>',
          maxdepth: 2,
          insidetextorientation: 'auto',
          marker: { colors, line: { color: '#FFFFFF', width: 2 } },
          opacity: 0.9,
        },
      ],
      layout: {
        height: 700, // match bar-chart height
        margin: { l: 20, r: 20, t: 20, b: 20 },
        font_size: 12,
        plot_bgcolor: 'transparent',
        paper_bgcolor: 'transparent',
        dragmode: false,
      },
    };
  }, [currentAssemblyId]);

  /* ------------------------------------------------------------------ */
  /* render                                                             */
  /* ------------------------------------------------------------------ */
  if (plotConfig.noData) {
    return (
      <div className="chart-card" style={{ height: '700px' }}>
        <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          No density data available for this species assembly.
          <br />
          (ID: {currentAssemblyId})
        </p>
      </div>
    );
  }

  return (
    <div
      className="chart-card"
      style={{ height: '700px', display: 'flex', flexDirection: 'column' }}
    >
      {/* title */}
      <h3 className="chart-title">
        TF Class , TF Family and TF Motif Density per Species
      </h3>

      {/* selector */}
      <div className="selector-container" style={{ marginBottom: '1rem' }}>
        <label className="selector-label">
          Select a Species to Analyze (Click on graph for drilldown
          analysis){' '}
        </label>
        <Select
          className="custom-select"
          options={speciesOptions}
          value={speciesOptions.find((o) => o.value === currentAssemblyId)}
          onChange={handleSpeciesSelect}
          placeholder="Select a species…"
          isClearable
        />
      </div>

      {/* plot */}
      <div style={{ flex: '1 1 auto' }}>
        <Plot
          data={plotConfig.data}
          layout={plotConfig.layout}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

export default TfFamilySunburstChart;
