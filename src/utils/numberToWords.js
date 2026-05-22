const ONES = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept',
  'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze',
  'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf',
]

const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante']

function convertBelow100(n) {
  if (n < 20) return ONES[n]

  if (n < 70) {
    const tens = Math.floor(n / 10)
    const ones = n % 10
    if (ones === 0) return TENS[tens]
    if (ones === 1) return TENS[tens] + ' et un'
    return TENS[tens] + '-' + ONES[ones]
  }

  if (n < 80) {
    // 70-79: soixante + (10-19)
    const sub = n - 60
    if (sub === 11) return 'soixante et onze'
    return 'soixante-' + ONES[sub]
  }

  if (n < 90) {
    // 80-89: quatre-vingt(s)
    const ones = n - 80
    if (ones === 0) return 'quatre-vingts'
    return 'quatre-vingt-' + ONES[ones]
  }

  // 90-99: quatre-vingt-dix + ...
  const sub = n - 80
  return 'quatre-vingt-' + ONES[sub]
}

function convertBelow1000(n) {
  if (n < 100) return convertBelow100(n)
  const hundreds = Math.floor(n / 100)
  const remainder = n % 100
  const centWord = hundreds === 1 ? 'cent' : ONES[hundreds] + ' cent'
  if (remainder === 0) return centWord + (hundreds > 1 ? 's' : '')
  return centWord + ' ' + convertBelow100(remainder)
}

function convertInteger(n) {
  if (n === 0) return 'zéro'

  const parts = []

  const milliards = Math.floor(n / 1_000_000_000)
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1_000)
  const remainder = n % 1_000

  if (milliards > 0) {
    parts.push(convertBelow1000(milliards) + ' milliard' + (milliards > 1 ? 's' : ''))
  }
  if (millions > 0) {
    parts.push(convertBelow1000(millions) + ' million' + (millions > 1 ? 's' : ''))
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'mille' : convertBelow1000(thousands) + ' mille')
  }
  if (remainder > 0) {
    parts.push(convertBelow1000(remainder))
  }

  return parts.join(' ')
}

const CURRENCY_LABELS = {
  MAD: { int: 'dirham', intP: 'dirhams', dec: 'centime', decP: 'centimes' },
  EUR: { int: 'euro', intP: 'euros', dec: 'centime', decP: 'centimes' },
  USD: { int: 'dollar', intP: 'dollars', dec: 'cent', decP: 'cents' },
}

export function numberToFrenchWords(amount, currency = 'MAD') {
  if (isNaN(amount) || amount < 0) return ''
  const rounded = Math.round(amount * 100) / 100
  const intPart = Math.floor(rounded)
  const decPart = Math.round((rounded - intPart) * 100)

  const labels = CURRENCY_LABELS[currency] ?? CURRENCY_LABELS.MAD
  const intLabel = intPart > 1 ? labels.intP : labels.int
  const decLabel = decPart > 1 ? labels.decP : labels.dec

  const intWords = convertInteger(intPart)
  let result = intWords + ' ' + intLabel

  if (decPart > 0) {
    result += ' et ' + convertInteger(decPart) + ' ' + decLabel
  }

  return result.charAt(0).toUpperCase() + result.slice(1)
}
