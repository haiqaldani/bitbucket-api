const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;
  // const repoFilePath = `${payload.workspace}_repository.csv`;
  const repoFilePath = `onprem_repository.csv`;
  const projectFilePath = `permission_project_onprem.csv`;

  try {
    const headers = {
      Accept: "application/json",
      Content: "application/json",
      Authorization: `Basic ${payload.access_token}`,
    };

    const dataAll = [];

    const repoData = await readAndMapURepoCloudCSV(repoFilePath);
    const projectData = await readAndMapProjectCloudCSV(projectFilePath);

    const repoAll = [];

    for (let x = 0; x < repoData.length; x++) {
      repoAll.push({
        repo_slug: repoData[x].repo_slug,
        project_key: repoData[x].project_key,
      });
    }

    // Your further processing logic
    for (let index = 0; index < projectData.length; index++) {
      if (projectData[index].permission === payload.permission) {
        const name = projectData[index].name;
        const email = projectData[index].email;
        const uuid = projectData[index].uuid;
        const account_id = projectData[index].account_id;

        const filteredData = repoAll.filter(
          (item) => item.project_key === projectData[index].project_key
        );

        for (let j = 0; j < filteredData.length; j++) {
          const repo_slug = filteredData[j].repo_slug;

          console.log(
            `Project: ${projectData[index].project_key} with ${repo_slug}`
          );

          // const data = {
          //   permission: `${payload.permissionAssign}`,
          // };

          // const url = `https://api.bitbucket.org/2.0/repositories/${payload.workspace}/${repo_slug}/permissions-config/users/${uuid}`;

          // console.log(url);

          // const reviewer = await axios.put(
          //   url,
          //   {
          //     headers,
          //   },
          //   data
          // );

          const reviewer = {
            projectKey: projectData[index].project_key,
            name: name,
            email: email,
            repo_slug: repo_slug,
            permission: payload.permissionAssign,
            uuid: uuid,
            account_id: account_id,
          };
          dataAll.push(reviewer);
        }
      }
    }

    const csvData = await parseAsync(dataAll);
    fs.writeFileSync(`permission_project_to_repo.csv`, csvData, "utf-8");

    return res.status(200).json({
      status: "Success",
      statusCode: 200,
      message: "Successfully assign Admin",
      data: dataAll,
    });
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      return res
        .status(500)
        .json({ status: "error", message: "service unavailable" });
    }

    return res.status(400).json({
      status: "error",
      statusCode: 400,
      message: error.message,
    });
  }
};

async function readAndMapProjectCloudCSV(filePath) {
  const projectData = [];
  const dataStream = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ",",
      from_line: 2,
      to_line: 999999,
    })
  );

  dataStream.on("data", function (row) {
    const email = row[1];
    const name = row[2];
    const project_key = row[3];
    const permission = row[4];
    const uuid = row[5];
    const account_id = row[6];

    // Map CSV data to your desired structure
    projectData.push({
      email: email,
      name: name,
      project_key: project_key,
      permission: permission,
      uuid: uuid,
      account_id: account_id,
    });
  });

  await new Promise((resolve) => {
    dataStream.on("end", function () {
      resolve();
    });
  });

  return projectData;
}

async function readAndMapURepoCloudCSV(filePath) {
  const repoData = [];
  const dataStream = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ",",
      from_line: 2,
      to_line: 9999999,
    })
  );

  dataStream.on("data", function (row) {
    const repo_slug = row[0];
    const project = row[8];

    const jsonProject = JSON.parse(project);

    const project_key = jsonProject.key;

    // Map CSV data to your desired structure
    repoData.push({
      repo_slug: repo_slug,
      project_key: project_key,
    });
  });

  await new Promise((resolve) => {
    dataStream.on("end", function () {
      resolve();
    });
  });

  return repoData;
}
