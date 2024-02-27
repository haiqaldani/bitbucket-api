const { default: axios } = require("axios");
const fs = require("fs");
const _ = require("lodash");
const { parse } = require("csv-parse");
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;
  // const repositoryFilePath = `${payload.workspace}_repository.csv`;

  let filePath;

  if (payload.batch === false) {
    filePath = `onprem_branch.csv`;
  } else {
    filePath = `onprem_branch_${payload.batch}.csv`;
  }

  let repositoryFilePath

  if (payload.batch === false) {
    repositoryFilePath = `onprem_repository.csv`;
  } else {
    repositoryFilePath = `onprem_repository_${payload.batch}.csv`;
  }

  try {
    const headers = {
      Accept: "application/json",
      Content: "application/json",
      Authorization: `Basic ${payload.access_token}`,
    };

    const dataAll = [];

    const repositoryData = await readRepository(repositoryFilePath);
    const branchData = await readBranch(filePath);

    for (let i = 0; i < repositoryData.length; i++) {
      const repo_slug = repositoryData[i].repo_slug;

      // console.log(repo_slug);

      const filteredData = branchData.filter(
        (item) => item.repo_slug === repo_slug
      );

      // console.log(filteredData);

      if (filteredData.length > 0) {
        const result = await modelSelection(
          payload.workspace,
          filteredData,
          repo_slug,
          headers
        );

        dataAll.push(...result);
      }
    }

    const csvData = await parseAsync(dataAll);

    fs.writeFileSync(`onprem_branch_to_cloud_${payload.batch}.csv`, csvData, "utf-8");

    return res.status(200).json({
      status: "Success",
      statusCode: 200,
      message: "Successfully assign Branch",
      // data: dataAll,
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

async function readRepository(filePath) {
  const repositoryData = [];
  const dataStream = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ",",
      from_line: 2,
      to_line: 9999999,
    })
  );

  dataStream.on("data", function (row) {
    const repo_slug = row[0];

    // Map CSV data to your desired structure
    repositoryData.push({
      repo_slug: repo_slug,
    });
  });

  await new Promise((resolve) => {
    dataStream.on("end", function () {
      resolve();
    });
  });

  return repositoryData;
}

async function readBranch(filePath) {
  const branchData = [];
  const dataStream = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ",",
      from_line: 2,
      to_line: 999999,
    })
  );

  dataStream.on("data", function (row) {
    const type = row[5];
    const matcher = row[6];
    const matcher_type = row[7];
    const project_key = row[8];
    const repo_slug = row[9];
    const uuid = row[13];

    // Map CSV data to your desired structure
    branchData.push({
      type: type,
      matcher: matcher,
      matcher_type: matcher_type,
      project_key: project_key,
      repo_slug: repo_slug,
      uuid: uuid,
    });
  });

  await new Promise((resolve) => {
    dataStream.on("end", function () {
      resolve();
    });
  });

  return branchData;
}

async function modelSelection(workspace, data, repo_slug, headers) {
  const result = [];
  const modelData = data.filter(
    (item) => item.matcher_type === "MODEL_CATEGORY"
  );
  const patternData = data.filter(
    (item) => item.matcher_type !== "MODEL_CATEGORY"
  );

  if (modelData.length > 0) {
    const model = await modelAPI(
      workspace,
      modelData,
      repo_slug,
      headers,
      "branching_model"
    );
    result.push(...model);
  }
  if ([patternData].length > 0) {
    const pattern = await modelAPI(
      workspace,
      patternData,
      repo_slug,
      headers,
      "glob"
    );
    result.push(...pattern);
  }

  console.log(result)

  return result;
}

async function modelAPI(
  workspace,
  data,
  repo_slug,
  headers,
  branch_match_kind
) {
  const result = [];

  const branchGroup = _.groupBy(data, "matcher");

  for (const matcher in branchGroup) {
    const dataMatcher = [];

    branchGroup[matcher].forEach((item) => {
      dataMatcher.push({
        type: item.type,
        uuid: item.uuid,
      });
    });

    const data1 = dataMatcher.filter(
      (item) => item.type === "no-deletes" || item.type === "read-only"
    );
    const data2 = dataMatcher.filter(
      (item) => item.type === "pull-request-only"
    );
    const data3 = dataMatcher.filter(
      (item) => item.type === "fast-foward-only"
    );

    if (data1.length > 0) {
      const result1 = await runAPI(
        workspace,
        data1,
        4,
        repo_slug,
        headers,
        branch_match_kind,
        matcher
      );
      result.push(...result1);
    }
    if (data2.length > 0) {
      const result2 = await runAPI(
        workspace,
        data2,
        3,
        repo_slug,
        headers,
        branch_match_kind,
        matcher
      );
      result.push(...result2);
    }
    if (data3.length > 0) {
      const result3 = await runAPI(
        workspace,
        data3,
        2,
        repo_slug,
        headers,
        branch_match_kind,
        matcher
      );
      result.push(...result3);
    }
  }

  return result;
}

async function runAPI(
  workspace,
  dataSelection,
  totalKind,
  repo_slug,
  headers,
  branch_match_kind,
  matcher
) {
  const result = [];
  const kind = ["push", "restrict_merges", "force", "delete"];
  for (let index = 0; index < totalKind; index++) {
    const users = [];

    for (let i = 0; i < dataSelection.length; i++) {
      if (dataSelection[i].uuid !== "#N/A") {
        users.push({
          aid_id: dataSelection[i].uuid,
        });
      }
    }

    var data;

    console.log("disini")

    if (index === 2 || index === 3) {
      data = {
        repo_slug: repo_slug,
        kind: kind[index],
        pattern: matcher,
        branch_match_kind: branch_match_kind,
        users: [],
        groups: [],
      };
    } else {
      data = {
        repo_slug: repo_slug,
        kind: kind[index],
        pattern: matcher,
        branch_match_kind: branch_match_kind,
        users: users,
        groups: [],
      };
    }

    // const run = await axios.post(
    //   `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo_slug}/branch-restrictions`,
    //   {
    //     headers,
    //   },
    //   data
    // );

    result.push(data);
  }

  console.log(result);
  return result;
}
