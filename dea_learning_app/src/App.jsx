import { useState } from 'react'
import StudyPlan from './StudyPlan'
import ExamSimulator from './ExamSimulator'

/* ── Brand icon ─────────────────────────────────────────────────── */
function PipelineIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <polygon points="18,3 10,8 18,13 26,8"    fill="#FBBF24"/>
      <line x1="26" y1="8"  x2="26" y2="13"    stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="26" cy="14.5" r="1.5"         fill="#FBBF24"/>
      <rect x="2"  y="19" width="9"  height="10" rx="2" fill="#3B82F6"/>
      <line x1="4" y1="22.5" x2="9"  y2="22.5"  stroke="white" strokeWidth="1"   opacity="0.9"/>
      <line x1="4" y1="25.5" x2="9"  y2="25.5"  stroke="white" strokeWidth="1"   opacity="0.6"/>
      <line x1="12" y1="24" x2="15" y2="24"      stroke="#93C5FD" strokeWidth="1.3" strokeDasharray="1.6,1"/>
      <rect x="13" y="17" width="10" height="14" rx="2" fill="#6366F1"/>
      <path d="M19.5 20 L17 24.5 L19 24 L17.5 30 L22 23.5 L20 24Z" fill="white" opacity="0.9"/>
      <line x1="24" y1="24" x2="27" y2="24"      stroke="#93C5FD" strokeWidth="1.3" strokeDasharray="1.6,1"/>
      <rect x="25" y="19" width="9"  height="10" rx="2" fill="#0EA5E9"/>
      <rect x="27"   y="26" width="1.5" height="2"  fill="white" opacity="0.9"/>
      <rect x="29.5" y="24" width="1.5" height="4"  fill="white" opacity="0.9"/>
      <rect x="32"   y="22" width="1.5" height="6"  fill="white" opacity="0.9"/>
    </svg>
  )
}

/* ── Nav config ─────────────────────────────────────────────────── */
const SECTIONS = [
  {
    id:     'study',
    label:  'Study Plan',
    sub:    'Concepts, 12-day timeline & cheat sheet',
    badge:  '6 topics',
    color:  '#2563EB',
    lightBg:'#EFF6FF',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#2563EB' : '#6B7280'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    id:     'exam',
    label:  'Exam Simulator',
    sub:    'Practice questions with instant feedback',
    badge:  '50+ questions',
    color:  '#7C3AED',
    lightBg:'#F5F3FF',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={active ? '#7C3AED' : '#6B7280'} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
]

const HEADER_H = 64   /* px — keep in sync with header height below */

/* ── App ────────────────────────────────────────────────────────── */
export default function App() {
  const [tab, setTab] = useState('study')
  const active = SECTIONS.find(s => s.id === tab)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ════════════════════════════════════════════════════════
          BRAND HEADER  —  identity only, nothing clickable
      ════════════════════════════════════════════════════════ */}
      <header style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)',
        height: HEADER_H,
        display: 'flex', alignItems: 'center',
        padding: '0 28px',
        gap: 14,
        position: 'sticky', top: 0, zIndex: 200,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        {/* Icon badge */}
        <div style={{
          width: 42, height: 42,
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <PipelineIcon size={28} />
        </div>

        {/* Brand name */}
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            DEA Learning
          </div>
          <div style={{ fontSize: 11, color: '#7DD3FC', letterSpacing: '0.15px', lineHeight: 1.3, marginTop: 1 }}>
            AWS Data Engineer Associate · Exam Prep
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Active section indicator */}
        <div style={{
          background: active.lightBg,
          border: `1px solid ${active.color}33`,
          borderRadius: 6,
          padding: '5px 12px',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {active.icon(true)}
          <span style={{ fontSize: 12, fontWeight: 600, color: active.color }}>{active.label}</span>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          BODY ROW  —  sidebar + content
      ════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* ── Left sidebar ─────────────────────────────────── */}
        <aside style={{
          width: 248,
          flexShrink: 0,
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          position: 'sticky',
          top: HEADER_H,
          height: `calc(100vh - ${HEADER_H}px)`,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* Section label */}
          <div style={{
            padding: '22px 20px 10px',
            fontSize: 10, fontWeight: 700, color: '#94A3B8',
            letterSpacing: '1px', textTransform: 'uppercase',
          }}>
            Learning Modules
          </div>

          {/* Nav items */}
          <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SECTIONS.map(s => {
              const isActive = tab === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setTab(s.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 12px',
                    border: 'none',
                    borderRadius: 8,
                    background: isActive ? s.lightBg : 'transparent',
                    outline: isActive ? `1.5px solid ${s.color}33` : '1.5px solid transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'background .15s',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: isActive ? `${s.color}18` : '#F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 1,
                  }}>
                    {s.icon(isActive)}
                  </div>

                  {/* Text */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, lineHeight: 1.3,
                      color: isActive ? s.color : '#1E293B',
                    }}>
                      {s.label}
                    </div>
                    <div style={{
                      fontSize: 11, color: isActive ? `${s.color}99` : '#64748B',
                      marginTop: 3, lineHeight: 1.45,
                    }}>
                      {s.sub}
                    </div>
                    {/* Badge */}
                    <div style={{
                      display: 'inline-block', marginTop: 6,
                      background: isActive ? `${s.color}15` : '#F1F5F9',
                      color: isActive ? s.color : '#94A3B8',
                      fontSize: 10, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 20,
                      letterSpacing: '0.2px',
                    }}>
                      {s.badge}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Footer info */}
          <div style={{
            margin: '12px',
            padding: '14px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              DEA-C01 Exam Prep
            </div>
            <div style={{ fontSize: 10, color: '#6B7280', lineHeight: 1.6 }}>
              Covers all 4 domains:<br/>
              Ingestion · Storage · Operations · Security
            </div>
            <div style={{
              marginTop: 10,
              height: 4, borderRadius: 2,
              background: '#E2E8F0', overflow: 'hidden',
            }}>
              <div style={{ width: '72%', height: '100%', background: 'linear-gradient(90deg, #2563EB, #7C3AED)', borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>72% passing score required</div>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────── */}
        <main style={{ flex: 1, minWidth: 0, background: '#F8FAFC' }}>
          {tab === 'study' && <StudyPlan />}
          {tab === 'exam'  && <ExamSimulator />}
        </main>

      </div>
    </div>
  )
}
