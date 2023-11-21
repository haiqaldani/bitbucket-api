const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;
  const filePath = `${payload.workspace}_project.csv`;

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
      const project_key = row[3];

      requests.push({
        project_key: project_key,
      });
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      for (let index = 0; index < requests.length; index++) {
        const project_key = requests[index].project_key;

        const reviewer = await axios.get(
          `https://api.bitbucket.org/2.0/workspaces/${payload.workspace}/projects/${project_key}/permissions-config/users?pagelen=100`,
          {
            headers,
          }
        );

        console.log(project_key);

        const r = reviewer.data;

        if (r.values.length !== 0) {
          for (let i = 0; i < r.values.length; i++) {
            const userParse = r.values[i].user;
            const userUuid = userParse.uuid;
            const userDisplayName = userParse.display_name;
            const userId = userParse.account_id;
            const dataR = {
              displayName: userDisplayName,
              uuid: userUuid,
              accountId: userId,
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

        fs.writeFileSync(
          `permission_project_cloud_${payload.workspace}.csv`,
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
