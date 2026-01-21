// kintoneプラグインID
export const PLUGIN_ID = kintone.$PLUGIN_ID;

// ゲストスペースID
export const GUEST_SPACE_ID = (() => {
  const match = location.pathname.match(/^\/k\/guest\/(\d+)\//);
  return match ? match[1] : undefined;
})();

// kintone オブジェクト
export const getApp = () => {
  const app = kintone.app.getId() !== null ? kintone.app : kintone.mobile.app;
  return app;
};
