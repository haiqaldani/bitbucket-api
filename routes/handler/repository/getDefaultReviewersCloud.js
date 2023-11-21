const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "list-repo.csv";
const targetPath = "default-reviewers.csv";
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
      const repo_slug = row[1];
      const project_key = row[2];

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
          `http://${payload.server}/rest/default-reviewers/latest/projects/${project_key}/repos/${repo_slug}/conditions`,
          {
            headers,
          }
        );


        const r = reviewer.data;
        console.log(repo_slug);

        if (r.length !== 0) {
          for (let i = 0; i < r[0].reviewers.length; i++) {
            const userParse = r[0].reviewers[i];
            const userEmail = userParse.emailAddress;
            const userDisplayName = userParse.displayName;
            const userName = userParse.name;
            const dataAll = {
              name: userName,
              email: userEmail,
              display_name: userDisplayName,
              project_key: project_key,
              repo_slug: repo_slug,
            };
            data.push(dataAll);
          }
        }
      }

      if (data.length !== 0) {
        const csvData = await parseAsync(data);

        fs.writeFileSync(
          `default_reviewer_repo_${payload.min}-${payload.max}.csv`,
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
      message: error,
    });
  }
};
