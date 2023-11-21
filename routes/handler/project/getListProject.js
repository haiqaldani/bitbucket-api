const { default: axios } = require("axios");
const fs = require("fs");
const { parseAsync } = require("json2csv");
const { last } = require("lodash");

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const headers = {
      Authorization: `Bearer ${payload.access_token}`,
      Accept: "application/json",
    };

    let start = 0;
    let allProjects = [];
    let isLastPage = false;

    while (isLastPage === false) {
      const apiUrl = `http://${payload.server}/rest/api/latest/projects?limit=100&&start=${start}`;

      const data = await axios.get(apiUrl, { headers });

      const jsonData = data.data.values;

      allProjects.push(...jsonData);

      console.log(start);

      if (jsonData.length < 100) {
        isLastPage = true;
      } else {
        start += 100;
      }
    }

    const filePath = `onprem_project.csv`;

    const csvData = await parseAsync(allProjects);

    fs.writeFileSync(filePath, csvData, "utf-8");

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: `Get All Project in On Prem Success`,
      data: {
        totalProject: allProjects.length,
      },
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
