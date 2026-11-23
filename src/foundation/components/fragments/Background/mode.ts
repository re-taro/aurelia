/**
 * 背景の表示モード。ページごとに CommonLayout で指定し、<html data-background> として出す。
 * - ambient: クラゲが画面全体を漂う
 * - reading: 本文の帯の上ではクラゲを沈め、動きもゆっくりにして読むことに集中させる
 */
export type BackgroundMode = 'ambient' | 'reading';

export const BACKGROUND_MODE_ATTRIBUTE = 'data-background';
