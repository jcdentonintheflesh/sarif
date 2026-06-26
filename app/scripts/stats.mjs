#!/usr/bin/env node
// Sarif growth dashboard — pulls live numbers from the GitHub API.
//
//   npm run stats
//
// Reports stars, forks, watchers, open issues, and per-release download counts
// (the .dmg + .zip totals are the closest proxy we have to install count).
// Set GITHUB_TOKEN to also pull the 14-day traffic numbers (views/clones),
// which the API only exposes to repo collaborators.

const REPO = process.env.SARIF_REPO || 'jcdentonintheflesh/sarif';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

const headers = {
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'sarif-stats',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function gh(path) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, { headers });
  if (!r.ok) throw new Error(`GitHub ${r.status} on ${path}: ${(await r.text()).slice(0, 120)}`);
  return r.json();
}

function row(label, value) {
  return `  ${label.padEnd(22)} ${value}`;
}

const INSTALL_ASSETS = ['.dmg', '.zip'];

(async () => {
  try {
    const repo = await gh('');
    const releases = await gh('/releases?per_page=100');

    let totalInstalls = 0;
    const perRelease = releases.map(rel => {
      const installs = (rel.assets || [])
        .filter(a => INSTALL_ASSETS.some(ext => a.name.endsWith(ext)))
        .reduce((sum, a) => sum + a.download_count, 0);
      totalInstalls += installs;
      return { tag: rel.tag_name, installs, published: (rel.published_at || '').slice(0, 10) };
    });

    console.log(`\n  Sarif — ${REPO}\n  ${'─'.repeat(40)}`);
    console.log(row('Stars', repo.stargazers_count));
    console.log(row('Forks', repo.forks_count));
    console.log(row('Watchers', repo.subscribers_count));
    console.log(row('Open issues', repo.open_issues_count));
    console.log(row('Discussions', repo.has_discussions ? 'enabled' : 'OFF'));
    console.log(row('Total installs', `${totalInstalls}  (.dmg + .zip downloads)`));

    if (perRelease.length) {
      console.log(`\n  Per release`);
      for (const r of perRelease) {
        console.log(row(`  ${r.tag}`, `${r.installs} installs   ${r.published}`));
      }
    }

    // Traffic requires push access + a token.
    if (TOKEN) {
      try {
        const [views, clones] = await Promise.all([gh('/traffic/views'), gh('/traffic/clones')]);
        console.log(`\n  Traffic (last 14 days)`);
        console.log(row('Page views', `${views.count}  (${views.uniques} unique)`));
        console.log(row('Clones', `${clones.count}  (${clones.uniques} unique)`));
      } catch (e) {
        console.log(`\n  Traffic: unavailable (${e.message.split(':')[0]})`);
      }
    } else {
      console.log(`\n  Tip: set GITHUB_TOKEN to also pull 14-day traffic (views/clones).`);
    }
    console.log('');
  } catch (e) {
    console.error(`\n  ✖ ${e.message}\n`);
    process.exit(1);
  }
})();
