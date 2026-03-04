// ═══════════════════════════════════════════
// Spray Tracker — Tab Router
// Add new tabs by: 1) create file in spray/, 2) import here, 3) add to tabs array
// ═══════════════════════════════════════════

import { useState } from 'react'
import { C, cardStyle } from '../config.js'
import NewLogTab from './spray/NewLogTab.jsx'
import HistoryTab from './spray/HistoryTab.jsx'
import SdsTab from './spray/SdsTab.jsx'

export default function SprayTracker({ vehicle, chemicals, equipment, crews, logs, weather, onRefreshWeather, onSubmitLog, onLogsUpdated, loggedInEmployee, loggedInCrew }) {
  const [tab, setTab] = useState('log')
  const tabs = [{ key: 'log', label: 'New Log', icon: '📝' }, { key: 'history', label: 'History', icon: '📋' }, { key: 'sds', label: 'SDS', icon: '☣️' }]
  return (
    <div>
      <div style={{ display: 'flex', marginBottom: 14, background: C.card, borderRadius: 14, border: `1.5px solid ${C.cardBorder}`, overflow: 'hidden' }}>
        {tabs.map(t => (
          <div key={t.key} tabIndex={0} role="button" onClick={() => setTab(t.key)} onKeyDown={e => e.key === 'Enter' && setTab(t.key)}
            style={{ flex: 1, textAlign: 'center', padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', outline: 'none',
              color: tab === t.key ? '#fff' : C.textLight, background: tab === t.key ? C.accent : 'transparent', transition: 'all 0.15s' }}>
            {t.icon} {t.label}
          </div>
        ))}
      </div>
      {tab === 'log' && <NewLogTab vehicle={vehicle} chemicals={chemicals} equipment={equipment} crews={crews} weather={weather} onRefresh={onRefreshWeather} onSubmit={onSubmitLog} onLogsUpdated={onLogsUpdated} loggedInEmployee={loggedInEmployee} loggedInCrew={loggedInCrew} />}
      {tab === 'history' && <HistoryTab logs={logs} />}
      {tab === 'sds' && <SdsTab chemicals={chemicals} />}
    </div>
  )
}