const { default: axios } = require("axios");
const fs = require("fs");
const { parse } = require("csv-parse");
const filePath = "onprem_project.csv";
const { parseAsync } = require("json2csv");

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${payload.access_token}`,
    };

    const data = [];

    const dataStream = fs.createReadStream(filePath).pipe(
      parse({
        delimiter: ",",
        from_line: 2,
        to_line: 999999,
      })
    );

    const requests = [];
    dataStream.on("data", async function (row) {
      const project_key = row[0];

      requests.push({
        project_key: project_key,
      });
    });

    dataStream.on("end", async function () {
      await Promise.all(requests);

      console.log(requests);

      for (let index = 0; index < requests.length; index++) {
        const project_key = requests[index].project_key;

        let start = 0;
        let isLastPage = false;

        while (isLastPage === false) {
          const apiUrl = `http://${payload.server}/rest/api/latest/projects/${project_key}/repos?limit=100&start=${start}`;

          const r = await axios.get(apiUrl, { headers });

          const jsonData = r.data.values;

          data.push(...jsonData);

          console.log(start);

          if (jsonData.length < 100) {
            isLastPage = true;
          } else {
            start += 100;
          }
        }

        // if (r.values.length !== 0) {
        //   data.push(...r.values);
        // }
      }

      // console.log(data);

      if (data.length !== 0) {
        const csvData = await parseAsync(data);

        fs.writeFileSync(`onprem_repository.csv`, csvData, "utf-8");

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
