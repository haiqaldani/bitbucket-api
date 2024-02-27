const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const auth = `${payload.email}:${payload.api_token}`;

    const headers = {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(auth).toString("base64")}`,
    };

    const data = [];

    const dataStream = fs.createReadStream(`${payload.workspace}_users.csv`).pipe(
      parse({
        delimiter: ",",
        from_line: 2,
        to_line: 99999999,
      })
    );

    const requests = [];
    dataStream.on("data", async function (row) {
      const account_id = row[1];
      const name = row[0];

      requests.push({
        account_id: account_id,
        name: name,
      });
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      for (let index = 0; index < requests.length; index++) {
        const acc = requests[index].account_id;
        const name = requests[index].name;

        // console.log(acc)
        console.log(acc)

        const assign = await axios.get(
          `https://api.bitbucket.org/2.0/users/${acc}`,
          {
            headers,
          }
        );

        // const r = assign.data;

        console.log(assign);

        // const fullData = {
        //   name: name,
        //   uuid: r.uuid,
        //   account: acc,
        //   account_status: r.account_status,
        //   type: r.type,
        //   is_staff: r.is_staff,
        // };

        // data.push(fullData);
      }

      // console.log(data);

      // const csvData = await parseAsync(data);

      // fs.writeFileSync(
      //   `${payload.workspace}_bitbucket_users`,
      //   csvData,
      //   "utf-8"
      // );

      return res.status(200).json({
        status: "Success",
        statusCode: 200,
        data: data
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
      message: error,
    });
  }
};
