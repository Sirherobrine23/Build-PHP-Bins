import { execFileAsync } from "./childPromisses";

export type gitClone = {
  repo: string,
  out?: string,
  branch?: string,
  depth?: number,
  quiet?: boolean,
};
export async function clone(options: gitClone) {
  const args = ["clone"];
  if (!/^http[s]:\/\//.test(options.repo)) options.repo = `https://github.com/${options.repo}`;
  args.push(options.repo);

  // Branch or tag
  if (options.branch) args.push("-b", options.branch);

  // Depth clone
  if (options.depth) args.push("--depth", options.depth.toFixed(0));
  else args.push("--depth", "1");

  // Quiet
  if (options.quiet) args.push("-q");

  if (options.out) args.push(options.out);
  return execFileAsync("git", args, {stdio: "inherit"});
}