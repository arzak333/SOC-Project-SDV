import { createContext, useContext, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'

export type JwtRole = 'admin' | 'analyst' | 'supervisor'

interface RoleContextType {
  effectiveRole: JwtRole
  setEffectiveRole: (role: JwtRole) => void
  canAssign: boolean
  canManageRules: boolean
  canManagePlaybooks: boolean
  canExport: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const baseRole: JwtRole = (user?.role as JwtRole) ?? 'analyst'

  // Admins can switch effective role for demos; others are locked to their JWT role
  const [effectiveRole, setEffectiveRoleState] = useState<JwtRole>(baseRole)

  function setEffectiveRole(role: JwtRole) {
    if (baseRole === 'admin') {
      setEffectiveRoleState(role)
    }
  }

  const canAssign         = effectiveRole === 'admin' || effectiveRole === 'supervisor'
  const canManageRules    = effectiveRole === 'admin' || effectiveRole === 'supervisor'
  const canManagePlaybooks = effectiveRole === 'admin' || effectiveRole === 'supervisor'
  const canExport         = effectiveRole === 'admin' || effectiveRole === 'supervisor'

  return (
    <RoleContext.Provider value={{
      effectiveRole,
      setEffectiveRole,
      canAssign,
      canManageRules,
      canManagePlaybooks,
      canExport,
    }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}
