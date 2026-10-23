const PREVIEW_POLICY = "default-src 'none'; img-src data: blob:; media-src data: blob:; style-src 'unsafe-inline' data:; font-src data:; script-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";

function addPreviewPolicy(markup) {
  const policy = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_POLICY}">`;
  const source = String(markup || '');

  if (/<head\b[^>]*>/i.test(source)) {
    return source.replace(/<head\b[^>]*>/i, (head) => `${head}${policy}`);
  }

  if (/<html\b[^>]*>/i.test(source)) {
    return source.replace(/<html\b[^>]*>/i, (html) => `${html}<head>${policy}</head>`);
  }

  return `<!doctype html><html lang="en"><head>${policy}<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${source}</body></html>`;
}

export function buildHtmlPreview(markup) {
  return addPreviewPolicy(markup);
}

export function buildCssPreview(htmlMarkup, cssSource) {
  const baseStyles = 'body { margin: 0; padding: 12px; font-family: sans-serif; color: #1e293b; }\n';
  const stylesheetUrl = `data:text/css;charset=utf-8,${encodeURIComponent(`${baseStyles}${String(cssSource || '')}`)}`;
  const stylesheet = `<link rel="stylesheet" href="${stylesheetUrl}">`;
  const source = String(htmlMarkup || '<main><article class="card"><h1>Preview</h1></article></main>');

  if (/<head\b[^>]*>/i.test(source)) {
    const withStylesheet = /<\/head>/i.test(source)
      ? source.replace(/<\/head>/i, `${stylesheet}</head>`)
      : source.replace(/<head\b[^>]*>/i, (head) => `${head}${stylesheet}`);
    return addPreviewPolicy(withStylesheet);
  }

  if (/<html\b[^>]*>/i.test(source)) {
    return addPreviewPolicy(source.replace(/<html\b[^>]*>/i, (html) => `${html}<head>${stylesheet}</head>`));
  }

  return addPreviewPolicy(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${stylesheet}</head><body>${source}</body></html>`);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function buildSubmissionPreview(language, sourceCode, htmlFixture = '') {
  if (!String(sourceCode || '').trim()) return '';
  const normalizedLanguage = String(language || '').toLowerCase();
  if (normalizedLanguage === 'html') return buildHtmlPreview(sourceCode);
  if (normalizedLanguage === 'css') return buildCssPreview(htmlFixture, sourceCode);

  const displayName = ({ javascript: 'JavaScript', js: 'JavaScript', python: 'Python', java: 'Java' })[normalizedLanguage] || 'This language';
  return buildHtmlPreview(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Submission details</title></head><body><main style="font:14px system-ui,sans-serif;padding:24px;color:#172033"><p style="color:#4f46e5;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${displayName} submission</p><h1 style="font-size:20px">Requirement check only</h1><p>This mode checks the task requirements. It does not run this program in a language runtime.</p><h2 style="font-size:14px">Submitted source</h2><pre style="padding:16px;background:#111827;color:#d1fae5;border-radius:6px;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(sourceCode)}</pre></main></body></html>`);
}
