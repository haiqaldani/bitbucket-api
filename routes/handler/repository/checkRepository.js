const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "data.csv";

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const headers = {
      Authorization: `Bearer ${payload.access_token}`,
      Accept: "application/json",
    };

    const statusError = [];

    const dataStream = fs.createReadStream(filePath).pipe(
      parse({
        delimiter: ",",
        from_line: parseInt(payload.min) + 1,
        to_line: parseInt(payload.max) + 1,
      })
    );

    const requests = [];
    dataStream.on("data", async function (row) {
      const repo_slug = row[1];

      const request = axios
        .get(
          `https://api.bitbucket.org/2.0/repositories/${payload.workspace}/${repo_slug}`,
          {
            headers,
          }
        )
        .then(() => {
          console.log(`Check Success for Repo Slug: ${repo_slug}`);
        })
        .catch((error) => {
          console.error(`Error for Repo Slug ${repo_slug}:`, error.message);
          statusError.push({
            row: row[0],
            repoSlug: repo_slug,
            message: `Check Error for Repo Slug ${repo_slug}: ${error.message}`,
          });
        });

      requests.push(request);
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      const totalData = payload.max;
      const totalSuccess = totalData - statusError.length;
      const totalError = statusError.length;

      statusError.sort((a, b) => parseInt(a.row) - parseInt(b.row));

      if (statusError.length === 0) {
        return res.status(200).json({
          status: "success",
          statusCode: 200,
          listRow: `${payload.min} - ${payload.max}`,
          totalData: totalData,
          data: "ALL REPO CHECKED",
        });
      }

      return res.status(200).json({
        status: "success",
        statusCode: 200,
        listRow: `${payload.min} - ${payload.max}`,
        totalSuccess: totalSuccess,
        totalError: totalError,
        data: statusError,
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
