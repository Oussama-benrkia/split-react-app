import { useRef } from 'react'

// A4 page dimensions at 96dpi
const A4_H = 1123
const PAGE_PAD = 96           // top + bottom padding (48 each)
export const HEADER_ZONE_H = 190  // Zones 1+2 (minHeight:160 + mb-6:24 + buffer)
const LABEL_H = 48            // "FACTURE" label + mb-4 gap
const TABLE_HEADER_H = 40     // thead row (py-2, text-xs, border-b-2)
const FOOTER_H = 80           // ZoneFooter — absolute, reserved on every page
const TOTALS_H = 220          // TotalsBlock + mt-6 gap (last page only)
const ADD_BTN_H = 44

// Minimum measured height of a first split fragment to be accepted.
// Prevents stub splits where only 1–2 lines would land at the bottom of a page.
const MIN_SPLIT_H = 24

// Minimum remaining space before we push a new page instead of placing a short row
// (orphan prevention — only applies to rows shorter than this threshold).
const MIN_ZONE_H = 80

function pageBudget(headerH) {
  return A4_H - PAGE_PAD - headerH - LABEL_H - TABLE_HEADER_H - FOOTER_H
}

function stripHtml(html) {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = (html)
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

// Split a block-level element at its top-level <br> children, emitting one sub-block
// per line.  This turns <div>line1<br>line2</div> into two <div> entries so the
// paragraph-split binary search can fill pages line-by-line instead of all-or-nothing.
function pushBRSplitBlocks(el, blocks) {
  const tag = el.tagName.toLowerCase()
  const attrs = Array.from(el.attributes).map(a => ` ${a.name}="${a.value}"`).join('')
  const toHtml = (n) => n.nodeType === Node.TEXT_NODE ? n.textContent : n.outerHTML
  let lineNodes = []
  const flush = () => {
    const html = lineNodes.map(toHtml).join('')
    if (html.trim()) blocks.push({ fullHtml: `<${tag}${attrs}>${html}</${tag}>` })
    lineNodes = []
  }
  for (const child of el.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE && child.tagName === 'BR') flush()
    else lineNodes.push(child)
  }
  flush()
}

function extractParagraphBlocks(html) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html || ''
  const blocks = []
  for (const node of tmp.childNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Standalone <br> at root level — skip, it's just whitespace structure
      if (node.tagName === 'BR') continue
      // Block elements whose direct children include <br>: split line-by-line so the
      // binary search can pack pages tightly (avoids huge gap when one block ≈ full page).
      const isBlock = node.tagName === 'DIV' || node.tagName === 'P' ||
                      node.tagName === 'BLOCKQUOTE' || node.tagName === 'PRE'
      const hasBR = isBlock && Array.from(node.childNodes).some(
        c => c.nodeType === Node.ELEMENT_NODE && c.tagName === 'BR'
      )
      if (hasBR) pushBRSplitBlocks(node, blocks)
      else blocks.push({ fullHtml: node.outerHTML })
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      const span = document.createElement('span')
      span.appendChild(node.cloneNode(true))
      blocks.push({ fullHtml: span.innerHTML })
    }
  }
  return blocks
}

// Look up a row's height from the cache (or fall back to a pre-measured value stored on
// the row object itself for newly-created split fragments).
function getRowHeight(row, heightCache) {
  if (row._isFirstPart) return row._splitHeight ?? 0
  const key = row._partIndex !== undefined
    ? row.id + '_part_' + row._partIndex
    : (row._isContinued ? row.id + '_c' : row.id)
  const cached = heightCache.get(key)
  if (cached !== undefined) return cached
  return row._measuredH ?? 40
}

// ─── Measurement-based split engine ──────────────────────────────────────────
//
// Every split strategy finds the largest fragment that fits within `budget` via
// binary search, calling measureFragment() at each candidate so the browser's
// own layout engine decides where text wraps — no character counting involved.
//
// measureFragment(row) renders the candidate into a hidden table row with
// identical CSS and returns its offsetHeight synchronously.

function tryListSplitMeasured(row, budget, measureFragment) {
  const html = row.descriptionHtml || ''

  const tmp = document.createElement('div')
  tmp.innerHTML = html

  const listEl = tmp.querySelector(':scope > ol, :scope > ul')
  if (!listEl) return null

  const tag = listEl.tagName.toLowerCase()
  const items = Array.from(listEl.querySelectorAll(':scope > li'))
  if (items.length < 2) return null

  const childNodes = Array.from(tmp.childNodes)
  const listIdx = childNodes.indexOf(listEl)
  const toHtml = (nodes) => {
    const wrap = document.createElement('div')
    nodes.forEach(n => wrap.appendChild(n.cloneNode(true)))
    return wrap.innerHTML
  }
  const beforeHtml = toHtml(childNodes.slice(0, listIdx))
  const afterHtml = toHtml(childNodes.slice(listIdx + 1))

  const existingStart = listEl.hasAttribute('start') ? parseInt(listEl.getAttribute('start'), 10) : 1
  const base = row._originalListStart ?? existingStart
  const placed = row._totalItemsPlaced ?? 0

  const buildFirstHtml = (count) => {
    const clone = listEl.cloneNode(false)
    clone.removeAttribute('start')
    if (tag === 'ol' && existingStart !== 1) clone.setAttribute('start', String(existingStart))
    for (let i = 0; i < count; i++) clone.appendChild(items[i].cloneNode(true))
    return beforeHtml + clone.outerHTML
  }

  const h1 = measureFragment({ ...row, descriptionHtml: buildFirstHtml(1) })
  if (h1 <= 0 || h1 > budget || h1 < MIN_SPLIT_H) return null

  // If all items fit in the budget there is nothing to split — return null so
  // the main placement loop places the row intact (no orphan last item).
  const hAll = measureFragment({ ...row, descriptionHtml: buildFirstHtml(items.length) })
  if (hAll <= budget) return null

  let lo = 1, hi = items.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    const h = measureFragment({ ...row, descriptionHtml: buildFirstHtml(mid) })
    if (h <= budget) lo = mid
    else hi = mid - 1
  }

  const firstHtml = buildFirstHtml(lo)
  const secondListClone = listEl.cloneNode(false)
  secondListClone.removeAttribute('start')
  if (tag === 'ol') secondListClone.setAttribute('start', String(base + placed + lo))
  for (let i = lo; i < items.length; i++) secondListClone.appendChild(items[i].cloneNode(true))
  const secondHtml = secondListClone.outerHTML + afterHtml

  const firstH = measureFragment({ ...row, descriptionHtml: firstHtml })
  const secondH = measureFragment({ ...row, descriptionHtml: secondHtml })
  if (firstH < MIN_SPLIT_H || secondH < MIN_SPLIT_H) return null

  return {
    firstPart: {
      ...row,
      _isFirstPart: true,
      _htmlSplit: true,
      _splitHeight: firstH,
      descriptionHtml: firstHtml,
    },
    secondPart: {
      ...row,
      _isContinued: true,
      _isFirstPart: false,
      _htmlSplit: true,
      _splitHeight: undefined,
      _measuredH: secondH,
      _partIndex: (row._partIndex ?? 0) + 1,
      descriptionHtml: secondHtml,
      _originalListStart: base,
      _totalItemsPlaced: placed + lo,
    },
  }
}

function tryParaSplitMeasured(row, blocks, budget, measureFragment) {
  if (blocks.length < 2) return null

  const buildFirstHtml = (count) => blocks.slice(0, count).map(b => b.fullHtml).join('')

  const h1 = measureFragment({ ...row, descriptionHtml: buildFirstHtml(1) })
  if (h1 <= 0 || h1 > budget || h1 < MIN_SPLIT_H) return null

  let lo = 1, hi = blocks.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    const h = measureFragment({ ...row, descriptionHtml: buildFirstHtml(mid) })
    if (h <= budget) lo = mid
    else hi = mid - 1
  }

  const firstHtml = buildFirstHtml(lo)
  const secondHtml = blocks.slice(lo).map(b => b.fullHtml).join('')
  if (!secondHtml.trim()) return null

  const firstH = measureFragment({ ...row, descriptionHtml: firstHtml })
  const secondH = measureFragment({ ...row, descriptionHtml: secondHtml })
  if (firstH < MIN_SPLIT_H || secondH < MIN_SPLIT_H) return null

  return {
    firstPart: {
      ...row,
      _isFirstPart: true,
      _textSplit: true,
      _splitHeight: firstH,
      descriptionHtml: firstHtml,
    },
    secondPart: {
      ...row,
      _isContinued: true,
      _isFirstPart: false,
      _textSplit: true,
      _measuredH: secondH,
      descriptionHtml: secondHtml,
      description: stripHtml(secondHtml),
      _partIndex: (row._partIndex ?? 0) + 1,
    },
  }
}

// Split HTML content at a word boundary, preserving all inline formatting.
// Returns [firstHtml, secondHtml] where both halves keep the original tag structure.
function splitHtmlAtWordBoundary(html, splitAfterWord) {
  if (!html) return ['', '']
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  let placed = 0

  function processNode(node) {
    if (node.nodeType === 3) {
      const tokens = node.textContent.split(/(\s+)/)
      let first = '', second = ''
      for (const tok of tokens) {
        if (/^\s*$/.test(tok)) {
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
    return [f ? `<${tag}${attrs}>${f}</${tag}>` : '', s ? `<${tag}${attrs}>${s}</${tag}>` : '']
  }

  let first = '', second = ''
  for (const child of tmp.childNodes) {
    const [f, s] = processNode(child)
    first += f; second += s
  }
  return [first, second]
}

function countHtmlWords(html) {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || '').trim().split(/\s+/).filter(Boolean).length
}

function tryWordSplitMeasured(row, budget, measureFragment) {
  const html = (row.descriptionHtml || row.description || '').trim()
  if (!html) return null

  const totalWords = countHtmlWords(html)
  if (totalWords < 2) return null

  const buildFirstHtml = (count) => splitHtmlAtWordBoundary(html, count)[0]

  const h1 = measureFragment({ ...row, descriptionHtml: buildFirstHtml(1) })
  if (h1 <= 0 || h1 > budget || h1 < MIN_SPLIT_H) return null

  let lo = 1, hi = totalWords - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    const h = measureFragment({ ...row, descriptionHtml: buildFirstHtml(mid) })
    if (h <= budget) lo = mid
    else hi = mid - 1
  }

  const [firstHtml, secondHtml] = splitHtmlAtWordBoundary(html, lo)
  if (!secondHtml.trim()) return null

  const firstH = measureFragment({ ...row, descriptionHtml: firstHtml })
  const secondH = measureFragment({ ...row, descriptionHtml: secondHtml })
  if (secondH < MIN_SPLIT_H) return null

  return {
    firstPart: {
      ...row,
      _isFirstPart: true,
      _textSplit: true,
      _splitHeight: firstH,
      descriptionHtml: firstHtml,
    },
    secondPart: {
      ...row,
      _isContinued: true,
      _isFirstPart: false,
      _textSplit: true,
      _measuredH: secondH,
      descriptionHtml: secondHtml,
      description: stripHtml(secondHtml),
      _partIndex: (row._partIndex ?? 0) + 1,
    },
  }
}

function trySplitRow(row, available, measureFragment) {
  if (!measureFragment || available < MIN_SPLIT_H) return null

  const html = row.descriptionHtml || ''

  // 1. List-item boundary split (preferred — preserves complete <li> blocks and ol numbering)
  const listSplit = tryListSplitMeasured(row, available, measureFragment)
  if (listSplit) return listSplit

  // 2. Block-element boundary split (<p>, <div>, headings)
  let paraSplit = null
  const blocks = extractParagraphBlocks(html || row.description || '')
  if (blocks.length >= 2) {
    paraSplit = tryParaSplitMeasured(row, blocks, available, measureFragment)
  }

  // 3. Word-boundary split. Always attempt when the para split leaves less than half
  // the page budget in the first fragment — a large block that exactly fills a page
  // can strand a tiny para fragment with a huge gap below it.
  const paraFirstH = paraSplit?.firstPart._splitHeight ?? 0
  const wordSplit = (paraFirstH < available * 0.5)
    ? tryWordSplitMeasured(row, available, measureFragment)
    : null

  // Prefer whichever split fills the first page more.
  if (paraSplit && wordSplit) {
    return wordSplit.firstPart._splitHeight > paraFirstH ? wordSplit : paraSplit
  }
  return paraSplit || wordSplit
}

// ─── Checkpoint system ────────────────────────────────────────────────────────

const CHECKPOINT_INTERVAL = 10

function findCheckpoint(checkpoints, dirtyFromIndex) {
  let lo = 0, hi = checkpoints.length - 1, best = null
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (checkpoints[mid].rowIndex < dirtyFromIndex) { best = checkpoints[mid]; lo = mid + 1 }
    else hi = mid - 1
  }
  return best
}

function restoreCheckpoint(cp) {
  return {
    pages: cp.pages.map(p => ({ ...p, rows: [...p.rows] })),
    currentRows: [...cp.currentRows],
    cursorY: cp.cursorY,
    globalRowStart: cp.globalRowStart,
  }
}

// ─── Core pagination algorithm ────────────────────────────────────────────────

function paginateIncremental(rows, heightCache, headerH, measureFragment, dirtyFromIndex, checkpointsRef) {
  const budget = pageBudget(headerH)

  if (rows.length === 0) {
    checkpointsRef.current = []
    return [{ rows: [], isLast: true, pageNumber: 1, rowStartIndex: 0 }]
  }

  const cp = (dirtyFromIndex !== null && checkpointsRef.current.length > 0)
    ? findCheckpoint(checkpointsRef.current, dirtyFromIndex)
    : null

  let pages, currentRows, cursor_y, globalRowStart, startRowIndex

  if (cp) {
    const restored = restoreCheckpoint(cp)
    pages = restored.pages
    currentRows = restored.currentRows
    cursor_y = restored.cursorY
    globalRowStart = restored.globalRowStart
    startRowIndex = cp.rowIndex
    checkpointsRef.current = checkpointsRef.current.filter(c => c.rowIndex < cp.rowIndex)
  } else {
    pages = []
    currentRows = []
    cursor_y = 0
    globalRowStart = 0
    startRowIndex = 0
    if (dirtyFromIndex === null) checkpointsRef.current = []
  }

  // Use a work queue so split continuations are fed back through the same fit logic,
  // allowing rows taller than one full page to be carved across as many pages as needed.
  const queue = rows.slice(startRowIndex)
  let nextSourceIndex = startRowIndex
  let queueDepth = 0  // > 0 while split continuations are pending in the queue

  while (queue.length > 0) {
    const row = queue.shift()
    const isContinuation = row._isContinued === true

    if (!isContinuation) {
      if (queueDepth === 0 && nextSourceIndex % CHECKPOINT_INTERVAL === 0 && nextSourceIndex > 0) {
        checkpointsRef.current.push({
          rowIndex: nextSourceIndex,
          pages: pages.map(p => ({ ...p, rows: [...p.rows] })),
          currentRows: [...currentRows],
          cursorY: cursor_y,
          globalRowStart,
        })
      }
      nextSourceIndex++
    } else {
      queueDepth = Math.max(0, queueDepth - 1)
    }

    const rowH = getRowHeight(row, heightCache)
    const remaining = budget - cursor_y

    if (rowH <= remaining) {
      if (cursor_y > 0 && rowH < MIN_ZONE_H && remaining - rowH < MIN_ZONE_H) {
        // Orphan prevention: only push short rows that would leave almost no room after.
        // cursor_y > 0 guard prevents infinite loops for rows nearly as tall as the budget.
        pages.push({ rows: currentRows, isLast: false, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
        globalRowStart += currentRows.filter(r => !r._isContinued).length
        currentRows = [{ ...row, _y: 0 }]
        cursor_y = rowH
      } else {
        currentRows.push({ ...row, _y: cursor_y })
        cursor_y += rowH
      }
    } else {
      let split = trySplitRow(row, remaining, measureFragment)

      if (!split && rowH > budget) {
        // Row is taller than a full page — move to a fresh page so it starts at the top
        // and can fill the full budget for the split attempt.
        if (currentRows.length > 0) {
          pages.push({ rows: currentRows, isLast: false, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
          globalRowStart += currentRows.filter(r => !r._isContinued).length
        }
        currentRows = []
        cursor_y = 0
        split = trySplitRow(row, budget, measureFragment)
      }

      if (split) {
        // Both fragment heights come from real measurements — no budget-clamping needed.
        currentRows.push({ ...split.firstPart, _y: cursor_y })
        pages.push({ rows: currentRows, isLast: false, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
        globalRowStart += currentRows.filter(r => !r._isContinued).length
        currentRows = []
        cursor_y = 0

        queueDepth++
        queue.unshift({
          ...split.secondPart,
          _totalItemsPlaced: split.secondPart._totalItemsPlaced ?? 0,
          _originalListStart: split.secondPart._originalListStart ?? 1,
        })
      } else {
        // Cannot split — start a fresh page and place the row at the top.
        if (currentRows.length > 0) {
          pages.push({ rows: currentRows, isLast: false, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
          globalRowStart += currentRows.filter(r => !r._isContinued).length
        }
        currentRows = [{ ...row, _y: 0 }]
        cursor_y = rowH
      }
    }
  }

  if (cursor_y + TOTALS_H + ADD_BTN_H > budget) {
    pages.push({ rows: currentRows, isLast: false, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
    globalRowStart += currentRows.filter(r => !r._isContinued).length
    pages.push({ rows: [], isLast: true, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
  } else {
    pages.push({ rows: currentRows, isLast: true, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
  }

  return pages
}

export function usePagination(rows, heightCache, _version, headerH = HEADER_ZONE_H, measureFragment = null, dirtyFromIndex = null) {
  const checkpointsRef = useRef([])
  const pagesRef = useRef(null)
  const prevVersionRef = useRef(-1)
  const prevMetaRef = useRef({ rowsLength: -1, headerH: null })
  const prevRowsRef = useRef(null) // eslint-disable-line react-hooks/refs

  const prev = prevMetaRef.current // eslint-disable-line react-hooks/refs
  const structureChanged = (
    rows.length !== prev.rowsLength ||
    headerH !== prev.headerH
  )
  // Invalidate cache when row content changes (description/name edits change the rows
  // reference even when row count and heights stay the same).
  const rowsChanged = rows !== prevRowsRef.current // eslint-disable-line react-hooks/refs

  // eslint-disable-next-line react-hooks/refs
  if (_version === prevVersionRef.current && !structureChanged && !rowsChanged && pagesRef.current !== null) {
    return pagesRef.current // eslint-disable-line react-hooks/refs
  }

  let effectiveDirtyFrom = dirtyFromIndex
  // eslint-disable-next-line react-hooks/refs
  if (structureChanged || dirtyFromIndex === null || checkpointsRef.current.length === 0) {
    effectiveDirtyFrom = null
    if (structureChanged) checkpointsRef.current = [] // eslint-disable-line react-hooks/refs
  }

  prevMetaRef.current = { rowsLength: rows.length, headerH } // eslint-disable-line react-hooks/refs
  prevVersionRef.current = _version // eslint-disable-line react-hooks/refs
  prevRowsRef.current = rows // eslint-disable-line react-hooks/refs

  const result = paginateIncremental(
    rows, heightCache, headerH, measureFragment,
    effectiveDirtyFrom, checkpointsRef
  )
  pagesRef.current = result // eslint-disable-line react-hooks/refs
  return result
}
