import { atom } from 'jotai';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';
import { getApp, GUEST_SPACE_ID } from '../lib/kintone';

type ClientParams = {
  baseUrl: string;
  guestSpaceId?: string;
};

/**
 * アプリのフィールド情報を格納するAtom
 */
export const appFieldsAtom = atom(async () => {
  // KintoneRestAPIClientの生成
  const clientParams: ClientParams = { baseUrl: location.origin };
  if (GUEST_SPACE_ID) clientParams.guestSpaceId = GUEST_SPACE_ID;
  const client = new KintoneRestAPIClient(clientParams);

  // アプリIDの取得
  const appId = getApp().getId();
  if (!appId) {
    throw new Error('アプリIDが取得できませんでした。');
  }

  // アプリのフィールド情報を取得
  const { properties } = await client.app.getFormFields({ app: appId });

  // フィールド情報をソート
  return Object.values(properties).sort((a, b) => a.label.localeCompare(b.label, 'ja'));
});
