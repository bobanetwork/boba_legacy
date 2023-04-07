import React from 'react';
import styled from 'styled-components';

const Row = styled.div`
    display: flex;
    flex-direction: row; 
    justify-content: flex-start; 
    align-items: center; 
    width: 100%;
`;

const Column = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
`;

//color: 'rgba(255, 255, 255, 0.3)' }}
export const ROW = ({ children , style, className}) => {
    return <Row className={className} style={style}>{children}</Row>
}

export const COLUMN = ({ children, style, className}) => {
    return <Column className={className} style={style}>{children}</Column>
}

