import React from 'react'
import styled, { useTheme } from 'styled-components'

export default {
  title: 'Theme/Color Palette',
}

const ColorBox = styled.div`
  display: flex;
  border-radius: 8px;
  width: 100px;
  height: 100px;
`

const Title = styled.p`
  font-size: ${(props) => props.theme.titles.heading1};
  color: ${(props) => props.theme.defaultColorText};
  font-weight: bold;
  text-transform: capitalize;
`

const Item = styled.p`
  font-size: ${(props) => props.theme.text.body2};
  color: ${(props) => props.theme.defaultColorText};
`

const SubTitle = styled.p`
  font-size: ${(props) => props.theme.text.body1};
  font-weight: bold;
  color: ${(props) => props.theme.defaultColorText};
`
const ColorContainer = styled.div`
  padding: 25px 0px;
`

export const Palette = () => {
  const theme = useTheme() as any
  const colors = theme.colors
  return (
    <ColorContainer>
      {Object.keys(colors).map((currentColor) => {
        return (
          <>
            <Title>{currentColor}s</Title>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {Object.entries(colors[currentColor]).map(([name, color]) => (
                <div key={name} style={{ margin: '10px' }}>
                  <ColorBox style={{ backgroundColor: color as string }} />
                  <SubTitle>{name}</SubTitle>
                  <Item>{color}</Item>
                </div>
              ))}
            </div>
          </>
        )
      })}
    </ColorContainer>
  )
}
