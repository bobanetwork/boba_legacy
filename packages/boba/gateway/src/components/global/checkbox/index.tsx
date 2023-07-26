import React, { useState, useEffect } from 'react'
import { CheckboxWithLabelProps } from './types'
import { Typography } from 'components/global/typography'
import { Label, Checkbox, CheckContainer } from './styles'
import { Svg } from 'components/global/svg'

import CheckedIcon from 'images/icons/check.svg'

export const CheckboxWithLabel: React.FC<CheckboxWithLabelProps> = ({
  label,
  checked = false,
  onChange,
}) => {
  const [isChecked, setIsChecked] = useState(checked)

  const handleChange = () => {
    const newCheckedState = !isChecked
    setIsChecked(newCheckedState)
    onChange(newCheckedState)
  }

  useEffect(() => {
    setIsChecked(checked)
  }, [])

  return (
    <div>
      <Label>
        <CheckContainer checked={isChecked}>
          <Checkbox
            type="checkbox"
            checked={isChecked}
            onChange={handleChange}
          />
          <Svg src={CheckedIcon} />
        </CheckContainer>
        {label && <Typography variant="body1">{label}</Typography>}
      </Label>
    </div>
  )
}
