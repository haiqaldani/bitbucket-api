const { default: axios } = require("axios");
const fs = require("fs");
const _ = require("lodash");
const { parse } = require("csv-parse");
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;
  const repositoryFilePath = `permission_repo_onprem.csv`;
  const repositoryFilePath2 = `permission_project_to_repo.csv`;
  const branchFilePath = `branch_2-1000.csv`;

  try {
    const headers = {
      Accept: "application/json",
      Content: "application/json",
      Authorization: `Basic ${payload.access_token}`,
    };

    const dataAll = [];

    const repositoryData = await readRepositoryPerm(repositoryFilePath);
    const repositoryData2 = await readRepositoryPerm2(repositoryFilePath2);
    const branchData = await readBranchPerm(branchFilePath);

    for (let i = 0; i < branchData.length; i++) {
      const repo_slug_branch = branchData[i].repo_slug;
      const email_branch = branchData[i].email;
      const name = branchData[i].name;
      const project_key = branchData[i].project_key;

      console.log(`Check perm branch: ${repo_slug_branch} with ${email_branch}`);

      const repoFiltered = repositoryData.filter(
        (item) => item.repo_slug === repo_slug_branch
      );

      const repoFilteredName = repoFiltered.filter(
        (item) => item.email === email_branch
      );

      const repoFiltered2 = repositoryData2.filter(
        (item) => item.repo_slug === repo_slug_branch
      );

      const repoFiltered2Name = repoFiltered2.filter(
        (item) => item.email === email_branch
      );

      if (repoFiltered2Name.length === 0 || repoFilteredName.length === 0) {
        const data = {
          name: name,
          email: email_branch,
          project_key: project_key,
          repo_slug: repo_slug_branch,
          perm: "REPO_WRITE",
        };
        dataAll.push(data);
      }
    }

    if (dataAll.length === 0) {
      return res.status(200).json({
        status: "Success",
        statusCode: 200,
        message: "No Branch to be assigned",
        data: dataAll,
      });
    } else {
      const csvData = await parseAsync(dataAll);

      fs.writeFileSync(`perm_repo_for_branch.csv`, csvData, "utf-8");

      return res.status(200).json({
        status: "Success",
        statusCode: 200,
        message: "Successfully assign Branch",
        data: dataAll,
      });
    }
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

async function readRepositoryPerm(filePath) {
  const repositoryData = [];
  const dataStream = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ",",
      from_line: 2,
      to_line: 999999,
    })
  );

  dataStream.on("data", function (row) {
    const repo_slug = row[4];
    const project_key = row[3];
    const email = row[1];
    const permission = row[5];
    const name = row[0];

    // Map CSV data to your desired structure
    repositoryData.push({
      project_key: project_key,
      repo_slug: repo_slug,
      email: email,
      perm: permission,
      name: name,
    });
  });

  await new Promise((resolve) => {
    dataStream.on("end", function () {
      resolve();
    });
  });

  return repositoryData;
}

async function readBranchPerm(filePath, minLine, maxLine) {
  const branchData = [];
  const dataStream = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ",",
      from_line: 2,
      to_line: 999999,
    })
  );

  dataStream.on("data", function (row) {
    const project_key = row[8];
    const repo_slug = row[9];
    const email = row[2];
    const name = row[1];

    // Map CSV data to your desired structure
    branchData.push({
      project_key: project_key,
      repo_slug: repo_slug,
      email: email,
      name: name,
    });
  });

  await new Promise((resolve) => {
    dataStream.on("end", function () {
      resolve();
    });
  });

  return branchData;
}

async function readRepositoryPerm2(filePath) {
  const repositoryData = [];
  const dataStream = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ",",
      from_line: 2,
      to_line: 999999,
    })
  );

  dataStream.on("data", function (row) {
    const repo_slug = row[3];
    const project_key = row[0];
    const email = row[2];
    const permission = row[4];
    const name = row[1];

    // Map CSV data to your desired structure
    repositoryData.push({
      project_key: project_key,
      repo_slug: repo_slug,
      email: email,
      perm: permission,
      name: name,
    });
  });

  await new Promise((resolve) => {
    dataStream.on("end", function () {
      resolve();
    });
  });

  return repositoryData;
}
