// kintoneプラグインID
export const PLUGIN_ID = kintone.$PLUGIN_ID;

// ゲストスペースID
export const GUEST_SPACE_ID = (() => {
  const match = location.pathname.match(/^\/k\/guest\/(\d+)\//);
  return match ? match[1] : undefined;
})();

/** モバイル判定 */
export const isMobile = (eventType?: string): boolean => {
  return eventType ? /^mobile\./.test(eventType) : kintone.app.getId() === null;
};

/** kintoneオブジェクト取得 */
export const getApp = (eventType?: string): typeof kintone.mobile.app | typeof kintone.app => {
  return isMobile(eventType) ? kintone.mobile.app : kintone.app;
};
