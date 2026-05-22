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
const ROW_DEFAULT_H = 40      // fallback row height
const ROW_OVERHEAD_H = 28     // row border + cell padding (non-description portion)
const LINE_HEIGHT_DEFAULT = 16   // text-xs line-height fallback
const CHARS_PER_LINE_DEFAULT = 35 // fallback chars per line

// Default budget — overridden at runtime once the header zone is measured.
function pageBudget(headerH) {
  return A4_H - PAGE_PAD - headerH - LABEL_H - TABLE_HEADER_H - FOOTER_H
}

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

const DESCENDER_BUFFER = 4  // extra px below last text line so g/j/y/p descenders aren't clipped

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
  const firstHtml = beforeList + `<${tag}${attrs}>${buildItems(items.slice(0, splitAt))}</${tag}>`
  const startAttr = tag.toLowerCase() === 'ol' ? ` start="${splitAt + 1}"` : ''
  const secondHtml = `<${tag}${startAttr}${attrs}>${buildItems(items.slice(splitAt))}</${tag}>` + afterList

  return { firstHtml, secondHtml, linesInFirst: linesUsed }
}

function trySplitRow(row, available, lineHeight, charsPerLine) {
  const minSplitH = 3 * lineHeight + ROW_OVERHEAD_H
  if (available < minSplitH) return null

  const descLinesVisible = Math.floor((available - ROW_OVERHEAD_H) / lineHeight)
  if (descLinesVisible < 1) return null

  const html = row.descriptionHtml || ''

  // Prefer HTML-level list split: produces exact item boundaries, no pixel estimation.
  const listSplit = tryListSplit(html, descLinesVisible, charsPerLine)
  if (listSplit) {
    const splitDescHeight = listSplit.linesInFirst * lineHeight + DESCENDER_BUFFER
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

  const firstText = plainText.slice(0, splitChar).trimEnd()
  const continuationText = plainText.slice(splitChar).trimStart()
  const splitDescHeight = countLines(firstText, charsPerLine) * lineHeight + DESCENDER_BUFFER

  const firstPart = {
    ...row,
    _isFirstPart: true,
    _splitHeight: available,
    _splitDescHeight: splitDescHeight,
  }
  const secondPart = {
    ...row,
    _isContinued: true,
    _continuationText: continuationText,
    _splitDescHeight: splitDescHeight,
  }

  return { firstPart, secondPart }
}

function paginate(rows, heightCache, headerH, lineHeight, charsPerLine) {
  const budget = pageBudget(headerH)

  if (rows.length === 0) {
    return [{ rows: [], isLast: true, pageNumber: 1, rowStartIndex: 0 }]
  }

  const pages = []
  let currentRows = []
  let budgetUsed = 0
  let globalRowStart = 0

  for (const row of rows) {
    const rowH = estimateRowHeight(row, heightCache)
    const remaining = budget - budgetUsed

    if (rowH <= remaining) {
      currentRows.push(row)
      budgetUsed += rowH
    } else {
      const split = trySplitRow(row, remaining, lineHeight, charsPerLine)

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
    }
  }

  // Check if totals + add button fit on the last page.
  if (budgetUsed + TOTALS_H + ADD_BTN_H > budget) {
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
