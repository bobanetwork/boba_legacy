import React, { FC, memo } from 'react'
import ReactSelect, { ActionMeta } from 'react-select'

type Option = unknown

interface OptionProps {
  label: string
  value?: string
  onAction?: string
}

interface SelectProps {
  options?: Array<OptionProps>
  label?: string
  showIcon?: boolean
  variant?: 'primary' | 'secondary'
}

const options = [
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'vanilla', label: 'Vanilla' },
]

const Select: FC<SelectProps> = ({ label }) => {
  const onChange = (option: Option | null, actionMeta: ActionMeta<Option>) => {
    console.log(['selected', option, actionMeta])
  }

  return (
    <>
      <ReactSelect options={options} onChange={onChange} />
    </>
  )
}

export default memo(Select)
