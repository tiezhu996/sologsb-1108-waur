import type { FilmStock } from '../types/film-stock'

/** 过期后每 6 个月降 1/3 档 */
const STEP_MONTHS = 6
/** 宽限期：过期半年内仍照登记值 */
const GRACE_MONTHS = 6
const STOPS_PER_STEP = 1 / 3

export interface IsoAdvice {
  /** 建议实拍 ISO */
  iso: number
  /** 较登记值降低的档数（1/3 的倍数），无需降低时为 0 */
  stopsDown: number
  /** 降低档数的中文显示，如 "2/3" */
  stopsLabel: string
  /** 建议值是否低于登记值（需要降感） */
  adjusted: boolean
  /** 是否已触底到标称值的一半 */
  atFloor: boolean
}

export function monthsExpired(expireDate: string, now: Date = new Date()): number {
  const expire = new Date(`${expireDate}T00:00:00`)
  let months = (now.getFullYear() - expire.getFullYear()) * 12 + (now.getMonth() - expire.getMonth())
  if (now.getDate() < expire.getDate()) months -= 1
  return months
}

function roundIso(value: number): number {
  return Math.max(1, Math.round(value))
}

/**
 * 计算建议实拍 ISO。
 * 过期半年内照登记值，之后每过半年（在登记值基础上）降 1/3 档，最低到标称值的一半。
 */
export function adviseIso(film: Pick<FilmStock, 'boxIso' | 'realIso' | 'expireDate'>, now: Date = new Date()): IsoAdvice {
  const expired = monthsExpired(film.expireDate, now)
  const steps = expired <= GRACE_MONTHS ? 0 : Math.floor((expired - GRACE_MONTHS) / STEP_MONTHS)
  const stopsDown = steps * STOPS_PER_STEP
  const floor = film.boxIso / 2
  const decayed = film.realIso * 2 ** -stopsDown
  const iso = roundIso(Math.max(floor, decayed))
  const atFloor = decayed <= floor
  const adjusted = steps > 0
  return {
    iso,
    stopsDown,
    stopsLabel: formatStops(stopsDown),
    adjusted,
    atFloor
  }
}

/**
 * 新登记时的入册值：输入的实拍 ISO 低于按标称值算出的建议值就抬到建议值；
 * 自己测出更高值则保留。
 */
export function resolveRegisteredIso(input: { boxIso: number; realIso: number; expireDate: string }, now: Date = new Date()): number {
  const advice = adviseIso({ boxIso: input.boxIso, realIso: input.boxIso, expireDate: input.expireDate }, now)
  return Math.max(roundIso(input.realIso), advice.iso)
}

export function formatStops(stopsDown: number): string {
  const thirds = Math.round(stopsDown / STOPS_PER_STEP)
  if (thirds <= 0) return '0'
  if (thirds % 3 === 0) return `${thirds / 3}`
  return `${thirds}/3`
}
