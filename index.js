import core from "@actions/core";
import fetch from "./doppler.js";

// For local testing
if (process.env.NODE_ENV === "development" && process.env.DOPPLER_TOKEN) {
  process.env["INPUT_DOPPLER-TOKEN"] = process.env.DOPPLER_TOKEN;
  process.env["INPUT_DOPPLER-PROJECT"] = process.env.DOPPLER_PROJECT;
  process.env["INPUT_DOPPLER-CONFIG"] = process.env.DOPPLER_CONFIG;
}

const DOPPLER_META = ["DOPPLER_PROJECT", "DOPPLER_CONFIG", "DOPPLER_ENVIRONMENT"];
const DOPPLER_TOKEN = core.getInput("doppler-token", { required: true });
const GITHUB_EVENT_NUMBER = core.getInput("github-event-number", { required: true });
core.setSecret(DOPPLER_TOKEN);

const IS_SA_TOKEN = DOPPLER_TOKEN.startsWith("dp.sa.");
const IS_PERSONAL_TOKEN = DOPPLER_TOKEN.startsWith("dp.pt.");
const DOPPLER_PROJECT = (IS_SA_TOKEN || IS_PERSONAL_TOKEN) ? core.getInput("doppler-project") : null;
const DOPPLER_CONFIG = (IS_SA_TOKEN || IS_PERSONAL_TOKEN) ? core.getInput("doppler-config") : null;
if (IS_PERSONAL_TOKEN && !(DOPPLER_PROJECT && DOPPLER_CONFIG)) {
  core.setFailed("doppler-project and doppler-config inputs are required when using a Personal token. Additionally, we recommend switching to Service Accounts.");
  process.exit();
}
if (IS_SA_TOKEN && !(DOPPLER_PROJECT && DOPPLER_CONFIG)) {
  core.setFailed("doppler-project and doppler-config inputs are required when using a Service Account token");
  process.exit();
}

const secrets = await fetch(DOPPLER_TOKEN, DOPPLER_PROJECT, DOPPLER_CONFIG);

let formattedSecrets = '';
for (const [key, value] of Object.entries(secrets)) {
  let currentValue = value
  if(key === "TEAMSTREAM_API_ENDPOINT") {
    currentValue = `https://pr-${ GITHUB_EVENT_NUMBER }-teamstreamgg-teamstream.fly.dev/api`
  }

  if(key === "TEAMSTREAM_API_ENDPOINT") {
    currentValue = `https://pr-${ GITHUB_EVENT_NUMBER }-teamstreamgg-teamstream.fly.dev`
  }


  if (!DOPPLER_META.includes(key)) {
    formattedSecrets += `${key}='${currentValue}' `;
    core.setSecret(currentValue);
    core.setOutput(key, currentValue);
  }

  core.setOutput('formattedSecrets', formattedSecrets.trim());

  if (core.getInput("inject-env-vars") === "true") {
    core.exportVariable(key, currentValue);
  }

}
