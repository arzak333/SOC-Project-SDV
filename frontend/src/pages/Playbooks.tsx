import { useState } from 'react'
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Shield,
  Mail,
  Ban,
  Search,
  FileText,
  Users,
  Server,
  Zap,
  Copy,
  Eye,
  Archive,
  RotateCcw
} from 'lucide-react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PlaybookStep {
  id: string
  order: number
  name: string
  type: 'action' | 'condition' | 'notification' | 'manual'
  description: string
  config: Record<string, any>
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
}

interface Playbook {
  id: string
  name: string
  description: string
  status: 'active' | 'draft' | 'archived'
  trigger: 'manual' | 'alert_rule' | 'scheduled'
  triggerConfig?: Record<string, any>
  steps: PlaybookStep[]
  lastRun?: string
  triggeredCount: number
  avgDuration?: string
  createdAt: string
  category: 'incident' | 'investigation' | 'remediation' | 'compliance'
}

// Action types available for playbook steps
const STEP_TYPES = [
  { value: 'action', label: 'Action', icon: Zap, description: 'Execute an automated action' },
  { value: 'condition', label: 'Condition', icon: Search, description: 'Branch based on conditions' },
  { value: 'notification', label: 'Notification', icon: Mail, description: 'Send notifications' },
  { value: 'manual', label: 'Manual', icon: Users, description: 'Require manual approval' },
]

// Available actions for steps
const AVAILABLE_ACTIONS = [
  { value: 'isolate_host', label: 'Isolate Host', icon: Ban, category: 'containment' },
  { value: 'block_ip', label: 'Block IP Address', icon: Shield, category: 'containment' },
  { value: 'disable_account', label: 'Disable User Account', icon: Users, category: 'containment' },
  { value: 'collect_logs', label: 'Collect System Logs', icon: FileText, category: 'investigation' },
  { value: 'scan_endpoint', label: 'Scan Endpoint', icon: Search, category: 'investigation' },
  { value: 'notify_team', label: 'Notify SOC Team', icon: Mail, category: 'notification' },
  { value: 'create_ticket', label: 'Create Incident Ticket', icon: FileText, category: 'notification' },
  { value: 'restore_backup', label: 'Restore from Backup', icon: RotateCcw, category: 'remediation' },
]

// Mock playbooks data
const initialPlaybooks: Playbook[] = [
  {
    id: '1',
    name: 'Ransomware Response',
    description: 'Immediate containment and investigation steps for ransomware detection',
    status: 'active',
    trigger: 'alert_rule',
    triggerConfig: { rule_name: 'Malware Alert' },
    category: 'incident',
    steps: [
      { id: 's1', order: 1, name: 'Isolate Affected Host', type: 'action', description: 'Immediately isolate the infected endpoint', config: { action: 'isolate_host' }, status: 'completed' },
      { id: 's2', order: 2, name: 'Notify SOC Team', type: 'notification', description: 'Alert the security team via email and Slack', config: { channels: ['email', 'slack'] }, status: 'completed' },
      { id: 's3', order: 3, name: 'Collect Forensic Data', type: 'action', description: 'Gather logs and memory dumps', config: { action: 'collect_logs' }, status: 'running' },
      { id: 's4', order: 4, name: 'Await Manager Approval', type: 'manual', description: 'Wait for security manager to approve next steps', config: {}, status: 'pending' },
      { id: 's5', order: 5, name: 'Block Source IP', type: 'action', description: 'Block the command & control IP', config: { action: 'block_ip' }, status: 'pending' },
    ],
    lastRun: '2024-01-15T14:30:00Z',
    triggeredCount: 12,
    avgDuration: '15m',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Phishing Investigation',
    description: 'Email analysis and user notification workflow for suspected phishing',
    status: 'active',
    trigger: 'alert_rule',
    triggerConfig: { rule_name: 'Phishing Detection' },
    category: 'investigation',
    steps: [
      { id: 's1', order: 1, name: 'Extract Email Headers', type: 'action', description: 'Parse and analyze email headers', config: { action: 'collect_logs' } },
      { id: 's2', order: 2, name: 'Check URL Reputation', type: 'action', description: 'Verify URLs against threat intel', config: { action: 'scan_endpoint' } },
      { id: 's3', order: 3, name: 'Notify User', type: 'notification', description: 'Inform the targeted user', config: { channels: ['email'] } },
      { id: 's4', order: 4, name: 'Block Sender Domain', type: 'condition', description: 'If malicious, block the sender', config: { condition: 'is_malicious' } },
    ],
    lastRun: '2024-01-14T09:15:00Z',
    triggeredCount: 45,
    avgDuration: '8m',
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'Brute Force Response',
    description: 'Account lockout and IP blocking for failed login attempts',
    status: 'active',
    trigger: 'alert_rule',
    triggerConfig: { rule_name: 'Brute Force Detection' },
    category: 'incident',
    steps: [
      { id: 's1', order: 1, name: 'Lock User Account', type: 'action', description: 'Temporarily lock the targeted account', config: { action: 'disable_account' } },
      { id: 's2', order: 2, name: 'Block Source IP', type: 'action', description: 'Add attacker IP to blocklist', config: { action: 'block_ip' } },
      { id: 's3', order: 3, name: 'Notify User & Admin', type: 'notification', description: 'Send security alerts', config: { channels: ['email'] } },
    ],
    lastRun: '2024-01-15T10:00:00Z',
    triggeredCount: 89,
    avgDuration: '2m',
    createdAt: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    name: 'Data Exfiltration Detection',
    description: 'Network analysis for unusual outbound traffic patterns',
    status: 'draft',
    trigger: 'manual',
    category: 'investigation',
    steps: [
      { id: 's1', order: 1, name: 'Analyze Network Flows', type: 'action', description: 'Review outbound traffic logs', config: { action: 'collect_logs' } },
      { id: 's2', order: 2, name: 'Identify Destination', type: 'action', description: 'Trace data destination', config: { action: 'scan_endpoint' } },
    ],
    triggeredCount: 0,
    createdAt: '2024-01-10T00:00:00Z',
  },
]

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>(initialPlaybooks)
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter playbooks
  const filteredPlaybooks = playbooks.filter(pb => {
    if (filterStatus !== 'all' && pb.status !== filterStatus) return false
    if (filterCategory !== 'all' && pb.category !== filterCategory) return false
    if (searchQuery && !pb.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !pb.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Stats
  const stats = {
    total: playbooks.length,
    active: playbooks.filter(p => p.status === 'active').length,
    totalRuns: playbooks.reduce((sum, p) => sum + p.triggeredCount, 0),
    draft: playbooks.filter(p => p.status === 'draft').length,
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this playbook?')) return
    setPlaybooks(playbooks.filter(p => p.id !== id))
    if (selectedPlaybook?.id === id) setSelectedPlaybook(null)
  }

  function handleDuplicate(playbook: Playbook) {
    const newPlaybook: Playbook = {
      ...playbook,
      id: Date.now().toString(),
      name: `${playbook.name} (Copy)`,
      status: 'draft',
      triggeredCount: 0,
      lastRun: undefined,
      createdAt: new Date().toISOString(),
    }
    setPlaybooks([newPlaybook, ...playbooks])
  }

  function handleToggleStatus(id: string) {
    setPlaybooks(playbooks.map(p => {
      if (p.id === id) {
        const newStatus = p.status === 'active' ? 'draft' : 'active'
        return { ...p, status: newStatus }
      }
      return p
    }))
  }

  function handleArchive(id: string) {
    setPlaybooks(playbooks.map(p => p.id === id ? { ...p, status: 'archived' as const } : p))
  }

  function handleRun(playbook: Playbook) {
    // Simulate running a playbook
    const updatedPlaybook = {
      ...playbook,
      lastRun: new Date().toISOString(),
      triggeredCount: playbook.triggeredCount + 1,
    }
    setPlaybooks(playbooks.map(p => p.id === playbook.id ? updatedPlaybook : p))
    setSelectedPlaybook(updatedPlaybook)
  }

  function handleCreate(data: Partial<Playbook>) {
    const newPlaybook: Playbook = {
      id: Date.now().toString(),
      name: data.name || 'New Playbook',
      description: data.description || '',
      status: 'draft',
      trigger: data.trigger || 'manual',
      triggerConfig: data.triggerConfig || {},
      category: data.category || 'incident',
      steps: data.steps || [],
      triggeredCount: 0,
      createdAt: new Date().toISOString(),
    }
    setPlaybooks([newPlaybook, ...playbooks])
    setShowForm(false)
  }

  function handleUpdate(data: Partial<Playbook>) {
    if (!editingPlaybook) return
    setPlaybooks(playbooks.map(p => p.id === editingPlaybook.id ? { ...p, ...data } : p))
    setEditingPlaybook(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Playbooks
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Automated response procedures for security incidents
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPlaybook(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Playbook
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.total}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Playbooks</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <Play className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.active}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Active</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-600/20 rounded-lg">
              <FileText className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.draft}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Drafts</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.totalRuns}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Executions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search playbooks..."
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
        >
          <option value="all">All Categories</option>
          <option value="incident">Incident Response</option>
          <option value="investigation">Investigation</option>
          <option value="remediation">Remediation</option>
          <option value="compliance">Compliance</option>
        </select>
      </div>

      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Playbooks List */}
        <div className="space-y-3">
          {filteredPlaybooks.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--color-text-muted)' }} />
              <p className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>No playbooks found</p>
              <p style={{ color: 'var(--color-text-muted)' }}>Create your first playbook to get started</p>
            </div>
          ) : (
            filteredPlaybooks.map((playbook) => (
              <div
                key={playbook.id}
                onClick={() => setSelectedPlaybook(playbook)}
                className={clsx(
                  'glass-card p-4 cursor-pointer transition-all',
                  selectedPlaybook?.id === playbook.id && 'ring-2 ring-blue-500',
                  playbook.status === 'archived' && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={clsx(
                      'p-2 rounded-lg',
                      playbook.status === 'active' ? 'bg-blue-600/20' : 'bg-slate-600/20'
                    )}>
                      <BookOpen className={clsx(
                        'w-5 h-5',
                        playbook.status === 'active' ? 'text-blue-400' : 'text-slate-400'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {playbook.name}
                        </h3>
                        <StatusBadge status={playbook.status} />
                      </div>
                      <p className="text-sm truncate mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {playbook.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0 ml-2" style={{ color: 'var(--color-text-muted)' }} />
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                    <Zap className="w-4 h-4" />
                    {playbook.steps.length} steps
                  </span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                    <CheckCircle2 className="w-4 h-4" />
                    {playbook.triggeredCount} runs
                  </span>
                  {playbook.lastRun && (
                    <span className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                      <Clock className="w-4 h-4" />
                      {format(new Date(playbook.lastRun), 'Pp', { locale: fr })}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Playbook Detail */}
        {selectedPlaybook ? (
          <PlaybookDetail
            playbook={selectedPlaybook}
            onEdit={() => {
              setEditingPlaybook(selectedPlaybook)
              setShowForm(true)
            }}
            onDelete={() => handleDelete(selectedPlaybook.id)}
            onDuplicate={() => handleDuplicate(selectedPlaybook)}
            onToggle={() => handleToggleStatus(selectedPlaybook.id)}
            onArchive={() => handleArchive(selectedPlaybook.id)}
            onRun={() => handleRun(selectedPlaybook)}
            onClose={() => setSelectedPlaybook(null)}
          />
        ) : (
          <div className="glass-card p-12 flex items-center justify-center">
            <div className="text-center">
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>Select a playbook to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <PlaybookForm
          playbook={editingPlaybook}
          onSubmit={editingPlaybook ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false)
            setEditingPlaybook(null)
          }}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: Playbook['status'] }) {
  const styles = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  }

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}

function CategoryBadge({ category }: { category: Playbook['category'] }) {
  const styles = {
    incident: 'bg-red-500/20 text-red-400',
    investigation: 'bg-blue-500/20 text-blue-400',
    remediation: 'bg-green-500/20 text-green-400',
    compliance: 'bg-purple-500/20 text-purple-400',
  }

  const labels = {
    incident: 'Incident Response',
    investigation: 'Investigation',
    remediation: 'Remediation',
    compliance: 'Compliance',
  }

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[category]}`}>
      {labels[category]}
    </span>
  )
}

interface PlaybookDetailProps {
  playbook: Playbook
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggle: () => void
  onArchive: () => void
  onRun: () => void
  onClose: () => void
}

function PlaybookDetail({ playbook, onEdit, onDelete, onDuplicate, onToggle, onArchive, onRun, onClose }: PlaybookDetailProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  function toggleStep(id: string) {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSteps(newExpanded)
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {playbook.name}
              </h2>
              <StatusBadge status={playbook.status} />
              <CategoryBadge category={playbook.category} />
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{playbook.description}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700/50 rounded lg:hidden">
            <X className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4">
          {playbook.status === 'active' && (
            <button
              onClick={onRun}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Play className="w-4 h-4" />
              Run Now
            </button>
          )}
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm"
            style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onDuplicate}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm"
            style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button
            onClick={onToggle}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
              playbook.status === 'active' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-green-600/20 text-green-400'
            )}
          >
            {playbook.status === 'active' ? (
              <>
                <Pause className="w-4 h-4" />
                Disable
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Activate
              </>
            )}
          </button>
          {playbook.status !== 'archived' && (
            <button
              onClick={onArchive}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm bg-slate-600/20"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Archive className="w-4 h-4" />
              Archive
            </button>
          )}
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm bg-red-600/20 text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Trigger</p>
          <p className="text-sm font-medium capitalize" style={{ color: 'var(--color-text-primary)' }}>
            {playbook.trigger === 'alert_rule' ? `Alert Rule: ${playbook.triggerConfig?.rule_name}` : playbook.trigger}
          </p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Total Runs</p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{playbook.triggeredCount}</p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Last Run</p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {playbook.lastRun ? format(new Date(playbook.lastRun), 'PPp', { locale: fr }) : 'Never'}
          </p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Avg Duration</p>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{playbook.avgDuration || 'N/A'}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="p-4">
        <h3 className="font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Workflow Steps ({playbook.steps.length})
        </h3>
        <div className="space-y-2">
          {playbook.steps.map((step, index) => (
            <div key={step.id}>
              <div
                onClick={() => toggleStep(step.id)}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-700/30"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                {/* Step number */}
                <div className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                  step.status === 'completed' ? 'bg-green-600 text-white' :
                  step.status === 'running' ? 'bg-blue-600 text-white animate-pulse' :
                  step.status === 'failed' ? 'bg-red-600 text-white' :
                  'bg-slate-600 text-slate-300'
                )}>
                  {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                </div>

                {/* Step info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {step.name}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded capitalize" style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-muted)'
                    }}>
                      {step.type}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {step.description}
                  </p>
                </div>

                {/* Status indicator */}
                {step.status && (
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded capitalize',
                    step.status === 'completed' && 'bg-green-600/20 text-green-400',
                    step.status === 'running' && 'bg-blue-600/20 text-blue-400',
                    step.status === 'failed' && 'bg-red-600/20 text-red-400',
                    step.status === 'pending' && 'bg-slate-600/20 text-slate-400',
                    step.status === 'skipped' && 'bg-yellow-600/20 text-yellow-400'
                  )}>
                    {step.status}
                  </span>
                )}

                <ChevronDown className={clsx(
                  'w-4 h-4 transition-transform',
                  expandedSteps.has(step.id) && 'rotate-180'
                )} style={{ color: 'var(--color-text-muted)' }} />
              </div>

              {/* Expanded step details */}
              {expandedSteps.has(step.id) && (
                <div
                  className="ml-10 mt-1 p-3 rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                >
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Configuration:</p>
                  <pre className="text-xs overflow-x-auto" style={{ color: 'var(--color-text-primary)' }}>
                    {JSON.stringify(step.config, null, 2)}
                  </pre>
                </div>
              )}

              {/* Connector line */}
              {index < playbook.steps.length - 1 && (
                <div className="ml-6 h-4 border-l-2 border-dashed" style={{ borderColor: 'var(--color-border)' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface PlaybookFormProps {
  playbook?: Playbook | null
  onSubmit: (data: Partial<Playbook>) => void
  onCancel: () => void
}

function PlaybookForm({ playbook, onSubmit, onCancel }: PlaybookFormProps) {
  const isEditing = !!playbook?.id

  const [name, setName] = useState(playbook?.name || '')
  const [description, setDescription] = useState(playbook?.description || '')
  const [category, setCategory] = useState<Playbook['category']>(playbook?.category || 'incident')
  const [trigger, setTrigger] = useState<Playbook['trigger']>(playbook?.trigger || 'manual')
  const [steps, setSteps] = useState<PlaybookStep[]>(playbook?.steps || [])
  const [showStepForm, setShowStepForm] = useState(false)

  function handleAddStep(step: Omit<PlaybookStep, 'id' | 'order'>) {
    const newStep: PlaybookStep = {
      ...step,
      id: Date.now().toString(),
      order: steps.length + 1,
    }
    setSteps([...steps, newStep])
    setShowStepForm(false)
  }

  function handleRemoveStep(id: string) {
    setSteps(steps.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      description,
      category,
      trigger,
      steps,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between p-4 border-b"
          style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {isEditing ? 'Edit Playbook' : 'New Playbook'}
          </h2>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-slate-700/50">
            <X className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Playbook Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Ransomware Response"
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Describe what this playbook does"
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Playbook['category'])}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="incident">Incident Response</option>
                <option value="investigation">Investigation</option>
                <option value="remediation">Remediation</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Trigger
              </label>
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value as Playbook['trigger'])}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <option value="manual">Manual</option>
                <option value="alert_rule">Alert Rule</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Workflow Steps ({steps.length})
              </label>
              <button
                type="button"
                onClick={() => setShowStepForm(true)}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </button>
            </div>

            {steps.length === 0 ? (
              <div
                className="p-8 text-center rounded-lg border-2 border-dashed"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No steps added yet. Add steps to define the workflow.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-slate-600 text-white"
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {step.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {step.type} - {step.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(step.id)}
                      className="p-1 text-red-400 hover:bg-red-600/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step Form Modal */}
          {showStepForm && (
            <StepForm
              onSubmit={handleAddStep}
              onCancel={() => setShowStepForm(false)}
            />
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isEditing ? 'Update Playbook' : 'Create Playbook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface StepFormProps {
  onSubmit: (step: Omit<PlaybookStep, 'id' | 'order'>) => void
  onCancel: () => void
}

function StepForm({ onSubmit, onCancel }: StepFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<PlaybookStep['type']>('action')
  const [description, setDescription] = useState('')
  const [action, setAction] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name,
      type,
      description,
      config: type === 'action' ? { action } : {},
    })
  }

  return (
    <div
      className="p-4 rounded-lg border"
      style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}
    >
      <h4 className="font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>Add Step</h4>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Step Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Isolate Host"
              className="w-full px-2 py-1.5 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PlaybookStep['type'])}
              className="w-full px-2 py-1.5 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              {STEP_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this step do?"
            className="w-full px-2 py-1.5 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
          />
        </div>

        {type === 'action' && (
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="">Select action...</option>
              {AVAILABLE_ACTIONS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 text-sm rounded"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
