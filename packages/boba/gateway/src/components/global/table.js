import React from 'react';
import { styled } from '@mui/material/styles'
import { useTheme } from '@emotion/react';

//import styled from 'styled-components'
import {ROW} from 'components/global/containers';
import {TEXT} from 'components/global/text';
import Tooltip from 'components/tooltip/Tooltip';
import { HelpOutline } from '@mui/icons-material'
import { useMediaQuery } from '@mui/material'


  export const TableHeaderContainer = styled(ROW)(({ theme }) => ({
    padding: "20px",
    borderTopLeftRadius: "6px",
    borderTopRightRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent:'flex-end',
    background: theme.palette.background.secondary,
    [theme.breakpoints.down('md')]: {
      marginBottom: "5px",
    },

  }))

  const TABLEROW = styled(ROW)`
    &:not(:first-of-type) {
        justify-content: flex-end;
    }
`;

//color: 'rgba(255, 255, 255, 0.3)' }}
export const TABLEHEADER = ({ options }) => {
    return (
        <TableHeaderContainer>           
            {
                options?.map((option) => {
                    return (
                        <TABLEROW key={option.name}>
                            <TEXT>{option.name}</TEXT>
                            {option.tooltip &&
                                <Tooltip title={option.tooltip}>
                                    <HelpOutline fontSize="small" sx={{ opacity: 0.65 }} />
                                </Tooltip>
                            }
                        </TABLEROW>
                    )
                })
            }
        </TableHeaderContainer>
    )
}



export const TABLECONTENT = ({ options , mobileOptions}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const currentOptions = isMobile ? mobileOptions.map(i => options[i]) : options;
    return(
        <ROW>           
            {
                currentOptions?.map((option,index) => {
                    return (
                        <TABLEROW key={index}>
                        {option.content}
                        </TABLEROW>
                    )
                })
            }
        </ROW>
    )
}


