import AllNetworksIcon from '../../images/allNetworks.svg'
import { IDropdownItem } from 'components/global/dropdown'
import { IFilterDropdownItem } from 'components/filter'
import { TableHeaderOptionType } from 'components/global/table'

export const ALL_NETWORKS: IDropdownItem = {
  value: 'All',
  label: 'All Networks',
  imgSrc: AllNetworksIcon,
}
export const FILTER_OPTIONS: IFilterDropdownItem[] = [
  { value: 'All', label: 'All Status' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Canceled', label: 'Canceled' },
]

export const TableOptions: TableHeaderOptionType[] = [
  {
    name: 'Date',
    width: 168,
    tooltip: '',
  },
  {
    name: 'From',
    width: 142,
    tooltip: '',
  },
  {
    name: 'To',
    width: 142,
    tooltip: '',
  },
  {
    name: 'Token',
    width: 90,
    tooltip: '',
  },
  { name: 'Amount', width: 80, tooltip: '' },
  { name: 'Status', width: 88, tooltip: '' },
]
