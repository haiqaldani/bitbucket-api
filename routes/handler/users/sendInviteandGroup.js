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
      Authorization: `Bearer ${payload.api_token}`,
    };

    const statusError = [];

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

      requests.push(project_key);
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      for (let index = 0; index < requests.length; index++) {
        const uuid = requests[index];


        const assign = await axios.get(
        `https://api.bitbucket.org/1.0/groups/${payload.workspace}/${payload.group_slug}/members/${uuid}/ `,
          {
            headers,
          },
        );

        const r = assign.data;

        if (r.length !== 0) {
          data.push(...assign.data);
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
