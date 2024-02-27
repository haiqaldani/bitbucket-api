const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "onprem_repository.csv";
const targetPath = "cloud_default-reviewers.csv";
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
        from_line: 2,
        to_line: 9999999,
      })
    );

    const requests = [];
    dataStream.on("data", async function (row) {
      const repo_slug = row[0];

      requests.push({
        repo_slug: repo_slug,
      });
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      for (let index = 0; index < requests.length; index++) {
        const repo_slug = requests[index].repo_slug;

        let start = 1;
        let isLastPage = false;

        while (isLastPage === false) {
          const apiUrl = `http://api.bitbucket.org/2.0/repositories/${payload.workspace}/${repo_slug}/default-reviewers?pagelen=100&page=${start}`;

          const reviewer = await axios.get(apiUrl, { headers });

          const size = Math.ceil(reviewer.data.size / 100);

          console.log(`Size: ${size}`);

          if (start === size || size === 0) {
            isLastPage = true;
          } else {
            start += 1;
          }

          const r = reviewer.data.values;
          console.log(`${r.length} Reviewer in ${repo_slug}`);

          if (r.values.length !== 0) {
            for (let i = 0; i < r.values.length; i++) {
              const userParse = r.values[i].user;
              const username = userParse.username;
              const userDisplayName = userParse.display_name;
              const useruuid = userParse.uuid;
              const dataR = {
                username: username,
                displayName: userDisplayName,
                uuid: useruuid,
                repo_slug: repo_slug,
              };
              data.push(dataR);
            }
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
