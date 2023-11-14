const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "branch.csv";
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
        from_line: parseInt(payload.min) + 1,
        to_line: parseInt(payload.max) + 1,
      })
    );

    const requests = [];
    dataStream.on("data", async function (row) {
      const project_key = row[0];
      const repo_slug = row[5];

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

        const data = {
          
        }

        const reviewer = await axios.post(
          `https://api.bitbucket.org/2.0/repositories/${payload.workspace}/${repo_slug}/branch-restrictions`,
          {
            headers,
          },
          data
        );

        const r = reviewer.data;
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
