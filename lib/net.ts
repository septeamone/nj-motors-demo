type Conn = { saveData?: boolean; effectiveType?: string; downlink?: number };

/**
 * A slow or metered connection, as far as the browser tells (Chrome, Android; Safari says nothing and counts as fast).
 * On such a connection the site opens without waiting for the extras and plays the lighter copies of the videos.
 */
export function slowNet() {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as Navigator & { connection?: Conn }).connection;
  return !!c && (!!c.saveData || /2g|3g/.test(c.effectiveType ?? "") || (!!c.downlink && c.downlink < 3));
}
