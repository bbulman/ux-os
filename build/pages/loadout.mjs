import { page, esc, plural, fmt, codeBlock, note, linker, statusChip } from '../shell.mjs';
import { loadout } from '../loadout.mjs';

export const loadoutJson = (ctx) => `${JSON.stringify(loadout(ctx.plugins, ctx.entries).fragment, null, 2)}\n`;

export function loadoutPage(ctx) {
  const path = 'loadout/';
  const L = linker(path);
  const lo = loadout(ctx.plugins, ctx.entries);
  const on = lo.public.filter((p) => p.on);
  const off = lo.public.filter((p) => !p.on);
  const link = (e, label = e.name) => `<a href="${L(`registry/${e.id}/`)}">${esc(label)}</a>`;
  const pluginLink = (p) => (p.owner || p.members[0] ? link(p.owner || p.members[0], p.name) : esc(p.name));
  const listOf = (items) => items.join(', ').replace(/, ([^,]*)$/, ' and $1');
  const json = loadoutJson(ctx);

  const rows = lo.public.map((p) => `    <tr>
      <td>${pluginLink(p)}${p.entry ? ` <span class="small">(${esc(ctx.byId.get(p.entry).name)})</span>` : ''}</td>
      <td><span class="chip chip--${p.on ? 'available' : 'off'}">${p.on ? 'ON' : 'OFF'}</span></td>
      <td class="lo-key"><code>${esc(p.key)}</code></td>
    </tr>`).join('\n');

  const body = `
<header class="page-head">
  <p class="kicker">${plural(on.length, 'plugin')} on · ${fmt(off.length)} off · ${plural(lo.overridden.length, 'skill')} by name</p>
  <h1>Loadout</h1>
  <p class="lede">What Claude loads on my machine, written as settings you can copy. Install the same plugins, merge the block below, and your Claude starts from the same list mine does.</p>
</header>

<section class="sec sec-tight" aria-labelledby="add-h">
  <h2 class="big-2" id="add-h">1. Add the marketplaces</h2>
  <p class="small">Once. Matt Pocock's skills come from Anthropic's own marketplace, which Claude Code already knows.</p>
  ${codeBlock(lo.marketplaceAdds, 'Marketplaces to add')}
</section>

<section class="sec sec-tight" aria-labelledby="install-h">
  <h2 class="big-2" id="install-h">2. Install the ${plural(on.length, 'plugin')} I keep on</h2>
  ${codeBlock(lo.installs, 'Plugins to install')}
</section>

<section class="sec sec-tight" aria-labelledby="merge-h">
  <h2 class="big-2" id="merge-h">3. Merge the settings</h2>
  <div class="prose">
    <p>Open <code>.claude/settings.json</code> in your home folder. Add the keys below to its <code>enabledPlugins</code> and <code>skillOverrides</code> objects, and keep the entries already there. If the file has neither object, paste the block in whole. A new session picks it up.</p>
    <p><code>false</code> keeps a plugin installed but never loaded. <code>user-invocable-only</code> keeps a skill out of Claude's list until you type its name: those ${fmt(lo.overridden.length)} are my own skills, and the setting only matters if you have them installed.</p>
  </div>
  <pre class="cmd" id="loadout-json" aria-label="Settings to merge"><code>${esc(json)}</code></pre>
  <p class="copy-row"><button type="button" class="btn" data-copy="loadout-json" hidden>Copy the settings</button><a class="link" href="settings.json" download>Download settings.json</a><span class="copy-status small" role="status" aria-live="polite"></span></p>
</section>

<section class="sec" aria-labelledby="cant-h">
  <h2 class="big" id="cant-h">What it can't control</h2>
  ${note(`<p><span class="note-k">Synced copies:</span> a plugin added through claude.ai loads from a synced copy whenever claude.ai says it should, even when these settings say <code>false</code>. Switch those off in claude.ai itself. ${lo.synced.length ? `${listOf(lo.synced.map(pluginLink))} only ever arrives that way.` : ''}</p>
<p><span class="note-k">Private:</span> ${listOf(lo.private.map(pluginLink))} load from folders on my machine and aren't published, so they're left out.</p>
${lo.unnamed.length ? `<p><span class="note-k">Unnamed:</span> ${listOf(lo.unnamed.map((e) => link(e)))} are kept by skill name in my own settings, and the registry doesn't list each skill, so they're left out too.</p>` : ''}
<p><span class="note-k">Projects:</span> a project's own <code>.claude/settings.json</code> and <code>settings.local.json</code> can override all of this for that project.</p>
<p><span class="note-k">Plugin skills:</span> <code>skillOverrides</code> doesn't reach a plugin's skills. A plugin skill that runs only by name says so in its own file, which is why none appear in the block.</p>`, 'note--wide')}
</section>

<section class="sec" aria-labelledby="plugins-h">
  <h2 class="big" id="plugins-h">Every plugin in the block</h2>
  <div class="table"><table class="lo-table">
    <thead><tr><th scope="col">Plugin</th><th scope="col">Loads</th><th scope="col" class="lo-key">Setting</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table></div>
</section>

<section class="sec" aria-labelledby="by-name-h">
  <h2 class="big" id="by-name-h">Skills kept out of the list</h2>
  <p class="lede">Each runs when you type its name. Claude never picks it on its own.</p>
  <ul class="plain">
${lo.overridden.map((e) => `    <li>${link(e)} ${statusChip(e)}</li>`).join('\n')}
  </ul>
</section>
`;
  return page({
    path, title: 'Loadout: UX-OS', current: 'loadout', ctx, body, scripts: ['assets/copy.js'],
    description: 'The settings that decide what Claude loads on my machine, as a block you can copy into your own.',
  });
}
