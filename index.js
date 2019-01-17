const { Toolkit } = require("actions-toolkit");
const fs = require("fs");
const path = require("path");
const tools = new Toolkit();
const octokit = tools.createOctokit();

async function run() {
  let newLabelsUrl = path.join(
    process.env["GITHUB_WORKSPACE"],
    ".github",
    "labels.json"
  );

  let liveLabels = await getCurrentLabels();
  let newLabels = JSON.parse(fs.readFileSync(newLabelsUrl).toString());

  let labelModList = diffLabels(liveLabels, newLabels);

  // Exit if no changes
  if (labelModList.length === 0) {
    return;
  }

  let createLabels = labelModList.filter(
    labelObj => labelObj.type === "create"
  );
  let updateLabels = labelModList.filter(
    labelObj => labelObj.type === "update"
  );
  let deleteLabels = labelModList.filter(
    labelObj => labelObj.type === "delete"
  );

  let commentBody = `Here are some pending changes for the new change:\n\n`;

  if (createLabels.length > 0) {
    commentBody += `New Labels:\n`;
    for (let label of createLabels) {
      commentBody += `* ${label.label.name} (color: ${label.label.color}): ${
        label.label.description
      }\n`;
    }
    commentBody += `\n`;
  }

  if (updateLabels.length > 0) {
    commentBody += `Updated Labels:\n\n`;
    for (let label of updateLabels) {
      commentBody += `* ${label.label.name} (color: ${label.label.color}): ${
        label.label.description
      }\n`;
    }
  }

  if (deleteLabels.length > 0) {
    commentBody += `Deleted Labels:\n\n`;
    for (let label of deleteLabels) {
      commentBody += `* ${label.label.name}\n`;
    }
  }

  let number = tools.context.payload.pull_request.number;

  let params = tools.context.repo({ number, body: commentBody });

  await octokit.pullRequests.createComment(params);
}

async function getCurrentLabels() {
  let response = await octokit.issues.listLabelsForRepo(
    tools.context.repo({
      headers: { accept: "application/vnd.github.symmetra-preview+json" }
    })
  );
  let data = response.data;

  return data;
}

function diffLabels(oldLabels, newLabels) {
  // Return diff which includes
  // 1) New labels to be created
  // 2) Labels that exist but have an update
  // 3) Labels that no longer exist and should be deleted

  // each entry has two values
  // { type: 'create' | 'update' | 'delete', label }

  let oldLabelsNames = oldLabels.map(label => label.name);
  let newLabelsNames = newLabels.map(label => label.name);

  let labelModList = [];

  oldLabelsNames.forEach(oLabel => {
    if (newLabelsNames.includes(oLabel)) {
      const oldLabel = oldLabels.filter(l => l.name === oLabel)[0];
      const newLabel = newLabels.filter(l => l.name === oLabel)[0];

      if (
        oldLabel.color !== newLabel.color ||
        oldLabel.description !== newLabel.description
      ) {
        // UPDATE
        labelModList.push({ type: "update", label: newLabel });
      }
      newLabelsNames = newLabelsNames.filter(element => {
        return element !== oLabel;
      });
    } else {
      // DELETE
      const oldLabel = oldLabels.filter(l => l.name === oLabel)[0];

      labelModList.push({ type: "delete", label: oldLabel });
    }
  });

  newLabelsNames.forEach(nLabel => {
    const newLabel = newLabels.filter(l => l.name === nLabel)[0];

    // CREATE
    labelModList.push({ type: "create", label: newLabel });
  });

  return labelModList;
}

run();
