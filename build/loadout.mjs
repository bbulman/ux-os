// Works out which plugin each registry entry belongs to, and the settings fragment that reproduces
// what loads on Bill's machine. The site's Loadout page and scripts/prune.mjs both read it, so the
// two can never disagree about which plugin an entry lives in.
const SLUG = /^[a-z0-9-]+$/;

export function checkPlugins(map, entries, fail) {
  if (!map || typeof map !== 'object' || !Array.isArray(map.plugins) || typeof map.marketplaces !== 'object') {
    fail('plugins: data/plugins.json needs "marketplaces" and a "plugins" list');
    return;
  }
  const ids = new Set(entries.map((e) => e.id));
  const names = new Set();
  for (const p of map.plugins) {
    const at = `plugin "${p.name}"`;
    if (!SLUG.test(p.name ?? '')) fail(`${at}: name must be lowercase letters, digits and hyphens`);
    if (names.has(p.name)) fail(`${at}: listed twice`);
    names.add(p.name);
    if (p.private && p.synced) fail(`${at}: cannot be both private and synced`);
    if (!p.private && !p.synced && !(p.marketplace in map.marketplaces)) fail(`${at}: marketplace "${p.marketplace}" is not listed under marketplaces`);
    if (p.entry && !ids.has(p.entry)) fail(`${at}: entry "${p.entry}" is not in the registry`);
  }
  // Every entry run through a plugin must belong to one we know about.
  for (const e of entries) {
    const prefix = prefixOf(e);
    if (prefix && !names.has(prefix)) fail(`entry ${e.id}: runs through plugin "${prefix}", which data/plugins.json does not list`);
  }
}

// The plugin an entry runs through, by name, or null for a plain skill, agent or MCP server.
function prefixOf(e) {
  if (!e.invoke) return null;
  if (e.invoke.includes(':')) return e.invoke.split(':')[0];
  return e.type === 'pack' ? e.invoke : null;
}

export function pluginsOf(map, entries) {
  return map.plugins.map((p) => {
    const members = entries.filter((e) => e.id === p.entry || prefixOf(e) === p.name);
    const owner = members.find((e) => e.id === p.entry) || members.find((e) => e.type === 'pack' && e.invoke === p.name) || null;
    const on = owner ? owner.status !== 'off' : members.some((e) => e.status !== 'off');
    const kind = p.synced ? 'synced' : p.private ? 'private' : 'public';
    const key = kind === 'public' ? `${p.name}@${p.marketplace}` : null;
    return { ...p, kind, key, on, owner, members, repo: kind === 'public' ? map.marketplaces[p.marketplace] : null };
  });
}

export function pluginFor(e, plugins) {
  return plugins.find((p) => p.members.includes(e)) || null;
}

// The fragment: every public plugin on or off, and every plain skill that loads only by name, or not at all.
// skillOverrides does not reach a plugin's skills, so a plugin skill that runs by name says so in its own file.
export function loadout(map, entries) {
  const plugins = pluginsOf(map, entries);
  const pub = plugins.filter((p) => p.kind === 'public').sort((a, b) => a.key.localeCompare(b.key));
  const enabledPlugins = Object.fromEntries(pub.map((p) => [p.key, p.on]));
  const overridden = entries
    .filter((e) => e.invoke && !prefixOf(e) && ['skill', 'command'].includes(e.type) && e.status !== 'available')
    .sort((a, b) => a.invoke.localeCompare(b.invoke));
  const skillOverrides = Object.fromEntries(overridden.map((e) => [e.invoke, e.status === 'off' ? 'off' : 'user-invocable-only']));
  const marketplaces = [...new Set(pub.filter((p) => p.on && p.repo).map((p) => p.repo))].sort();
  return {
    fragment: { enabledPlugins, skillOverrides },
    plugins,
    public: pub,
    private: plugins.filter((p) => p.kind === 'private'),
    synced: plugins.filter((p) => p.kind === 'synced'),
    // Groups kept by hand, such as "Taste skills": their skills are not named in the registry.
    unnamed: entries.filter((e) => e.type === 'pack' && !e.invoke && !plugins.some((p) => p.entry === e.id)),
    overridden,
    marketplaceAdds: marketplaces.map((r) => `/plugin marketplace add ${r}`),
    installs: pub.filter((p) => p.on).map((p) => `/plugin install ${p.key}`),
  };
}
