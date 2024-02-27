const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;
  // const repoFilePath = `${payload.workspace}_repository.csv`;
  const repoFilePath = `${payload.workspace}_repository.csv`;
  const projectFilePath = `permission_project_cloud_${payload.workspace}.csv`;

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
      if (projectData[index].perm === payload.permission) {

        const uuid = projectData[index].uuid;

        const filteredData = repoAll.filter(
          (item) => item.project_key === projectData[index].project_key
        );

        for (let j = 0; j < filteredData.length; j++) {
          const repo_slug = filteredData[j].repo_slug;

          console.log(`Project: ${projectData[index].project_key} with ${repo_slug}`);

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
            uuid: uuid,
            repo_slug: repo_slug,
            permission: payload.permissionAssign,
          };
          dataAll.push(reviewer);
        }
      }
    }

    const csvData = await parseAsync(dataAll);
    fs.writeFileSync(
      `permission_repo_admin_cloud_${payload.workspace}.csv`,
      csvData,
      "utf-8"
    );

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
      to_line: 9999999,
    })
  );

  dataStream.on("data", function (row) {
    const uuid = row[1];
    const project_key = row[3];
    const perm = row[4];

    // Map CSV data to your desired structure
    projectData.push({
      uuid: uuid,
      project_key: project_key,
      perm: perm,
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
    const repo_slug = row[4];
    const project = row[11];

    const projectJson = JSON.parse(project);
    const project_key = projectJson.key;

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
