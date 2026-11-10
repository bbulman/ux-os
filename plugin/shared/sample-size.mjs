#!/usr/bin/env node
// Survey sample size, or the margin of error a sample gives.
// Usage: node sample-size.mjs --population N [--margin 0.05] [--confidence 0.95] [--response 0.2] [--sample n]
//        node sample-size.mjs --self-test

import { fileURLToPath } from 'node:url';

const Z = { 0.9: 1.645, 0.95: 1.96, 0.99: 2.576 };

export function sampleNeeded({ population, margin = 0.05, confidence = 0.95 }) {
  const z = Z[confidence];
  if (!z) throw new Error('confidence must be 0.9, 0.95 or 0.99');
  const base = (z * z * 0.25) / (margin * margin);
  return Math.ceil(population ? base / (1 + (base - 1) / population) : base);
}

export function marginFor({ population, sample, confidence = 0.95 }) {
  const z = Z[confidence];
  if (!z) throw new Error('confidence must be 0.9, 0.95 or 0.99');
  const correction = population && population > 1 ? Math.sqrt((population - sample) / (population - 1)) : 1;
  return z * Math.sqrt(0.25 / sample) * correction;
}

function selfTest() {
  const fail = [];
  if (sampleNeeded({}) !== 385) fail.push('unlimited population at 5 percent needs 385');
  if (sampleNeeded({ population: 1000 }) !== 278) fail.push('1000 people at 5 percent needs 278');
  if (sampleNeeded({ population: 100 }) !== 80) fail.push('100 people at 5 percent needs 80');
  if (Math.abs(marginFor({ sample: 385 }) - 0.05) > 0.001) fail.push('385 gives about 5 percent');
  console.log(fail.length ? `FAIL: ${fail.join('; ')}` : 'self-test passed');
  process.exit(fail.length ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args[0] === '--self-test') selfTest();
  else {
    const value = (flag) => (args.includes(flag) ? Number(args[args.indexOf(flag) + 1]) : undefined);
    const population = value('--population');
    const confidence = value('--confidence') ?? 0.95;
    const sample = value('--sample');
    if (sample) {
      console.log(`A sample of ${sample} gives a margin of error of plus or minus ${(marginFor({ population, sample, confidence }) * 100).toFixed(1)} points at ${confidence * 100}% confidence.`);
    } else {
      const margin = value('--margin') ?? 0.05;
      const needed = sampleNeeded({ population, margin, confidence });
      const response = value('--response');
      const invites = response ? ` At a ${response * 100}% response rate, invite ${Math.ceil(needed / response - 1e-9)} people.` : '';
      console.log(`You need ${needed} completed responses for a margin of plus or minus ${margin * 100} points at ${confidence * 100}% confidence.${invites}`);
    }
  }
}
