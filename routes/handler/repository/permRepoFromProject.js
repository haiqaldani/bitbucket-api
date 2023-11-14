const fs = require("fs");
const { parse } = require("csv-parse");
const { default: axios } = require("axios");

module.exports = async (req, res) => {
  const payload = req.body;
  const userFilePath = `${payload.workspace}_repository.csv`;
  const projectFilePath = `list_project_admin.csv`;

  try {
    const headers = {
      Accept: "application/json",
      Content: "application/json",
      Authorization: `Basic ${payload.access_token}`,
    };

    const dataAll = [];

    const projectData = await readAndMapUserCSV(
      userFilePath,
      payload.min_user,
      payload.max_user
    );
    const userData = await readAndMapProjectCSV(
      projectFilePath,
      payload.min_repo,
      payload.max_repo
    );

    const projectAll = [];

    for (let x = 0; x < projectData.length; x++) {
      const project_key = JSON.parse(projectData[x].project_key);

      projectAll.push({
        repo_slug: projectData[x].repo_slug,
        project_key: project_key.key,
      });
    }

    // Your further processing logic
    for (let index = 0; index < userData.length; index++) {
      const uuid = userData[index].uuid;

      const filteredData = projectAll.filter(
        (item) => item.project_key === userData[index].project_key
      );

      for (let j = 0; j < filteredData.length; j++) {
        const repo_slug = filteredData[j].repo_slug;

        const data = {
          permission: "admin",
        };

        const url = `https://api.bitbucket.org/2.0/repositories/${payload.workspace}/${repo_slug}/permissions-config/users/${uuid}`

        console.log(url);

        const reviewer = await axios.put(
          url,
          {
            headers,

          },
          data
        );

        // const reviewer = {
        //   uuid: uuid,
        //   repo_slug: repo_slug,
        //   permission: "admin"
        // };

        console.log(`user: ${uuid} repo: ${repo_slug}`);
        dataAll.push(reviewer);
      }
    }

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

async function readAndMapProjectCSV(filePath, minLine, maxLine) {
  const userData = [];
  const dataStream = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ",",
      from_line: parseInt(minLine + 1),
      to_line: parseInt(maxLine),
    })
  );

  dataStream.on("data", function (row) {
    const uuid = row[5];
    const project_key = row[7];
    const perm = row[6];

    // Map CSV data to your desired structure
    userData.push({
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

  return userData;
}

async function readAndMapUserCSV(filePath, minLine, maxLine) {
  const projectData = [];
  const dataStream = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ",",
      from_line: parseInt(minLine + 1),
      to_line: parseInt(maxLine),
    })
  );

  dataStream.on("data", function (row) {
    const repo_slug = row[4];
    const project_key = row[11];

    // Map CSV data to your desired structure
    projectData.push({
      repo_slug: repo_slug,
      project_key: project_key,
    });
  });

  await new Promise((resolve) => {
    dataStream.on("end", function () {
      resolve();
    });
  });

  return projectData;
}
