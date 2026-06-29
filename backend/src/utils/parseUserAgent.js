/**
 * Lightweight UA parser — no dependencies needed.
 * Returns { browser, os, device }
 */
const parseUserAgent = (ua = '') => {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };

  const s = ua.toLowerCase();

  // ── Device ──────────────────────────────────────────────────────────────────
  let device = 'Desktop';
  if (/bot|crawl|spider|slurp|baiduspider|facebookexternalhit|whatsapp|telegram/i.test(ua)) {
    device = 'Bot';
  } else if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    device = 'Tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry|bb\d+|meego|palm|webos|phone/i.test(ua)) {
    device = 'Mobile';
  }

  // ── Browser ──────────────────────────────────────────────────────────────────
  let browser = 'Unknown';
  if      (/edg\//i.test(ua))           browser = 'Edge';
  else if (/opr\/|opera/i.test(ua))     browser = 'Opera';
  else if (/samsungbrowser/i.test(ua))  browser = 'Samsung Browser';
  else if (/ucbrowser/i.test(ua))       browser = 'UC Browser';
  else if (/firefox\/[\d.]+/i.test(ua)) browser = 'Firefox';
  else if (/chrome\/[\d.]+/i.test(ua) && !/chromium/i.test(ua)) browser = 'Chrome';
  else if (/chromium/i.test(ua))        browser = 'Chromium';
  else if (/safari\/[\d.]+/i.test(ua) && !/chrome/i.test(ua))   browser = 'Safari';
  else if (/msie|trident/i.test(ua))    browser = 'Internet Explorer';
  else if (/curl/i.test(ua))            browser = 'cURL';

  // ── OS ───────────────────────────────────────────────────────────────────────
  let os = 'Unknown';
  if      (/windows nt 10/i.test(ua))  os = 'Windows 10/11';
  else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6\.2/i.test(ua)) os = 'Windows 8';
  else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/windows/i.test(ua))         os = 'Windows';
  else if (/android [\d.]+/i.test(ua)) {
    const m = ua.match(/android ([\d.]+)/i);
    os = m ? `Android ${m[1]}` : 'Android';
  }
  else if (/iphone os [\d_]+/i.test(ua)) {
    const m = ua.match(/iphone os ([\d_]+)/i);
    os = m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS';
  }
  else if (/ipad.*os [\d_]+/i.test(ua)) {
    const m = ua.match(/os ([\d_]+)/i);
    os = m ? `iPadOS ${m[1].replace(/_/g, '.')}` : 'iPadOS';
  }
  else if (/mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua))    os = 'Linux';
  else if (/ubuntu/i.test(ua))   os = 'Ubuntu';

  return { browser, os, device };
};

module.exports = parseUserAgent;