import { useMemo } from 'react'

// A4 page dimensions at 96dpi
const A4_H = 1123
const PAGE_PAD = 96           // top + bottom padding (48 each)
const HEADER_ZONE_H = 190     // Zones 1+2 (minHeight:160 + mb-6:24 + buffer)
const LABEL_H = 48            // "FACTURE" label + mb-4 gap
const TABLE_HEADER_H = 40     // thead row (py-2, text-xs, border-b-2)
const FOOTER_H = 80           // ZoneFooter — absolute, reserved on every page
const TOTALS_H = 220          // TotalsBlock + mt-6 gap (last page only)
const ADD_BTN_H = 44
const ROW_DEFAULT_H = 40      // fallback row height
const ROW_OVERHEAD_H = 28     // row border + cell padding (non-description portion)
const LINE_HEIGHT = 18        // text-xs (12px) × line-height 1.5
const CHARS_PER_LINE = 42     // description column ≈ 271px / 6.5px avg char width
const MIN_SPLIT_H = 3 * LINE_HEIGHT + ROW_OVERHEAD_H  // ~82px — minimum to justify splitting

// All pages share the same header, so row budget is identical on every page.
const PAGE_BUDGET = A4_H - PAGE_PAD - HEADER_ZONE_H - LABEL_H - TABLE_HEADER_H - FOOTER_H
const FIRST_BUDGET = PAGE_BUDGET
const NEXT_BUDGET  = PAGE_BUDGET

function estimateRowHeight(row, heightCache) {
  // Split rows carry an explicit height; regular rows use the measured cache.
  if (row._splitHeight !== undefined) return row._splitHeight
  return heightCache.get(row.id) ?? ROW_DEFAULT_H
}

function stripHtml(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Attempts to split a tall row across a page boundary.
 * Returns { firstPart, secondPart } or null if the split isn't worthwhile.
 *
 * @param {object} row        - original row object
 * @param {number} available  - remaining pixel budget on the current page
 */
const DESCENDER_BUFFER = 4  // extra px below last text line so g/j/y/p descenders aren't clipped

function trySplitRow(row, available) {
  if (available < MIN_SPLIT_H) return null

  const descLinesVisible = Math.floor((available - ROW_OVERHEAD_H) / LINE_HEIGHT)
  if (descLinesVisible < 1) return null

  // Snap split point to a word boundary so we never cut a word in half.
  const rawSplitChar = descLinesVisible * CHARS_PER_LINE
  const plainText = stripHtml(row.descriptionHtml) || (row.description || '')
  if (rawSplitChar >= plainText.length) return null

  const lookback = plainText.lastIndexOf(' ', rawSplitChar)
  const splitChar = lookback > rawSplitChar - CHARS_PER_LINE ? lookback + 1 : rawSplitChar

  // Exact plain-text slices so the two halves never overlap or leave a gap.
  const firstText = plainText.slice(0, splitChar).trimEnd()
  const continuationText = plainText.slice(splitChar).trimStart()

  // Height that will contain exactly descLinesVisible lines + descender room.
  const splitDescHeight = descLinesVisible * LINE_HEIGHT + DESCENDER_BUFFER

  // First part: renders _splitFirstText (plain text) so the clip aligns perfectly
  // with where the continuation begins. The full descriptionHtml is kept so the
  // edit modal still shows the original rich content.
  const firstPart = {
    ...row,
    _isFirstPart: true,
    _splitHeight: available,
    _splitDescHeight: splitDescHeight,
    _splitFirstText: firstText,
  }

  // Second part: continuation row showing only the text that didn't fit.
  const secondPart = {
    ...row,
    _isContinued: true,
    _continuationText: continuationText,
  }

  return { firstPart, secondPart }
}

function paginate(rows, heightCache) {
  if (rows.length === 0) {
    return [{ rows: [], isLast: true, pageNumber: 1, rowStartIndex: 0 }]
  }

  const pages = []
  let currentRows = []
  let budgetUsed = 0
  let isFirst = true
  let globalRowStart = 0
  const budget = () => isFirst ? FIRST_BUDGET : NEXT_BUDGET

  for (const row of rows) {
    const rowH = estimateRowHeight(row, heightCache)
    const remaining = budget() - budgetUsed

    if (rowH <= remaining) {
      currentRows.push(row)
      budgetUsed += rowH
    } else {
      const split = trySplitRow(row, remaining)

      if (split) {
        // First part fills the remaining budget on the current page.
        currentRows.push(split.firstPart)
        pages.push({ rows: currentRows, isLast: false, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
        // The split row counts as one row — rowStartIndex on the next page starts at the
        // same global index so the continuation shows the same row number.
        globalRowStart += currentRows.length - 1

        // Continuation height: the portion that didn't fit.
        const continuationH = Math.max(ROW_DEFAULT_H, rowH - remaining)
        currentRows = [{ ...split.secondPart, _splitHeight: continuationH }]
        budgetUsed = continuationH
      } else {
        // Row doesn't fit and isn't worth splitting — push current page, start fresh.
        pages.push({ rows: currentRows, isLast: false, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
        globalRowStart += currentRows.length
        currentRows = [row]
        budgetUsed = rowH
      }
      isFirst = false
    }
  }

  // Check if totals + add button fit on the last page.
  const lastBudget = isFirst ? FIRST_BUDGET : NEXT_BUDGET
  if (budgetUsed + TOTALS_H + ADD_BTN_H > lastBudget) {
    pages.push({ rows: currentRows, isLast: false, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
    globalRowStart += currentRows.length
    pages.push({ rows: [], isLast: true, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
  } else {
    pages.push({ rows: currentRows, isLast: true, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
  }

  return pages
}

export function usePagination(rows, heightCache, _version) {
  return useMemo(() => paginate(rows, heightCache), [rows, heightCache, _version])
}
