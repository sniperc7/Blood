'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronRight, X, ArrowRight } from 'lucide-react'
import { INDIAN_RELATIONSHIPS } from '@/lib/data/relationships'

interface Member {
  id: string
  name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  location_city: string | null
  location_country: string | null
  profession: string | null
  company: string | null
  education: string | null
  notes: string | null
  user_id: string | null
  relationship_label: string
  parent_member_id: string | null
}

// ── Generation steps ──────────────────────────────────────────────────────────

const GEN_STEP: Record<string, number> = {
  'Father': 1, 'Mother': 1,
  'Grandfather': 2, 'Grandmother': 2,
  'Uncle': 1, 'Aunt': 1,
  'Brother': 0, 'Sister': 0,
  'Cousin': 0, 'Husband': 0, 'Wife': 0,
  'Son': -1, 'Daughter': -1,
  'Nephew': -1, 'Niece': -1,
  'Grandson': -2, 'Granddaughter': -2,
  'Dada': 2, 'Dadi': 2, 'Nana': 2, 'Nani': 2,
  'Pardada': 3, 'Pardadi': 3, 'Parnana': 3, 'Parnani': 3,
  'Papa': 1, 'Pita': 1, 'Maa': 1, 'Mata': 1,
  'Bhaiya': 0, 'Bhai': 0, 'Behen': 0, 'Didi': 0,
  'Pati': 0, 'Patni': 0,
  'Beta': -1, 'Beti': -1,
  'Chacha': 1, 'Chachi': 1, 'Tau': 1, 'Taayi': 1,
  'Mama': 1, 'Mami': 1, 'Mausa': 1, 'Mausi': 1,
  'Bhatija': -1, 'Bhatiji': -1, 'Bhanja': -1, 'Bhanji': -1,
}

function getGenStep(rel: string): number {
  if (rel.includes(' — ')) {
    const word = rel.split(' — ')[0].trim().split(' ')[0]
    return GEN_STEP[word] ?? 0
  }
  if (rel.includes("'s ")) {
    return rel.split("'s ").reduce((sum, step) => sum + (GEN_STEP[step.trim()] ?? 0), 0)
  }
  return GEN_STEP[rel.trim()] ?? 0
}

function computeGenerations(members: Member[]): Map<string, number> {
  const memo = new Map<string, number>()
  const memberMap = new Map(members.map(m => [m.id, m]))
  function compute(id: string, depth = 0): number {
    if (memo.has(id)) return memo.get(id)!
    if (depth > 20) return 0
    const m = memberMap.get(id)
    if (!m) return 0
    const step = getGenStep(m.relationship_label)
    if (!m.parent_member_id) { memo.set(id, step); return step }
    const parentGen = compute(m.parent_member_id, depth + 1)
    const gen = parentGen + step
    memo.set(id, gen); return gen
  }
  for (const m of members) compute(m.id)
  return memo
}

// ── Tree parent inference ─────────────────────────────────────────────────────

function getTreeParentId(
  m: Member,
  allMembers: Member[],
  genMap: Map<string, number>,
): string | null {
  if (m.parent_member_id) return m.parent_member_id
  const myGen = genMap.get(m.id) ?? 0
  const base = m.relationship_label.split("'s ")[0]
  for (const other of allMembers) {
    if (other.id === m.id) continue
    const otherGen = genMap.get(other.id) ?? 0
    if (otherGen !== myGen + 1) continue
    const otherParts = other.relationship_label.split("'s ")
    if (otherParts[0] === base && otherParts.length > 1) return other.id
  }
  return null
}

function findImpliedParent(m: Member, allMembers: Member[]): Member | null {
  if (m.parent_member_id) return allMembers.find(x => x.id === m.parent_member_id) ?? null
  const label = m.relationship_label
  if (!label.includes("'s ")) return null
  const parts = label.split("'s ")
  const parentLabel = parts.slice(0, -1).join("'s ")
  return allMembers.find(x =>
    x.relationship_label === parentLabel ||
    x.relationship_label.startsWith(parentLabel + ' —')
  ) ?? null
}

// ── Spouse pairing ────────────────────────────────────────────────────────────

const SPOUSE_MAP: Record<string, string> = {
  'Father': 'Mother', 'Mother': 'Father',
  'Husband': 'Wife', 'Wife': 'Husband',
  'Grandfather': 'Grandmother', 'Grandmother': 'Grandfather',
  'Nana': 'Nani', 'Nani': 'Nana',
  'Dada': 'Dadi', 'Dadi': 'Dada',
  'Pardada': 'Pardadi', 'Pardadi': 'Pardada',
}

function firstWord(rel: string) { return rel.split(/[\s'—]/)[0].trim() }
function isSpousePair(a: Member, b: Member): boolean {
  const ar = firstWord(a.relationship_label), br = firstWord(b.relationship_label)
  return SPOUSE_MAP[ar] === br || SPOUSE_MAP[br] === ar
}
function isUserParentHead(h: Member): boolean {
  return ['Father', 'Mother', 'Papa', 'Maa', 'Pita', 'Mata'].includes(firstWord(h.relationship_label))
}

// ── Family unit structure ─────────────────────────────────────────────────────

interface FamilyUnit {
  id: string
  heads: Member[]
  children: FamilyUnit[]
  leafChildren: Member[]
  isUserParentUnit: boolean
  colorIndex: number
}

function buildFamilyUnits(members: Member[], genMap: Map<string, number>): FamilyUnit[] {
  if (members.length === 0) return []

  const treeParentId = new Map<string, string | null>()
  for (const m of members) {
    treeParentId.set(m.id, getTreeParentId(m, members, genMap))
  }

  const topLevel = members.filter(m => treeParentId.get(m.id) === null)
  const byGen = new Map<number, Member[]>()
  for (const m of topLevel) {
    const g = genMap.get(m.id) ?? 0
    if (!byGen.has(g)) byGen.set(g, [])
    byGen.get(g)!.push(m)
  }

  const allGens = [...byGen.keys()]
  if (allGens.length === 0) return []
  const topGen = Math.max(...allGens)

  const used = new Set<string>()

  function getChildMembers(heads: Member[]): Member[] {
    const headIds = new Set(heads.map(h => h.id))
    return members.filter(m => {
      if (used.has(m.id)) return false
      const tp = treeParentId.get(m.id)
      return tp != null && headIds.has(tp)
    })
  }

  function buildUnit(head: Member, partnerArg: Member | null, colorIdx: number): FamilyUnit {
    used.add(head.id)
    let partner = partnerArg
    if (!partner) {
      const myGen = genMap.get(head.id) ?? 0
      partner = members.find(m =>
        !used.has(m.id) && isSpousePair(head, m) && (genMap.get(m.id) ?? 0) === myGen
      ) ?? null
      if (partner) used.add(partner.id)
    }
    const heads = partner ? [head, partner] : [head]
    const isParentUnit = heads.some(isUserParentHead)

    let rawChildren = getChildMembers(heads)
    if (isParentUnit) {
      const gen0Orphans = members.filter(m =>
        !used.has(m.id) &&
        treeParentId.get(m.id) === null &&
        (genMap.get(m.id) ?? 0) === 0
      )
      const existing = new Set(rawChildren.map(c => c.id))
      rawChildren = [...rawChildren, ...gen0Orphans.filter(m => !existing.has(m.id))]
    }

    const childUnits: FamilyUnit[] = []
    const leafChildren: Member[] = []
    // Each sub-unit gets its own distinct color (incrementing from colorIdx)
    let subColor = colorIdx + 1

    for (const child of rawChildren) {
      if (used.has(child.id)) continue
      const childGen = genMap.get(child.id) ?? 0
      const childSpouse = rawChildren.find(m =>
        !used.has(m.id) && m.id !== child.id &&
        isSpousePair(child, m) && (genMap.get(m.id) ?? 0) === childGen
      ) ?? null
      used.add(child.id)
      if (childSpouse) used.add(childSpouse.id)

      const childHeads = childSpouse ? [child, childSpouse] : [child]
      const grandchildren = getChildMembers(childHeads)
      const childIsParent = childHeads.some(isUserParentHead)

      if (grandchildren.length > 0 || childIsParent) {
        childUnits.push(buildUnit(child, childSpouse, subColor++))
      } else {
        leafChildren.push(child)
        if (childSpouse) leafChildren.push(childSpouse)
      }
    }

    return {
      id: heads.map(h => h.id).join('-'),
      heads,
      children: childUnits,
      leafChildren,
      isUserParentUnit: isParentUnit,
      colorIndex: colorIdx,
    }
  }

  const topMembers = topGen > 0 ? (byGen.get(topGen) ?? []) : (byGen.get(0) ?? [])
  const topUnits: FamilyUnit[] = []
  let colorIdx = 0
  for (const m of topMembers) {
    if (used.has(m.id)) continue
    const spouse = topMembers.find(x => !used.has(x.id) && x.id !== m.id && isSpousePair(m, x)) ?? null
    if (spouse) used.add(spouse.id)
    used.add(m.id)
    topUnits.push(buildUnit(m, spouse, colorIdx++))
  }
  return topUnits
}

// ── Sunburst layout ───────────────────────────────────────────────────────────

// Layout: innermost ring = oldest generation (grandparents)
//         outermost ring = youngest generation (you, siblings, children)
// Each top-level family branch = a pizza slice sector

interface SunburstSegment {
  id: string
  member: Member | null
  isUser: boolean
  startAngle: number
  endAngle: number
  innerR: number
  outerR: number
  colorIndex: number  // -1 = You (dark)
}

function polar(cx: number, cy: number, r: number, a: number) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(cx: number, cy: number, iR: number, oR: number, a0: number, a1: number): string {
  if (a1 - a0 >= 2 * Math.PI - 0.001) {
    // Full circle: use two semicircles
    const mid = a0 + Math.PI
    const o1 = polar(cx, cy, oR, a0)
    const o2 = polar(cx, cy, oR, mid)
    const i1 = polar(cx, cy, iR, mid)
    const i2 = polar(cx, cy, iR, a0)
    return `M ${o1.x} ${o1.y} A ${oR} ${oR} 0 1 1 ${o2.x} ${o2.y} A ${oR} ${oR} 0 1 1 ${o1.x} ${o1.y} M ${i1.x} ${i1.y} A ${iR} ${iR} 0 1 0 ${i2.x} ${i2.y} A ${iR} ${iR} 0 1 0 ${i1.x} ${i1.y} Z`
  }
  const p1 = polar(cx, cy, oR, a0)
  const p2 = polar(cx, cy, oR, a1)
  const p3 = polar(cx, cy, iR, a1)
  const p4 = polar(cx, cy, iR, a0)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${p1.x} ${p1.y} A ${oR} ${oR} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${iR} ${iR} 0 ${large} 0 ${p4.x} ${p4.y} Z`
}

// Color palette: each family branch gets one hue, same hue across all its rings
// hsl values — sat/lightness adjusted per the palette
const PALETTE: Array<[number, number, number]> = [
  // [h, s, l]
  [351, 80, 88],  // rose
  [38, 90, 86],   // amber
  [200, 80, 87],  // sky
  [152, 65, 86],  // emerald
  [262, 65, 88],  // violet
  [22, 85, 87],   // orange
  [172, 65, 86],  // teal
  [328, 70, 88],  // pink
]

function segmentFill(colorIndex: number): string {
  if (colorIndex < 0) return '#111827'
  const [h, s, l] = PALETTE[colorIndex % PALETTE.length]
  return `hsl(${h}, ${s}%, ${l}%)`
}

function segmentStroke(colorIndex: number): string {
  if (colorIndex < 0) return '#374151'
  const [h, s, l] = PALETTE[colorIndex % PALETTE.length]
  return `hsl(${h}, ${s}%, ${Math.max(l - 20, 40)}%)`
}

function computeSunburst(
  units: FamilyUnit[],
  genMap: Map<string, number>,
  cx: number,
  cy: number,
  innerPad: number,
  ringWidth: number,
  topGen: number,
): SunburstSegment[] {
  const segs: SunburstSegment[] = []

  // Ring index: 0 = innermost (oldest gen), increases outward (newer gen)
  // ring index for gen G = topGen - G
  function rInner(gen: number): number {
    return innerPad + (topGen - gen) * ringWidth
  }
  function rOuter(gen: number): number {
    return rInner(gen) + ringWidth
  }

  function leafCount(unit: FamilyUnit): number {
    return Math.max(1,
      (unit.isUserParentUnit ? 1 : 0) +
      unit.leafChildren.length +
      unit.children.reduce((s, c) => s + leafCount(c), 0)
    )
  }

  const GAP_RAD = 0.018 // tiny gap between adjacent segments

  function placeUnit(unit: FamilyUnit, start: number, span: number) {
    const g = GAP_RAD / 2
    const s0 = start + g
    const s1 = start + span - g
    if (s1 <= s0) return
    const mid = (s0 + s1) / 2
    const gen = genMap.get(unit.heads[0].id) ?? 1

    // Place heads
    const numHeads = unit.heads.length
    const headSpan = (s1 - s0) / numHeads
    for (let i = 0; i < numHeads; i++) {
      segs.push({
        id: unit.heads[i].id,
        member: unit.heads[i],
        isUser: false,
        startAngle: s0 + i * headSpan,
        endAngle: s0 + (i + 1) * headSpan,
        innerR: rInner(gen),
        outerR: rOuter(gen),
        colorIndex: unit.colorIndex,
      })
    }

    // Distribute children in the outer ring
    type ChildItem = { isYou: boolean; member?: Member; unit?: FamilyUnit; leaves: number }
    const items: ChildItem[] = [
      ...(unit.isUserParentUnit ? [{ isYou: true, leaves: 1 }] : []),
      ...unit.leafChildren.map(m => ({ isYou: false, member: m, leaves: 1 })),
      ...unit.children.map(c => ({ isYou: false, unit: c, leaves: leafCount(c) })),
    ]
    if (items.length === 0) return

    const total = items.reduce((s, x) => s + x.leaves, 0)
    let childAngle = s0

    for (const item of items) {
      const ispan = (s1 - s0) * (item.leaves / total)
      const ig = GAP_RAD / 2
      const ia = childAngle + ig
      const ib = childAngle + ispan - ig

      if (item.isYou) {
        segs.push({
          id: '__you__',
          member: null,
          isUser: true,
          startAngle: ia,
          endAngle: Math.max(ib, ia + 0.01),
          innerR: rInner(0),
          outerR: rOuter(0),
          colorIndex: -1,
        })
      } else if (item.member) {
        const childGen = genMap.get(item.member.id) ?? 0
        segs.push({
          id: item.member.id,
          member: item.member,
          isUser: false,
          startAngle: ia,
          endAngle: Math.max(ib, ia + 0.01),
          innerR: rInner(childGen),
          outerR: rOuter(childGen),
          colorIndex: unit.colorIndex,
        })
      } else if (item.unit) {
        placeUnit(item.unit, childAngle, ispan)
      }
      childAngle += ispan
    }
  }

  const totalLeaves = units.reduce((s, u) => s + leafCount(u), 0)
  let angle = -Math.PI / 2

  for (const unit of units) {
    const span = (leafCount(unit) / totalLeaves) * 2 * Math.PI
    placeUnit(unit, angle, span)
    angle += span
  }

  return segs
}

// ── Sunburst SVG view ─────────────────────────────────────────────────────────

function SunburstView({
  segments,
  cx,
  cy,
  innerPad,
  userName,
  onTap,
}: {
  segments: SunburstSegment[]
  cx: number
  cy: number
  innerPad: number
  userName: string
  onTap: (id: string) => void
}) {
  return (
    <>
      {/* Ring segments */}
      {segments.map(seg => {
        const fill = segmentFill(seg.colorIndex)
        const stroke = segmentStroke(seg.colorIndex)
        const midAngle = (seg.startAngle + seg.endAngle) / 2
        const midR = (seg.innerR + seg.outerR) / 2
        const arcLen = (seg.endAngle - seg.startAngle) * midR
        const showLabel = arcLen > 48

        // Short first name for small arcs, full first name for larger
        const displayName = seg.member
          ? (arcLen > 72 ? seg.member.name.split(' ')[0] : seg.member.name.split(' ')[0].slice(0, 5))
          : 'You'
        const relLabel = seg.member
          ? firstWord(seg.member.relationship_label)
          : ''

        // Text rotation: align radially outward
        const textDeg = (midAngle * 180) / Math.PI + 90
        const tx = cx + midR * Math.cos(midAngle)
        const ty = cy + midR * Math.sin(midAngle)

        return (
          <g
            key={seg.id}
            onClick={() => onTap(seg.id)}
            style={{ cursor: 'pointer' }}
            role="button"
          >
            <path
              d={arcPath(cx, cy, seg.innerR, seg.outerR, seg.startAngle, seg.endAngle)}
              fill={fill}
              stroke="white"
              strokeWidth="2"
            />
            {showLabel && (
              <g transform={`translate(${tx}, ${ty}) rotate(${textDeg})`}>
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  dy={relLabel ? '-4' : '0'}
                  fontSize="10"
                  fontWeight="600"
                  fill={seg.isUser ? '#ffffff' : '#1f2937'}
                  style={{ fontFamily: 'inherit', userSelect: 'none' }}
                >
                  {displayName}
                </text>
                {relLabel && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    dy="7"
                    fontSize="7.5"
                    fill={seg.isUser ? 'rgba(255,255,255,0.75)' : '#6b7280'}
                    style={{ fontFamily: 'inherit', userSelect: 'none' }}
                  >
                    {relLabel}
                  </text>
                )}
              </g>
            )}
          </g>
        )
      })}

      {/* Center hub */}
      <circle cx={cx} cy={cy} r={innerPad} fill="#111827" />
      <text
        x={cx} y={cy - 4}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="700"
        fill="white"
        style={{ fontFamily: 'inherit', userSelect: 'none' }}
      >
        {userName.split(' ')[0]}
      </text>
      <text
        x={cx} y={cy + 8}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="7"
        fill="rgba(255,255,255,0.55)"
        style={{ fontFamily: 'inherit', userSelect: 'none' }}
      >
        You
      </text>
    </>
  )
}

// ── Profile modal ─────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-gray-700 flex-1">{value}</span>
    </div>
  )
}

function ProfileModal({ member, allMembers, userName, onClose, onAdd, onDelete }: {
  member: Member; allMembers: Member[]; userName: string;
  onClose: () => void; onAdd: (id: string, name: string) => void; onDelete: (id: string) => void;
}) {
  const impliedParent = findImpliedParent(member, allMembers)
  const parentName = impliedParent ? impliedParent.name : userName

  const coMembers = allMembers.filter(m =>
    m.id !== member.id && (
      (m.parent_member_id === member.parent_member_id && m.parent_member_id !== null) ||
      (findImpliedParent(m, allMembers)?.id === impliedParent?.id && impliedParent !== null)
    )
  )
  const inferred = coMembers.map(m => {
    const ar = firstWord(member.relationship_label), br = firstWord(m.relationship_label)
    if (SPOUSE_MAP[ar] === br || SPOUSE_MAP[br] === ar) return { label: 'Spouse', name: m.name }
    return { label: m.relationship_label, name: m.name }
  })

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">{member.name}</h2>
              <p className="text-sm text-gray-400">{member.relationship_label} of <span className="text-gray-600">{parentName}</span></p>
              {member.user_id && <span className="inline-flex items-center gap-0.5 mt-1 text-xs text-red-600 font-medium">🩸 verified</span>}
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-600 p-1"><X size={18} /></button>
          </div>
          {inferred.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Also in tree</p>
              {inferred.map((r, i) => (
                <p key={i} className="text-xs text-gray-600">
                  <span className="text-gray-400">{r.label}:</span> <span className="font-medium">{r.name}</span>
                </p>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            {member.date_of_birth && <Row label="Born" value={new Date(member.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />}
            {(member.location_city || member.location_country) && <Row label="Location" value={[member.location_city, member.location_country].filter(Boolean).join(', ')} />}
            {member.profession && <Row label="Profession" value={[member.profession, member.company].filter(Boolean).join(' · ')} />}
            {member.education && <Row label="Education" value={member.education} />}
            {member.email && <Row label="Email" value={member.email} />}
            {member.phone && <Row label="Phone" value={member.phone} />}
            {member.notes && <Row label="Notes" value={member.notes} />}
          </div>
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => { onAdd(member.id, member.name); onClose() }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-gray-400 transition-colors"
            >
              <Plus size={14} /> Add their relative
            </button>
            {member.user_id ? (
              <div className="flex flex-col items-center justify-center px-3 py-2 border border-gray-100 rounded-xl">
                <span className="text-[10px] text-red-400">🩸</span>
                <span className="text-[9px] text-gray-300 mt-0.5">verified</span>
              </div>
            ) : (
              <button
                onClick={() => { onDelete(member.id); onClose() }}
                className="flex items-center justify-center px-4 py-2.5 border border-red-100 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Chain builder data ────────────────────────────────────────────────────────

const CHAIN_STEPS = [
  { label: 'Parents', steps: ['Father', 'Mother'] },
  { label: 'Siblings', steps: ['Brother', 'Sister'] },
  { label: 'Children', steps: ['Son', 'Daughter'] },
  { label: 'Spouse', steps: ['Husband', 'Wife'] },
  { label: 'Grandparents', steps: ['Grandfather', 'Grandmother'] },
  { label: 'Grandchildren', steps: ['Grandson', 'Granddaughter'] },
  { label: 'Extended', steps: ['Uncle', 'Aunt', 'Nephew', 'Niece'] },
]

function resolveChain(chain: string[]): { hindi: string; definition: string } | null {
  const english = chain.join("'s ")
  const match = INDIAN_RELATIONSHIPS.find(r =>
    r.english.toLowerCase() === english.toLowerCase() ||
    r.definition.toLowerCase() === english.toLowerCase()
  )
  return match ? { hindi: match.hindi, definition: match.definition } : null
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', date_of_birth: '',
  location_city: '', location_country: '', profession: '',
  company: '', education: '', notes: '',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FamilyTreeClient({
  members,
  userId,
  userName,
}: {
  members: Member[]
  userId: string
  userName: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [addError, setAddError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showProfile, setShowProfile] = useState<Member | null>(null)
  const [showExtra, setShowExtra] = useState(false)
  const [parentId, setParentId] = useState<string | null>(null)
  const [parentName, setParentName] = useState('You')
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [chain, setChain] = useState<string[]>([])
  const [pickingStep, setPickingStep] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const genMap = computeGenerations(members)
  const familyUnits = buildFamilyUnits(members, genMap)

  // Sunburst dimensions — fits in viewport, no scroll
  const CANVAS = 380
  const cx = CANVAS / 2
  const cy = CANVAS / 2
  const INNER_PAD = 32
  const genVals = [...genMap.values()]
  const topGen = genVals.length > 0 ? Math.max(...genVals) : 1
  const bottomGen = genVals.length > 0 ? Math.min(...genVals) : 0
  const totalRings = topGen - bottomGen + 1  // rings needed including gen 0
  const ringWidth = (cx - INNER_PAD - 6) / Math.max(totalRings, 1)

  const segments = familyUnits.length > 0
    ? computeSunburst(familyUnits, genMap, cx, cy, INNER_PAD, ringWidth, topGen)
    : []

  const memberMap = new Map(members.map(m => [m.id, m]))

  function setField(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function openAdd(pId: string | null, pName: string) {
    setParentId(pId)
    setParentName(pName)
    setForm({ ...EMPTY_FORM })
    setChain([])
    setPickingStep(false)
    setShowStartPicker(false)
    setShowExtra(false)
    setAddError(null)
    setShowModal(true)
  }

  function handleSegmentTap(id: string) {
    if (id === '__you__') return
    const m = memberMap.get(id)
    if (m) setShowProfile(m)
  }

  const chainLabel = chain.join("'s ")
  const resolved = chain.length > 0 ? resolveChain(chain) : null
  const canSubmit = form.name.trim() !== '' && chain.length > 0

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setAddError(null)
    const supabase = createClient()
    startTransition(async () => {
      const { error } = await supabase.from('family_tree_members').insert({
        tree_owner_id: userId,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        location_city: form.location_city || null,
        location_country: form.location_country || null,
        profession: form.profession || null,
        company: form.company || null,
        education: form.education || null,
        notes: form.notes || null,
        relationship_label: chainLabel,
        parent_member_id: parentId,
      })
      if (error) { setAddError(error.message); return }
      setShowModal(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    const supabase = createClient()
    startTransition(async () => {
      await supabase.from('family_tree_members').delete().eq('id', id)
      router.refresh()
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center justify-start">

      {/* Sunburst SVG — fits screen, no scroll */}
      <div className="w-full flex justify-center">
        <svg
          viewBox={`0 0 ${CANVAS} ${CANVAS}`}
          style={{ width: '100%', maxWidth: CANVAS, maxHeight: 'calc(100svh - 120px)', height: 'auto' }}
          aria-label="Family tree"
        >
          {members.length === 0 ? (
            <>
              {/* Empty state: just show center hub + add prompt */}
              <circle cx={cx} cy={cy} r={INNER_PAD + ringWidth * 0.8} fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="4 3" />
              <circle cx={cx} cy={cy} r={INNER_PAD} fill="#111827" />
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" style={{ fontFamily: 'inherit' }}>
                {userName.split(' ')[0]}
              </text>
              <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.55)" style={{ fontFamily: 'inherit' }}>
                You
              </text>
            </>
          ) : (
            <SunburstView
              segments={segments}
              cx={cx}
              cy={cy}
              innerPad={INNER_PAD}
              userName={userName}
              onTap={handleSegmentTap}
            />
          )}
        </svg>
      </div>

      {/* Add button */}
      <div className="mt-3 pb-4">
        <button
          onClick={() => openAdd(null, 'You')}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Plus size={12} /> Add relative
        </button>
        {members.length > 0 && (
          <p className="text-center text-[10px] text-gray-300 mt-2">Tap a segment to view details</p>
        )}
      </div>

      {/* Profile modal */}
      {showProfile && (
        <ProfileModal
          member={showProfile}
          allMembers={members}
          userName={userName}
          onClose={() => setShowProfile(null)}
          onAdd={(id, name) => { setShowProfile(null); openAdd(id, name) }}
          onDelete={(id) => { setShowProfile(null); handleDelete(id) }}
        />
      )}

      {/* Add relative modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[92vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Add relative</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <input
                  placeholder="Their name *"
                  required
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                />

                {/* Relationship */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Relationship</p>
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">Starting from</p>
                    <button
                      type="button"
                      onClick={() => setShowStartPicker(s => !s)}
                      className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:border-gray-400"
                    >
                      <span>{parentName}</span>
                      <ChevronDown size={14} className="text-gray-400" />
                    </button>
                    {showStartPicker && (
                      <div className="border border-gray-200 rounded-lg mt-1 overflow-hidden max-h-40 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => { setParentId(null); setParentName('You'); setShowStartPicker(false) }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${parentId === null ? 'font-medium' : ''}`}
                        >
                          You
                        </button>
                        {members.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setParentId(m.id); setParentName(m.name); setShowStartPicker(false); setChain([]) }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-t border-gray-50 ${parentId === m.id ? 'font-medium' : ''}`}
                          >
                            {m.name} <span className="text-xs text-gray-400 ml-1">{m.relationship_label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mb-2">{parentName}'s → build the chain</p>
                  <div className="flex items-center flex-wrap gap-1 mb-2 min-h-[32px]">
                    {chain.length === 0 && !pickingStep && (
                      <span className="text-xs text-gray-300 italic">Pick a relationship below</span>
                    )}
                    {chain.map((step, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <ArrowRight size={10} className="text-gray-300" />}
                        <span className="bg-gray-900 text-white text-xs px-2.5 py-1 rounded-full">{step}</span>
                      </span>
                    ))}
                    {chain.length > 0 && (
                      <button type="button" onClick={() => setChain(c => c.slice(0, -1))} className="text-xs text-gray-400 hover:text-red-400 ml-1">✕</button>
                    )}
                  </div>

                  {resolved && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
                      <p className="text-xs text-amber-700">
                        <span className="font-semibold">{resolved.hindi}</span>
                        <span className="text-amber-500 ml-1.5">— {resolved.definition}</span>
                      </p>
                    </div>
                  )}

                  {pickingStep ? (
                    <div className="border border-gray-200 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-600">Pick next step</p>
                        <button type="button" onClick={() => setPickingStep(false)} className="text-gray-300 hover:text-gray-600"><X size={14} /></button>
                      </div>
                      {CHAIN_STEPS.map(group => (
                        <div key={group.label}>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{group.label}</p>
                          <div className="flex flex-wrap gap-1">
                            {group.steps.map(step => (
                              <button
                                key={step}
                                type="button"
                                onClick={() => { setChain(c => [...c, step]); setPickingStep(false) }}
                                className="px-3 py-1.5 rounded-full text-xs border border-gray-200 text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                              >
                                {step}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPickingStep(true)}
                      className="flex items-center gap-1.5 text-xs border border-dashed border-gray-300 rounded-lg px-3 py-2 text-gray-500 hover:border-gray-500 w-full justify-center transition-colors"
                    >
                      <Plus size={12} />
                      {chain.length === 0 ? 'Pick first step' : 'Add another step'}
                    </button>
                  )}

                  {chain.length > 0 && form.name && (
                    <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-500 mt-2">
                      <span className="font-medium text-gray-700">{form.name}</span> is {parentName}'s{' '}
                      <span className="font-medium text-gray-700">{chainLabel}</span>
                      {resolved && <span className="text-gray-400"> ({resolved.hindi})</span>}
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact (optional)</p>
                  <input placeholder="Email" type="email" value={form.email} onChange={e => setField('email', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                  <input placeholder="Phone" value={form.phone} onChange={e => setField('phone', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Date of birth</label>
                    <input type="date" value={form.date_of_birth} onChange={e => setField('date_of_birth', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-400" />
                  </div>
                </div>

                <button type="button" onClick={() => setShowExtra(e => !e)} className="text-xs text-gray-400 hover:text-gray-700 text-left flex items-center gap-1">
                  {showExtra ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {showExtra ? 'Hide' : 'Add'} extra details
                </button>

                {showExtra && (
                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                    <div className="flex gap-2">
                      <input placeholder="City" value={form.location_city} onChange={e => setField('location_city', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 min-w-0" />
                      <input placeholder="Country" value={form.location_country} onChange={e => setField('location_country', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 min-w-0" />
                    </div>
                    <input placeholder="Profession" value={form.profession} onChange={e => setField('profession', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                    <input placeholder="Company" value={form.company} onChange={e => setField('company', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                    <input placeholder="Education / College" value={form.education} onChange={e => setField('education', e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
                    <textarea placeholder="Notes" value={form.notes} onChange={e => setField('notes', e.target.value)} rows={2} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none" />
                  </div>
                )}

                {addError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{addError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={!canSubmit || isPending} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50">
                    {isPending ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
