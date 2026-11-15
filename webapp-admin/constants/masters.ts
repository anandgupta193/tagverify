'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase'
import { C } from '@/lib/schema'

/** An RTO option, e.g. code "CG04", label "CG04 - RTO/ATS Raipur". */
export interface Rto {
  code: string
  label: string
}

/**
 * Chhattisgarh RTOs — the same list the dealer app bundles
 * (android/.../data/MasterData.kt). Admin can replace it via masters/dropdowns.rtos.
 */
export const DEFAULT_RTOS: Rto[] = (
  [
    ['CG04', 'Raipur'], ['CG05', 'Dhamtari'], ['CG06', 'Mahasamund'], ['CG07', 'Durg'],
    ['CG08', 'Rajnandgaon'], ['CG09', 'Kabirdham'], ['CG10', 'Bilaspur'],
    ['CG11', 'Janjgir-Champa'], ['CG12', 'Korba'], ['CG13', 'Raigarh'], ['CG14', 'Jashpur'],
    ['CG15', 'Ambikapur'], ['CG16', 'Koriya'], ['CG17', 'Jagdalpur'], ['CG18', 'Dantewada'],
    ['CG19', 'Kanker'],
  ] as const
).map(([code, city]) => ({ code, label: `${code} - RTO/ATS ${city}` }))

const year = new Date().getFullYear()

/** Same defaults as the dealer app's form (android/.../data/MasterData.kt). */
export interface Masters {
  makes: string[]
  categories: string[]
  fuelTypes: string[]
  rtos: Rto[]
  mfgYears: string[]
}

export const DEFAULT_MASTERS: Masters = {
  makes: [
    'Tata Motors', 'Ashok Leyland', 'Mahindra & Mahindra', 'Eicher Motors', 'BharatBenz',
    'Maruti Suzuki', 'Hyundai', 'Toyota', 'Force Motors', 'SML Isuzu', 'Volvo', 'Scania',
    'Bajaj', 'Piaggio', 'TVS', 'Other',
  ],
  categories: [
    '3 Wheeler', 'Ambulance', 'Bus', 'Cab', 'Fire Tender', 'Goods Carriers', 'HMV/HCV',
    'LMV/LCV', 'School Bus', 'Tractor/Trailer', 'Other',
  ],
  fuelTypes: ['Diesel', 'Petrol', 'CNG', 'LPG', 'Electric', 'Hybrid'],
  rtos: DEFAULT_RTOS,
  mfgYears: Array.from({ length: 36 }, (_, i) => String(year - i)),
}

const strings = (raw: unknown): string[] | null => {
  if (!Array.isArray(raw)) return null
  const list = raw.filter((s): s is string => typeof s === 'string' && s.trim() !== '')
  return list.length ? list : null
}

/** masters/dropdowns.rtos entries look like "CG07|RTO/ATS Durg" (same parsing as the app). */
function parseRtos(raw: unknown): Rto[] | null {
  if (!Array.isArray(raw)) return null
  const list = raw
    .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
    .map((s) => {
      const [code, name = ''] = s.split('|', 2).map((p) => p.trim())
      return { code, label: name ? `${code} - ${name}` : code }
    })
  return list.length ? list : null
}

/** Dropdown lists: bundled defaults, each replaced by masters/dropdowns.<key> when set (same as the app). */
export function useMasters(): Masters {
  const [m, setM] = useState(DEFAULT_MASTERS)
  useEffect(() => {
    getDoc(doc(getFirebaseDb(), C.masters, 'dropdowns'))
      .then((s) => {
        const d = s.data()
        if (!d) return
        setM({
          makes: strings(d.makes) ?? DEFAULT_MASTERS.makes,
          categories: strings(d.categories) ?? DEFAULT_MASTERS.categories,
          fuelTypes: strings(d.fuelTypes) ?? DEFAULT_MASTERS.fuelTypes,
          rtos: parseRtos(d.rtos) ?? DEFAULT_MASTERS.rtos,
          mfgYears: strings(d.mfgYears) ?? DEFAULT_MASTERS.mfgYears,
        })
      })
      .catch(() => {})
  }, [])
  return m
}

/** RTO dropdown options (see useMasters). */
export const useRtos = (): Rto[] => useMasters().rtos
