import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const TxBuilderWrapper = styled(Box)(({ theme }) => ({
  background: theme.palette.background.secondary,
  backdropFilter: 'blur(100px)',
  borderRadius: theme.palette.primary.borderRadius,
  border: theme.palette.primary.border,
  flex: 1,
  minHeight: 'fit-content',
  padding: '20px',
  width: '100%',
}))

export const Wrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  marginTop: 20,
  marginBottom: 20,
  width: '100%',
}))

export const ButtonWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
}))

export const MethodsWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: 20,
  width: '100%',
}))

export const InputWrapper = styled(Box)(({ theme }) => ({
  marginTop: 20,
  marginBottom: 20,
  padding: 20,
  borderRadius: theme.palette.primary.borderRadius,
  border: theme.palette.primary.border,
  backgroundColor: theme.palette.background.input,
}))

export const TxResultWrapper = styled(Box)(({ theme }) => ({
  marginTop: 20,
  marginBottom: 10,
}))

export const TxSuccessWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
}))
