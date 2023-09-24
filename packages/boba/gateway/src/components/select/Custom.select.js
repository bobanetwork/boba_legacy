import React from 'react'

import { components } from 'react-select';
import { IconContainer, ValueContainer } from './styles';
import { Typography } from 'components/global';

export const Option = (props) => {

  const {
    icon,
    title,
    label,
    subTitle
  } = props.data;

  return <>
    <components.Option {...props}>
      <ValueContainer active={props.isSelected}>
        {icon && <IconContainer>
          <img src={icon} alt={title} width="100%"/>
        </IconContainer>}
        {label && <Typography variant="body3">{label}</Typography>}
        {title && <Typography variant="body3" >{title}</Typography>}
        {subTitle && <Typography variant="body3" >{subTitle}</Typography>}
      </ValueContainer>
    </components.Option>
  </>
}


export const MultiValue = (props) => {

  return <>
    <components.MultiValue {...props}>
      <Typography variant="body2">{props.data.label}</Typography>
    </components.MultiValue>
  </>
}
export const SingleValue = (props) => {
  const { icon, title, label, subTitle } = props.data;
  return <>
    <components.SingleValue  {...props}>
      <ValueContainer>
        {icon && <IconContainer>
          <img src={icon} alt={title} width="100%"/>
        </IconContainer>}
        {label && <Typography variant="body1">{label}</Typography>}
        {title && <Typography variant="body2" >{title}</Typography>}
      </ValueContainer>
    </components.SingleValue>
  </>
}
