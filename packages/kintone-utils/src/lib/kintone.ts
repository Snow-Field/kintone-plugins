// kintoneプラグインID
export const PLUGIN_ID = kintone.$PLUGIN_ID;

// ゲストスペースID
export const GUEST_SPACE_ID = (() => {
  const match = location.pathname.match(/^\/k\/guest\/(\d+)\//);
  return match ? match[1] : undefined;
})();

// kintoneアプリID
export const getAppId = () => {
  const appId = kintone.app.getId() ?? kintone.mobile.app.getId();
  if (!appId) throw new Error('アプリIDの取得に失敗しました');
  return appId;
};
