/**
 * Kintone グローバル API 型定義
 * @module kintone/global
 * @note グローバルオブジェクトの型定義のため namespace を使用します
 */

import type { BuildRecord, BuildRecordForSet } from './record';

// ============================================================================
// グローバル型定義
// ============================================================================

declare global {
  // --------------------------------------------------------------------------
  // kintone 名前空間
  // --------------------------------------------------------------------------

  namespace kintone {
    /**
     * ユーザー情報
     */
    interface User {
      id: string;
      code: string;
      name: string;
      email: string;
      url: string;
      employeeNumber: string;
      phone: string;
      mobilePhone: string;
      extensionNumber: string;
      timezone: string;
      isGuest: boolean;
      language: string;
    }

    /**
     * ログインユーザー情報を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/kintone/get-login-user/
     */
    function getLoginUser(): User;

    /**
     * CSRFトークンを取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/api/get-csrf-token/
     */
    function getRequestToken(): string;

    /**
     * UIバージョンを取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/kintone/get-design/
     */
    function getUiVersion(): 1 | 2;
  }

  // --------------------------------------------------------------------------
  // kintone.api 名前空間
  // --------------------------------------------------------------------------

  namespace kintone.api {
    /**
     * API URLを取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/api/get-url/
     */
    function url(path: string, detectGuestSpace?: boolean): string;

    /**
     * クエリパラメータ付きURLを取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/api/get-url-including-query/
     */
    function urlForGet(
      path: string,
      params: Record<string, unknown>,
      detectGuestSpace?: boolean
    ): string;

    /**
     * 同時実行数の制限を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/api/get-concurrency-limit/
     */
    function getConcurrencyLimit(): Promise<{ limit: number; running: number }>;
  }

  // --------------------------------------------------------------------------
  // kintone.proxy 名前空間
  // --------------------------------------------------------------------------

  namespace kintone.proxy {
    /**
     * プロキシアップロード
     * @see https://cybozu.dev/ja/kintone/docs/js-api/proxy/kintone-proxy/
     */
    function upload(
      url: string,
      method: 'POST' | 'PUT',
      headers: Record<string, string>,
      data: { format: 'RAW'; value: Blob }
    ): Promise<[string, number, Record<string, string>]>;

    /**
     * プロキシアップロード
     * @see https://cybozu.dev/ja/kintone/docs/js-api/proxy/kintone-proxy-upload/
     */
    function upload(
      url: string,
      method: 'POST' | 'PUT',
      headers: Record<string, string>,
      data: { format: 'RAW'; value: Blob },
      callback: (body: string, status: number, headers: Record<string, string>) => void,
      errback?: (errorBody: string) => void
    ): void;
  }

  // --------------------------------------------------------------------------
  // kintone.app 名前空間
  // --------------------------------------------------------------------------

  namespace kintone.app {
    /**
     * アプリIDを取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-app/
     */
    function getId(): number | null;

    /**
     * レコード一覧のフィールド要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-record-list-field-elements/
     */
    function getFieldElements(fieldCode: string): HTMLElement[] | null;

    /**
     * レコード一覧のヘッダーメニュー要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-record-list-header-menu-element/
     */
    function getHeaderMenuSpaceElement(): HTMLElement | null;

    /**
     * レコード一覧のヘッダー要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-record-list-header-element/
     */
    function getHeaderSpaceElement(): HTMLElement | null;

    /**
     * クエリ条件を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-record-list-query/
     */
    function getQueryCondition(): string | null;

    /**
     * クエリ文字列を取得（order by, limit, offset含む）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-record-list-query-with-order-by-limit-offset/
     */
    function getQuery(): string | null;

    /**
     * ルックアップ先のアプリIDを取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-lookup-target/
     */
    function getLookupTargetAppId(fieldCode: string): number | null;

    /**
     * 関連レコード一覧先のアプリIDを取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-related-records-target/
     */
    function getRelatedRecordsTargetAppId(fieldCode: string): number | null;
  }

  namespace kintone.mobile.app {
    /**
     * アプリIDを取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-app/
     */
    function getId(): number | null;

    /**
     * フィールド要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-record-list-field-elements/
     */
    function getFieldElements(fieldCode: string): HTMLElement[] | null;

    /**
     * クエリ条件を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-record-list-query/
     */
    function getQueryCondition(): string | null;

    /**
     * クエリ文字列を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-record-list-query-with-order-by-limit-offset/
     */
    function getQuery(): string | null;

    /**
     * ルックアップ先のアプリIDを取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-lookup-target/
     */
    function getLookupTargetAppId(fieldCode: string): number | null;

    /**
     * 関連レコード一覧先のアプリIDを取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-related-records-target/
     */
    function getRelatedRecordsTargetAppId(fieldCode: string): number | null;
  }

  // --------------------------------------------------------------------------
  // kintone.app.record 名前空間
  // --------------------------------------------------------------------------

  namespace kintone.app.record {
    /**
     * レコードIDを取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/get-record-id/
     */
    function getId(): number | null;

    /**
     * レコード詳細を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/get-record/
     */
    function get<AppSchema extends { properties: Record<string, any> } = any>(): {
      record: BuildRecord<AppSchema>;
    } | null;

    /**
     * レコード値を設定
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/set-record-value/
     */
    function set<AppSchema extends { properties: Record<string, any> } = any>(recordObject: {
      record: BuildRecordForSet<AppSchema>;
    }): void;

    /**
     * レコードフィールド要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/get-record-field-element/
     */
    function getFieldElement(fieldCode: string): HTMLElement | null;

    /**
     * レコードヘッダーメニュー要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/get-record-header-menu-element/
     */
    function getHeaderMenuSpaceElement(): HTMLElement | null;

    /**
     * スペース要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/get-space-element/
     */
    function getSpaceElement(id: string): HTMLElement | null;

    /**
     * フィールドの表示/非表示を設定
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/show-or-hide-a-field/
     */
    function setFieldShown(fieldCode: string, isShown: boolean): void;

    /**
     * フィールドグループの開閉を設定
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/open-field-group/
     */
    function setGroupFieldOpen(fieldCode: string, isOpen: boolean): void;
  }

  namespace kintone.mobile.app.record {
    /**
     * レコードIDを取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/get-record-id/
     */
    function getId(): number | null;

    /**
     * レコード詳細を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/get-record/
     */
    function get<AppSchema extends { properties: Record<string, any> } = any>(): {
      record: BuildRecord<AppSchema>;
    } | null;

    /**
     * レコード値を設定
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/set-record-value/
     */
    function set<AppSchema extends { properties: Record<string, any> } = any>(recordObject: {
      record: BuildRecordForSet<AppSchema>;
    }): void;

    /**
     * レコードフィールド要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/get-record-field-element/
     */
    function getFieldElement(fieldCode: string): HTMLElement | null;

    /**
     * レコードヘッダー要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/app/get-mobile-header-element/
     */
    function getHeaderSpaceElement(): HTMLElement | null;

    /**
     * スペース要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/get-space-element/
     */
    function getSpaceElement(id: string): HTMLElement | null;

    /**
     * フィールドの表示/非表示を設定
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/show-or-hide-a-field/
     */
    function setFieldShown(fieldCode: string, isShown: boolean): void;

    /**
     * フィールドグループの開閉を設定
     * @see https://cybozu.dev/ja/kintone/docs/js-api/record/open-field-group/
     */
    function setGroupFieldOpen(fieldCode: string, isOpen: boolean): void;
  }

  // --------------------------------------------------------------------------
  // kintone.portal 名前空間
  // --------------------------------------------------------------------------

  namespace kintone.portal {
    /**
     * ポータルのスペース要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/portal/get-content-portal-element/
     */
    function getContentSpaceElement(): HTMLElement | null;
  }

  namespace kintone.mobile.portal {
    /**
     * モバイルポータルのスペース要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/portal/get-content-portal-element/
     */
    function getContentSpaceElement(): HTMLElement | null;
  }

  // --------------------------------------------------------------------------
  // kintone.space 名前空間
  // --------------------------------------------------------------------------

  namespace kintone.space.portal {
    /**
     * スペースポータルのスペース要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/space/get-content-space-element/
     */
    function getContentSpaceElement(): HTMLElement | null;
  }

  namespace kintone.mobile.space.portal {
    /**
     * モバイルスペースポータルのスペース要素を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/space/get-content-space-element/
     */
    function getContentSpaceElement(): HTMLElement | null;
  }

  // --------------------------------------------------------------------------
  // kintone.plugin.app 名前空間
  // --------------------------------------------------------------------------

  namespace kintone.plugin.app {
    /**
     * プラグイン設定を取得
     * @see https://kintone.dev/en/docs/kintone/js-api/plugin/plug-in-javascript-api/
     */
    function getConfig(pluginId: string): Record<string, string>;

    /**
     * プラグイン設定を保存
     * @see https://kintone.dev/en/docs/kintone/js-api/plugin/plug-in-javascript-api/
     */
    function setConfig(config: Record<string, string>, callback?: () => void): void;

    /**
     * プロキシ設定を取得
     * @see https://cybozu.dev/ja/kintone/docs/js-api/plugins/get-config-for-proxy/
     */
    function getProxyConfig(
      url: string,
      method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    ): {
      headers: Record<string, string>;
      data: Record<string, unknown>;
    };

    /**
     * プロキシ設定を保存
     * @see https://cybozu.dev/ja/kintone/docs/js-api/plugins/set-config-for-proxy/
     */
    function setProxyConfig(
      url: string,
      method: 'GET' | 'POST' | 'PUT' | 'DELETE',
      headers: Record<string, string>,
      data: Record<string, unknown>,
      callback?: () => void
    ): void;

    /**
     * プラグインプロキシ（GET/DELETE, Promise版）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/
     */
    function proxy(
      pluginId: string,
      url: string,
      method: 'GET' | 'DELETE',
      headers: Record<string, string>,
      data: Record<string, never> | ''
    ): Promise<[string, number, Record<string, string>]>;

    /**
     * プラグインプロキシ（POST/PUT, Promise版）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/
     */
    function proxy(
      pluginId: string,
      url: string,
      method: 'POST' | 'PUT',
      headers: Record<string, string>,
      data: Record<string, unknown> | string
    ): Promise<[string, number, Record<string, string>]>;

    /**
     * プラグインプロキシ（GET/DELETE, コールバック版）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/
     */
    function proxy(
      pluginId: string,
      url: string,
      method: 'GET' | 'DELETE',
      headers: Record<string, string>,
      data: Record<string, never> | '',
      callback: (body: string, status: number, headers: Record<string, string>) => void,
      errback?: (errorBody: string) => void
    ): void;

    /**
     * プラグインプロキシ（POST/PUT, コールバック版）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy/
     */
    function proxy(
      pluginId: string,
      url: string,
      method: 'POST' | 'PUT',
      headers: Record<string, string>,
      data: Record<string, unknown> | string,
      callback: (body: string, status: number, headers: Record<string, string>) => void,
      errback?: (errorBody: string) => void
    ): void;
  }

  namespace kintone.plugin.app.proxy {
    /**
     * プラグインプロキシアップロード（Promise版）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy-upload/
     */
    function upload(
      pluginId: string,
      url: string,
      method: 'POST' | 'PUT',
      headers: Record<string, string>,
      data: { format: 'RAW'; value: Blob }
    ): Promise<[string, number, Record<string, string>]>;

    /**
     * プラグインプロキシアップロード（コールバック版）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/plugins/kintone-plug-in-proxy-upload/
     */
    function upload(
      pluginId: string,
      url: string,
      method: 'POST' | 'PUT',
      headers: Record<string, string>,
      data: { format: 'RAW'; value: Blob },
      successCallback: (body: string, status: number, headers: Record<string, string>) => void,
      failureCallback?: (errorBody: string) => void
    ): void;
  }

  // --------------------------------------------------------------------------
  // kintone.events 名前空間
  // --------------------------------------------------------------------------

  namespace kintone.events {
    /**
     * イベントハンドラーを登録
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/
     */
    function on<T extends keyof kintone.events.EventMap>(
      type: T | T[],
      handler: (
        event: kintone.events.EventMap[T]
      ) => kintone.events.EventMap[T] | Promise<kintone.events.EventMap[T]>
    ): void;

    /**
     * イベントハンドラーを登録（フィールド変更イベント用）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/
     */
    function on(type: string | string[], handler: (event: any) => any | Promise<any>): void;

    /**
     * イベントハンドラーを解除
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/
     */
    function off<T extends keyof kintone.events.EventMap>(
      type: T | T[],
      handler: (
        event: kintone.events.EventMap[T]
      ) => kintone.events.EventMap[T] | Promise<kintone.events.EventMap[T]>
    ): void;

    /**
     * イベントハンドラーを解除（フィールド変更イベント用）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/
     */
    function off(type: string | string[], handler: (event: any) => any | Promise<any>): void;
  }
}
