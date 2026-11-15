// "I need to..." filters the jobs as you type. Without this script every job shows.
// ?q=journey on the URL starts the search, so a search can be linked.
(function () {
  var finder = document.querySelector('[data-finder]');
  if (!finder) return;
  var input = finder.querySelector('[data-q]');
  var count = finder.querySelector('[data-count]');
  var jobs = Array.prototype.slice.call(document.querySelectorAll('.job[data-search]'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('[data-group]'));
  var empty = document.querySelector('[data-empty]');
  var total = jobs.length;
  // Each group's own count, and the contents link that jumps to it.
  var counters = groups.map(function (g) { return g.querySelector('[data-group-count]'); });
  var sizes = groups.map(function (g) { return g.querySelectorAll('.job[data-search]').length; });
  var labels = counters.map(function (c) { return c ? c.textContent : ''; });
  var toc = groups.map(function (g) { return document.querySelector('.toc a[href="#' + g.id + '"]'); });

  function norm(s) {
    return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/['’]/g, '').replace(/[^a-z0-9:/]+/g, ' ').trim();
  }
  var index = jobs.map(function (j) { return norm(j.getAttribute('data-search')); });

  function run() {
    var terms = norm(input.value).split(' ').filter(Boolean);
    var shown = 0;
    jobs.forEach(function (j, i) {
      var ok = terms.every(function (w) { return index[i].indexOf(w) >= 0; });
      j.hidden = !ok;
      if (ok) shown++;
    });
    groups.forEach(function (g, i) {
      var n = g.querySelectorAll('.job[data-search]:not([hidden])').length;
      g.hidden = n === 0;
      if (toc[i]) toc[i].hidden = n === 0;
      if (counters[i]) counters[i].textContent = n === sizes[i] ? labels[i] : n + ' of ' + sizes[i] + (sizes[i] === 1 ? ' job' : ' jobs');
    });
    count.textContent = 'Showing ' + shown + ' of ' + total + ' jobs';
    empty.hidden = shown !== 0;
  }

  var timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(run, 120);
  });

  var q = new URLSearchParams(location.search).get('q');
  if (q) input.value = q;
  finder.hidden = false;
  run();
})();
