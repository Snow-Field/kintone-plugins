import { type FC } from 'react';
import { type SxProps, type Theme, Box, keyframes, Typography } from '@mui/material';

type Props = {
  label?: string;
  sx?: SxProps<Theme>;
};

const wave = keyframes`
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1); }
`;

export const WaveAnimation: FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 60 }}>
    {[0, 0.1, 0.2, 0.3].map((delay) => (
      <Box
        key={delay}
        sx={{
          width: 5,
          height: 40,
          background: 'linear-gradient(45deg, #3498db, #1abc9c)',
          margin: '0 5px',
          borderRadius: '2px',
          animation: `${wave} 1.2s infinite ease-in-out`,
          animationDelay: `${delay}s`,
        }}
      />
    ))}
  </Box>
);

export const WaveLoader: FC<Props> = ({ label = '読み込み中...', sx }) => (
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
    <WaveAnimation />
    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
      {label}
    </Typography>
  </Box>
);
