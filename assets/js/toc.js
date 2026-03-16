document.addEventListener('DOMContentLoaded', function () {
  (async function(){
    try {
      var tocEl = document.getElementById('toc');
      if (!tocEl) return;

      // Try to load feed.xml first
      var feedUrls = [ '/feed.xml', window.location.pathname.replace(/\/[^/]*$/, '/') + 'feed.xml', window.location.origin + '/feed.xml' ];
      var feedResp = null;
      for (var u of feedUrls) {
        try { feedResp = await fetch(u, {cache:'no-store'}); if (feedResp && feedResp.ok) { feedUrl = u; break; } } catch(e) { feedResp = null; }
      }

      var links = [];
      if (feedResp && feedResp.ok) {
        var text = await feedResp.text();
        var parser = new DOMParser();
        var doc = parser.parseFromString(text, 'application/xml');
        var items = doc.querySelectorAll('item');
        if (!items.length) items = doc.querySelectorAll('entry');
        items.forEach(function(it){
          var titleEl = it.querySelector('title');
          var linkEl = it.querySelector('link');
          var title = titleEl ? titleEl.textContent.trim() : null;
          var link = null;
          if (linkEl) {
            link = linkEl.getAttribute('href') || linkEl.textContent || null;
          }
          var guid = it.querySelector('guid');
          if (!link && guid) link = guid.textContent.trim();
          if (title && link) links.push({title: title, href: link});
        });
      }

      // Fallback: scan DOM for post links
      if (!links.length) {
        var candidates = document.querySelectorAll('.posts article h2 a, article h2 a, .post-list a, .posts a');
        var seen = new Set();
        candidates.forEach(function(a){
          var href = a.getAttribute('href');
          var text = (a.textContent||a.innerText||href||'').trim();
          if (!href || !text) return;
          // normalize relative
          if (!href.match(/^https?:\/\//) && !href.startsWith('/')) {
            href = (window.location.pathname.replace(/\/[^/]*$/, '/') + href).replace(/\/\.\//g,'/');
          }
          if (seen.has(href)) return;
          seen.add(href);
          links.push({title: text, href: href});
        });
      }

      if (!links.length) {
        tocEl.innerHTML = '<p>No posts found to build TOC.</p>';
        return;
      }

      var ul = document.createElement('ul');
      ul.className = 'toc-list';
      links.forEach(function(l){
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = l.href;
        a.textContent = l.title;
        a.className = 'toc-link';
        li.appendChild(a);
        ul.appendChild(li);
      });
      tocEl.innerHTML = '';
      tocEl.appendChild(ul);

    } catch (e) {
      console.error('TOC build error', e);
      var tocEl = document.getElementById('toc'); if (tocEl) tocEl.innerHTML = '<p>Error building TOC.</p>';
    }
  })();
});
