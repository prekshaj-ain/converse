const fs = require("fs");

const removeLocalFile = (localPath) => {
  fs.unlink(localPath, (err) => {
    if (err) console.log("Error while removing local files: ", err);
    else {
      console.log("Removed local: ", localPath);
    }
  });
};

const getLocalPath = (fileName) => {
  return `public/images/${fileName}`;
};

const getStaticFilePath = (req, fileName) => {
  return `${req.protocol}://${req.get("host")}/images/${fileName}`;
};

module.exports = {
  removeLocalFile,
  getLocalPath,
  getStaticFilePath,
};
