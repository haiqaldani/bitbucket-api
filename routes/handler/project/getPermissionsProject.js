const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "list-project.csv";
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

      requests.push({
        project_key: project_key,
      });
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      for (let index = 0; index < requests.length; index++) {
        const project_key = requests[index].project_key;

        const reviewer = await axios.get(
          `http://${payload.server}/rest/api/latest/projects/${project_key}/permissions/users?limit=100`,
          {
            headers,
          }
        );

        console.log(project_key);

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
              permission: r.values[i].permission,
            };
            data.push(dataR);
          }
        }
      }

      // console.log(data);

      if (data.length !== 0) {
        const csvData = await parseAsync(data);

        fs.writeFileSync(`permission_project_${payload.min}-${payload.max}.csv`, csvData, "utf-8");

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
