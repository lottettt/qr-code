// Type Imports
import type { ChildrenType } from '@core/types'

// Layout Imports
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'

// Component Imports
import Providers from '@components/Providers'
import Navigation from '@components/layout/vertical/Navigation'
import Navbar from '@components/layout/vertical/Navbar'
import DashboardClientLayout from '@components/layout/DashboardClientLayout'

const Layout = async ({ children }: ChildrenType) => {
  const direction = 'ltr'

  return (
    <Providers direction={direction}>
      <LayoutWrapper
        verticalLayout={
          <VerticalLayout navigation={<Navigation />} navbar={<Navbar />}>
            <DashboardClientLayout>{children}</DashboardClientLayout>
          </VerticalLayout>
        }
      />
    </Providers>
  )
}

export default Layout
