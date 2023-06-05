import React, { ReactNode } from 'react'
import styled from 'styled-components'

type VariantType = 'info' | 'success' | 'danger' | 'warning'

const Badge = styled.span<{ variant: VariantType }>(({ theme, variant }) => ({
  display: 'inline-block',
  color: `${theme.colors[variant]}`,
  borderRadius: '100%',
  margin: '0 10px',
  border: `1px solid ${theme.colors[variant]}`,
}))

const Circle = styled.span<{ variant: VariantType }>(({ theme, variant }) => ({
  margin: 5,
  display: 'block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: `${theme.colors[variant]}`,
  boxShadow: `0 0 0 ${theme.colors[variant]}`,
  animation: `pulsing 1500ms ease-in-out infinite`,
  '@keyframes pulsing': {
    '0%': {
      boxShadow: `0 0 0 0 ${theme.colors[variant]}`,
    },
    '70%': {
      boxShadow: `0 0 0 4px ${theme.colors[variant]}`,
    },
    '100%': {
      boxShadow: `0 0 0 0 ${theme.colors[variant]}`,
    },
  },
}))

const PulseContainer = styled.span`
  display: flex;
  justify-content: center;
  align-items: center;
`

interface PulseBadgeProps {
  children: ReactNode
  variant: VariantType
}

export const PulseBadge: React.FC<PulseBadgeProps> = ({
  children,
  variant = 'info',
}) => {
  return (
    <PulseContainer>
      <Badge variant={variant}>
        <Circle variant={variant} />
      </Badge>
      {children}
    </PulseContainer>
  )
}

export default PulseBadge
