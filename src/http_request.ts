import { tmpdir } from "node:os";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import got from "got";
import tar from "tar";
import admZip from "adm-zip";

export async function saveFile(url: string, options?: {filePath?: string, headers?: {[key: string]: string|number}}) {
  let fileSave = path.join(tmpdir(), (Math.random()*155515151).toFixed()+"_raw_node_"+path.basename(url));
  const Headers = {};
  if (options) {
    if (options.filePath && typeof options.filePath === "string") fileSave = options.filePath;
    if (options.headers) Object.keys(options.headers).forEach(key => Headers[key] = String(options.headers[key]));
  }

  const gotStream = got.stream({url, headers: Headers, isStream: true});
  gotStream.pipe(fs.createWriteStream(fileSave, {autoClose: false}));
  await new Promise<void>((done, reject) => {
    gotStream.on("end", () => setTimeout(done, 1000));
    gotStream.on("error", reject);
  });
  return fileSave;
}

const isGithubRoot = /github.com\/[\S\w]+\/[\S\w]+\/archive/;
export async function extractZip(url: string, folderTarget: string) {
  if (isGithubRoot.test(url)) {
    const tempFolder = await fs.promises.mkdtemp(path.join(tmpdir(), "githubRoot-------"), "utf8");
    promisify((new admZip()).extractAllToAsync)(tempFolder, true, true);
    await fs.promises.cp(path.join(tempFolder, (await fs.promises.readdir(tempFolder))[0]), folderTarget, {recursive: true, force: true, preserveTimestamps: true, verbatimSymlinks: true});
    return await fs.promises.rm(tempFolder, {recursive: true, force: true});
  }
  return promisify((new admZip()).extractAllToAsync)(folderTarget, true, true);
}

export async function downloadGithubZip(org: string, repo: string, target: string) {
  // https://github.com/%~3/%~4/archive/%~2.zip
  return saveFile(`https://github.com/${org}/${repo}/archive/${target}.zip`);
}

export async function tarExtract(url: string, options?: {folderPath?: string, headers?: {[key: string]: string|number}}) {
  let fileSave = path.join(tmpdir(), "_bdscore", (Math.random()*155515151).toFixed()+"_raw_bdscore");
  const Headers = {};
  if (options) {
    if (options.folderPath && typeof options.folderPath === "string") fileSave = options.folderPath;
    if (options.headers) Object.keys(options.headers).forEach(key => Headers[key] = String(options.headers[key]));
  }

  if (!fs.existsSync(fileSave)) await fs.promises.mkdir(fileSave, {recursive: true});
  const gotStream = got.stream({url, headers: Headers, isStream: true});
  const tarE = tar.extract({
    cwd: fileSave,
    noChmod: false,
    noMtime: false,
    preserveOwner: true,
    keep: true,
    p: true
  });
  gotStream.pipe(tarE);
  return new Promise<string>((done, reject) => {
    gotStream.on("end", () => done(fileSave));
    gotStream.on("error", reject);
    tarE.on("error", reject);
  });
}

export async function getBuffer(url: string, options?: {method?: string,body?: any, headers?: {[key: string]: string}}): Promise<Buffer> {
  const Headers = {};
  let Body: any;
  if (options) {
    if (options.headers) Object.keys(options.headers).forEach(key => Headers[key] = String(options.headers[key]));
    if (options.body) Body = options.body;
  }
  // if (typeof fetch === "undefined")
  return got(url, {
    headers: Headers,
    responseType: "buffer",
    body: Body,
    method: (options?.method||"GET").toUpperCase() as any
  }).then(({body}) => Buffer.from(body));
}

export async function getJSON<JSONReturn = any>(url: string, options?: {method?: string, body?: any, headers?: {[key: string]: string}}): Promise<JSONReturn> {
  return getBuffer(url, {
    body: options?.body,
    headers: options?.headers,
    method: options?.method
  }).then(res => JSON.parse(res.toString("utf8")) as JSONReturn);
}