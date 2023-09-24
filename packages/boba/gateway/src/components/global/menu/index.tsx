import React, { FC } from 'react'
import {
  StyleMenuButton,
  StyledLabel,
  StyledMenu,
  StyledMenuItem,
} from './styles'
import { MenuProps } from './types'

const Menu: FC<MenuProps> = ({
  label,
  name,
  children,
  options,
  variant,
  anchorOrigin = {
    vertical: 'bottom',
    horizontal: 'center',
  },
  transformOrigin = {
    vertical: 'top',
    horizontal: 'center',
  },
}) => {
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
      <StyleMenuButton variant={variant} active={open} onClick={handleClick}>
        {label || children}
      </StyleMenuButton>
      <StyledMenu
        anchorEl={anchorEl}
        id={name}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
      >
        {options.map((opt, index) => {
          return (
            <StyledMenuItem key={index} onClick={opt.onClick}>
              {opt.label ? (
                <StyledLabel>{opt.label}</StyledLabel>
              ) : (
                opt.component
              )}
            </StyledMenuItem>
          )
        })}
      </StyledMenu>
    </>
  )
}

export default Menu
