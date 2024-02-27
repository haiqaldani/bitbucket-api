const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;

  let filePath;

  if (payload.batch === false) {
    filePath = `onprem_repository.csv`;
  } else {
    filePath = `onprem_repository_${payload.batch}.csv`;
  }

  try {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${payload.access_token}`,
    };

    const data = [];

    let userData;

    if (payload.workspace) {
      userData = await readUser(`${payload.workspace}_user.csv`);
    }

    const dataStream = fs.createReadStream(filePath).pipe(
      parse({
        delimiter: ",",
        from_line: 2,
        to_line: 99999,
      })
    );

    const requests = [];
    dataStream.on("data", async function (row) {
      const project = row[8];
      const repo_slug = row[0];

      const projectJson = JSON.parse(project);
      const project_key = projectJson.key;

      requests.push({
        project_key: project_key,
        repo_slug: repo_slug,
      });
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      for (let index = 0; index < requests.length; index++) {
        const project_key = requests[index].project_key;
        const repo_slug = requests[index].repo_slug;

        const reviewer = await axios.get(
          `http://${payload.server}/rest/branch-permissions/latest/projects/${project_key}/repos/${repo_slug}/restrictions`,
          {
            headers,
          }
        );

        const r = reviewer.data;
        console.log(`Branch Permission: ${project_key} with ${repo_slug}`);

        if (r.values.length !== 0) {
          if (r.isLastPage === false) {
            data.push(reviewer.data);

            const size = Math.ceil(r.size / 25);
            for (let i = 1; i < size; i++) {
              const start = 25 * (i - 1);

              const nextCall = await axios.get(
                `http://${payload.server}/rest/branch-permissions/latest/projects/${project_key}/repos/${repo_slug}/restrictions?start=${start}&limit=25`,
                {
                  headers,
                }
              );

              for (let j = 0; j < nextCall.data.values.length; j++) {
                const values = nextCall.data.values[j];

                if (values.groups.length > 0) {
                  for (let m = 0; m < values.groups.length; m++) {
                    const name = null;
                    const display_name = null;
                    const email = values.emailAddress;
                    const group_name = values.groups[m];
                    const type_branch = values.scope.type;
                    const type = values.type;
                    const matcher = values.matcher.id;
                    const matcher_type = values.matcher.type.id;

                    data.push({
                      name: name,
                      display_name: display_name,
                      email: email,
                      group_name: group_name,
                      type_branch: type_branch,
                      type: type,
                      matcher: matcher,
                      matcher_type: matcher_type,
                      project_key: project_key,
                      repo_slug: repo_slug,
                      size: nextCall.data.size,
                      limit: nextCall.data.limit,
                      uuid: null,
                      account_id: null
                    });
                  }
                }

                if (values.users.length > 0) {
                  for (let n = 0; n < values.users.length; n++) {

                    let resultUser;
                    if (userData != null) {
                      resultUser = userData.find(
                        (item) => item.name === values.users[n].displayName
                      );
                    }

                    const name = values.users[n].name;
                    const display_name = values.users[n].displayName;
                    const email = values.users[n].emailAddress;
                    const group_name = null;
                    const type_branch = values.scope.type;
                    const type = values.type;
                    const matcher = values.matcher.id;
                    const matcher_type = values.matcher.type.id;

                    data.push({
                      name: name,
                      display_name: display_name,
                      email: email,
                      group_name: group_name,
                      type_branch: type_branch,
                      type: type,
                      matcher: matcher,
                      matcher_type: matcher_type,
                      project_key: project_key,
                      repo_slug: repo_slug,
                      size: nextCall.data.size,
                      limit: nextCall.data.limit,
                      uuid: resultUser?.uuid || null,
                      account_id: resultUser?.account_id || null,
                    });
                  }
                }
              }
            }
          } else {
            for (let j = 0; j < r.values.length; j++) {
              const values = r.values[j];

              if (values.groups.length > 0) {
                for (let m = 0; m < values.groups.length; m++) {
                  const name = null;
                  const display_name = null;
                  const email = null;
                  const group_name = values.groups[m];
                  const type_branch = values.scope.type;
                  const type = values.type;
                  const matcher = values.matcher.id;
                  const matcher_type = values.matcher.type.id;

                  data.push({
                    name: name,
                    display_name: display_name,
                    email: email,
                    group_name: group_name,
                    type_branch: type_branch,
                    type: type,
                    matcher: matcher,
                    matcher_type: matcher_type,
                    project_key: project_key,
                    repo_slug: repo_slug,
                    size: r.size,
                    limit: r.limit,
                    uuid: null,
                    access_token: null
                  });
                }
              }

              if (values.users.length > 0) {
                for (let n = 0; n < values.users.length; n++) {
                  let resultUser;
                  if (userData != null) {
                    resultUser = userData.find(
                      (item) => item.name === values.users[n].displayName
                    );
                  }
                  const name = values.users[n].name;
                  const display_name = values.users[n].displayName;
                  const email = values.users[n].emailAddress;
                  const group_name = null;
                  const type_branch = values.scope.type;
                  const type = values.type;
                  const matcher = values.matcher.id;
                  const matcher_type = values.matcher.type.id;

                  data.push({
                    name: name,
                    display_name: display_name,
                    email: email,
                    group_name: group_name,
                    type_branch: type_branch,
                    type: type,
                    matcher: matcher,
                    matcher_type: matcher_type,
                    project_key: project_key,
                    repo_slug: repo_slug,
                    size: r.size,
                    limit: r.limit,
                    uuid: resultUser?.uuid || null,
                    account_id: resultUser?.account_id || null,
                  });
                }
              }
            }
          }
        }
      }

      // console.log(data);

      if (data.length !== 0) {
        const csvData = await parseAsync(data);

        fs.writeFileSync(`onprem_batch_${payload.batch}.csv`, csvData, "utf-8");

        return res.status(200).json({
          status: "Success",
          statusCode: 200,
          data: data,
        });
      } else {
        return res.status(200).json({
          status: "Success",
          statusCode: 200,
          message: "No Data",
        });
      }
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

  async function readUser(filePath) {
    const userData = [];
    const dataStream = fs.createReadStream(filePath).pipe(
      parse({
        delimiter: ",",
        from_line: 2,
        to_line: 999999,
      })
    );

    dataStream.on("data", function (row) {
      const name = row[0];
      const uuid = row[3];
      const account_id = row[4];

      // Map CSV data to your desired structure
      userData.push({
        name: name,
        uuid: uuid,
        account_id: account_id,
      });
    });

    await new Promise((resolve) => {
      dataStream.on("end", function () {
        resolve();
      });
    });

    return userData;
  }
};
