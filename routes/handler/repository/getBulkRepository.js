const { default: axios } = require("axios");
const fs = require("fs");
const { parseAsync } = require('json2csv');

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const headers = {
      Authorization: `Bearer ${payload.access_token}`,
      Accept: "application/json",
    };

    const apiUrl = `https://api.bitbucket.org/2.0/repositories/${
      payload.workspace
    }${payload.page ? `?page=${payload.page}` : ""}${
      payload.pagelen ? `&pagelen=${payload.pagelen}` : ""
    }`;

    const data = await axios.get(apiUrl, { headers });

    const jsonData = data.data.values;

    const issueNum = (jsonData.length * payload.page) + 1 - 100;

    const issueLast = issueNum + jsonData.length - 1;

    const filePath = `${payload.workspace}_${issueNum}-${issueLast}.csv`;

    const csvData = await parseAsync(jsonData);

    fs.writeFileSync(filePath, csvData, "utf-8");

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: `Get Workspace ${payload.workspace} Repository ${issueNum}-${issueLast} Success`,
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
