import React from 'react'
import { ProgressBar, Line, Circle, Label, LabelContainer } from './style'
import { LinearProgressProps } from './types'

export const LinearProgress: React.FC<LinearProgressProps> = ({ A, B, C }) => {
  const totalWidth = A + B + C
  const forWidth = `${(A / totalWidth) * 100}%`
  const againstWidth = `${(B / totalWidth) * 100}%`
  const abstainWidth = `${(C / totalWidth) * 100}%`

  return (
    <>
      <ProgressBar className="progress-bar">
        <Line className="for" style={{ width: forWidth }} />
        <Line className="against" style={{ width: againstWidth }} />
        <Line className="abstain" style={{ width: abstainWidth }} />
      </ProgressBar>
      <LabelContainer>
        <Label>
          <Circle className="for" /> For: {A}
        </Label>
        <Label>
          <Circle className="against" /> Against: {B}{' '}
        </Label>
        <Label>
          <Circle className="abstain" /> Abstain: {C}
        </Label>
      </LabelContainer>
    </>
  )
}
