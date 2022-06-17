import { styled } from '@mui/material/styles'
import { Box, TextField } from '@mui/material'

export const Wrapper = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${(props) => props.newstyle ? props.theme.palette.background.input : 'transparent' };
  border-radius: 4px;
  padding: ${(props) => props.newstyle ? '10px 20px' : '0' };
  border: ${(props) => props.newstyle ? '1px solid rgba(255, 255, 255, 0.06)' : 'none' };
`;

export const TextFieldTag = styled(TextField)(({ ...props }) => ({
  "input::-webkit-outer-spin-button, input::-webkit-inner-spin-button": {
    "WebkitAppearance": "none",
    "margin": 0,
  },
  "input[type=number]": {
    "MozAppearance": "textfield"
  },
  '& .MuiInputBase-input': {
    fontSize: '0.9em',
  },
  '&:hover': {
    borderRadius: 4,
    backgroundColor: props.theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255,255,255,0.05)',
  }
}));

export const UnitContent = styled(Box)`
  display: flex;
  justify-content: flex-start;
  border-right: ${(props) => props.theme.palette.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(255,255,255,0.2)'};
  margin-right: 30px;
  flex: 2;
  div {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

export const InputWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 6,
  [theme.breakpoints.down('md')]: {
    flex: 4,
  },
}));

export const InputWrapperFull = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
}))

export const ActionsWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 3;
  margin-left: 10px;
`;
