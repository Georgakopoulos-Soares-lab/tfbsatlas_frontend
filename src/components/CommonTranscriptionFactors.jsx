import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import '../styles/Visualizations.css';

const CommonTranscriptionFactors = ({ assemblyId, organismLabel }) => {
  const [tfData, setTfData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- This useEffect is now CORRECT ---
  useEffect(() => {
    if (!assemblyId) {
      setTfData([]);
      return;
    }

    const fetchTfData = async () => {
      setLoading(true);
      setError(null);
      console.log(`[CommonTFs] Fetching data for assemblyId: ${assemblyId}`);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/most-common-transcription-factors`,
          { params: { species_name: assemblyId }, timeout: 10000 }
        );
        const sortedData = res.data.sort(
          (a, b) => a.species_count - b.species_count
        );
        setTfData(sortedData);
      } catch (err) {
        console.error(`[CommonTFs] API call failed for ${assemblyId}:`, err);
        setError('Failed to fetch transcription factors');
        setTfData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTfData();
    // The dependency array now correctly listens for changes to `assemblyId`.
  }, [assemblyId]);

  const buildOption = () => {
    if (!tfData.length) return {};
    return {
      title: {
        text: `Common TF Families in ${organismLabel}`,
        left: 'center',
        textStyle: { fontSize: 18, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) =>
          `${params[0].name}: ${params[0].value.toLocaleString()} occurrences`,
      },
      grid: { left: 160, right: 60, top: 70, bottom: 50 },
      yAxis: {
        type: 'category',
        data: tfData.map((d) => d.transcription_factor_family),
      },
      xAxis: { type: 'value', name: 'Occurrences' },
      series: [
        {
          name: 'TF Count',
          type: 'bar',
          data: tfData.map((d) => d.species_count),
          itemStyle: { color: '#5470C6' },
          label: {
            show: true,
            position: 'right',
            valueAnimation: true,
            formatter: '{c}',
          },
        },
      ],
    };
  };

  return (
    <div className="chart-card">
      {loading && <div className="text-center p-5">Loading...</div>}
      {error && <p className="error text-center p-5">{error}</p>}
      {!loading && !error && tfData.length > 0 ? (
        <ReactECharts option={buildOption()} style={{ height: '500px' }} />
      ) : (
        !loading &&
        !error && (
          <div className="text-center p-5">
            No data available for this species.
          </div>
        )
      )}
    </div>
  );
};

export default CommonTranscriptionFactors;
