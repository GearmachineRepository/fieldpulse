// ═══════════════════════════════════════════
// Spray Tracker — Tab Router
// Add new tabs: 1) create file in spray/,
//               2) import here, 3) add to tabs array
// ═══════════════════════════════════════════

import { useState } from 'react'
import TabBar     from '../components/common/TabBar.jsx'
import NewLogTab  from './spray/NewLogTab.jsx'
import HistoryTab from './spray/HistoryTab.jsx'
import SdsTab     from './spray/SdsTab.jsx'

const TABS = [
  { key: 'log',     label: 'New Log', icon: '📝' },
  { key: 'history', label: 'History', icon: '📋' },
  { key: 'sds',     label: 'SDS',     icon: '☣️' },
]

export default function SprayTracker({
  vehicle, chemicals, equipment, crews, logs,
  weather, onRefreshWeather, onSubmitLog, onLogsUpdated,
  loggedInEmployee, loggedInCrew,
}) {
  const [tab, setTab] = useState('log')

  return (
    <div>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'log' && (
        <NewLogTab
          vehicle={vehicle}
          chemicals={chemicals}
          equipment={equipment}
          crews={crews}
          weather={weather}
          onRefresh={onRefreshWeather}
          onSubmit={onSubmitLog}
          onLogsUpdated={onLogsUpdated}
          loggedInEmployee={loggedInEmployee}
          loggedInCrew={loggedInCrew}
        />
      )}
      {tab === 'history' && <HistoryTab logs={logs} />}
      {tab === 'sds'     && <SdsTab chemicals={chemicals} />}
    </div>
  )
}
