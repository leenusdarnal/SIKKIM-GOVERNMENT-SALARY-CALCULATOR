const isGitHubPages = process.env.GITHUB_PAGES === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    paths: {
      base: isGitHubPages ? '/SIKKIM-GOVERNMENT-SALARY-CALCULATOR' : ''
    },
    ...(isGitHubPages ? { prerender: { entries: ['*'] } } : {})
  }
};

export default config;
