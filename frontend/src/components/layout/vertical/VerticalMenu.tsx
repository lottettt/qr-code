'use client'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, MenuItem, MenuSection } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useAuth } from '@/contexts/AuthContext'
import { can } from '@/lib/permissions'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ scrollMenu }: { scrollMenu: (container: any, isPerfectScrollbar: boolean) => void }) => {
  const theme = useTheme()
  const { isBreakpointReached, transitionDuration } = useVerticalNav()
  const { user } = useAuth()

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      <Menu
        menuItemStyles={menuItemStyles(theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-line' /> }}
        menuSectionStyles={menuSectionStyles(theme)}
      >
        <MenuSection label='QR Center'>
          <MenuItem href='/' icon={<i className='ri-qr-code-line' />}>
            Find QR Code
          </MenuItem>
          {can(user, 'qr.print') && (
            <MenuItem href='/reprint' icon={<i className='ri-printer-line' />}>
              Reprint
            </MenuItem>
          )}
        </MenuSection>

        {(can(user, 'admin.qrItems') ||
          can(user, 'admin.systems') ||
          can(user, 'admin.qrTypes') ||
          can(user, 'admin.audit') ||
          can(user, 'admin.users')) && (
          <MenuSection label='Administration'>
            {can(user, 'admin.qrItems') && (
              <MenuItem href='/admin/qr-items/new' icon={<i className='ri-add-box-line' />}>
                Register QR Code
              </MenuItem>
            )}
            {can(user, 'admin.qrItems') && (
              <MenuItem href='/admin/qr-items/batch' icon={<i className='ri-file-excel-2-line' />}>
                Batch Import
              </MenuItem>
            )}
            {can(user, 'admin.systems') && (
              <MenuItem href='/admin/systems' icon={<i className='ri-apps-2-line' />}>
                Systems
              </MenuItem>
            )}
            {can(user, 'admin.qrTypes') && (
              <MenuItem href='/admin/qr-types' icon={<i className='ri-price-tag-3-line' />}>
                QR Types
              </MenuItem>
            )}
            {can(user, 'admin.qrItems') && (
              <MenuItem href='/admin/qr-items' icon={<i className='ri-list-check-2' />}>
                QR Items
              </MenuItem>
            )}
            {can(user, 'admin.audit') && (
              <MenuItem href='/admin/audit-log' icon={<i className='ri-history-line' />}>
                Audit Log
              </MenuItem>
            )}
            {can(user, 'admin.users') && (
              <MenuItem href='/admin/users' icon={<i className='ri-user-settings-line' />}>
                Users
              </MenuItem>
            )}
          </MenuSection>
        )}
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
