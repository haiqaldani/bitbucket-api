const { default: axios } = require("axios");
const fs = require("fs");
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${payload.access_token}`,
    };

    const allData = [];
    const storeData= []

    const data = await axios.get(
      `https://api.bitbucket.org/2.0/workspaces/${payload.workspace}/members?pagelen=100&page=1`,
      {
        headers,
      }
    );

    allData.push(...data.data.values);

    const dataPage = Math.ceil(data.data.size / 100);

    for (let i = 1; i < dataPage; i++) {

      const dataNext = await axios.get(
        `https://api.bitbucket.org/2.0/workspaces/${
          payload.workspace
        }/members?pagelen=100&page=${i + 1}`,
        {
          headers,
        }
      );

      allData.push(...dataNext.data.values);

      console.log(i+1)
    }

    for (let index = 0; index < allData.length; index++) {
      storeData.push(allData[index].user) 
    }

    const filePath = `${payload.workspace}_user.csv`;

    const csvData = await parseAsync(storeData);

    fs.writeFileSync(filePath, csvData, "utf-8");

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: `Get All User in Workspace ${payload.workspace} Success`,
      data: storeData
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
