const { default: axios } = require("axios");
const fs = require("fs");
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;

  try {

    const auth = `${payload.email}:${payload.api_token}`

    const headers = {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(auth).toString('base64')}`,
    };

    const allData = [];

    var startAt = 1;

    while (true) {
      const data = await axios.get(
        `https://${payload.workspace}.atlassian.net/rest/api/3/users/search?maxResults=50&startAt=${startAt}`,
        {
          headers,
        }
      );

      allData.push(...data.data);

      console.log(startAt)
      startAt += 50;
      console.log(data.data.length)

      if (data.data.length === 0) {
        break;
      }
    }

    const csvData = await parseAsync(allData);

    fs.writeFileSync(`${payload.workspace}_users.csv`, csvData, "utf-8");

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: `Get All User in Workspace ${payload.workspace} Success`,
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
