const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "list-permission.csv";
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const data = [];

    const dataStream = fs.createReadStream(filePath).pipe(
      parse({
        delimiter: ",",
        from_line: parseInt(payload.min),
        to_line: parseInt(payload.max),
      })
    );

    const requests = [];
    dataStream.on("data", async function (row) {
      const user = row[0];
      const permission = row[1];

      const userParse = JSON.parse(user);
      const userEmail = userParse.emailAddress;
      const userDisplayName = userParse.displayName;
      const userName = userParse.name;

      requests.push({
        name: userName,
        email: userEmail,
        displayName: userDisplayName,
        permission: permission,
      });
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      for (let index = 0; index < requests.length; index++) {
        const r = {
          name: requests[index].name,
          email: requests[index].email,
          displayName: requests[index].displayName,
          permission: requests[index].permission,
        };

        data.push(r);
      }

      // console.log(data);

      const csvData = await parseAsync(data);

      fs.writeFileSync(`CovertUserListPermission.csv`, csvData, "utf-8");

      return res.status(200).json({
        status: "Success",
        statusCode: 200,
        data: data,
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
      message: error.message,
    });
  }
};
