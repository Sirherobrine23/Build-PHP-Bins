import path from "path/win32";
import fs from "fs";
import { extractZip } from "../http_request";
import { execFileAsync } from "../childPromisses";
import checkVs, { VSEditions, vcvarsallBat } from "./check_vs";
import * as php from "./php";

export type phpBuildOptions = {
  buildFolder?: string,
  PHPSdkVer?: string,
  phpMajorVer?: string,
  LibyamlVer?: string
};

export default async function buildPhp(options?: phpBuildOptions) {
  const buildFolder = options?.buildFolder||path.join(process.cwd(), "php_build");
  if (fs.existsSync(buildFolder)) await fs.promises.rm(buildFolder, {recursive: true, force: true});
  await fs.promises.mkdir(buildFolder, {recursive: true});
  console.log("Build in '%s' folder", buildFolder);

  // Checking vscode version and edtion
  const VS_EDITION: VSEditions = process.env.VS_EDITION as VSEditions;
  const VS_VER = process.env.VS_VER||"2022";
  const VSEditions = await checkVs(VS_VER);
  if (!VSEditions) throw new Error("Install Visual Studio code 2019 or High¹");
  await vcvarsallBat(VS_VER, {Edition: VS_EDITION, argsToScript: [process.arch], cwd: buildFolder});

  // Delete bin folder if exists
  const binFolder = path.join(buildFolder, "bin");
  if (fs.existsSync(binFolder)) {
    console.info("Deletando a pasta bin");
    await fs.promises.rm(binFolder, {recursive: true, force: true});
  }

  // PHP Sdk
  console.log("Getting SDK...")
  const PHP_SDK_VER = options?.PHPSdkVer||"2.2.0";
  await php.phpSdk({
    buildFolder,
    PHP_SDK_VER
  });

  // PHP Souce
  const PHP_MAJOR_VER = options?.phpMajorVer||"8.0";
  const PHP_VER = options?.phpMajorVer||PHP_MAJOR_VER+".22";
  console.log("Downloading PHP source version %s...", PHP_MAJOR_VER);
  await php.phpSrc({
    buildFolder,
    phpGetRev: `php-${PHP_VER}`
  });

  // Dependecie
  const DEPS_DIR_NAME = "deps";
  const DEPS_DIR = path.join(buildFolder, DEPS_DIR_NAME);
  await fs.promises.mkdir(DEPS_DIR, {recursive: true});
  console.log("Downloading PHP dependencies into %s...", DEPS_DIR);
  await php.phpsdk_deps({
    buildFolder,
    VC_VER: "vs16",
    DEPS_DIR_NAME,
    PHP_MAJOR_VER
  });

  // Extra deps
  console.log("Getting additional dependencies...");

  // libyaml
  const LIBYAML_VER = options?.LibyamlVer||"";
  console.log("Downloading LibYAML version %s...", LIBYAML_VER);
  await extractZip(`https://github.com/yaml/libyaml/archive/${LIBYAML_VER}.zip`, path.join(DEPS_DIR, "libyaml"));
  console.log("Generating build configuration...")
  await execFileAsync("cmake", ["-A", process.arch, `-DCMAKE_PREFIX_PATH=${DEPS_DIR}`, `-DCMAKE_INSTALL_PREFIX=${DEPS_DIR}`, "-DBUILD_SHARED_LIBS=ON", "."], {cwd: path.join(DEPS_DIR, "libyaml"), stdio: "inherit"});

  console.log("Compiling...");
  const MSBUILD_CONFIGURATION = "RelWithDebInfo";
  await execFileAsync("msbuild", ["ALL_BUILD.vcxproj", `/p:Configuration=${MSBUILD_CONFIGURATION}`, "/m"], {cwd: path.join(DEPS_DIR, "libyaml"), stdio: "inherit"});

  console.log("Installing files...");
  await execFileAsync("msbuild", ["INSTALL.vcxproj", `/p:Configuration=${MSBUILD_CONFIGURATION}`, "/m"], {cwd: path.join(DEPS_DIR, "libyaml"), stdio: "inherit"});
  await fs.promises.cp(path.join(MSBUILD_CONFIGURATION, "yaml.pdb"), path.join(DEPS_DIR, "bin\\yaml.pdb"));

  // "Downloading pthread-w32 version %PTHREAD_W32_VER%..."
  const PTHREAD_W32_VER = "3.0.0";
  console.log("Downloading pthread-w32 version %s...", PTHREAD_W32_VER);
  await extractZip(`https://netcologne.dl.sourceforge.net/project/pthreads4w/pthreads4w-code-v${PTHREAD_W32_VER}.zip`, path.join(DEPS_DIR, "pthreads4w-code"));
}