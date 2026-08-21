(function(){
  const form = document.getElementById('fetchForm');
  const urlInput = document.getElementById('urlInput');
  const submitBtn = document.getElementById('submitBtn');
  const statusRow = document.getElementById('statusRow');
  const panel = document.getElementById('panel');
  const panelLabel = document.getElementById('panelLabel');
  const panelBody = document.getElementById('panelBody');
  const copyBtn = document.getElementById('copyBtn');

  let lastRawText = '';

  function pill(text, cls){
    const span = document.createElement('span');
    span.className = 'pill' + (cls ? ' ' + cls : '');
    span.textContent = text;
    return span;
  }

  function clearStatus(){
    statusRow.innerHTML = '';
  }

  function escapeHtml(str){
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatBytes(bytes){
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
  }

  // Syntax-highlight already-pretty-printed JSON (operates on escaped text).
  function highlightJson(escaped){
    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
      function(match){
        if (/^"/.test(match)){
          return /:$/.test(match)
            ? '<span class="tok-key">' + match + '</span>'
            : '<span class="tok-str">' + match + '</span>';
        }
        if (/true|false/.test(match)) return '<span class="tok-bool">' + match + '</span>';
        if (/null/.test(match)) return '<span class="tok-null">' + match + '</span>';
        return '<span class="tok-num">' + match + '</span>';
      }
    );
  }

  // Light indentation pass for XML/HTML-like markup, then tag-highlight the escaped result.
  function prettyMarkup(raw){
    const compact = raw.replace(/>\s*</g, '><').trim();
    let formatted = '';
    let depth = 0;
    const parts = compact.split(/(?=<)|(?<=>)/g).filter(Boolean);
    parts.forEach(function(part){
      if (/^<\/[^>]+>$/.test(part)){
        depth = Math.max(depth - 1, 0);
        formatted += '  '.repeat(depth) + part + '\n';
      } else if (/^<[^!?/][^>]*[^/]>$/.test(part) && !/^<[^>]+\/>$/.test(part)){
        formatted += '  '.repeat(depth) + part + '\n';
        depth++;
      } else if (/^<[^>]+\/>$/.test(part) || /^<!--/.test(part) || /^<\?/.test(part) || /^<!/.test(part)){
        formatted += '  '.repeat(depth) + part + '\n';
      } else if (/^</.test(part)){
        formatted += '  '.repeat(depth) + part + '\n';
      } else {
        formatted += '  '.repeat(depth) + part.trim() + '\n';
      }
    });
    return formatted.trim();
  }

  function highlightMarkup(escaped){
    return escaped
      .replace(/(&lt;\/?[a-zA-Z0-9:_-]+)/g, '<span class="tok-tag">$1</span>')
      .replace(/([a-zA-Z-:]+)(=)(&quot;[^&]*&quot;|"[^"]*")/g, '<span class="tok-attr">$1</span>$2$3');
  }

  function showMessage(text, isErr){
    panel.classList.add('visible');
    panelBody.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'msg' + (isErr ? ' err' : '');
    div.textContent = text;
    panelBody.appendChild(div);
    copyBtn.style.display = 'none';
  }

  function showOutput(text){
    panel.classList.add('visible');
    panelBody.innerHTML = '';
    const pre = document.createElement('pre');
    pre.innerHTML = text;
    panelBody.appendChild(pre);
    copyBtn.style.display = 'inline-block';
  }

  copyBtn.addEventListener('click', function(){
    navigator.clipboard.writeText(lastRawText).then(function(){
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Copied';
      setTimeout(function(){ copyBtn.textContent = original; }, 1200);
    });
  });

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const raw = urlInput.value.trim();
    if (!raw) return;

    let url;
    try {
      url = new URL(raw);
    } catch (err){
      clearStatus();
      statusRow.appendChild(pill('invalid url', 'err'));
      showMessage('That doesn\'t look like a valid, complete URL. Include the scheme, e.g. https://example.com/path', true);
      return;
    }

    clearStatus();
    panelLabel.textContent = 'output';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Fetching…';
    statusRow.appendChild(pill(url.hostname, 'accent'));
    showMessage('Fetching…', false);

    const started = performance.now();
    try {
      const res = await fetch(url.toString());
      const elapsed = Math.round(performance.now() - started);
      const text = await res.text();
      lastRawText = text;
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      const sizeBytes = new Blob([text]).size;

      clearStatus();
      statusRow.appendChild(pill('GET'));
      statusRow.appendChild(pill(res.status + ' ' + res.statusText, res.ok ? 'ok' : 'err'));
      statusRow.appendChild(pill(formatBytes(sizeBytes)));
      statusRow.appendChild(pill(elapsed + ' ms'));

      // Binary / non-text content
      if (/^(image|audio|video|font|application\/octet-stream|application\/pdf|application\/zip)/.test(contentType)){
        statusRow.appendChild(pill(contentType.split(';')[0], 'accent'));
        showMessage('This response is binary (' + (contentType.split(';')[0] || 'unknown type') + ', ' + formatBytes(sizeBytes) + '). Binary data isn\'t something a text view can represent meaningfully.', false);
        return;
      }

      if (!text.trim()){
        statusRow.appendChild(pill('empty body'));
        showMessage('The response came back with an empty body.', false);
        return;
      }

      // Try JSON first, regardless of declared content-type
      let asJson = null;
      try { asJson = JSON.parse(text); } catch(_) {}

      if (asJson !== null){
        statusRow.appendChild(pill('json', 'accent'));
        panelLabel.textContent = 'json';
        const pretty = JSON.stringify(asJson, null, 2);
        showOutput(highlightJson(escapeHtml(pretty)));
        return;
      }

      const looksLikeMarkup = /^\s*</.test(text) || contentType.includes('xml') || contentType.includes('html');
      if (looksLikeMarkup){
        const kind = contentType.includes('html') || /<html/i.test(text) ? 'html' : 'xml';
        statusRow.appendChild(pill(kind, 'accent'));
        panelLabel.textContent = kind;
        const pretty = prettyMarkup(text);
        showOutput(highlightMarkup(escapeHtml(pretty)));
        return;
      }

      statusRow.appendChild(pill(contentType.split(';')[0] || 'text', 'accent'));
      panelLabel.textContent = 'text';
      showOutput(escapeHtml(text));

    } catch (err){
      const elapsed = Math.round(performance.now() - started);
      clearStatus();
      statusRow.appendChild(pill('GET'));
      statusRow.appendChild(pill('failed', 'err'));
      statusRow.appendChild(pill(elapsed + ' ms'));
      showMessage('Couldn\'t reach that URL. This is almost always one of: the server blocks cross-origin requests from browser pages (CORS) — most APIs do this by default — the URL is unreachable, or it\'s misspelled. This isn\'t something the app can work around from the browser; the target server has to explicitly allow it.', true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Fetch';
    }
  });
})
();