import { BookOpen, Plus, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface Playbook {
    id: string
    name: string
    description: string
    status: 'active' | 'draft' | 'archived'
    lastRun?: string
    triggeredCount: number
}

const mockPlaybooks: Playbook[] = [
    {
        id: '1',
        name: 'Ransomware Response',
        description: 'Immediate containment and investigation steps for ransomware detection',
        status: 'active',
        lastRun: '2h ago',
        triggeredCount: 12,
    },
    {
        id: '2',
        name: 'Phishing Investigation',
        description: 'Email analysis and user notification workflow',
        status: 'active',
        lastRun: '1d ago',
        triggeredCount: 45,
    },
    {
        id: '3',
        name: 'Brute Force Response',
        description: 'Account lockout and IP blocking for failed login attempts',
        status: 'active',
        lastRun: '5h ago',
        triggeredCount: 89,
    },
    {
        id: '4',
        name: 'Data Exfiltration Detection',
        description: 'Network analysis for unusual outbound traffic patterns',
        status: 'draft',
        triggeredCount: 0,
    },
]

export default function Playbooks() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Playbooks</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Automated response procedures for security incidents
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    New Playbook
                </button>
            </div>

            {/* Playbooks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockPlaybooks.map((playbook) => (
                    <div
                        key={playbook.id}
                        className="glass-card p-5 hover:border-blue-500/50 transition-colors cursor-pointer"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/20 rounded-lg">
                                    <BookOpen className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-100">{playbook.name}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{playbook.description}</p>
                                </div>
                            </div>
                            <StatusBadge status={playbook.status} />
                        </div>

                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-700">
                            {playbook.lastRun && (
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Clock className="w-4 h-4" />
                                    Last run: {playbook.lastRun}
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <CheckCircle2 className="w-4 h-4" />
                                Triggered: {playbook.triggeredCount}x
                            </div>
                        </div>
                    </div>
                ))}
            </div>
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
        <span
            className={`px-2 py-1 text-xs font-medium rounded border capitalize ${styles[status]}`}
        >
            {status}
        </span>
    )
}
