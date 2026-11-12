// Where things sit. An idea folder holds the research files flat, with work files in work/ inside it.
// In a project laid out by discipline the idea folder is ux-os/<project>/research/, and each other discipline's work files sit in a folder beside it.
// Both names are needed to tell the layout: a folder that is only named research, anywhere else, is a plain idea folder.

import { existsSync, lstatSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, posix, resolve } from 'node:path';

export const HOME = 'ux-os';
export const RESEARCH = 'research';
export const WORK = 'work';
const DISCIPLINE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isDir = (path) => existsSync(path) && statSync(path).isDirectory();

export const byDiscipline = (folder) => basename(resolve(folder)) === RESEARCH && basename(dirname(dirname(resolve(folder)))) === HOME;
export const projectDir = (folder) => (byDiscipline(folder) ? dirname(resolve(folder)) : resolve(folder));
export const ideaSlug = (folder) => basename(projectDir(folder));
// The folder that holds every idea, which is where repository.md sits.
export const homeDir = (folder) => dirname(projectDir(folder));
// "Interaction design" files into interaction-design/.
// A pack named research or work would land in a folder that already means something else.
export const disciplineName = (set) => {
  const name = set.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return [RESEARCH, WORK].includes(name) ? `${name}-work` : name;
};

// The folders that hold work files, as paths from the idea folder. Every real folder beside research/ counts, and a link to a folder elsewhere does not.
export function workDirs(folder) {
  const dirs = [WORK];
  if (byDiscipline(folder) && isDir(projectDir(folder))) {
    for (const name of readdirSync(projectDir(folder)).sort()) if (name !== RESEARCH && DISCIPLINE.test(name) && !lstatSync(join(projectDir(folder), name)).isSymbolicLink()) dirs.push(`../${name}`);
  }
  return dirs.filter((dir) => isDir(join(folder, dir)));
}

// How a work file is named to a reader: its folder is shown when it is a discipline's.
export const workLabel = (file) => (file.startsWith('../') ? file.slice(3) : basename(file));

export const isWorkFile = (file) => file.startsWith(`${WORK}/`) || file.startsWith('../');

// A work file sits outside the idea folder's top level, so a link written in it is turned into a path from the idea folder.
export const fromWork = (file) => (target) => {
  const path = posix.normalize(posix.join(posix.dirname(file), target));
  return file.startsWith('../') && path.startsWith(`../${RESEARCH}/`) ? path.slice(RESEARCH.length + 4) : path;
};

// How a work file's evidence links begin.
export const evidencePrefix = (file) => (file.startsWith('../') ? `../${RESEARCH}/evidence/` : '../evidence/');
