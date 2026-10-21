'use client'

import AuthGuard from '@/components/AuthGuard'

export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
