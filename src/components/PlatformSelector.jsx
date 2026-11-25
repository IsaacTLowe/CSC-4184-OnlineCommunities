import { platformLabels } from '../gameCatalog.js'

export default function PlatformSelector({ value, onChange, includeAll = true, label = 'Filter games by platform' }) {
  const options = includeAll ? [['all', 'All platforms'], ...Object.entries(platformLabels)] : Object.entries(platformLabels)
  return (
    <div className="platform-selector" role="group" aria-label={label}>
      {options.map(([id, name]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{name}</button>
      ))}
    </div>
  )
}
