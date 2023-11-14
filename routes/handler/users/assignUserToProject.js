const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "bitbucket_admin.csv";
// const { parseAsync } = require('json2csv');


module.exports = async (req, res) => {
  const payload = req.body;


  try {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${payload.api_token}`,
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
      const usernames = row[0];

      requests.push(usernames);
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      for (let index = 0; index < requests.length; index++) {
        const username = requests[index];
        console.log(username)

        const assign = await axios.put(
        `http://${payload.server}/rest/api/latest/projects/${payload.project_key}/permissions/users?name=${username}&permission=${payload.permission}`,
          {
            headers,
          },
        );

        const r = assign.data;

        if (r.length !== 0) {
          data.push(...assign.data);
        }
      }

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
