const { default: axios } = require("axios");
const { google } = require("googleapis");

module.exports = async (req, res) => {
  const payload = req.body;

  try {
    const auth = new google.auth.GoogleAuth({
      // Add your authentication credentials here
      keyFile: "googleServices.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const headers = {
      Authorization: `Basic ${Buffer.from(
        `${payload.email}:${payload.apiKey}`
      ).toString("base64")}`,
    };

    const sheets = google.sheets({ version: "v4", auth });

    const spreadsheetId = payload.spreadsheetId;
    const rangeRead = payload.rangeRead;
    const rangeWrite = payload.rangeWrite;

    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: rangeRead,
    });

    const values = readResponse.data.values;
    const userIds = values.map((row) => row[0]);

    var statusError = [];
    var data = [];

    for (const [index, userId] of userIds.entries()) {
      try {
        await axios.delete(
          `https://${payload.atlassian}.atlassian.net/rest/api/3/user?accountId=${userId}`,
          {
            headers,
          }
        );
        console.log(`Delete Success for UserID ${userId}`);
        data.push({
          range: `${rangeWrite}${index+1}`,
          values: [[`Delete Success for UserID ${userId}`]],
        });
      } catch (error) {
        console.error(`Error for UserID ${userId}:`, error.message);
        data.push({
          range: `${rangeWrite}${index+1}`,
          values: [[`Delete Error for UserID ${userId}: ${error.message}`]],
        });
        statusError.push({
          userId: userId,
          message: `Delete Error for UserID ${userId}: ${error.message}`,
        });
      }
    }

    sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      resource: {
        data,
        valueInputOption: "USER_ENTERED",
      },
    });

    if (statusError.length === 0) {
      return res.status(200).json({
        status: "success",
        statusCode: 200,
        data: "All User Deleted",
      });
    }

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      data: statusError,
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
