const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "project.csv";
const targetPath = "default-reviewers.csv";
const { parseAsync } = require('json2csv');


module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${payload.access_token}`,
    };

    const statusError = [];

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
      const project_key = row[0];

      requests.push(project_key);
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      for (let index = 0; index < requests.length; index++) {
        const project_key = requests[index];

        const reviewer = await axios.get(
          `http://${payload.server}/rest/default-reviewers/latest/projects/${project_key}/repos/${repo_slug}/conditions`,
          {
            headers,
          }
        );

        const r = reviewer.data;

        if (r.values.length !== 0) {
          for (let i = 0; i < r.values.length; i++) {
            const userParse = r.values[i].user;
            const userEmail = userParse.emailAddress;
            const userDisplayName = userParse.displayName;
            const userName = userParse.name;
            const dataR = {
              name: userName,
              email: userEmail,
              displayName: userDisplayName,
              project_key: project_key,
              repo_slug: repo_slug,
              permission: r.values[i].permission,
            };
            data.push(dataR);
          }

        }
      }

      // console.log(data);

      const csvData = await parseAsync(data);

      fs.writeFileSync(targetPath, csvData, "utf-8");

      return res.status(200).json({
        status: "error",
        statusCode: 200,
        data: data,
      });
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
