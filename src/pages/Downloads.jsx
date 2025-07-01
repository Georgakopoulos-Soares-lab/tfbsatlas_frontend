import React, {
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useEffect,
} from 'react';
import {
  useTable,
  useSortBy,
  usePagination,
  useRowSelect,
  useGlobalFilter,
} from 'react-table';
// The 'match-sorter' import is no longer needed and has been removed.
import {
  Container,
  Button,
  Table,
  Form,
  Row,
  Col,
  Pagination,
  Alert,
  ProgressBar,
  Spinner,
} from 'react-bootstrap';

// --- Static Data Imports ---
import joinedData from '../constants/static/joined.json';
import motifMetadata from '../constants/static/motif_metadata.json';
import emptyMotifs from '../constants/static/empty_motifs.json';
import '../styles/Downloads.css';

// -----------------------------------------------------------------------------
// Zenodo Repository Configuration (No changes needed)
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
const recordCache = new Map();

const getRecordMetadata = async (recordId) => {
  if (recordCache.has(recordId)) return recordCache.get(recordId);
  const res = await fetch(`https://zenodo.org/api/records/${recordId}`);
  if (!res.ok)
    throw new Error(`Could not fetch metadata for record ${recordId}`);
  const json = await res.json();
  recordCache.set(recordId, json);
  return json;
};

const findFirstValidUrl = async (filename, recordIds) => {
  for (const recordId of recordIds) {
    try {
      const meta = await getRecordMetadata(recordId);
      const fileEntry = (meta.files || []).find((f) => f.key === filename);
      if (fileEntry) {
        return (
          fileEntry.links.self ||
          fileEntry.links.download ||
          `https://zenodo.org/records/${recordId}/files/${filename}`
        );
      }
    } catch (_) {
      /* ignore */
    }
  }
  throw new Error(`File ${filename} not found in any repository.`);
};

// -----------------------------------------------------------------------------
// Checkbox component for row selection (No changes needed)
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
  const [globalFilter, setGlobalFilter] = useState('');

  const emptyMotifSet = useMemo(() => new Set(emptyMotifs), []);

  const data = useMemo(() => {
    if (downloadMode === 'species') {
      return joinedData;
    }
    return motifMetadata.filter((motif) => !emptyMotifSet.has(motif.motif_id));
  }, [downloadMode, emptyMotifSet]);

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

  // --- NEW: Define the "starts with" search function ---
  const startsWithFilterFn = useMemo(() => {
    const filter = (rows, columnIds, filterValue) => {
      const searchTerm = String(filterValue).toLowerCase();

      // Return all rows if search term is empty
      if (!searchTerm) {
        return rows;
      }

      // Filter rows
      return rows.filter((row) => {
        // Check if any value in the original row data starts with the search term
        return Object.values(row.original).some((val) =>
          String(val).toLowerCase().startsWith(searchTerm)
        );
      });
    };
    return filter;
  }, []);

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
    setGlobalFilter: setTableGlobalFilter,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 },
      // --- MODIFIED: Use the new "starts with" function for global filtering ---
      globalFilter: startsWithFilterFn,
    },
    useGlobalFilter,
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

  // Debounce the global filter (no changes needed here)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTableGlobalFilter(globalFilter);
    }, 300);
    return () => clearTimeout(timeout);
  }, [globalFilter, setTableGlobalFilter]);

  // Download queue logic (no changes needed here)
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
      setDownloadProgress(((i + 1) / total) * 50);
    }

    const delayMs = 2500;
    for (let i = 0; i < validUrls.length; i++) {
      const { url, filename } = validUrls[i];
      setCurrentStatus(`Opening ${filename} (${i + 1}/${validUrls.length})…`);
      window.open(url, '_blank', 'noopener,noreferrer');
      setDownloadProgress(50 + ((i + 1) / validUrls.length) * 50);
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
        {/* --- MODIFIED: Removed the subheader paragraph --- */}
        <p className="downloads-subheader"></p>

        <Alert variant="info">
          <strong>Tip:</strong> Allow pop‑ups so your browser can open each
          download tab.
        </Alert>

        <Row className="mb-3 align-items-center">
          <Col md={6}>
            {/* --- MODIFIED: Removed placeholder from search bar --- */}
            <Form.Control
              type="text"
              value={globalFilter || ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="mb-2 mb-md-0"
            />
          </Col>
          <Col md={6} className="d-flex justify-content-md-end">
            <Form.Check
              type="switch"
              id="download-mode-switch"
              checked={downloadMode === 'motif'}
              onChange={(e) =>
                setDownloadMode(e.target.checked ? 'motif' : 'species')
              }
              label={
                downloadMode === 'species'
                  ? 'Showing Per Species'
                  : 'Showing Per Motif'
              }
              className="fs-5"
            />
          </Col>
        </Row>

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

        {/* Pagination Controls */}
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
              style={{ width: '150px' }}
            >
              {[10, 25, 50, 100, 200, 500, 1000].map((s) => (
                <option key={s} value={s}>
                  Show {s} rows
                </option>
              ))}
              <option key="all" value={data.length}>
                Show All
              </option>
            </Form.Select>
          </Col>
        </Row>

        {/* Download Controls */}
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
