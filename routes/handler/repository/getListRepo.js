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

      const maxRecordsPerFile = 1000; // Adjust this as needed
      const csvFiles = [];
      let fileIndex = 1;

      for (let index = 0; index < requests.length; index++) {
        const project_key = requests[index].project_key;
        let start = 0;
        let isLastPage = false;

        while (isLastPage === false) {
          const apiUrl = `http://${payload.server}/rest/api/latest/projects/${project_key}/repos?limit=100&start=${start}`;
          const r = await axios.get(apiUrl, { headers });
          const jsonData = r.data.values;

          if (jsonData.length === 0) {
            isLastPage = true;
            continue;
          }

          data.push(...jsonData);

          console.log(`Project: ${project_key}`);

          if (r.data.isLastPage === true) {
            isLastPage = true;
          } else {
            start += 100;
          }
        }
      }

      if (data.length !== 0) {
        let recordsWritten = 0;
        let currentDataIndex = 0;

        while (currentDataIndex < data.length) {
          const slicedData = data.slice(
            currentDataIndex,
            currentDataIndex + maxRecordsPerFile
          );
          const csvData = await parseAsync(slicedData);
          const fileName = `onprem_repository_${fileIndex}.csv`;

          fs.writeFileSync(fileName, csvData, "utf-8");
          csvFiles.push(fileName);

          recordsWritten += slicedData.length;
          currentDataIndex += maxRecordsPerFile;
          fileIndex++;
        }

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
