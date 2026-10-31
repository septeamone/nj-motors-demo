type Conn = { saveData?: boolean; effectiveType?: string; downlink?: number };

const conn = () => (typeof navigator === "undefined" ? undefined : (navigator as Navigator & { connection?: Conn }).connection);

/**
 * A really slow or metered connection (data saver, 2G/3G class), as far as the browser tells (Chrome, Android;
 * Safari says nothing and counts as fast). Only then do the videos switch to their lighter copies: the browser's
 * speed estimate alone is too rough for that, it sent good lines to the light videos.
 */
export function slowNet() {
  const c = conn();
  return !!c && (!!c.saveData || /2g|3g/.test(c.effectiveType ?? ""));
}

/**
 * A slow line by the rougher measure too (the speed estimate under 2 Mbit/s). Used only for loading order: the
 * opening loader waits for less and the extras (3D phone, lower films) wait until they are near. Nothing looks worse.
 */
export function lightLoad() {
  const c = conn();
  return slowNet() || (!!c && !!c.downlink && c.downlink < 2);
}
