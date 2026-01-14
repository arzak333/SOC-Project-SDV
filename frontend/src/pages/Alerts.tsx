import { useEffect, useState } from 'react'
import { Plus, Trash2, Power, PowerOff } from 'lucide-react'
import { fetchAlertRules, createAlertRule, deleteAlertRule, toggleAlertRule } from '../api'
import { AlertRule } from '../types'
import SeverityBadge from '../components/SeverityBadge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Alerts() {
  const [rules, setRules] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadRules()
  }, [])

  async function loadRules() {
    try {
      const data = await fetchAlertRules()
      setRules(data.rules)
    } catch (error) {
      console.error('Failed to load alert rules:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this alert rule?')) return
    try {
      await deleteAlertRule(id)
      setRules(rules.filter((r) => r.id !== id))
    } catch (error) {
      console.error('Failed to delete rule:', error)
    }
  }

  async function handleToggle(id: string) {
    try {
      const updated = await toggleAlertRule(id)
      setRules(rules.map((r) => (r.id === id ? updated : r)))
    } catch (error) {
      console.error('Failed to toggle rule:', error)
    }
  }

  async function handleCreate(data: Partial<AlertRule>) {
    try {
      const newRule = await createAlertRule(data as any)
      setRules([newRule, ...rules])
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create rule:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Alert Rules</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <AlertRuleForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No alert rules configured. Create one to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-gray-800 rounded-lg p-4 border ${
                rule.enabled ? 'border-gray-700' : 'border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{rule.name}</h3>
                    <SeverityBadge severity={rule.severity as any} size="sm" />
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        rule.enabled
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-gray-600/20 text-gray-400'
                      }`}
                    >
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {rule.description && (
                    <p className="text-gray-400 text-sm mb-3">{rule.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Condition: </span>
                      <code className="text-blue-400">
                        {JSON.stringify(rule.condition)}
                      </code>
                    </div>
                    <div>
                      <span className="text-gray-500">Action: </span>
                      <span>{rule.action}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Triggered: </span>
                      <span>{rule.trigger_count} times</span>
                    </div>
                    {rule.last_triggered && (
                      <div>
                        <span className="text-gray-500">Last: </span>
                        <span>
                          {format(new Date(rule.last_triggered), 'Pp', { locale: fr })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(rule.id)}
                    className={`p-2 rounded-lg ${
                      rule.enabled
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                    }`}
                    title={rule.enabled ? 'Disable' : 'Enable'}
                  >
                    {rule.enabled ? (
                      <Power className="w-5 h-5" />
                    ) : (
                      <PowerOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface AlertRuleFormProps {
  onSubmit: (data: Partial<AlertRule>) => void
  onCancel: () => void
}

function AlertRuleForm({ onSubmit, onCancel }: AlertRuleFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState('')
  const [count, setCount] = useState(5)
  const [timeframe, setTimeframe] = useState('10m')
  const [action, setAction] = useState<'log' | 'email' | 'webhook'>('log')
  const [severity, setSeverity] = useState('high')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      description,
      condition: {
        event_type: eventType || 'any',
        count,
        timeframe,
      },
      action,
      action_config: {},
      severity,
      enabled: true,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-bold mb-4">New Alert Rule</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="Multiple Failed Logins"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="Alert when multiple auth failures occur"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Event Type</label>
              <input
                type="text"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="auth_failure"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Threshold</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                min={1}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="5m">5 minutes</option>
                <option value="10m">10 minutes</option>
                <option value="30m">30 minutes</option>
                <option value="1h">1 hour</option>
                <option value="24h">24 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="log">Log only</option>
              <option value="email">Send email</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
