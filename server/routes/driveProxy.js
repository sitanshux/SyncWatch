const express = require('express');
const https = require('https');
const http = require('http');
const router = express.Router();

/**
 * Google Drive Proxy
 * Streams a public Google Drive file through our server to bypass CORS.
 * Supports Range requests so the HTML5 <video> element can seek.
 * Handles Google Drive redirects with cookie forwarding and confirmation tokens.
 *
 * @route  GET /api/drive-stream/:fileId
 */
router.get('/drive-stream/:fileId', (req, res) => {
  const { fileId } = req.params;

  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return res.status(400).json({ error: 'Invalid file ID.' });
  }

  // Initial download URL from Google Drive
  const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;

  // Headers to forward
  const baseHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
  };
  if (req.headers.range) {
    baseHeaders['Range'] = req.headers.range;
  }

  const cookies = {};

  const getCookieHeader = () => {
    return Object.keys(cookies).map(k => `${k}=${cookies[k]}`).join('; ');
  };

  /**
   * Follow redirects manually while preserving cookies and forwarding Range headers.
   */
  const fetchWithRedirects = (url, depth = 0) => {
    if (depth > 8) {
      if (!res.headersSent) {
        res.status(502).json({ error: 'Too many redirects from Google Drive.' });
      }
      return;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      if (!res.headersSent) {
        res.status(400).json({ error: 'Invalid redirect URL from Google Drive.' });
      }
      return;
    }

    const requester = parsedUrl.protocol === 'https:' ? https : http;
    const requestHeaders = { ...baseHeaders };
    const currentCookies = getCookieHeader();
    if (currentCookies) {
      requestHeaders['Cookie'] = currentCookies;
    }

    const proxyReq = requester.get(url, { headers: requestHeaders }, (proxyRes) => {
      // Store any cookies returned by Google Drive
      if (proxyRes.headers['set-cookie']) {
        proxyRes.headers['set-cookie'].forEach((cookieStr) => {
          const parts = cookieStr.split(';')[0].split('=');
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim();
          if (key) cookies[key] = val;
        });
      }

      // Handle 301/302/303/307/308 redirects
      if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
        let redirectUrl = proxyRes.headers.location;
        if (redirectUrl.startsWith('/')) {
          redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
        }
        proxyRes.resume(); // discard body
        fetchWithRedirects(redirectUrl, depth + 1);
        return;
      }

      // Check if response is HTML (could be virus scan warning or confirm page)
      const contentType = proxyRes.headers['content-type'] || '';
      if (contentType.includes('text/html') && depth < 3) {
        let body = '';
        proxyRes.on('data', (chunk) => { body += chunk; });
        proxyRes.on('end', () => {
          // Look for confirmation token or download link in HTML
          const confirmTokenMatch = body.match(/confirm=([a-zA-Z0-9_-]+)/);
          const uuidMatch = body.match(/uuid=([a-zA-Z0-9_-]+)/);
          const formActionMatch = body.match(/<form[^>]+action="([^"]+)"/i);
          const hrefMatch = body.match(/href="([^"]*drive\.usercontent\.google\.com\/download[^"]*)"/i);

          if (confirmTokenMatch) {
            const confirmUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmTokenMatch[1]}`;
            fetchWithRedirects(confirmUrl, depth + 1);
          } else if (hrefMatch) {
            let nextUrl = hrefMatch[1].replace(/&amp;/g, '&');
            fetchWithRedirects(nextUrl, depth + 1);
          } else if (formActionMatch) {
            let actionUrl = formActionMatch[1].replace(/&amp;/g, '&');
            if (uuidMatch && !actionUrl.includes('uuid=')) {
              actionUrl += `&uuid=${uuidMatch[1]}`;
            }
            fetchWithRedirects(actionUrl, depth + 1);
          } else {
            // Direct user-agent stream fallback
            const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
            fetchWithRedirects(directUrl, depth + 1);
          }
        });
        return;
      }

      // Forward headers to client
      if (proxyRes.headers['content-type']) {
        res.setHeader('Content-Type', proxyRes.headers['content-type']);
      }
      if (proxyRes.headers['content-length']) {
        res.setHeader('Content-Length', proxyRes.headers['content-length']);
      }
      if (proxyRes.headers['content-range']) {
        res.setHeader('Content-Range', proxyRes.headers['content-range']);
      }
      if (proxyRes.headers['accept-ranges']) {
        res.setHeader('Accept-Ranges', proxyRes.headers['accept-ranges']);
      }

      res.status(proxyRes.statusCode);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('[Drive Proxy] Error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Failed to stream Google Drive file.' });
      }
    });
  };

  fetchWithRedirects(driveUrl);
});

module.exports = router;
