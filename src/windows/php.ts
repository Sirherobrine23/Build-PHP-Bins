import { clone as gitClone } from "../git";
import { execFileAsync } from "../childPromisses";
import { extractZip } from "../http_request";
import path from "path/win32";

type buildBase = {
  buildFolder: string,
};

type phpSdkOptions = buildBase & {
  PHP_SDK_VER: string,
};
export async function phpSdk(options: phpSdkOptions) {
  // PHP Sdk
  await gitClone({
    repo: "OSTC/php-sdk-binary-tools",
    branch: `php-sdk-${options.PHP_SDK_VER}`,
    out: options.buildFolder
  });

  return execFileAsync(path.join(options.buildFolder, "bin\\phpsdk_setvars.bat"), {
    cwd: options.buildFolder,
  });
}

type phpDepend = buildBase & {
  VC_VER: string,
  PHP_MAJOR_VER: string,
  DEPS_DIR_NAME: string
};
export async function phpsdk_deps(options: phpDepend) {
  return execFileAsync(path.join(options.buildFolder, "bin\\phpsdk_deps.bat"), [
    "-u",
    "-t",
    options.VC_VER,
    "-b",
    options.PHP_MAJOR_VER,
    "-a",
    process.arch,
    "-f",
    "-d",
    options.DEPS_DIR_NAME
  ], {
    cwd: options.buildFolder,
    stdio: "inherit"
  });
}

type phpSrcOPtions = buildBase & {
  phpGetRev: string
};
export async function phpSrc(options: phpSrcOPtions) {
  return extractZip(`https://github.com/php/php-src/archive/${options.phpGetRev}.zip`, path.join(options.buildFolder, "php-src"));
}