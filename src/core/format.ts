// Utilitas format tampilan.

/** Inisial nama, dipakai di daftar demi privasi pasien. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts.slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

/** Angka dengan desimal tetap, memakai koma sesuai kaidah bahasa Indonesia. */
export function fmt(n: number, d = 3): string {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(d).replace('.', ',')
}

/** Angka polos (titik desimal) — untuk ekspor CSV. */
export function fmtRaw(n: number, d = 4): string {
  return Number.isFinite(n) ? n.toFixed(d) : ''
}

/** Nama disamarkan untuk peran kader (privasi — hanya inisial). */
export function displayName(name: string, role: string): string {
  return role === 'kader' ? initials(name) + '.' : name
}

/** '2026-07-16 18:17:35' → '16 Jul 2026, 18.17' */
export function fmtDate(iso: string): string {
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
