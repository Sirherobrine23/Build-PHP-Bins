import path from "node:path/win32";
import fs from "node:fs/promises";
import fsOld from "node:fs";
import { execFileAsync } from "../childPromisses";
export type VSEditions = "Community"|"Enterprise"|"Professional";
// C:\\Program Files\\Microsoft Visual Studio
export const VSFolder = process.env.VS_FOLDER||"C:\\Program Files\\Microsoft Visual Studio";

export default async function checkVs(year: string): Promise<false|VSEditions[]> {
  const yearVs = path.join(VSFolder, year);
  if (!fsOld.existsSync(VSFolder)) return false;
  else if (fsOld.existsSync(yearVs)) return (await fs.readdir(yearVs)).filter(file => file === "Community"||file === "Enterprise"||file === "Professional") as VSEditions[];
  return false;
}

export async function vcvarsallBat(year: string, options?: {Edition?: VSEditions, argsToScript?: string[], cwd?: string}) {
  const vsfolder = await checkVs(year);
  if (!vsfolder) throw new Error("Install visual studio 2019 or High");
  if (!options) options = {};
  if (!options?.Edition) {
    if (vsfolder.includes("Enterprise")) options.Edition = "Enterprise";
    else if (vsfolder.includes("Professional")) options.Edition = "Enterprise";
    else options.Edition = "Community";
  }
  const scriptFile = path.join(VSFolder, year, options.Edition, "VC\\Auxiliary\\Build\\vcvarsall.bat");
  return execFileAsync(scriptFile, [...(options.argsToScript||[])], {
    stdio: (process.env.DEBUG==="1"||process.env.DEBUG==="true")?"inherit":"ignore",
    cwd: options.cwd,
  });
}