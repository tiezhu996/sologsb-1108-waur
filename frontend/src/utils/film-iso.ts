import type { FilmStock } from '../types/film-stock'

const ISO_LADDER = [12, 16, 20, 25, 32, 40, 50, 64, 80, 100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200]

const GRACE_MONTHS = 6
const STEP_MONTHS = 6

type IsoSubject = Pick<FilmStock, 'boxIso' | 'realIso' | 'expireDate'>

function nearestRungIndex(iso: number): number {
  let best = 0
  ISO_LADDER.forEach((rung, index) => {
    if (Math.abs(Math.log2(rung / iso)) < Math.abs(Math.log2(ISO_LADDER[best] / iso))) {
      best = index
    }
  })
  return best
}

function floorRungIndex(iso: number): number {
  const index = ISO_LADDER.findIndex((rung) => rung >= iso)
  return index === -1 ? ISO_LADDER.length - 1 : index
}

export function expiredHalfYearSteps(expireDate: string, now: Date = new Date()): number {
  const expire = new Date(`${expireDate}T23:59:59`)
  if (Number.isNaN(expire.getTime())) return 0
  const cursor = new Date(expire)
  cursor.setMonth(cursor.getMonth() + GRACE_MONTHS)
  let steps = 0
  while (cursor <= now) {
    steps += 1
    cursor.setMonth(cursor.getMonth() + STEP_MONTHS)
  }
  return steps
}

export function suggestedRealIso(film: IsoSubject, now: Date = new Date()): number {
  const steps = expiredHalfYearSteps(film.expireDate, now)
  if (steps === 0) return film.realIso
  const floorIndex = floorRungIndex(film.boxIso / 2)
  const index = Math.max(nearestRungIndex(film.realIso) - steps, floorIndex)
  return ISO_LADDER[index]
}
