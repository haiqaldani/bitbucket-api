const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "list-repo.csv";
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${payload.access_token}`,
    };

    const data = [];

    const dataStream = fs.createReadStream(filePath).pipe(
      parse({
        delimiter: ",",
        from_line: parseInt(payload.min),
        to_line: parseInt(payload.max),
      })
    );

    const requests = [];
    dataStream.on("data", async function (row) {
      const project_key = row[2];
      const repo_slug = row[1];

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
        console.log(repo_slug);

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
                    const group_name = values.groups[m];
                    const type_branch = values.scope.type;
                    const type = values.type;
                    const matcher = values.matcher.id;
                    const matcher_type = values.matcher.type.id;

                    data.push({
                      name: name,
                      display_name: display_name,
                      group_name: group_name,
                      type_branch: type_branch,
                      type: type,
                      matcher: matcher,
                      matcher_type: matcher_type,
                      project_key: project_key,
                      repo_slug: repo_slug,
                      size: nextCall.data.size,
                      limit: nextCall.data.limit,
                    });
                  }
                }

                if (values.users.length > 0) {
                  for (let n = 0; n < values.users.length; n++) {
                    const name = values.users[n].name;
                    const display_name = values.users[n].displayName;
                    const group_name = null;
                    const type_branch = values.scope.type;
                    const type = values.type;
                    const matcher = values.matcher.id;
                    const matcher_type = values.matcher.type.id;

                    data.push({
                      name: name,
                      display_name: display_name,
                      group_name: group_name,
                      type_branch: type_branch,
                      type: type,
                      matcher: matcher,
                      matcher_type: matcher_type,
                      project_key: project_key,
                      repo_slug: repo_slug,
                      size: nextCall.data.size,
                      limit: nextCall.data.limit,
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
                  const group_name = values.groups[m];
                  const type_branch = values.scope.type;
                  const type = values.type;
                  const matcher = values.matcher.id;
                  const matcher_type = values.matcher.type.id;

                  data.push({
                    name: name,
                    display_name: display_name,
                    group_name: group_name,
                    type_branch: type_branch,
                    type: type,
                    matcher: matcher,
                    matcher_type: matcher_type,
                    project_key: project_key,
                    repo_slug: repo_slug,
                    size: r.size,
                    limit: r.limit,
                  });
                }
              }

              if (values.users.length > 0) {
                for (let n = 0; n < values.users.length; n++) {
                  const name = values.users[n].name;
                  const display_name = values.users[n].displayName;
                  const group_name = null;
                  const type_branch = values.scope.type;
                  const type = values.type;
                  const matcher = values.matcher.id;
                  const matcher_type = values.matcher.type.id;

                  data.push({
                    name: name,
                    display_name: display_name,
                    group_name: group_name,
                    type_branch: type_branch,
                    type: type,
                    matcher: matcher,
                    matcher_type: matcher_type,
                    project_key: project_key,
                    repo_slug: repo_slug,
                    size: r.size,
                    limit: r.limit,
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

        fs.writeFileSync(
          `branch_${payload.min}-${payload.max}.csv`,
          csvData,
          "utf-8"
        );

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
};
