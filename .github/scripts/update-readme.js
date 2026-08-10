import { Octokit } from "@octokit/rest";
import fs from "fs/promises";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function getTopProjects() {
  const { data: repos } = await octokit.repos.listForUser({
    username: "frnAlt",
    sort: "updated",
    per_page: 100
  });

  const topProjects = repos
    .filter(repo => !repo.fork && !repo.archived && !repo.private && repo.name !== "frnAlt")
    .sort((a, b) => b.stargazers_count - a.stargazers_count || b.forks_count - a.forks_count)
    .slice(0, 10)
    .map(repo => `- [${repo.name}](${repo.html_url}) - ${repo.description || 'No description'}`);

  return topProjects.join('\n');
}

async function getRecentProjects() {
  const { data: repos } = await octokit.repos.listForUser({
    username: "frnAlt",
    sort: "pushed",
    per_page: 100
  });

  const recentProjects = repos
    .filter(repo => !repo.fork && !repo.archived && !repo.private && repo.name !== "frnAlt")
    .slice(0, 5)
    .map(repo => `- [${repo.name}](${repo.html_url}) - ${repo.description || 'No description'}`);

  return recentProjects.join('\n');
}

async function updateReadme() {
  const [topProjects, recentProjects] = await Promise.all([
    getTopProjects(),
    getRecentProjects()
  ]);
  
  let readme = await fs.readFile('README.md', 'utf8');
  
  // Update top projects
  const topProjectsStartToken = '<!-- TOP-PROJECTS-LIST:START -->';
  const topProjectsEndToken = '<!-- TOP-PROJECTS-LIST:END -->';
  const newTopProjectsContent = `${topProjectsStartToken}\n${topProjects}\n${topProjectsEndToken}`;
  
  readme = readme.replace(
    new RegExp(`${topProjectsStartToken}[\\s\\S]*${topProjectsEndToken}`),
    newTopProjectsContent
  );

  // Update recent projects
  const recentProjectsStartToken = '<!-- RECENT-PROJECTS:START -->';
  const recentProjectsEndToken = '<!-- RECENT-PROJECTS:END -->';
  const newRecentProjectsContent = `${recentProjectsStartToken}\n${recentProjects}\n${recentProjectsEndToken}`;
  
  readme = readme.replace(
    new RegExp(`${recentProjectsStartToken}[\\s\\S]*${recentProjectsEndToken}`),
    newRecentProjectsContent
  );
  
  await fs.writeFile('README.md', readme);
}

updateReadme().catch(console.error);
