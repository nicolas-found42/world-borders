import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function declaredIssues(body) {
  const declarations = [...body.matchAll(/<!--\s*completed-issues:\s*(\[[\s\S]*?\])\s*-->/g)];
  if (declarations.length !== 1)
    throw new Error('Declare completed issues once: <!-- completed-issues: [] -->');
  const issues = JSON.parse(declarations[0][1]);
  if (
    !Array.isArray(issues) ||
    issues.some((n) => !Number.isSafeInteger(n) || n <= 0) ||
    new Set(issues).size !== issues.length
  )
    throw new Error('Completed issues must be unique positive integer issue numbers');
  return issues.sort((a, b) => a - b);
}
export function validateClosingIssues(
  body,
  references,
  repository,
  { dependencyBot = false } = {},
) {
  const declared = dependencyBot && !body.includes('completed-issues:') ? [] : declaredIssues(body);
  if (references.some((r) => r.repository.nameWithOwner !== repository))
    throw new Error('Cross-repository closing links require a separate reviewed change');
  const actual = references.map((r) => r.number).sort((a, b) => a - b);
  if (JSON.stringify(actual) !== JSON.stringify(declared))
    throw new Error(
      `GitHub parsed closing issues ${JSON.stringify(actual)}; declared completed issues ${JSON.stringify(declared)}`,
    );
  return declared;
}
export function isDependencyBot(author) {
  return author?.__typename === 'Bot' && ['dependabot', 'dependabot[bot]'].includes(author.login);
}
export function githubQuery(query, variables = {}) {
  return JSON.parse(
    execFileSync(
      'gh',
      [
        'api',
        'graphql',
        '-f',
        `query=${query}`,
        ...Object.entries(variables).flatMap(([key, value]) => ['-F', `${key}=${value}`]),
      ],
      { encoding: 'utf8' },
    ),
  ).data;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const repository = process.env.GITHUB_REPOSITORY || 'nicolas-found42/world-borders';
  const [owner, name] = repository.split('/');
  const number = Number(process.argv[2]);
  if (!Number.isSafeInteger(number) || number <= 0)
    throw new Error('Usage: node scripts/pr-metadata.mjs PR_NUMBER');
  const data = githubQuery(
    `query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){body author{login __typename} closingIssuesReferences(first:100){nodes{number repository{nameWithOwner}} pageInfo{hasNextPage}}}}}`,
    { owner, name, number },
  );
  const pr = data.repository.pullRequest;
  if (pr.closingIssuesReferences.pageInfo.hasNextPage)
    throw new Error('Too many closing references; split this PR');
  console.log(
    JSON.stringify({
      number,
      completedIssues: validateClosingIssues(
        pr.body,
        pr.closingIssuesReferences.nodes,
        repository,
        { dependencyBot: isDependencyBot(pr.author) },
      ),
    }),
  );
}
