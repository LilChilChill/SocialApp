const fs = require("fs");

const jsonData = JSON.parse(fs.readFileSync("mongo_export.json", "utf8"));

let erdSchema = "";

for (const collection in jsonData) {
  erdSchema += `Table ${collection} {\n  _id ObjectId [pk]\n`;

  if (jsonData[collection].length > 0) {
    const sampleData = jsonData[collection][0];
    for (const key in sampleData) {
      if (key !== "_id") {
        erdSchema += `  ${key} ${typeof sampleData[key]}\n`;
      }
    }
  }

  erdSchema += "}\n\n";
}

fs.writeFileSync("schema.dbml", erdSchema);
console.log("✅ File schema.dbml đã được tạo!");
