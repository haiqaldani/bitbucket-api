const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");

const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${payload.access_token}`,
    };

    const data = [];

    const filePath = `${payload.workspace}_repository.csv`;

    let min;
    let max;

    if (!payload.min && !payload.max) {
      min = 2;
      max = 99999999;
    } else {
      min = payload.min;
      max = payload.max;
    }

    const first = min - 1;
    const last = max - 1;
    console.log(`${first} - ${last}`);

    const dataStream = fs.createReadStream(filePath).pipe(
      parse({
        delimiter: ",",
        from_line: min,
        to_line: max,
      })
    );

    const requests = [];
    dataStream.on("data", async function (row) {
      const repo_slug = row[4];

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
          const apiUrl = `https://api.bitbucket.org/2.0/repositories/${payload.workspace}/${repo_slug}/permissions-config/users?page=${start}&pagelen=25`;

          const reviewer = await axios.get(apiUrl, { headers });

          const size = Math.ceil(reviewer.data.size / 100);

          if (start === size || size === 0) {
            isLastPage = true;
          } else {
            start += 1;
          }

          console.log(`Repo: ${repo_slug} = Number ${index + 1} size ${reviewer.data.size} page ${size}`);
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
                repo_slug: repo_slug,
                permission: r.values[i].permission,
              };
              data.push(dataR);
            }
          }
        }
      }

      // console.log(data);

      if (data.length !== 0) {
        const csvData = await parseAsync(data);

        if (payload.batch) {
          fs.writeFileSync(
            `${payload.workspace}_permission_repos_${payload.batch}.csv`,
            csvData,
            "utf-8"
          );
        } else {
          fs.writeFileSync(
            `${payload.workspace}_permission_project.csv`,
            csvData,
            "utf-8"
          );
        }

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
