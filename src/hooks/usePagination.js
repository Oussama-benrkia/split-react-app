import { useMemo } from 'react'

// A4 page dimensions at 96dpi
const A4_H = 1123
const PAGE_PAD = 96           // top + bottom padding (48 each)
export const HEADER_ZONE_H = 190  // Zones 1+2 (minHeight:160 + mb-6:24 + buffer) — also exported as initial state
const LABEL_H = 48            // "FACTURE" label + mb-4 gap
const TABLE_HEADER_H = 40     // thead row (py-2, text-xs, border-b-2)
const FOOTER_H = 80           // ZoneFooter — absolute, reserved on every page
const TOTALS_H = 220          // TotalsBlock + mt-6 gap (last page only)
const ADD_BTN_H = 44
const ROW_OVERHEAD_H = 28     // row border + cell padding (non-description portion)
const LINE_HEIGHT_DEFAULT = 16   // text-xs line-height fallback
const CHARS_PER_LINE_DEFAULT = 35 // fallback chars per line

// Column geometry for Phase 1 height measurement
const NAME_COL_INNER_W = 130  // Désignation col (22% of 698px) minus px-3 padding each side
const DESC_COL_INNER_W = 247  // Description col — must match PageCanvas probe width
const CELL_PAD_V = 16         // py-2: 8px top + 8px bottom
const BORDER_W = 1            // border-b on every tbody row

// Default budget — overridden at runtime once the header zone is measured.
function pageBudget(headerH) {
  return A4_H - PAGE_PAD - headerH - LABEL_H - TABLE_HEADER_H - FOOTER_H
}

// Phase 1 — always take the larger of the DOM-measured cache and the content-computed height.
// _textSplit continuations carry different content from the original row, so they are stored
// under id+'_c' to avoid conflating the original row's full height with the continuation's height.
function estimateRowHeight(row, heightCache, lineHeight, charsPerLine) {
  if (row._splitHeight !== undefined) return row._splitHeight
  const computed = measureRowHeight(row, lineHeight, charsPerLine)
  const key = ((row._textSplit || row._htmlSplit) && row._isContinued) ? row.id + '_c' : row.id
  if (!heightCache.has(key)) return computed
  return Math.max(heightCache.get(key), computed)
}

function stripHtml(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;#8203;/gi, '')
    .replace(/&#8203;/gi, '')
    .replace(/​/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const DESCENDER_BUFFER = 4  // extra px below last text line so g/j/y/p descenders aren't clipped

// Phase 1 — Measure: compute row height from text content and font metrics.
// Used as the primary fallback when heightCache has no entry (new rows, first render).
function measureRowHeight(row, lineHeight, charsPerLine) {
  const nameCharsPerLine = Math.max(10, Math.floor(NAME_COL_INNER_W * charsPerLine / DESC_COL_INNER_W))

  const nameLines = Math.max(1, countLines(stripHtml(row.nameHtml || row.name || ''), nameCharsPerLine))
  const descLines = Math.max(1, countLines(stripHtml(row.descriptionHtml || row.description || ''), charsPerLine))

  const nameCellH = nameLines * lineHeight + CELL_PAD_V
  const descCellH = descLines * lineHeight + CELL_PAD_V

  return Math.max(nameCellH, descCellH) + BORDER_W
}

function countLines(text, charsPerLine) {
  return text.split('\n').reduce(
    (n, seg) => n + (seg.length === 0 ? 1 : Math.ceil(seg.length / charsPerLine)), 0
  )
}

/**
 * Walk the plain text segment-by-segment (split on \n) and return the character
 * position where the text would exceed maxLines visual lines.
 * Each explicit \n is a hard line break; within a segment, lines wrap at charsPerLine.
 * Returns plainText.length if everything fits.
 */
function findSplitChar(plainText, maxLines, charsPerLine) {
  const segments = plainText.split('\n')
  let linesUsed = 0
  let charPos = 0

  for (let si = 0; si < segments.length; si++) {
    const seg = segments[si]
    const segLines = seg.length === 0 ? 1 : Math.ceil(seg.length / charsPerLine)

    if (linesUsed + segLines > maxLines) {
      const linesLeft = maxLines - linesUsed
      const charLimit = linesLeft * charsPerLine
      if (charLimit >= seg.length) return charPos + seg.length
      const lastSpace = seg.lastIndexOf(' ', charLimit)
      return charPos + (lastSpace > 0 ? lastSpace : charLimit)
    }

    linesUsed += segLines
    charPos += seg.length
    if (si < segments.length - 1) charPos++
  }

  return plainText.length
}

/**
 * Try to split an HTML list (ol/ul) at a <li> boundary so each page gets
 * complete items and ordered lists continue with the correct start number.
 * Returns { firstHtml, secondHtml, linesInFirst } or null if not applicable.
 */
function tryListSplit(html, descLinesVisible, charsPerLine) {
  const listMatch = /<(ol|ul)([^>]*)>([\s\S]*?)<\/\1>/i.exec(html)
  if (!listMatch) return null

  const tag = listMatch[1]
  const attrs = listMatch[2]
  const listContent = listMatch[3]
  const beforeList = html.slice(0, listMatch.index)
  const afterList = html.slice(listMatch.index + listMatch[0].length)

  // Parse <li> items (assumes no nesting)
  const liPattern = /<li([^>]*)>([\s\S]*?)<\/li>/gi
  const items = []
  let m
  while ((m = liPattern.exec(listContent)) !== null) {
    const text = stripHtml(m[2])
    items.push({ liAttrs: m[1], liContent: m[2], lines: Math.max(1, countLines(text, charsPerLine)) })
  }

  if (items.length < 2) return null

  // Find split point: last item index that still fits
  let linesUsed = 0
  let splitAt = -1
  for (let i = 0; i < items.length; i++) {
    if (linesUsed + items[i].lines > descLinesVisible) { splitAt = i; break }
    linesUsed += items[i].lines
  }
  if (splitAt <= 0 || splitAt >= items.length) return null

  const buildItems = arr => arr.map(it => `<li${it.liAttrs}>${it.liContent}</li>`).join('')
  // Strip any existing start attr from attrs so we never duplicate it.
  const cleanAttrs = attrs.replace(/\s*start=["']\d+["']/gi, '')
  // Compute correct start numbers accounting for an existing start on this list.
  const existingStartMatch = /start=["'](\d+)["']/i.exec(attrs)
  const existingStart = existingStartMatch ? parseInt(existingStartMatch[1], 10) : 1
  // First segment: needs start only when the list doesn't begin at 1 (e.g. a re-split continuation).
  const firstStartAttr = (tag.toLowerCase() === 'ol' && existingStart !== 1) ? ` start="${existingStart}"` : ''
  const firstHtml = beforeList + `<${tag}${firstStartAttr}${cleanAttrs}>${buildItems(items.slice(0, splitAt))}</${tag}>`
  // Second segment always needs start to continue numbering from the right item.
  const startAttr = tag.toLowerCase() === 'ol' ? ` start="${existingStart + splitAt}"` : ''
  const secondHtml = `<${tag}${startAttr}${cleanAttrs}>${buildItems(items.slice(splitAt))}</${tag}>` + afterList

  return { firstHtml, secondHtml, linesInFirst: linesUsed }
}

// Minimum lines that must be visible on the first page before we agree to split.
// If fewer lines fit in the remaining space the whole row is pushed to the next page instead,
// preventing 1-2 line stubs that look broken and cause CSS-translate drift at the top of
// the continuation.
const MIN_SPLIT_LINES = 5

function trySplitRow(row, available, lineHeight, charsPerLine) {
  const minSplitH = MIN_SPLIT_LINES * lineHeight + ROW_OVERHEAD_H
  if (available < minSplitH) return null

  const descLinesVisible = Math.floor((available - ROW_OVERHEAD_H) / lineHeight)
  if (descLinesVisible < MIN_SPLIT_LINES) return null

  const html = row.descriptionHtml || ''

  // Prefer HTML-level list split: produces exact item boundaries, no pixel estimation.
  const listSplit = tryListSplit(html, descLinesVisible, charsPerLine)
  if (listSplit) {
    // +lineHeight buffers for <ol>/<ul> default top+bottom margin that plain-text
    // line counting cannot see — without it the last visible item is always clipped.
    const splitDescHeight = listSplit.linesInFirst * lineHeight + lineHeight + DESCENDER_BUFFER
    const firstPart = {
      ...row,
      _isFirstPart: true,
      _htmlSplit: true,
      _splitHeight: available,
      _splitDescHeight: splitDescHeight,
      descriptionHtml: listSplit.firstHtml,
    }
    const secondPart = {
      ...row,
      _isContinued: true,
      _htmlSplit: true,
      descriptionHtml: listSplit.secondHtml,
    }
    return { firstPart, secondPart }
  }

  // Fallback: plain-text split for non-list content.
  const plainText = stripHtml(html) || (row.description || '')
  const splitChar = findSplitChar(plainText, descLinesVisible, charsPerLine)
  if (splitChar >= plainText.length) return null

  // Detect mid-word split: no whitespace on either side of the cut point.
  const charBefore = splitChar > 0 ? plainText[splitChar - 1] : ' '
  const charAt = plainText[splitChar] ?? ' '
  const isMidWord = charBefore !== ' ' && charBefore !== '\n' && charAt !== ' ' && charAt !== '\n'

  const firstText = isMidWord
    ? plainText.slice(0, splitChar) + '-'
    : plainText.slice(0, splitChar).trimEnd()
  const continuationText = isMidWord
    ? plainText.slice(splitChar)
    : plainText.slice(splitChar).trimStart()
  // Use the full available description height as the clip rather than a text-derived
  // estimate: countLines() cannot see <p>/<ol> margins or bold line-height bumps, so
  // any text estimate is always too small and clips rich HTML too early.
  const splitDescHeight = available - ROW_OVERHEAD_H

  const firstPart = {
    ...row,
    _isFirstPart: true,
    _splitHeight: available,
    _splitDescHeight: splitDescHeight,
    descriptionHtml: html,  // keep original HTML; _splitDescHeight + maxHeight clip does the trimming
    _textSplit: true,
  }
  const secondPart = {
    ...row,
    _isContinued: true,
    _continuationText: continuationText,
    _splitDescHeight: splitDescHeight,
    descriptionHtml: continuationText,
    description: continuationText,
    _textSplit: true,
  }

  return { firstPart, secondPart }
}

function paginate(rows, heightCache, headerH, lineHeight, charsPerLine) {
  const budget = pageBudget(headerH)
  // Mirrors trySplitRow's minSplitH — minimum vertical zone that must remain after a row
  // placement, so a page never ends with a lone short row right before a page break.
  const MIN_ZONE_H = MIN_SPLIT_LINES * lineHeight + ROW_OVERHEAD_H

  if (rows.length === 0) {
    return [{ rows: [], isLast: true, pageNumber: 1, rowStartIndex: 0 }]
  }

  const pages = []
  let currentRows = []
  // Phase 2 — cursor_y tracks the top of the next row within the current page content area.
  // Resets to 0 on every new page. Z1/Z3 are never part of this budget.
  let cursor_y = 0
  let globalRowStart = 0

  // Use a work queue so split continuations are re-evaluated through the same fit logic,
  // allowing rows taller than a single page to be carved across as many pages as needed.
  const queue = [...rows]

  while (queue.length > 0) {
    const row = queue.shift()
    const rowH = estimateRowHeight(row, heightCache, lineHeight, charsPerLine)
    const remaining = budget - cursor_y

    if (rowH <= remaining) {
      if (cursor_y > 0 && rowH < MIN_ZONE_H && remaining - rowH < MIN_ZONE_H) {
        // Orphan prevention: only push short rows (rowH < MIN_ZONE_H) that would land with
        // almost no room left. Large rows that happen to fill the space are placed normally —
        // pushing them would leave a proportionally large hole instead.
        // cursor_y > 0 guard prevents infinite loops for rows nearly as tall as the budget.
        pages.push({ rows: currentRows, isLast: false, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
        globalRowStart += currentRows.length
        currentRows = [{ ...row, _y: 0 }]
        cursor_y = rowH
      } else {
        currentRows.push({ ...row, _y: cursor_y })
        cursor_y += rowH
      }
    } else {
      // Try to split in the remaining space; if the row is also taller than a full page,
      // retry with the full budget so oversized rows are carved page by page.
      const split = trySplitRow(row, remaining, lineHeight, charsPerLine)
               ?? (rowH > budget ? trySplitRow(row, budget, lineHeight, charsPerLine) : null)

      if (split) {
        // First part fills the current page.
        currentRows.push({ ...split.firstPart, _y: cursor_y })
        pages.push({ rows: currentRows, isLast: false, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
        globalRowStart += currentRows.length - 1
        currentRows = []
        cursor_y = 0

        if (split.secondPart._textSplit || split.secondPart._htmlSplit) {
          // Text/list split: continuation carries its own descriptionHtml (remaining content).
          // Re-queue without a fixed _splitHeight so estimateRowHeight measures it fresh
          // and trySplitRow can carve it further if it still exceeds a full page.
          queue.unshift({ ...split.secondPart })
        } else {
          // CSS-translate continuation: descriptionHtml is still the full original HTML.
          // measureRowHeight would overcount, so estimate from what's left of the original.
          const continuationH = Math.max(lineHeight + CELL_PAD_V + BORDER_W, rowH - remaining)
          currentRows = [{ ...split.secondPart, _y: 0, _splitHeight: continuationH }]
          cursor_y = continuationH
        }
      } else {
        // Cannot split — start a fresh page and place the row at the top.
        pages.push({ rows: currentRows, isLast: false, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
        globalRowStart += currentRows.length
        currentRows = [{ ...row, _y: 0 }]
        cursor_y = rowH
      }
    }
  }

  // Check if totals + add button fit on the last page.
  if (cursor_y + TOTALS_H + ADD_BTN_H > budget) {
    pages.push({ rows: currentRows, isLast: false, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
    globalRowStart += currentRows.length
    pages.push({ rows: [], isLast: true, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
  } else {
    pages.push({ rows: currentRows, isLast: true, pageNumber: pages.length + 1, rowStartIndex: globalRowStart })
  }

  return pages
}

export function usePagination(rows, heightCache, _version, headerH = HEADER_ZONE_H, textMetrics = {}) {
  const lineHeight = textMetrics.lineHeight ?? LINE_HEIGHT_DEFAULT
  const charsPerLine = textMetrics.charsPerLine ?? CHARS_PER_LINE_DEFAULT
  return useMemo(
    () => paginate(rows, heightCache, headerH, lineHeight, charsPerLine),
    [rows, heightCache, _version, headerH, lineHeight, charsPerLine],
  )
}
