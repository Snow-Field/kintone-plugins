import { type FC } from 'react';
import { type SxProps, type Theme, Box, keyframes, Typography } from '@mui/material';

type Props = {
  label?: string;
  sx?: SxProps<Theme>;
};

const morph = keyframes`
  0%, 100% {
    border-radius: 20%;
    transform: rotate(0deg) scale(1);
  }
  25% {
    border-radius: 50%;
    transform: rotate(90deg) scale(0.9);
  }
  50% {
    border-radius: 5%;
    transform: rotate(180deg) scale(1.1);
  }
  75% {
    border-radius: 50%;
    transform: rotate(270deg) scale(0.9);
  }
`;

export const GeometricMorph: FC = () => (
  <Box
    sx={{
      width: 80,
      height: 80,
      background: 'linear-gradient(135deg, #feca57, #ff6b6b)',
      position: 'relative',
      animation: `${morph} 3s ease-in-out infinite`,
    }}
  />
);

export const GeometryLoader: FC<Props> = ({ label = '読み込み中...', sx }) => (
  <Box
    sx={{
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
      ...sx,
    }}
  >
    <GeometricMorph />
    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
      {label}
    </Typography>
  </Box>
);
