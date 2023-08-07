import React, { FC, useRef, useState, useEffect, useCallback } from 'react'
import { subMonths } from 'date-fns'
import {
  DatePickerDropdown,
  DatePickerHeader,
  DatePickerContainer,
} from './styles'
import { formatDate } from 'util/dates'
import { DayPicker, DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

interface DatePickerProps {
  selected: Date
  timeFormat?: string
  onChange: Function
  range?: boolean
  onChangeFrom?: Function
  onChangeTo?: Function
}

const DatePicker = (props: DatePickerProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownRef])

  const [selectedDate, setSelectedDate] = useState<Date>(props.selected)
  const [isOpen, setIsOpen] = useState(false)
  const today = new Date()
  const defaultSelectedRange: DateRange = {
    from: subMonths(today, 6),
    to: today,
  }
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    defaultSelectedRange
  )

  const handleClick = useCallback(() => {
    setIsOpen(!isOpen)
  }, [isOpen])

  const handleDateChange = (date: Date | undefined) => {
    if (date && selectedDate !== date) {
      setSelectedDate(date)
      props.onChange(date)
    }
    handleClick()
  }
  const handleRangeChange = (range: DateRange | undefined) => {
    if (range && range !== selectedRange) {
      setSelectedRange(range)
      props.onChangeFrom && props.onChangeFrom(range.from)
      props.onChangeTo && props.onChangeTo(range.to)
    }
  }

  if (props.range) {
    const dateRangeString = `${
      selectedRange?.from
        ? formatDate(selectedRange?.from?.getTime() / 1000, props.timeFormat)
        : 'From'
    } - ${
      selectedRange?.to
        ? formatDate(selectedRange?.to?.getTime() / 1000, props.timeFormat)
        : 'To'
    }`

    return (
      <DatePickerContainer ref={dropdownRef}>
        <DatePickerHeader onClick={handleClick}>
          {dateRangeString}
        </DatePickerHeader>
        <DatePickerDropdown>
          {isOpen && (
            <DayPicker
              id="test"
              mode="range"
              defaultMonth={selectedRange?.from}
              selected={selectedRange}
              // footer={footer}
              onSelect={(range) => handleRangeChange(range)}
            />
          )}
        </DatePickerDropdown>
      </DatePickerContainer>
    )
  }

  return (
    <DatePickerContainer ref={dropdownRef}>
      <DatePickerHeader onClick={handleClick}>
        {formatDate(selectedDate.getTime() / 1000, props.timeFormat)}
      </DatePickerHeader>
      {isOpen && (
        <DatePickerDropdown>
          <DayPicker
            mode="single"
            defaultMonth={selectedDate}
            selected={selectedDate}
            onSelect={(date) => handleDateChange(date)}
          />
        </DatePickerDropdown>
      )}
    </DatePickerContainer>
  )
}

export default DatePicker
