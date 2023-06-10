import React, { useState, useEffect } from 'react'
import { Switch, Input, Slider } from './styles'

export interface SwitchButtonProps {
  isDisable?: boolean
  isActive?: boolean
  onStateChange?: (isChecked: boolean) => void
}

export const SwitchButton: React.FC<SwitchButtonProps> = ({
  isDisable = false,
  isActive = false,
  onStateChange,
}) => {
  const [isChecked, setIsChecked] = useState(isActive)

  useEffect(() => {
    setIsChecked(isActive)
  }, [isActive])

  useEffect(() => {
    if (onStateChange) {
      onStateChange(isChecked)
    }
  }, [isChecked, onStateChange])

  const handleSwitchChange = () => {
    if (!isDisable) {
      setIsChecked(!isChecked)
    }
  }

  return (
    <Switch>
      <Input
        type="checkbox"
        checked={isChecked}
        onChange={handleSwitchChange}
        disabled={isDisable}
      />
      <Slider as="span" />
    </Switch>
  )
}
