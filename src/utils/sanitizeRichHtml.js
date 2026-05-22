/**
 * Converts legacy <font color="...">...</font> nodes (produced by old
 * execCommand('foreColor') calls before styleWithCSS was enabled) into
 * <span style="color:...">...</span> so that inline style specificity
 * (1,0,0,0) wins over any parent Tailwind color class.
 */
export function sanitizeRichHtml(html) {
  if (!html) return ''
  return html
    .replace(/<font color="([^"]+)">/gi, '<span style="color:$1">')
    .replace(/<\/font>/gi, '</span>')
}
