import { atom } from 'jotai';
import { restoreConfig, type PluginConfig } from '@/shared/config';

// ローディングの状態を保持するatom
export const loadingAtom = atom(false);

// アクティブなタブのインデックスを保持するatom
export const activeTabIndexAtom = atom(0);

// プラグイン設定情報を管理するAtom
export const pluginConfigAtom = atom<PluginConfig>(restoreConfig());
