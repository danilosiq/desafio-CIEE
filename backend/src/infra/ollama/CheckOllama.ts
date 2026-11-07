import { loadEnvironment } from "../config/LoadEnvironment";
import { checkOllama } from "./OllamaAvailability";
loadEnvironment();
void checkOllama().then((result) => {
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "ready") process.exitCode = 1;
});
