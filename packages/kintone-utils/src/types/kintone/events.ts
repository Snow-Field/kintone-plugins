/**
 * Kintone イベント型定義（詳細版）
 * @module kintone/events
 * @note グローバルオブジェクトの型定義のため namespace を使用します
 */

import type {
  BuildRecord,
  BuildRecordOnCreatePage,
  ChangedField,
  ChangedSubtable,
  ChangedRow,
} from './record';

declare global {
  namespace kintone.events {
    // ========================================================================
    // レコード一覧イベント
    // ========================================================================

    /**
     * レコード一覧表示イベント（リスト表示）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/idx/index-show-event/
     */
    interface AppRecordIndexShowEventForListView<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.index.show';
      appId: number;
      viewId: number;
      viewName: string;
      viewType: 'list';
      records: Array<BuildRecord<AppSchema>>;
      date: null;
      offset: number;
      size: number;
    }

    /**
     * レコード一覧表示イベント（カレンダー表示）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/idx/index-show-event/
     */
    interface AppRecordIndexShowEventForCalendarView<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.index.show';
      appId: number;
      viewId: number;
      viewName: string;
      viewType: 'calendar';
      records: {
        [date in `${number}-${string}-${string}`]: Array<BuildRecord<AppSchema>>;
      };
      date: `${number}-${string}`;
      offset: null;
      size: null;
    }

    /**
     * レコード一覧表示イベント（カスタマイズ表示）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/idx/index-show-event/
     */
    interface AppRecordIndexShowEventForCustomView<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.index.show';
      appId: number;
      viewId: number;
      viewName: string;
      viewType: 'custom';
      records: Array<BuildRecord<AppSchema>>;
      date: null;
      offset: number;
      size: number;
    }

    /**
     * レコード一覧表示イベント（全タイプ）
     */
    type AppRecordIndexShowEvent<AppSchema extends { properties: Record<string, any> } = any> =
      | AppRecordIndexShowEventForListView<AppSchema>
      | AppRecordIndexShowEventForCalendarView<AppSchema>
      | AppRecordIndexShowEventForCustomView<AppSchema>;

    /**
     * インライン編集表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/idx/index-edit-show-event/
     */
    interface AppRecordIndexEditShowEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.index.edit.show';
      appId: number;
      recordId: string;
      record: BuildRecord<AppSchema>;
    }

    /**
     * インライン編集フィールド変更イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/idx/index-edit-change-event/
     */
    interface AppRecordIndexEditChangeEvent<
      AppSchema extends { properties: Record<string, any> } = any,
      TargetField extends string = string,
    > {
      type: `app.record.index.edit.change.${TargetField}`;
      appId: string;
      recordId: string;
      record: BuildRecord<AppSchema>;
      changes: { field: ChangedField };
      error?: string;
    }

    /**
     * インライン編集保存送信イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/idx/index-edit-submit-event/
     */
    interface AppRecordIndexEditSubmitEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.index.edit.submit';
      appId: string;
      recordId: string;
      record: BuildRecord<AppSchema>;
      error?: string;
    }

    /**
     * インライン編集保存成功イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/idx/index-edit-submit-success-event/
     */
    interface AppRecordIndexEditSubmitSuccessEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.index.edit.submit.success';
      appId: number;
      recordId: string;
      record: BuildRecord<AppSchema>;
      url?: string | null;
    }

    /**
     * インライン編集終了イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/idx/index-edit-finish-event/
     */
    interface AppRecordIndexEditFinishEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.index.edit.Finish';
      appId: number;
      recordId: string;
      record: BuildRecord<AppSchema>;
    }

    /**
     * レコード削除送信イベント（一覧）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/idx/index-delete-submit-event/
     */
    interface AppRecordIndexDeleteSubmitEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.index.delete.submit';
      appId: number;
      recordId: number;
      record: BuildRecord<AppSchema>;
    }

    // ========================================================================
    // レコード詳細イベント
    // ========================================================================

    /**
     * レコード詳細表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/detail/detail-show-event/
     */
    interface AppRecordDetailShowEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.detail.show';
      appId: number;
      recordId: number;
      record: BuildRecord<AppSchema>;
    }

    /**
     * レコード削除送信イベント（詳細）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/detail/detail-delete-submit-event/
     */
    interface AppRecordDetailDeleteSubmitEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.detail.delete.submit';
      appId: number;
      recordId: number;
      record: BuildRecord<AppSchema>;
      error?: string;
    }

    /**
     * プロセス実行イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/detail/detail-process-proceed-event/
     */
    interface AppRecordDetailProcessProceedEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.detail.process.proceed';
      action: { value: string };
      status: { value: string };
      nextStatus: { value: string };
      record: BuildRecord<AppSchema>;
      error?: string;
    }

    // ========================================================================
    // レコード作成イベント
    // ========================================================================

    /**
     * レコード作成画面表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/create/create-show-event/
     */
    interface AppRecordCreateShowEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.create.show';
      appId: number;
      reuse: boolean;
      record: BuildRecordOnCreatePage<AppSchema>;
      error?: string;
    }

    /**
     * レコード作成フィールド変更イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/create/create-change-event/
     */
    interface AppRecordCreateChangeEvent<
      AppSchema extends { properties: Record<string, any> } = any,
      TargetField extends string = string,
    > {
      type: `app.record.create.change.${TargetField}`;
      appId: number;
      record: BuildRecordOnCreatePage<AppSchema>;
      changes:
        | { field: ChangedField; row: ChangedRow | null }
        | { field: ChangedSubtable; row: ChangedRow | null };
      error?: string;
    }

    /**
     * レコード作成保存送信イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/create/create-submit-event/
     */
    interface AppRecordCreateSubmitEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.create.submit';
      appId: number;
      record: BuildRecordOnCreatePage<AppSchema>;
      error?: string;
    }

    /**
     * レコード作成保存成功イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/create/create-submit-success-event/
     */
    interface AppRecordCreateSubmitSuccessEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.create.submit.success';
      appId: number;
      recordId: string;
      record: BuildRecordOnCreatePage<AppSchema>;
      url?: string | null;
    }

    // ========================================================================
    // レコード編集イベント
    // ========================================================================

    /**
     * レコード編集画面表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/edit/edit-show-event/
     */
    interface AppRecordEditShowEvent<AppSchema extends { properties: Record<string, any> } = any> {
      type: 'app.record.edit.show';
      appId: number;
      recordId: number;
      record: BuildRecord<AppSchema>;
      error?: string;
    }

    /**
     * レコード編集フィールド変更イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/edit/edit-change-event/
     */
    interface AppRecordEditChangeEvent<
      AppSchema extends { properties: Record<string, any> } = any,
      TargetField extends string = string,
    > {
      type: `app.record.edit.change.${TargetField}`;
      appId: number;
      recordId: number;
      record: BuildRecord<AppSchema>;
      changes:
        | { field: ChangedField; row: ChangedRow | null }
        | { field: ChangedSubtable; row: ChangedRow | null };
      error?: string;
    }

    /**
     * レコード編集保存送信イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/edit/edit-submit-event/
     */
    interface AppRecordEditSubmitEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.edit.submit';
      appId: number;
      recordId: number;
      record: BuildRecord<AppSchema>;
      error?: string;
    }

    /**
     * レコード編集保存成功イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/edit/edit-submit-success-event/
     */
    interface AppRecordEditSubmitSuccessEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'app.record.edit.submit.success';
      appId: number;
      recordId: string;
      record: BuildRecord<AppSchema>;
      url?: string | null;
    }

    // ========================================================================
    // その他のイベント
    // ========================================================================

    /**
     * レコード印刷画面表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/print-show-event/
     */
    interface AppRecordPrintShowEvent<AppSchema extends { properties: Record<string, any> } = any> {
      type: 'app.record.print.show';
      appId: number;
      recordId: number;
      record: BuildRecord<AppSchema>;
    }

    /**
     * グラフ表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/graph-show-event/
     */
    interface AppReportShowEvent {
      type: 'app.report.show';
      appId: number;
    }

    /**
     * ポータル表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/portal-show-event/
     */
    interface PortalShowEvent {
      type: 'portal.show';
    }

    /**
     * スペースポータル表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/space-show-event/
     */
    interface SpacePortalShowEvent {
      type: 'space.portal.show';
      spaceId: string;
    }

    // ========================================================================
    // モバイルイベント
    // ========================================================================

    /**
     * モバイルレコード一覧表示イベント（リスト表示）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/idx/index-show-event/
     */
    interface MobileAppRecordIndexShowEventForListView<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'mobile.app.record.index.show';
      appId: number;
      viewId: number;
      viewName: string;
      viewType: 'list';
      offset: number;
      size: number;
      date: null;
      records: Array<BuildRecord<AppSchema>>;
    }

    /**
     * モバイルレコード一覧表示イベント（カレンダー表示）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/idx/index-show-event/
     */
    interface MobileAppRecordIndexShowEventForCalendarView<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'mobile.app.record.index.show';
      appId: number;
      viewId: number;
      viewName: string;
      viewType: 'calendar';
      offset: null;
      size: null;
      date: `${number}-${string}`;
      records: {
        [date in `${number}-${string}-${string}`]: Array<BuildRecord<AppSchema>>;
      };
    }

    /**
     * モバイルレコード一覧表示イベント（カスタマイズ表示）
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/idx/index-show-event/
     */
    interface MobileAppRecordIndexShowEventForCustomView<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'mobile.app.record.index.show';
      appId: number;
      viewId: number;
      viewName: string;
      viewType: 'custom';
      offset: number;
      size: number;
      date: null;
      records: Array<BuildRecord<AppSchema>>;
    }

    /**
     * モバイルレコード一覧表示イベント（全タイプ）
     */
    type MobileAppRecordIndexShowEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > =
      | MobileAppRecordIndexShowEventForListView<AppSchema>
      | MobileAppRecordIndexShowEventForCalendarView<AppSchema>
      | MobileAppRecordIndexShowEventForCustomView<AppSchema>;

    /**
     * モバイルレコード詳細表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/detail/detail-show-event/
     */
    interface MobileAppRecordDetailShowEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'mobile.app.record.detail.show';
      appId: number;
      recordId: number;
      record: BuildRecord<AppSchema>;
    }

    /**
     * モバイルレコード削除送信イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/detail/detail-delete-submit-event/
     */
    interface MobileAppRecordDetailDeleteSubmitEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'mobile.app.record.detail.delete.submit';
      appId: number;
      recordId: number;
      record: BuildRecord<AppSchema>;
    }

    /**
     * モバイルプロセス実行イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/detail/detail-process-proceed-event/
     */
    interface MobileAppRecordDetailProcessProceedEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'mobile.app.record.detail.process.proceed';
      action: { value: string };
      status: { value: string };
      nextStatus: { value: string };
      record: BuildRecord<AppSchema>;
    }

    /**
     * モバイルレコード作成画面表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/create/create-show-event/
     */
    interface MobileAppRecordCreateShowEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'mobile.app.record.create.show';
      appId: number;
      reuse: boolean;
      record: BuildRecordOnCreatePage<AppSchema>;
    }

    /**
     * モバイルレコード作成フィールド変更イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/create/create-change-event/
     */
    interface MobileAppRecordCreateChangeEvent<
      AppSchema extends { properties: Record<string, any> } = any,
      TargetField extends string = string,
    > {
      type: `mobile.app.record.create.change.${TargetField}`;
      appId: number;
      record: BuildRecordOnCreatePage<AppSchema>;
      changes:
        | { field: ChangedField; row: ChangedRow | null }
        | { field: ChangedSubtable; row: ChangedRow | null };
    }

    /**
     * モバイルレコード作成保存送信イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/create/create-submit-event/
     */
    interface MobileAppRecordCreateSubmitEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'mobile.app.record.create.submit';
      appId: number;
      record: BuildRecordOnCreatePage<AppSchema>;
    }

    /**
     * モバイルレコード作成保存成功イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/create/create-submit-success-event/
     */
    interface MobileAppRecordCreateSubmitSuccessEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'mobile.app.record.create.submit.success';
      appId: number;
      recordId: string;
      record: BuildRecordOnCreatePage<AppSchema>;
    }

    /**
     * モバイルレコード編集画面表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/edit/edit-show-event/
     */
    interface MobileAppRecordEditShowEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'mobile.app.record.edit.show';
      appId: number;
      recordId: number;
      record: BuildRecord<AppSchema>;
    }

    /**
     * モバイルレコード編集フィールド変更イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/edit/edit-change-event/
     */
    interface MobileAppRecordEditChangeEvent<
      AppSchema extends { properties: Record<string, any> } = any,
      TargetField extends string = string,
    > {
      type: `mobile.app.record.edit.change.${TargetField}`;
      appId: number;
      recordId: number;
      record: BuildRecord<AppSchema>;
      changes:
        | { field: ChangedField; row: ChangedRow | null }
        | { field: ChangedSubtable; row: ChangedRow | null };
    }

    /**
     * モバイルレコード編集保存送信イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/edit/edit-submit-event/
     */
    interface MobileAppRecordEditSubmitEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'mobile.app.record.edit.submit';
      appId: number;
      recordId: number;
      record: BuildRecord<AppSchema>;
    }

    /**
     * モバイルレコード編集保存成功イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/edit/edit-submit-success-event/
     */
    interface MobileAppRecordEditSubmitSuccessEvent<
      AppSchema extends { properties: Record<string, any> } = any,
    > {
      type: 'mobile.app.record.edit.submit.success';
      appId: number;
      recordId: string;
      record: BuildRecord<AppSchema>;
    }

    /**
     * モバイルポータル表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/portal-show-event/
     */
    interface MobilePortalShowEvent {
      type: 'mobile.portal.show';
    }

    /**
     * モバイルスペースポータル表示イベント
     * @see https://cybozu.dev/ja/kintone/docs/js-api/events/space-show-event/
     */
    interface MobileSpacePortalShowEvent {
      type: 'mobile.space.portal.show';
      spaceId: string;
    }

    // ========================================================================
    // イベントマップ（kintone.events.on/off用）
    // ========================================================================

    /**
     * イベントマップ
     * kintone.events.on() / kintone.events.off() で使用される型マップ
     */
    interface EventMap<AppSchema extends { properties: Record<string, any> } = any> {
      'portal.show': PortalShowEvent;
      'app.record.index.show': AppRecordIndexShowEvent<AppSchema>;
      'app.record.index.edit.show': AppRecordIndexEditShowEvent<AppSchema>;
      'app.record.index.edit.submit': AppRecordIndexEditSubmitEvent<AppSchema>;
      'app.record.index.edit.submit.success': AppRecordIndexEditSubmitSuccessEvent<AppSchema>;
      'app.record.index.delete.submit': AppRecordIndexDeleteSubmitEvent<AppSchema>;
      'app.record.detail.show': AppRecordDetailShowEvent<AppSchema>;
      'app.record.detail.delete.submit': AppRecordDetailDeleteSubmitEvent<AppSchema>;
      'app.record.detail.process.proceed': AppRecordDetailProcessProceedEvent<AppSchema>;
      'app.record.create.show': AppRecordCreateShowEvent<AppSchema>;
      'app.record.create.submit': AppRecordCreateSubmitEvent<AppSchema>;
      'app.record.create.submit.success': AppRecordCreateSubmitSuccessEvent<AppSchema>;
      'app.record.edit.show': AppRecordEditShowEvent<AppSchema>;
      'app.record.edit.submit': AppRecordEditSubmitEvent<AppSchema>;
      'app.record.edit.submit.success': AppRecordEditSubmitSuccessEvent<AppSchema>;
      'app.record.print.show': AppRecordPrintShowEvent<AppSchema>;
      'app.report.show': AppReportShowEvent;
      'space.portal.show': SpacePortalShowEvent;
      'mobile.app.record.index.show': MobileAppRecordIndexShowEvent<AppSchema>;
      'mobile.app.record.detail.show': MobileAppRecordDetailShowEvent<AppSchema>;
      'mobile.app.record.detail.delete.submit': MobileAppRecordDetailDeleteSubmitEvent<AppSchema>;
      'mobile.app.record.detail.process.proceed': MobileAppRecordDetailProcessProceedEvent<AppSchema>;
      'mobile.app.record.create.show': MobileAppRecordCreateShowEvent<AppSchema>;
      'mobile.app.record.create.submit': MobileAppRecordCreateSubmitEvent<AppSchema>;
      'mobile.app.record.create.submit.success': MobileAppRecordCreateSubmitSuccessEvent<AppSchema>;
      'mobile.app.record.edit.show': MobileAppRecordEditShowEvent<AppSchema>;
      'mobile.app.record.edit.submit': MobileAppRecordEditSubmitEvent<AppSchema>;
      'mobile.app.record.edit.submit.success': MobileAppRecordEditSubmitSuccessEvent<AppSchema>;
      'mobile.portal.show': MobilePortalShowEvent;
      'mobile.space.portal.show': MobileSpacePortalShowEvent;
    }
  }
}
