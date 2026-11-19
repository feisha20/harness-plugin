export type ExitRegionProvider = 'codex' | 'antigravity'

export interface ExitRegionSample {
  readonly country: string
  readonly ip: string
  readonly location: string | null
  readonly source: 'cloudflare' | 'ping0' | 'ipwhois'
  readonly checkedAt: number
}

export interface ExitRegionView {
  readonly status: 'confirmed' | 'unavailable' | 'unmatched'
  readonly sample: ExitRegionSample | null
  readonly change: { readonly country: string; readonly at: number } | null
}
