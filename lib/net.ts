type Conn = { saveData?: boolean; effectiveType?: string; downlink?: number };

/**
 * A slow or metered connection, as far as the browser tells (Chrome, Android; Safari says nothing and counts as fast).
 * On such a connection the site opens without waiting for the extras and plays the lighter copies of the videos.
 */
export function slowNet() {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as Navigator & { connection?: Conn }).connection;
  // the browser's speed estimate (downlink) is rough and often low on a good line, so only data saver or a 2G/3G
  // class connection counts: a computer on a normal line always gets the full-quality videos
  return !!c && (!!c.saveData || /2g|3g/.test(c.effectiveType ?? ""));
}
