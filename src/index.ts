import linux from "./linux/index";
import windows from "./windows/index";
export {linux, windows};

if (process.argv[2] === "DEBUG") {
  process.env.DEBUG = "1";
  if (process.platform === "win32") windows();
  else linux();
}