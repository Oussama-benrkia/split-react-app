# Invoice Studio — Complete Technical Reference

Single-page browser application that generates A4 invoices for the Moroccan market
(MAD currency, French UI, TVA). Renders A4 pages live in the browser, paginates rows
automatically, splits rows that are taller than one page, and exports via window.print()
or jsPDF + html2canvas. No backend. Everything runs client-side.

---

## File map

```
src/
  main.jsx                        entry point — ErrorBoundary + StrictMode + createRoot
  App.jsx                         root — owns heightCache, measureFragment, pagination call
  index.css                       Tailwind base + rich-editor list styles + print CSS

  context/
    InvoiceContext.jsx            React context — exposes named action helpers

  hooks/
    useInvoiceState.js            useReducer + debounced localStorage persistence
    usePagination.js              pagination algorithm + split engine (all in one file)
    useOutsideClick.js            generic outside-click hook

  utils/
    sanitizeRichHtml.js           HTML sanitiser: font→span conversion + XSS strip
    numberToWords.js              float → French words (MAD/EUR/USD)
    exportPdf.js                  html2canvas + jsPDF raster export

  components/
    layout/
      A4Page.jsx                  794×1123 px wrapper div, class "a4-page"
      PageCanvas.jsx              scroll container, header ResizeObserver, page list
      Toolbar.jsx                 top bar: page count, new/PDF/settings buttons

    zones/
      ZoneClient.jsx              "Facturé à" block + ClientDropdown
      ZoneCompany.jsx             logo + company info + invoice number/dates
      ZoneInvoiceBody.jsx         FACTURE label + InvoiceTable + AddProductButton
      ZoneFooter.jsx              absolute 3-column footer pinned to page bottom

    invoice/
      InvoiceTable.jsx            visible <table> + off-screen measurement host
      InvoiceRow.jsx              editable source row (name contentEditable)
      InvoiceRowActions.jsx       ⋮ portal modal (edit / duplicate / delete)
      ContinuedRowFragment.jsx    read-only continuation for split rows
      ProbeRow.jsx                invisible in-flow row for height measurement
      AddProductButton.jsx        dashed "add" button

    totals/
      TotalsBlock.jsx             subtotal / discount / TVA / TTC / AmountInWords
      TVASelector.jsx             inline TVA rate picker
      DiscountField.jsx           inline discount % input
      AmountInWords.jsx           French words for total TTC

    editor/
      RichTextEditor.jsx          contentEditable div, mount-only innerHTML init
      RichTextToolbar.jsx         bold / italic / underline / lists / size / colour
      ColorPalette.jsx            colour swatches
      FontSizePicker.jsx          font-size dropdown

    client/
      ClientDropdown.jsx          searchable list + inline ClientForm
      ClientForm.jsx              new-client form
      ClientInfo.jsx              selected client display
      ClientListItem.jsx          one row in the dropdown list

    product/
      ProductModal.jsx            full-screen product catalogue
      ProductSearch.jsx           search + filter inside catalogue
      ProductForm.jsx             new-product form
      ProductListItem.jsx         one product row

    settings/
      SettingsDrawer.jsx          slide-in right panel, three tabs
      CompanyInfoForm.jsx         logo + company fields
      InvoiceDefaultsForm.jsx     prefix / number / TVA / currency / terms
      FooterConfigForm.jsx        three-column footer text
      LogoUploader.jsx            FileReader → base64 data URL

    ui/
      Button.jsx  Input.jsx  Modal.jsx  Dropdown.jsx  Badge.jsx  Divider.jsx
```

---

## State

### Shape (`useInvoiceState.js`)

All state lives in a single `useReducer`. Shape:

```js
{
  invoice: {
    id,              // crypto.randomUUID()
    number,          // "FAC-0001"
    date,            // ISO string "2024-06-04"
    dueDate,
    labelText,       // "FACTURE" — user-editable on page 1
    selectedClient,  // full client object or null
    rows: [
      {
        id,              // crypto.randomUUID()
        name,            // plain-text designation
        nameHtml,        // rich HTML from the contentEditable cell
        description,     // plain-text fallback (stripped from descriptionHtml)
        descriptionHtml, // rich HTML from RichTextEditor
        qty,
        unitPrice,
      }
    ],
    tvaRate,         // e.g. 20
    discountPercent, // e.g. 5
    currency,        // "MAD" | "EUR" | "USD"
  },
  clients:  [{ id, name, company, address, ice, rc }],
  products: [{ id, name, nameHtml, description, descriptionHtml, unitPrice }],
  settings: {
    company:  { name, address, phone, email, rc, if_, ice, logo },  // logo = base64 dataURL
    defaults: { invoiceNumberPrefix, nextInvoiceNumber, tvaRate,
                discountPercent, currency, paymentTermsDays, labelText },
    footer:   { col1, col2, col3 },
  },
  ui: {
    settingsOpen, productModalOpen,
    rowEditModal: { open, rowId },
    clientDropdownOpen,
  }
}
```

### Persistence

```js
// useInvoiceState.js
const timerRef = useRef(null)
useEffect(() => {
  const { ui, ...persisted } = state          // ui flags stripped — always reset on load
  clearTimeout(timerRef.current)
  timerRef.current = setTimeout(() => {
    localStorage.setItem('invoice-studio-state', JSON.stringify(persisted))
  }, 500)                                     // debounced — keystrokes don't block the thread
  return () => clearTimeout(timerRef.current)
}, [state])
```

On load: `loadState()` parses the key; resets all `ui` flags to false; returns `null` on any
parse error so `buildInitialState()` seeds from `src/data.json`.

IDs use `crypto.randomUUID()` — 128-bit, collision probability negligible.

### Reducer actions

```
ADD_ROW          product? → appends new row (id, name, nameHtml, description, descriptionHtml, qty, unitPrice)
UPDATE_ROW       rowId, fields → merges fields into that row
DUPLICATE_ROW    rowId → clones row with new id, inserts after original
REMOVE_ROW       rowId → filters out
SET_CLIENT       client → invoice.selectedClient
SET_TVA          rate
SET_DISCOUNT     pct
SET_LABEL        text → invoice.labelText
SET_DATE         date
SET_DUE_DATE     date
ADD_CLIENT       data, andSelect? → clients array, optionally selects
ADD_PRODUCT      data → products array
UPDATE_SETTINGS  section, data → merges into settings[section]
RESET_INVOICE    → fresh invoice with incremented number, resets ui
TOGGLE_SETTINGS / TOGGLE_PRODUCT_MODAL / SET_ROW_EDIT_MODAL
TOGGLE_CLIENT_DROPDOWN / CLOSE_CLIENT_DROPDOWN
```

### Context (`InvoiceContext.jsx`)

Wraps `useInvoiceState`, exposes named helpers so no component calls `dispatch` directly:

```js
addRow(product?)        updateRow(rowId, fields)    removeRow(rowId)
duplicateRow(rowId)     setSelectedClient(client)   setTvaRate(rate)
setDiscountPercent(pct) setLabelText(text)          setInvoiceDate(date)
setInvoiceDueDate(date) resetInvoice()              addClient(data, andSelect?)
addProduct(data)        updateSettings(section, data)
openSettings()          closeSettings()             openProductModal()
closeProductModal()     openRowEditModal(rowId)     closeRowEditModal()
openClientDropdown()    closeClientDropdown()
```

`useInvoice()` throws if called outside `InvoiceProvider`.

---

## Geometry constants (`usePagination.js`)

```
A4_H           = 1123 px    full A4 height at 96 dpi
PAGE_PAD       =   96 px    top 48 + bottom 48 (padding:'48px 40px' on A4Page)
HEADER_ZONE_H  =  190 px    default for Zones 1+2; corrected live by ResizeObserver
LABEL_H        =   48 px    "FACTURE" heading + mb-4 gap
TABLE_HEADER_H =   40 px    <thead> row (py-2, text-xs, border-b-2)
FOOTER_H       =   80 px    ZoneFooter (absolute, reserved on every page)
TOTALS_H       =  220 px    TotalsBlock + mt-6 gap (last page only)
ADD_BTN_H      =   44 px    AddProductButton (last page only)
MIN_SPLIT_H    =   60 px    minimum height for either split fragment (stub guard)
MIN_ZONE_H     =   80 px    orphan-prevention threshold
CHECKPOINT_INTERVAL = 10    save a checkpoint every 10 source rows
```

Per-page content budget:

```
budget = A4_H - PAGE_PAD - headerH - LABEL_H - TABLE_HEADER_H - FOOTER_H
       = 1123 - 96 - headerH - 48 - 40 - 80
       = 859 - headerH                       ≈ 669 px at default headerH = 190 px
```

The last page also needs `TOTALS_H + ADD_BTN_H = 264 px` from this budget.

A4Page inline style: `padding: '48px 40px'`.
Print CSS: `.a4-page { padding: 48px 40px !important }` — identical, so text wraps the same
way on screen as in print. Content area width: 794 − 2×40 = **714 px**.

---

## Measurement system

### The core problem

Row heights cannot be computed from character counts — rich HTML with mixed font sizes,
bold, lists, and inline colour spans produces heights that only the browser's layout engine
can determine. The pagination algorithm therefore asks the browser to render each candidate
fragment and reads `offsetHeight`.

### Why a separate off-screen table

The visible table uses `tableLayout: fixed` with a `<colgroup>` that distributes
`[4%, 22%, 38%, 8%, 12%, 12%, 4%]` across the 714 px content width. Column widths —
and therefore text wrapping — are determined by the table layout algorithm applied to those
percentages against the container width.

`overflow: hidden` is excluded from the CSS spec for `<tr>` elements and is ignored by
Chrome. `height: 0` on a `<tr>` is also unreliable because table row height is determined
by its cells, not by the row element itself. Any attempt to hide measurement rows inside the
real table (using `height:0` or `overflow:hidden`) either leaves the rows at their natural
height (extending the visible table and breaking layout) or makes `offsetHeight` return 0
(making measurements useless).

The solution: a separate table in a `position: fixed; top: -9999px` container sized to
exactly 714 px with the same `<colgroup>`. The container is entirely off-screen with no
layout impact. The rows inside are plain unconstrained `<tr>` elements — `offsetHeight`
returns their true natural height directly.

### Off-screen measurement host (`InvoiceTable.jsx`)

```
MEASURE_TABLE_WIDTH = 714   // 794px A4 − 2×40px padding
```

Rendered only when `isProbeHost === true` (the first page's InvoiceTable):

```jsx
<div style={{
  position: 'fixed', top: -9999, left: 0,
  width: MEASURE_TABLE_WIDTH,
  visibility: 'hidden', pointerEvents: 'none'
}}>
  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
    <colgroup>
      {columns.map((c, i) => <col key={i} style={{ width: c.width }} />)}
    </colgroup>
    <tbody>
      {invoice.rows.map(row =>
        <ProbeRow key={row.id + '__probe'} row={row} onHeight={onRowHeightChange} />
      )}
      <tr ref={measureRowRef}>          {/* blank — cells written by measureFragment */}
        <td className="py-2 px-3 text-xs" />
        <td className="py-2 px-3 text-xs font-medium text-gray-800 align-top"
            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} />
        <td className="rich-editor py-2 px-3 text-xs text-gray-600 align-top"
            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }} />
        <td className="py-2 px-3 text-xs" />
        <td className="py-2 px-3 text-xs" />
        <td className="py-2 px-3 text-xs" />
        <td className="py-2 px-3 text-xs" />
      </tr>
    </tbody>
  </table>
</div>
```

The container's `width: 714px` means the table's `100%` resolves to exactly 714 px.
The identical `<colgroup>` distributes the same pixel column widths as the real table.
Text wrapping in the off-screen table is therefore identical to the visible pages.
The `rich-editor` class on `cells[2]` is required — without it `<ol>` and `<ul>` elements
have no `padding-left` and render shorter than in the visible rows.

### ProbeRow (`ProbeRow.jsx`)

Measures every source row in `invoice.rows` (not paginated page rows — the full list).
Lives as a plain in-flow `<tr>` in the off-screen table:

```jsx
export default function ProbeRow({ row, onHeight }) {
  const rowRef = useRef(null)

  useLayoutEffect(() => {
    if (rowRef.current && onHeight)
      onHeight(row.id, rowRef.current.offsetHeight)
  }, [row.id, row.nameHtml, row.name, row.descriptionHtml, onHeight])

  return (
    <tr ref={rowRef}>
      <td className="py-2 px-3 text-xs" style={{ width: '4%' }} />
      <td className="py-2 px-3 text-xs font-medium text-gray-800 align-top"
          style={{ width: '22%', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(row.nameHtml || row.name || '') }} />
      <td className="rich-editor py-2 px-3 text-xs text-gray-600 align-top"
          style={{ width: '38%', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(row.descriptionHtml || row.description || '') }} />
      <td className="py-2 px-3 text-xs" style={{ width: '8%' }} />
      <td className="py-2 px-3 text-xs" style={{ width: '12%' }} />
      <td className="py-2 px-3 text-xs" style={{ width: '12%' }} />
      <td className="py-2 px-3 text-xs" style={{ width: '4%' }} />
    </tr>
  )
}
```

`useLayoutEffect` deps: `[row.id, row.nameHtml, row.name, row.descriptionHtml, onHeight]`.
Fires only when row content changes. Reports via `onHeight(rowId, offsetHeight)`.

### measureFragment (`App.jsx`)

Called synchronously during pagination whenever a row needs splitting:

```js
const measureFragment = useCallback((row) => {
  if (!measureRowRef.current) return 0
  const tr = measureRowRef.current
  tr.cells[1].innerHTML = sanitizeRichHtml(row.nameHtml || row.name || '')
  tr.cells[2].innerHTML = sanitizeRichHtml(row.descriptionHtml || row.description || '')
  return tr.offsetHeight
}, [])
```

Writes candidate HTML into the blank measurement `<tr>` in the off-screen table, reads
`offsetHeight`, and leaves the cells populated (overwritten on the next call). Because the
row is unconstrained and in the same colgroup/table context, `offsetHeight` returns the
precise natural height at those column widths.

### heightCache and heightVersion (`App.jsx`)

`heightCache` is a stable `Map` created as `useRef(new Map()).current`. It maps row IDs to
pixel heights. Every `onRowHeightChange(rowId, height)` call:

```
height === null   → evict all keys for this row (id, id_c, id_part_N),
                    mark dirtyFromIndexRef, increment heightVersion

Math.abs(prev-h) <= 2  → no-op  (2 px tolerance against sub-pixel rounding)

otherwise  → heightCache.set(rowId, height), mark dirty, increment heightVersion
```

`dirtyFromIndexRef` holds the smallest source-row index whose height changed since the last
render. It is read and cleared during the render that calls `usePagination`, enabling the
checkpoint system to resume from that index instead of re-paginating from row 0.

---

## Pagination algorithm (`usePagination.js`)

### Entry point in App.jsx

```js
// allMeasured: every source row has a cache entry
const allMeasured =
  deferredRows.length === 0 ||
  deferredRows.every(r => heightCache.has(r.id))

const pages = usePagination(
  allMeasured ? deferredRows : [],   // empty until all ProbeRows have reported
  heightCache,
  heightVersion,
  deferredHeaderH,
  measureFragment,
  dirtyFrom                          // null means full re-pagination
)
```

`useDeferredValue` on `invoice.rows` and `headerH` lets React paint intermediate states.
`isPaginationPending = deferredRows !== invoice.rows || deferredHeaderH !== headerH` drives
the toolbar spinner.

### Memoisation in `usePagination`

```js
const structureChanged = rows.length !== prev.rowsLength || headerH !== prev.headerH

if (_version === prevVersionRef.current && !structureChanged && pagesRef.current !== null)
  return pagesRef.current                 // nothing changed — return cached result
```

On structure change (row count or header height changed): clear all checkpoints, full
re-pagination. On version-only change (a height updated): look for a checkpoint before
`dirtyFromIndex` and resume from there.

### Core loop (`paginateIncremental`)

Loop state:

| Variable | Meaning |
|---|---|
| `pages[]` | Completed page objects |
| `currentRows[]` | Rows accumulating on the current in-progress page |
| `cursor_y` | Vertical fill in px on the current page |
| `globalRowStart` | Count of source rows placed so far (for row-number display) |
| `queue` | Work FIFO — `rows.slice(startRowIndex)` initially |
| `queueDepth` | Continuation fragments currently ahead in the queue |

For each row dequeued:

```
rowH      = getRowHeight(row, heightCache)
remaining = budget - cursor_y

if rowH <= remaining:
  orphan check:
    cursor_y > 0  AND  rowH < MIN_ZONE_H  AND  remaining - rowH < MIN_ZONE_H
    → flush page, start new page with this row
  else:
    append to currentRows, cursor_y += rowH

else (does not fit):
  split = trySplitRow(row, remaining, measureFragment)

  if !split AND rowH > budget:       // row taller than one full page
    flush current page, cursor_y = 0
    split = trySplitRow(row, budget, measureFragment)   // retry on full budget

  if split:
    push firstPart onto currentRows → flush page
    queue.unshift(secondPart)        // continuation processed next iteration
    queueDepth++

  else:
    flush current page
    place row at top of fresh page
```

After the queue drains:

```js
if (cursor_y + TOTALS_H + ADD_BTN_H > budget) {
  // totals don't fit — push a final empty page to hold them
  pages.push({ rows: currentRows, isLast: false, ... })
  pages.push({ rows: [], isLast: true, ... })
} else {
  pages.push({ rows: currentRows, isLast: true, ... })
}
```

### globalRowStart — row-number accounting

Every page flush uses:

```js
globalRowStart += currentRows.filter(r => !r._isContinued).length
```

Continuation fragments (`_isContinued: true`) do not advance the counter — they occupy the
same display slot as the source row they continue. This applies at all four flush sites:
orphan prevention, oversize-row flush, split flush, and cannot-split flush.

`rowStartIndex` on each page object equals `globalRowStart` at the time of the flush.
`InvoiceTable` uses it to initialise `lastDisplayIndex`:

```js
let lastDisplayIndex = rowStartIndex - 1
rows.map(row => {
  if (!row._isContinued) lastDisplayIndex++   // only source rows and firstParts advance
  // rendered as: {lastDisplayIndex + 1}
})
```

### Checkpoint system

Every `CHECKPOINT_INTERVAL = 10` source rows, when `queueDepth === 0`:

```js
checkpointsRef.current.push({
  rowIndex: nextSourceIndex,
  pages: pages.map(p => ({ ...p, rows: [...p.rows] })),
  currentRows: [...currentRows],
  cursorY: cursor_y,
  globalRowStart,
})
```

On the next call with a `dirtyFromIndex`, `findCheckpoint` binary-searches for the largest
checkpoint with `rowIndex < dirtyFromIndex`. If found, the algorithm restores that snapshot
and starts the queue from `rows.slice(checkpoint.rowIndex)`, skipping rows 0 through
`rowIndex − 1` entirely. Invalidated checkpoints (at or after `cp.rowIndex`) are discarded
before restoration.

### getRowHeight

```js
function getRowHeight(row, heightCache) {
  if (row._isFirstPart) return row._splitHeight ?? 0
  const key = row._partIndex !== undefined
    ? row.id + '_part_' + row._partIndex
    : (row._isContinued ? row.id + '_c' : row.id)
  const cached = heightCache.get(key)
  if (cached !== undefined) return cached
  return row._measuredH ?? 40   // 40 px safe fallback (≈ one text line)
}
```

`_isFirstPart` rows use `_splitHeight` set at split time and never write to `heightCache` —
their height is owned by the split engine. All other rows use cache keys: plain `id` for
source rows, `id_c` for single-split continuations, `id_part_N` for multi-split
continuations.

---

## Split engine (`usePagination.js`)

`trySplitRow(row, available, measureFragment)` is called when a row does not fit in the
remaining space. It tries three strategies in priority order. Returns `{ firstPart, secondPart }`
on success or `null` if no valid split exists.

Guard: `if (!measureFragment || available < MIN_SPLIT_H) return null` — refuse splits when
the available space is too small to hold even a stub.

### Strategy 1 — List split (`tryListSplitMeasured`)

**Trigger:** description HTML contains a top-level `<ol>` or `<ul>`.

**Item extraction (DOM, not regex):**
```js
const tmp = document.createElement('div')
tmp.innerHTML = html
const listEl = tmp.querySelector(':scope > ol, :scope > ul')
const items = Array.from(listEl.querySelectorAll(':scope > li'))
```
`:scope > li` selects only direct children, so nested lists are handled correctly —
the browser's HTML parser resolves the tree before inspection.

**Content before/after the list:**
```js
const childNodes = Array.from(tmp.childNodes)
const listIdx = childNodes.indexOf(listEl)
const toHtml = (nodes) => {
  const wrap = document.createElement('div')
  nodes.forEach(n => wrap.appendChild(n.cloneNode(true)))
  return wrap.innerHTML
}
const beforeHtml = toHtml(childNodes.slice(0, listIdx))
const afterHtml  = toHtml(childNodes.slice(listIdx + 1))
```
`wrap.innerHTML` serialises nodes back to HTML with correct entity encoding for text nodes.

**Binary search:**
```
lo = 1, hi = items.length − 1

while lo < hi:
  mid = (lo + hi + 1) >> 1
  h = measureFragment({ ...row, descriptionHtml: beforeHtml + listClone(mid) })
  if h <= budget: lo = mid
  else:           hi = mid − 1
```
Lower bound `lo = 1` guarantees at least one item in `firstPart`.
Upper bound `hi = items.length − 1` guarantees at least one item in `secondPart`.

**`ol` start attribute for continuations:**
```js
const base   = row._originalListStart ?? existingStart
const placed = row._totalItemsPlaced  ?? 0
// on secondPart:
secondListClone.setAttribute('start', String(base + placed + lo))
```
`_originalListStart` and `_totalItemsPlaced` propagate through every successive split of the
same row so ordered list numbers are globally correct across pages.

**Guards:** `if (firstH < MIN_SPLIT_H || secondH < MIN_SPLIT_H) return null`

---

### Strategy 2 — Paragraph split (`tryParaSplitMeasured`)

**Trigger:** `extractParagraphBlocks(html).length >= 2`

**Block extraction (DOM):**
```js
function extractParagraphBlocks(html) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html || ''
  const blocks = []
  for (const node of tmp.childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE)
      blocks.push({ fullHtml: node.outerHTML })
    else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      const span = document.createElement('span')
      span.appendChild(node.cloneNode(true))
      blocks.push({ fullHtml: span.innerHTML })
    }
  }
  return blocks
}
```
Captures every top-level node: `<p>`, `<div>`, `<br>`, `<img>`, text runs — no regex
fragility. Each element becomes `{ fullHtml: node.outerHTML }`.

**Binary search:** same upper-bound pattern as list split.

**Guards:**
```js
if (!secondHtml.trim()) return null
if (firstH < MIN_SPLIT_H || secondH < MIN_SPLIT_H) return null
```

---

### Strategy 3 — Word split (`tryWordSplitMeasured`)

**Trigger:** fallback for flat inline content or single-paragraph descriptions.

**HTML-aware word splitter (`splitHtmlAtWordBoundary`):**

Walks the DOM tree of the description HTML recursively, counting words across text nodes.
At the cut point it reconstructs both halves with the original tag structure intact:

```js
function processNode(node) {
  if (node.nodeType === 3) {       // text node
    const tokens = node.textContent.split(/(\s+)/)
    let first = '', second = ''
    for (const tok of tokens) {
      if (/^\s*$/.test(tok)) {     // whitespace token — assign to whichever side is current
        if (placed >= splitAfterWord) second += tok
        else first += tok
        continue
      }
      placed++
      if (placed <= splitAfterWord) first += tok
      else second += tok
    }
    return [first, second]
  }
  if (node.nodeType !== 1) return ['', '']
  const tag = node.tagName.toLowerCase()
  const attrs = Array.from(node.attributes).map(a => ` ${a.name}="${a.value}"`).join('')
  let f = '', s = ''
  for (const child of node.childNodes) {
    const [cf, cs] = processNode(child)
    f += cf; s += cs
  }
  // Omit wrapper tag entirely from a half if that half has no content
  return [
    f ? `<${tag}${attrs}>${f}</${tag}>` : '',
    s ? `<${tag}${attrs}>${s}</${tag}>` : '',
  ]
}
```

This preserves all inline formatting — `<strong>`, `<em>`, `<span style="color:...">`,
`<span style="font-size:...">` — in both halves without any regex substitution.

**Total word count:**
```js
function countHtmlWords(html) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || '').trim().split(/\s+/).filter(Boolean).length
}
```

**Binary search:** `lo = 1, hi = totalWords − 1`.

**Guards:**
```js
if (!secondHtml.trim()) return null
if (secondH < MIN_SPLIT_H) return null
```

---

### Split fragment shapes

```js
// firstPart — rendered by InvoiceRow (same component as source row)
{
  ...row,
  _isFirstPart:  true,
  _htmlSplit | _textSplit: true,
  _splitHeight:  firstH,      // from measureFragment — getRowHeight uses this, never overwritten
  descriptionHtml: firstHtml,
}

// secondPart — pushed to front of queue with queue.unshift()
{
  ...row,
  _isContinued:  true,
  _isFirstPart:  false,
  _measuredH:    secondH,     // initial estimate; self-corrected after rendering
  _partIndex:    (row._partIndex ?? 0) + 1,   // heightCache key = id + '_part_' + N
  descriptionHtml: secondHtml,
  description:   stripHtml(secondHtml),
  // list-only:
  _originalListStart,
  _totalItemsPlaced,
}
```

`queue.unshift(secondPart)` feeds the continuation back through the main loop immediately.
If it also does not fit, `trySplitRow` is called again with the new `remaining` or full
`budget`, allowing one row to span three or more pages.

### Height self-correction via ContinuedRowFragment

After `secondPart` renders on screen, its `useLayoutEffect` reports the actual rendered
height back to `heightCache`:

```js
// ContinuedRowFragment.jsx
const key = row._partIndex !== undefined
  ? row.id + '_part_' + row._partIndex
  : row.id + '_c'
onHeightChange(key, rowRef.current.offsetHeight)
```

Dependencies: `[row.id, row._partIndex, row.descriptionHtml, row._isFirstPart, row._textSplit, row._htmlSplit, onHeightChange]`

If the real height differs from `_measuredH` by more than 2 px, `heightVersion` increments
and pagination re-runs, self-correcting placement errors. `_isFirstPart` fragments are
excluded — their height is owned by `_splitHeight`.

### `stripHtml` (used for `description` field on secondPart)

```js
function stripHtml(html) {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
  return tmp.textContent
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
```

Uses `tmp.textContent` after DOM parsing — decodes all HTML entities (`&lt;`, `&eacute;`,
etc.) correctly, unlike a pure regex approach.

---

## Rendering pipeline

### App.jsx — orchestration

```
invoice.rows (live state)
  ↓ useDeferredValue
deferredRows
  ↓ allMeasured gate
usePagination(deferredRows, heightCache, heightVersion, deferredHeaderH, measureFragment, dirtyFrom)
  → pages[]
  ↓
<PageCanvas pages={pages} onRowHeightChange={...} onHeaderHeightChange={...} measureRowRef={...} />
```

### PageCanvas.jsx — header measurement + page list

Renders one `<A4Page>` per page. On page 0 a `headerRef` wraps the company+client zone.
A `ResizeObserver` reports `el.offsetHeight + 24` (the `+24` covers `mb-6 = 1.5 rem`):

```js
useEffect(() => {
  if (!headerRef.current) return
  const el = headerRef.current
  const report = () => onHeaderHeightChange?.(el.offsetHeight + 24)
  report()
  const ro = new ResizeObserver(report)
  ro.observe(el)
  return () => ro.disconnect()
}, [onHeaderHeightChange])
```

`onHeaderHeightChange` in `App.jsx` has a 2 px tolerance guard before calling `setHeaderH`,
preventing infinite loops from sub-pixel rounding.

Each page renders in order inside `height: 947, overflow: hidden` (1123 − 96 − 80 = 947):
1. `ZoneClient` (40%) + `ZoneCompany` (60%) — every page; `readOnly={index !== 0}`
2. `ZoneInvoiceBody` with `page.rows`
3. `TotalsBlock` inside `mt-6` — last page only
4. `ZoneFooter` — `position: absolute, bottom: 48px`, every page

### A4Page.jsx

```jsx
<div className="a4-page relative bg-white"
  style={{ width: 794, height: 1123, overflow: 'hidden', padding: '48px 40px',
           boxShadow: '...', marginBottom: 32 }}>
  {children}
  <div className="absolute bottom-3 right-4 text-xs text-gray-300" data-print-hide>
    p.{pageNumber}
  </div>
</div>
```

`overflow: hidden` clips content. Rows taller than their measured height are cleanly cut.

### InvoiceTable.jsx — row dispatch

```js
let lastDisplayIndex = rowStartIndex - 1
rows.map(row => {
  if (!row._isContinued) lastDisplayIndex++
  return row._isContinued
    ? <ContinuedRowFragment key={row.id + '-cont'} index={lastDisplayIndex} ... />
    : <InvoiceRow           key={row.id}           index={lastDisplayIndex} ... />
})
```

`isProbeHost === true` only on the first page's table — this is where the off-screen
measurement host is rendered.

### InvoiceRow.jsx — editable source row

- **Name cell:** `contentEditable` div. `useEffect([row.nameHtml, row.name])` updates
  `innerHTML` when props change, guarded by `nameRef.current !== document.activeElement`
  to avoid cursor reset while typing. `onBlur` calls `updateRow` and evicts the cache with
  `onHeightChange(row.id, null)`.
- **Description cell:** read-only `<div dangerouslySetInnerHTML>`. Edit via RowEditModal.
- **`useLayoutEffect` deps:** `[row.id, row.nameHtml, row.name, row.descriptionHtml, row.qty, row.unitPrice, row._isFirstPart, onHeightChange]` — reads `rowRef.current.offsetHeight` and calls `onHeightChange`. Skipped for `_isFirstPart` rows.

### ContinuedRowFragment.jsx

Read-only. Renders `row.nameHtml || row.name` via `dangerouslySetInnerHTML` (rich HTML,
matching the source row's formatting). Description renders the split `descriptionHtml`.
Reports actual height via `useLayoutEffect` for self-correction.

---

## Rich text system

### RichTextEditor.jsx

```jsx
useEffect(() => {
  if (editorRef.current)
    editorRef.current.innerHTML = sanitizeRichHtml(initialHtml)
}, [])   // mount-only — prevents cursor reset on re-render
```

Content changes flow out only via `onChange(editorRef.current.innerHTML)` on the `onInput`
event. The editor never re-renders from props after mount.

### RichTextToolbar.jsx

Uses `document.execCommand` for bold / italic / underline / lists.

**Font size:**
```js
document.execCommand('fontSize', false, '7')      // stamps <font size="7"> markers
const fonts = editorRef.current.querySelectorAll('font[size="7"]')
fonts.forEach(font => {
  const span = document.createElement('span')
  span.style.fontSize = px + 'px'
  span.innerHTML = font.innerHTML
  font.replaceWith(span)
})
```

**Colour:**
```js
document.execCommand('styleWithCSS', false, true)  // produce <span style="color:...">
document.execCommand('foreColor', false, hex)       // not <font color="...">
```
`styleWithCSS` produces inline style (specificity 1,0,0,0) which overrides any Tailwind
colour class. Without it, `foreColor` produces `<font color="...">` (specificity 0).

### sanitizeRichHtml.js

```js
const DANGEROUS_TAGS = new Set([
  'script','iframe','object','embed','link','style',
  'meta','base','form','input','button','select','textarea'
])

export function sanitizeRichHtml(html) {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
    .replace(/<font color="([^"]+)">/gi, '<span style="color:$1">')  // legacy execCommand
    .replace(/<\/font>/gi, '</span>')
    .replace(/​/g, '')          // U+200B zero-width space
    .replace(/&amp;#8203;/g, '')
    .replace(/&#8203;/g, '')

  tmp.querySelectorAll([...DANGEROUS_TAGS].join(',')).forEach(el => el.remove())

  tmp.querySelectorAll('*').forEach(el => {
    for (const attr of [...el.attributes])
      if (attr.name.startsWith('on') ||
          (attr.name === 'href' && /^javascript:/i.test(attr.value)))
        el.removeAttribute(attr.name)
  })

  return tmp.innerHTML
}
```

Called before every `dangerouslySetInnerHTML`, before writing to `measureFragment`'s cells,
and in `RichTextEditor` on mount.

---

## Data flow — a row edit end to end

1. User taps ⋮ → "Modifier" → `openRowEditModal(rowId)` → `ui.rowEditModal = {open:true, rowId}`
2. `RowEditModal` renders; `RichTextEditor` mounts with `initialHtml = row.descriptionHtml`,
   sets `innerHTML` once in its mount effect
3. User edits → `onChange(html)` → local modal state only
4. "Enregistrer" → `updateRow(rowId, local)` → `UPDATE_ROW` → reducer produces new `invoice.rows`
5. `useInvoiceState` effect schedules a 500 ms debounced `localStorage.setItem`
6. `InvoiceRow` receives new props:
   - `useEffect([row.nameHtml, row.name])` re-sets name cell `innerHTML` if not focused
   - `useLayoutEffect([...deps])` reads new `offsetHeight`, calls `onHeightChange`
7. `ProbeRow` in the off-screen table re-renders with new props → its `useLayoutEffect`
   fires → calls `onHeight`
8. `onRowHeightChange` in `App.jsx`: updates `heightCache`, sets `dirtyFromIndexRef`,
   increments `heightVersion`
9. React re-renders `InvoiceApp`:
   - `dirtyFrom` = `dirtyFromIndexRef.current`; ref cleared immediately
   - `usePagination` finds the nearest checkpoint before `dirtyFrom`, resumes from there
   - New `pages[]` flows to `PageCanvas`
10. Pages re-render; if any `ContinuedRowFragment` reports a height that differs from
    `_measuredH`, `heightVersion` increments once more, triggering a final self-correction pass

---

## PDF export (`exportPdf.js`)

```js
const pageEls = document.querySelectorAll('.a4-page')

// Hide toolbar and page-number overlays
const hidden = document.querySelectorAll('[data-print-hide]')
hidden.forEach(el => el.style.setProperty('display', 'none', 'important'))

const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
for (let i = 0; i < pageEls.length; i++) {
  const canvas = await html2canvas(pageEls[i], {
    scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
  })
  if (i > 0) pdf.addPage()
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297)
}
pdf.save(filename)

hidden.forEach(el => el.style.removeProperty('display'))
```

`scale: 2` gives 192 dpi effective resolution before JPEG compression at 0.95.
Each canvas is stretched to exactly 210×297 mm so all pages have identical physical size.

`window.print()` alternative: `index.css` print media hides `[data-print-hide]`, sets
`.a4-page { padding: 48px 40px !important; page-break-after: always }`.
Screen and print padding are identical so text wraps identically in both outputs.

---

## numberToWords (`utils/numberToWords.js`)

Converts a monetary float to French words:

- Supports MAD (dirhams / centimes), EUR (euros / centimes), USD (dollars / cents)
- Standard French 70s/90s (soixante-dix, quatre-vingt) — not Belgian/Swiss forms
- Handles 0 through billions
- Separates at `.toFixed(2)`: integer part → words + currency unit, fractional part → words + sub-unit
- Example: `2500.50 MAD` → `"Deux mille cinq cents dirhams et cinquante centimes"`

---

## ErrorBoundary (`main.jsx`)

```jsx
class ErrorBoundary extends Component {
  static getDerivedStateFromError(error) { return { hasError: true, error } }

  render() {
    if (this.state.hasError) return (
      <div ...>
        <h2>Une erreur inattendue s'est produite</h2>
        <p>{String(this.state.error)}</p>
        <button onClick={() => window.location.reload()}>Recharger</button>
        <button onClick={() => {
          localStorage.removeItem('invoice-studio-state')
          window.location.reload()
        }}>Réinitialiser les données</button>
      </div>
    )
    return this.props.children
  }
}
```

Wraps `<App />` in `<StrictMode>`. Any uncaught render error shows a bilingual recovery
screen instead of a blank page.

---

## Key invariants

| Invariant | Enforcement |
|---|---|
| Pagination only runs after every source row has a `heightCache` entry | `allMeasured` gate uses `deferredRows.every(r => heightCache.has(r.id))` |
| `_isFirstPart` rows never write to `heightCache` | Guard in `InvoiceRow.useLayoutEffect` and `ContinuedRowFragment.useLayoutEffect` |
| Off-screen table column widths == visible table column widths | Same `colgroup` percentages, same `MEASURE_TABLE_WIDTH = 714 px` container |
| `globalRowStart` counts only source rows | `currentRows.filter(r => !r._isContinued).length` at every flush |
| Continuation `heightCache` key matches what `ContinuedRowFragment` reports | Both `getRowHeight` and the fragment's effect compute `id_part_N` or `id_c` from the same fields |
| Both split fragments satisfy `>= MIN_SPLIT_H` before the split is accepted | All three strategies measure and check both `firstH` and `secondH` |
| `localStorage` writes are debounced | 500 ms timer in `useInvoiceState`, cleared on every state change |
| No `on*` handlers or dangerous tags in `dangerouslySetInnerHTML` | `sanitizeRichHtml` strips via DOM before every use |
| Any render crash shows a recovery UI | `ErrorBoundary` in `main.jsx` |
| `overflow: hidden` is never used on `<tr>` | CSS spec excludes table rows; off-screen container handles hiding instead |
