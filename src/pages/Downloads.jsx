import React, {
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useEffect,
} from 'react';
import { useTable, useSortBy, usePagination, useRowSelect } from 'react-table';
import {
  Container,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  Form,
  Row,
  Col,
  Pagination,
  Alert,
  ProgressBar,
  Spinner,
} from 'react-bootstrap';

import joinedData from '../constants/static/joined.json';
import motifMetadata from '../constants/static/motif_metadata.json';
import '../styles/Downloads.css';

// -----------------------------------------------------------------------------
// Zenodo Repository Configuration
// -----------------------------------------------------------------------------
const ZENODO_RECORDS = {
  species: ['15757984', '15757995', '15757998'],
  motif: [
    '15758866',
    '15758876',
    '15759150',
    '15759232',
    '15759236',
    '15759246',
    '15759261',
  ],
};

// -----------------------------------------------------------------------------
// Helper — query Zenodo JSON API instead of HEAD (avoids CORS issues)
// -----------------------------------------------------------------------------
const recordCache = new Map();

/**
 * Fetches and caches Zenodo record metadata (JSON) which includes a `files`
 * array. The Zenodo REST API *does* emit proper CORS headers, so this is safe
 * from the browser.
 */
const getRecordMetadata = async (recordId) => {
  if (recordCache.has(recordId)) return recordCache.get(recordId);
  const res = await fetch(`https://zenodo.org/api/records/${recordId}`);
  if (!res.ok)
    throw new Error(`Could not fetch metadata for record ${recordId}`);
  const json = await res.json();
  recordCache.set(recordId, json);
  return json;
};

/**
 * Looks for the first record where `filename` exists inside the `files` list.
 * Returns the direct download URL.
 */
const findFirstValidUrl = async (filename, recordIds) => {
  for (const recordId of recordIds) {
    try {
      const meta = await getRecordMetadata(recordId);
      const fileEntry = (meta.files || []).find((f) => f.key === filename);
      if (fileEntry) {
        // Prefer the API-provided download link (has auth token params etc.)
        return (
          fileEntry.links.self ||
          fileEntry.links.download ||
          `https://zenodo.org/records/${recordId}/files/${filename}`
        );
      }
    } catch (_) {
      /* ignore individual record failures */
    }
  }
  throw new Error(`File ${filename} not found in any repository.`);
};

// -----------------------------------------------------------------------------
// Checkbox component for row selection
// -----------------------------------------------------------------------------
const IndeterminateCheckbox = forwardRef(({ indeterminate, ...rest }, ref) => {
  const defaultRef = React.useRef();
  const resolvedRef = ref || defaultRef;
  useEffect(() => {
    if (resolvedRef.current) {
      resolvedRef.current.indeterminate = indeterminate;
    }
  }, [resolvedRef, indeterminate]);
  return <Form.Check type="checkbox" ref={resolvedRef} {...rest} />;
});
IndeterminateCheckbox.displayName = 'IndeterminateCheckbox';

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------
const Downloads = () => {
  const [downloadMode, setDownloadMode] = useState('species');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);

  const handleModeChange = (val) => val && setDownloadMode(val);

  // ---------------------------------------------------------------------------
  // Table setup (react‑table)
  // ---------------------------------------------------------------------------
  const data = useMemo(
    () => (downloadMode === 'species' ? joinedData : motifMetadata),
    [downloadMode]
  );

  const columns = useMemo(() => {
    const speciesCols = [
      { Header: 'Assembly ID', accessor: 'assembly_accession' },
      { Header: 'Organism Name', accessor: 'organism_name' },
      { Header: 'Family', accessor: 'family' },
      { Header: 'Order', accessor: 'order' },
    ];
    const motifCols = [
      { Header: 'Motif ID', accessor: 'motif_id' },
      { Header: 'Motif Name', accessor: 'name' },
      { Header: 'TF Family', accessor: 'tf_family' },
      { Header: 'TF Class', accessor: 'tf_class' },
    ];
    return downloadMode === 'species' ? speciesCols : motifCols;
  }, [downloadMode]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    selectedFlatRows,
    state: { pageIndex, pageSize },
  } = useTable(
    { columns, data, initialState: { pageIndex: 0, pageSize: 10 } },
    useSortBy,
    usePagination,
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((cols) => [
        {
          id: 'selection',
          Header: ({ getToggleAllPageRowsSelectedProps }) => (
            <IndeterminateCheckbox {...getToggleAllPageRowsSelectedProps()} />
          ),
          Cell: ({ row }) => (
            <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
          ),
        },
        ...cols,
      ]);
    }
  );

  // ---------------------------------------------------------------------------
  // Download queue — verify first, then open sequentially (2.5 s apart)
  // ---------------------------------------------------------------------------
  const handleDownload = useCallback(async () => {
    const queue = selectedFlatRows.map((r) => r.original);
    const total = queue.length;
    if (!total) return;

    setIsDownloading(true);
    setIsDownloadComplete(false);
    setDownloadProgress(0);
    setCurrentStatus('Gathering valid files…');

    const recordIds = ZENODO_RECORDS[downloadMode];
    const idKey =
      downloadMode === 'species' ? 'assembly_accession' : 'motif_id';

    // 1. Verify existence and collect URLs first --------------------------------
    const validUrls = [];
    for (let i = 0; i < total; i++) {
      const item = queue[i];
      const filename = `${item[idKey]}.tar.gz`;
      setCurrentStatus(`Checking ${filename} (${i + 1}/${total})…`);
      try {
        const url = await findFirstValidUrl(filename, recordIds);
        validUrls.push({ url, filename });
      } catch (err) {
        console.warn(err.message);
      }
      setDownloadProgress(((i + 1) / total) * 50); // verification = 50%
    }

    // 2. Sequentially open each confirmed URL -----------------------------------
    const delayMs = 2500;
    for (let i = 0; i < validUrls.length; i++) {
      const { url, filename } = validUrls[i];
      setCurrentStatus(`Opening ${filename} (${i + 1}/${validUrls.length})…`);
      window.open(url, '_blank', 'noopener,noreferrer');
      setDownloadProgress(50 + ((i + 1) / validUrls.length) * 50); // download phase = remaining 50%
      if (i < validUrls.length - 1) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }

    setIsDownloadComplete(true);
    setCurrentStatus('All done!');
    setTimeout(() => setIsDownloading(false), 3000);
  }, [selectedFlatRows, downloadMode]);

  // ---------------------------------------------------------------------------
  // UI -------------------------------------------------------------------------
  return (
    <Container fluid="lg" className="mt-4 mb-4">
      <div className="downloads-paper">
        <h1 className="downloads-header">Download TFBS Atlas Datasets</h1>
        <p className="downloads-subheader">
          Files are verified via Zenodo's JSON API (no CORS issues) before any
          tabs open. Confirmed files open one every 2.5&nbsp;seconds.
        </p>

        <Alert variant="info">
          <strong>Tip:</strong> Allow pop‑ups so your browser can open each
          download tab.
        </Alert>

        <ToggleButtonGroup
          type="radio"
          name="modeToggle"
          value={downloadMode}
          onChange={handleModeChange}
          className="mb-3"
        >
          <ToggleButton id="toggle-species" value="species">
            Per Species
          </ToggleButton>
          <ToggleButton id="toggle-motif" value="motif">
            Per Motif
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Data table */}
        <Table
          striped
          bordered
          hover
          responsive
          {...getTableProps()}
          className="downloads-table"
        >
          <thead>
            {headerGroups.map((hg) => (
              <tr {...hg.getHeaderGroupProps()}>
                {hg.headers.map((col) => (
                  <th {...col.getHeaderProps(col.getSortByToggleProps())}>
                    {col.render('Header')}{' '}
                    {col.isSorted ? (col.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>

        {/* Pagination */}
        <Row className="justify-content-between align-items-center mt-3 flex-wrap">
          <Col xs={12} md="auto" className="mb-2 mb-md-0">
            <Pagination>
              <Pagination.First
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
              />
              <Pagination.Prev
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              />
              <Pagination.Item active>{pageIndex + 1}</Pagination.Item>
              <Pagination.Next
                onClick={() => nextPage()}
                disabled={!canNextPage}
              />
              <Pagination.Last
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
              />
            </Pagination>
          </Col>
          <Col xs={12} md="auto" className="d-flex align-items-center">
            <span className="me-2">
              Page{' '}
              <strong>
                {pageIndex + 1} of {pageOptions.length}
              </strong>
            </span>
            <Form.Select
              size="sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{ width: '120px' }}
            >
              {[10, 25, 50, 100].map((s) => (
                <option key={s} value={s}>
                  Show {s} rows
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>
        <div className="download-controls mt-4">
          <div className="selection-info me-3">
            <strong>{selectedFlatRows.length}</strong> item(s) selected
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleDownload}
            disabled={selectedFlatRows.length === 0 || isDownloading}
            style={{ minWidth: '220px' }}
          >
            {isDownloading ? (
              <>
                <Spinner
                  as="span"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Processing...
              </>
            ) : (
              'Download Selected'
            )}
          </Button>
        </div>
        {isDownloading && (
          <div className="progress-section mt-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted">
                Status: <strong>{currentStatus}</strong>
              </span>
              <span>{Math.round(downloadProgress)}%</span>
            </div>
            <ProgressBar animated now={downloadProgress} className="mt-1" />
          </div>
        )}
        {isDownloadComplete && !isDownloading && (
          <Alert variant="success" className="mt-3">
            Download queue complete! Please check your browser's downloads.
          </Alert>
        )}
      </div>
    </Container>
  );
};

export default Downloads;
