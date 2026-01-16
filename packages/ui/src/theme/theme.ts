import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#3498db', // kintone公式に近いブルー
      light: '#e3f2fd', // 明るいブルー（ホバーや背景用）
      dark: '#2980b9', // 深みのあるブルー
    },
    secondary: {
      main: '#f39c12', // アクセント（kintoneの補助色に近いオレンジ）
      light: '#fdf2e9',
    },
    success: {
      main: '#10b981', // モダンな成功色（保存完了等）
    },
    background: {
      default: '#f4f4f4',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#757575',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontSize: 14,
  },
});
