import React, { FC, useRef } from 'react'
import DateRangePicker from 'react-bootstrap-daterangepicker'
import { DateInput } from './styles'

interface Props {}

const DatePicker: FC<Props> = (props) => {
  const keyRef = useRef<any>()
  const ref = useRef<any>()

  const onDateChange = (e: any, d: any) => {
    console.log(['interval', d])
  }

  return (
    <DateRangePicker>
      <DateInput>08/10/2023 To 11/10/2023</DateInput>
    </DateRangePicker>
  )
}

export default DatePicker
