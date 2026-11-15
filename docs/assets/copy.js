// Copy buttons: hidden until this runs, so a page without JavaScript shows only the block and the download link.
// The clipboard API first; if the browser refuses it, the older copy command; failing both, the block is left
// selected so one keypress copies it.
(function () {
  function selectBlock(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  function legacyCopy(el) {
    selectBlock(el);
    try { return document.execCommand('copy'); } catch (e) { return false; }
  }
  document.querySelectorAll('button[data-copy]').forEach(function (btn) {
    var target = document.getElementById(btn.getAttribute('data-copy'));
    var status = btn.parentNode.querySelector('.copy-status');
    if (!target) return;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var say = function (msg) { if (status) status.textContent = msg; };
      var fallback = function () {
        say(legacyCopy(target) ? 'Copied.' : 'Selected. Press Cmd+C or Ctrl+C to copy.');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(target.textContent).then(function () { say('Copied.'); }, fallback);
      } else {
        fallback();
      }
    });
  });
})();
