import { Bar } from 'react-chartjs-2';

const Histogram = ({ data, label, backgroundColor }) => {
    // Define bin size
    const binSize = 2;
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const numBins = Math.ceil((maxValue - minValue) / binSize);

    // Initialize bins
    const bins = Array.from({ length: numBins }, (_, i) => {
        const lowerBound = minValue + i * binSize;
        const upperBound = lowerBound + binSize;
        return { range: `${lowerBound}-${upperBound}`, count: 0 };
    });

    // Populate bins with data
    data.forEach(value => {
        const binIndex = Math.floor((value - minValue) / binSize);
        if (binIndex < numBins) {
            bins[binIndex].count += 1;
        }
    });

    // Prepare chart data
    const chartData = {
        labels: bins.map(bin => bin.range),
        datasets: [
            {
                label: label,
                data: bins.map(bin => bin.count),
                backgroundColor: backgroundColor,
            },
        ],
    };

    // Chart options
    const options = {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: `${label} Distribution`,
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Value Range',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Frequency',
                },
                beginAtZero: true,
            },
        },
    };

    return <Bar data={chartData} options={options} />;
};

export default Histogram;