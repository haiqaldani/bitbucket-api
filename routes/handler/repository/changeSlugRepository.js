const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "onprem_repository.csv";
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${payload.access_token}`,
    };

    const dataResponse = [];
    const errorResponse = [];

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
      const repo_name = row[2];
      const project = JSON.parse(row[8]);

      const project_key = project.key;

      requests.push({
        project_key: project_key,
        repo_slug: repo_slug,
        repo_name: repo_name,
      });
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      for (let index = 0; index < requests.length; index++) {
        const project_key = requests[index].project_key;
        const repo_slug = requests[index].repo_slug;
        const repo_name = requests[index].repo_name;

        try {
          const data = {
            name: `${project_key}_${repo_slug}`,
            slug: (`${project_key}_${repo_slug}`).toLowerCase(),
          };

          const response = await axios.put(
            `http://${payload.server}/rest/api/latest/projects/${project_key}/repos/${repo_slug}`,
            {
              headers,
            },
            data
          );

          const r = response.data;
          console.log(
            `Success change slug ${repo_slug} to ${project_key}_${repo_slug}`
          );

          const projectKey = r.project.key;
          const projectName = r.project.name;
          const repoName = r.name;
          const repoSlug = r.slug;
          const dataAll = {
            projectName: projectName,
            projectKey: projectKey,
            repoName: repoName,
            repoSlug: repoSlug,
          };
          dataResponse.push(dataAll);
        } catch (error) {
          console.log(
            `Error change slug ${repo_slug} to to ${project_key}_${repo_slug}`
          );
          errorResponse.push({
            project_key: project_key,
            repo_slug: repo_slug,
          });
        }

        return res.status(200).json({
          status: "Success",
          statusCode: 200,
          data: dataResponse,
          error: errorResponse,
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
