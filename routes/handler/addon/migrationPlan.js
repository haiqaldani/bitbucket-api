const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "onprem_repository.csv";

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const headers = {
      Accept: "application/json",
    };

    const dataStream = fs.createReadStream(filePath).pipe(
      parse({
        delimiter: ",",
        from_line: 2,
        to_line: 999999,
      })
    );

    const requests = [];
    dataStream.on("data", async function (row) {
      const repository_id = row[1];

      requests.push(parseInt(repository_id));
    });

    dataStream.on("end", async function () {
      const totalBatch = Math.ceil(requests.length / 1000);
      const response = [];

      for (let index = 0; index < totalBatch; index++) {
        const repos = requests.slice(index * 1000, (index + 1) * 1000);

        const data = {
          name: `Migration API ${index + 1}`,
          cloudSite: {
            cloudBaseUrl: "https://bitbucket.org",
            cloudApiBaseUrl: "https://api.bitbucket.org",
            cloudId: payload.cloudId,
            cloudUrl: `https://bitbucket.org/%7B${payload.cloudId}%7D`,
            workspace: {
              uuid: payload.cloudId,
              name: payload.workspace,
              baseUrl: "https://bitbucket.org",
              apiBaseUrl: "https://api.bitbucket.org",
              isSumEnabled: true,
            },
          },
          repositoryIds: repos,
          preflightCheckExecutionId: payload.executionId,
          userMigrationType: "PrUsers",
        };

        console.log(data.repositoryIds.length);

        try {
          const reviewer = await axios.post(
            `http://${payload.server}/rest/migration/latest/plan/save`,
            data,
            {
              auth: {
                username: payload.username,
                password: payload.access_token,
              },
              headers,
            }
          );

          const r = reviewer.data;

          response.push({
            name: `Migration Plan ${index + 1}`,
            result: r,
          });
        } catch (error) {
          console.error("Error occurred during axios request:", error);
          return res.status(500).json({ status: "error", message: error });
        }
      }

      return res.status(200).json({
        status: "success",
        statusCode: 200,
        data: response,
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
