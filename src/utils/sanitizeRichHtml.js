const DANGEROUS_TAGS = new Set(['script', 'iframe', 'object', 'embed', 'link', 'style', 'meta', 'base', 'form', 'input', 'button', 'select', 'textarea'])

export function sanitizeRichHtml(html) {
  if (!html) return ''

  const tmp = document.createElement('div')
  tmp.innerHTML = html
    .replace(/<font color="([^"]+)">/gi, '<span style="color:$1">')
    .replace(/<\/font>/gi, '</span>')
    .replace(/​/g, '')
    .replace(/&amp;#8203;/g, '')
    .replace(/&#8203;/g, '')

  // Remove dangerous elements entirely
  tmp.querySelectorAll([...DANGEROUS_TAGS].join(',')).forEach(el => el.remove())

  // Strip event handler attributes (onclick, onload, onerror, etc.)
  tmp.querySelectorAll('*').forEach(el => {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('on') || attr.name === 'href' && /^javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name)
      }
    }
  })

  return tmp.innerHTML
}
