import React, { FC, ReactNode, createElement } from 'react'
import MUIMenu from '@mui/material/Menu'
import MUIMenuItem from '@mui/material/MenuItem'
import { StyleMenuButton } from './styles'
import { MenuProps } from './types'

const Menu: FC<MenuProps> = ({ label, name, children, options }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <StyleMenuButton onClick={handleClick}>
        {label || children}
      </StyleMenuButton>
      <MUIMenu
        anchorEl={anchorEl}
        id={name}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {options.map((opt, index) => {
          return (
            <MUIMenuItem
              sx={{
                margin: '5px',
                borderRadius: '10px',
              }}
              key={index}
              onClick={opt.onClick}
            >
              {opt.component}
            </MUIMenuItem>
          )
        })}
      </MUIMenu>
    </>
  )
}

export default Menu
