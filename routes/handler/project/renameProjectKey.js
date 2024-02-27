const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "renameProjectKey.csv";
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const headers = {
      Accept: "application/json",
      // Authorization: `Bearer ${payload.access_token}`,
    };

    const dataAll = [];

    const dataStream = fs.createReadStream(filePath).pipe(
      parse({
        delimiter: ",",
        from_line: 2,
        to_line: 9999999
      })
    );

    const requests = [];
    dataStream.on("data", async function (row) {
      const project_key = row[2];
      const renameProject_key = row[7];

      requests.push({
        project_key: project_key,
        renameProject_key: renameProject_key,
      });
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      for (let index = 0; index < requests.length; index++) {
        const project_key = requests[index].project_key;
        const renameProject_key = requests[index].renameProject_key;

        const data = {
          key: renameProject_key,
        };

        const reviewer = await axios.put(
          `http://${payload.server}/rest/api/latest/projects/${project_key}`,
          {
            auth: {
              username: payload.username,
              password: payload.password,
            },
            headers,
          },
          data
        );

        console.log(project_key);

        const r = reviewer.data;

        dataAll.push(r);
      }

      // console.log(data);

      return res.status(200).json({
        status: "Success",
        statusCode: 200,
        message: "Success Rename Project",
        data: dataAll,
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
      message: error.message,
    });
  }
};
