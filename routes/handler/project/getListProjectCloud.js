const { default: axios } = require("axios");
const fs = require("fs");
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const headers = {
      Authorization: `Bearer ${payload.access_token}`,
      Accept: "application/json",
    };


    const dataCSV = [];

    const dataSize = await axios.get(`https://api.bitbucket.org/2.0/workspaces/${payload.workspace}/projects?pagelen=100`, { headers });

    console.log(dataSize.data.size);

    const size = Math.ceil(dataSize.data.size / 100);

    for (let i = 1; i <= size; i++) {
      const apiUrl = `https://api.bitbucket.org/2.0/workspaces/${payload.workspace}/projects?page=${i}&pagelen=100`;

      console.log(i);

      const data = await axios.get(apiUrl, { headers });

      const jsonData = data.data.values;

      if (i === 1) {
        dataCSV.push(...jsonData);
      } else {
        dataCSV.push(...jsonData.slice(1));
      }
    }

    const filePath = `${payload.workspace}_project.csv`;

    const csvData = await parseAsync(dataCSV);

    fs.writeFileSync(filePath, csvData, "utf-8");

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: `Get All Project in Workspace ${payload.workspace} Success`,
      data : {
        totalPage: size,
        totalProject: dataSize.data.size
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
