// Everything the pages compute from the data, worked out once: lookups, picks, rivals, counts.
import { band } from './load.mjs';
import { slug } from './shell.mjs';

const byUsage = (a, b) => b.usage.total - a.usage.total || a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });

export function derive(D) {
  const byId = new Map(D.entries.map((e) => [e.id, e]));
  const setBySlug = new Map(D.sets.map((s) => [s.slug, s]));
  const setName = Object.fromEntries(D.sets.map((s) => [s.slug, s.name]));
  const sorted = [...D.entries].sort(byUsage);

  // A rival named as pack:skill, where the pack is in the registry and counts by prefix, belongs to that pack.
  const packFor = (ref) => {
    const head = String(ref).replace(/^\//, '').split(':')[0];
    return D.entries.find((e) => e.type === 'pack' && e.match === 'prefix' && e.invoke === head);
  };
  const rivalOf = (j) => {
    if (!j.rival) return null;
    const id = D.resolve(j.rival.use);
    if (id) return { label: byId.get(id).name, ref: j.rival.use, entry: byId.get(id), pack: null, why: j.rival.why };
    return { label: j.rival.use, ref: j.rival.use, entry: null, pack: packFor(j.rival.use) || null, why: j.rival.why };
  };

  // Jobs, each with its pick, its rival and a stable anchor.
  const seen = new Map();
  const jobs = D.jobs.map((j) => {
    let a = `job-${slug(j.need)}`;
    const n = (seen.get(a) || 0) + 1;
    seen.set(a, n);
    if (n > 1) a = `${a}-${n}`;
    return { ...j, anchor: a, pick: byId.get(D.resolve(j.use)), rival: rivalOf(j) };
  });
  const jobsBySet = new Map(D.sets.map((s) => [s.slug, jobs.filter((j) => j.set === s.slug)]));

  const picks = new Map(); // entry id -> jobs it is the pick for
  const lost = new Map(); // entry id -> jobs where it is the rival (directly, or as its pack)
  for (const j of jobs) {
    (picks.get(j.pick.id) || picks.set(j.pick.id, []).get(j.pick.id)).push(j);
    const loser = j.rival && (j.rival.entry || j.rival.pack);
    if (loser) (lost.get(loser.id) || lost.set(loser.id, []).get(loser.id)).push(j);
  }
  const isPick = (e) => picks.has(e.id);

  const workflows = D.workflows.map((w) => ({
    ...w,
    steps: w.steps.map((st) => ({ ...st, entry: st.use ? byId.get(D.resolve(st.use)) : null })),
  }));
  const inWorkflows = new Map(); // entry id -> [{ workflow, labels }]
  for (const w of workflows) {
    for (const st of w.steps) {
      if (!st.entry) continue;
      const list = inWorkflows.get(st.entry.id) || inWorkflows.set(st.entry.id, []).get(st.entry.id);
      let hit = list.find((x) => x.workflow.slug === w.slug);
      if (!hit) list.push((hit = { workflow: w, labels: [] }));
      hit.labels.push(st.label);
    }
  }

  // Project files, with readers resolved where they are in the registry.
  const projectFiles = D.projectFiles.map((f) => ({
    ...f,
    readers: (f.readBy || []).map((r) => ({ ref: r, entry: byId.get(D.resolve(r)) || null })),
  }));
  const pfById = new Map(projectFiles.map((f) => [f.id, f]));

  // The band rule lives in load.mjs. Probe it so the labels can never disagree with it.
  const firstAt = (b) => { for (let n = 1; n < 100000; n++) if (band(n) === b) return n; return null; };
  const regularFrom = firstAt('regular');
  const heavyFrom = firstAt('heavy');
  const BANDS = {
    heavy: `Heavy, ${heavyFrom} or more`,
    regular: `Regular, ${regularFrom} to ${heavyFrom - 1}`,
    occasional: regularFrom - 1 === 1 ? 'Occasional, once' : `Occasional, 1 to ${regularFrom - 1}`,
    unused: 'Never used',
  };

  const count = (pred) => D.entries.filter(pred).length;
  const authors = [...new Set(D.entries.map((e) => e.author))];
  const thirdAuthors = authors
    .filter((a) => D.entries.some((e) => e.author === a && e.origin === 'third'))
    .map((a) => ({ name: a, n: count((e) => e.author === a) }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));

  // Links into a repo the registry marks private would 404 for a visitor.
  const privateRepos = [...new Set(D.entries.map((e) => e.privateRepo).filter(Boolean))];
  const isPrivateLink = (url) => privateRepos.some((r) => new RegExp(`^https://github\\.com/${r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[/#?]|$)`, 'i').test(url));

  // The most used entry that is a job's pick: the one Home circles.
  const topPick = sorted.find(isPick);

  return {
    ...D,
    byId, setBySlug, setName, sorted, jobs, jobsBySet, picks, lost, isPick, workflows, inWorkflows,
    projectFiles, pfById, BANDS, thirdAuthors, topPick, byUsage, privateRepos, isPrivateLink,
    totals: {
      entries: D.entries.length,
      mine: count((e) => e.origin !== 'third'),
      built: count((e) => e.origin === 'built'),
      combined: count((e) => e.origin === 'combined'),
      third: count((e) => e.origin === 'third'),
      unused: count((e) => !e.usage.total),
      used: count((e) => e.usage.total > 0),
      on: count((e) => e.status === 'available'),
      byName: count((e) => e.status === 'name'),
      off: count((e) => e.status === 'off'),
      jobs: jobs.length,
      rivals: jobs.filter((j) => j.rival).length,
      workflows: workflows.length,
      projectFiles: projectFiles.length,
      sets: D.sets.length,
      proposed: D.sets.filter((s) => s.proposed).length,
      withProof: count((e) => e.proof),
      withStory: count((e) => e.story),
    },
    count,
  };
}
