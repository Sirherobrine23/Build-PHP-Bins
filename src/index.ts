import linux from "./linux/index";
import windows from "./windows/index";
export {linux, windows};

if (process.argv[2] === "DEBUG") {
  if (process.platform === "win32") await windows();
  else linux();
}