const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;

  if (payload.batch === false) {
    filePath = `onprem_repository.csv`;
  } else {
    filePath = `onprem_repository_${payload.batch}.csv`;
  }

  try {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${payload.access_token}`,
    };

    const data = [];

    let userData;

    if (payload.workspace) {
      userData = await readUser(`${payload.workspace}_user.csv`);
    }

    // console.log(userData)

    const dataStream = fs.createReadStream(filePath).pipe(
      parse({
        delimiter: ",",
        from_line: 2,
        to_line: 99999999,
      })
    );

    const requests = [];
    dataStream.on("data", async function (row) {
      const repo_slug = row[0];
      const project = row[8];

      const projectJson = JSON.parse(project);

      const project_key = projectJson.key;

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

        let start = 1;
        let isLastPage = false;

        while (isLastPage === false) {
          const apiUrl = `http://${payload.server}/rest/api/latest/projects/${project_key}/repos/${repo_slug}/permissions/users?start=${start}&limit=100`;

          const reviewer = await axios.get(apiUrl, { headers });

          if (reviewer.data.isLastPage === true) {
            isLastPage = true;
          } else {
            start += 100;
          }

          console.log(`Project: ${project_key} with ${repo_slug} = Number ${index+1}`);
          const r = reviewer.data;

          if (r.values.length !== 0) {
            for (let i = 0; i < r.values.length; i++) {
              let resultUser;
              if (userData != null) {
                resultUser = userData.find(
                  (item) => item.name === r.values[i].user.displayName
                );
              }

              const userParse = r.values[i].user;
              const userEmail = userParse.emailAddress;
              const userDisplayName = userParse.displayName;
              const userName = userParse.name;
              const dataR = {
                name: userName,
                email: userEmail,
                displayName: userDisplayName,
                project_key: project_key,
                repo_slug: repo_slug,
                permission: r.values[i].permission,
                uuid: resultUser?.uuid || null,
                account_id: resultUser?.account_id || null,
              };
              data.push(dataR);
            }
          }
        }
      }

      // console.log(data);

      if (data.length !== 0) {
        const csvData = await parseAsync(data);

        var filePath2;

        if (payload.batch === false) {
          filePath2 = `onprem_permission_repo.csv`;
        } else {
          filePath2 = `onprem_permission_repo_${payload.batch}.csv`;
        }

        fs.writeFileSync(filePath2, csvData, "utf-8");

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

  async function readUser(filePath) {
    const userData = [];
    const dataStream = fs.createReadStream(filePath).pipe(
      parse({
        delimiter: ",",
        from_line: 2,
        to_line: 999999,
      })
    );

    dataStream.on("data", function (row) {
      const name = row[0];
      const uuid = row[3];
      const account_id = row[4];

      // Map CSV data to your desired structure
      userData.push({
        name: name,
        uuid: uuid,
        account_id: account_id,
      });
    });

    await new Promise((resolve) => {
      dataStream.on("end", function () {
        resolve();
      });
    });

    return userData;
  }
};
