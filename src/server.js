const http = require("http");
const fs = require("fs");
const url = require("url");
const path = require("path");

const port = 3000;
const host = "localhost";

let db = [];

const requestListener = async function (req, res) {
  const parsedUrl = url.parse(req.url);
  let pathname = path.join(__dirname, `${parsedUrl.pathname}`);
  const ext = path.parse(pathname).ext;
  const isApiReq = parsedUrl.path.includes("/api/");
  const map = {
    ".ico": "image/x-icon",
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".json": "application/json",
  };

  if (isApiReq) {
    res.setHeader("Content-type", "application/json");
    const slices = parsedUrl.path.split("/");
    slices.shift();

    if (req.method === "POST") {
      if (slices.length >= 3 && parsedUrl.path.includes("/api/getFiltred")) {
        if (typeof +slices[2] !== "number") {
          res.statusCode = 404;
          res.end("404");
          return;
        }

        let body = "";
        req.on("data", function (data) {
          body += data;
        });
        req.on("end", function () {
          body = JSON.parse(body);
          res.statusCode = 200;

          const folder = decodeURI(slices[2]);
          const count = slices[3];
          const skip = slices[4];
          const result = [];
          let idx = 0;
          for (const item of db) {
            idx++;
            if (
              (folder === "Входящие" || item.folder === folder) &&
              (body.bookmark === false || item.bookmark) &&
              (body.read === false || item.read) &&
              (body.doc === false || !!item.doc)
            ) {
              if (idx < skip) {
                continue;
              }
              const {
                flag,
                author,
                title,
                text,
                bookmark,
                important,
                read,
                date,
              } = item;
              result.push({
                id: idx - 1,
                author,
                title,
                text,
                bookmark,
                important,
                read,
                date,
                docs: !!item.doc,
                flag,
              });
              if (result.length >= +count) {
                break;
              }
            }
          }

          res.end(JSON.stringify(result));
        });
        return;
      }

      res.statusCode = 404;
      res.end(
        JSON.stringify({
          code: 404,
        })
      );
      return;
    }

    if (slices.length >= 4 && parsedUrl.path.includes("/api/getMessages")) {
      const folder = decodeURI(slices[2]);
      const count = slices[3];
      const skip = slices[4];
      const result = [];
      let idx = 0;
      for (const item of db) {
        idx++;
        if (folder === "Входящие" || item.folder === folder) {
          if (idx < skip) {
            continue;
          }
          const { flag, author, title, text, bookmark, important, read, date } =
            item;
          result.push({
            id: idx - 1,
            author,
            title,
            text,
            bookmark,
            important,
            read,
            date,
            docs: !!item.doc,
            flag,
          });
          if (result.length >= +count) {
            break;
          }
        }
      }
      res.statusCode = 200;
      res.end(JSON.stringify(result));
      return;
    }

    if (slices.length >= 3 && parsedUrl.path.includes("/api/message")) {
      if (typeof +slices[2] !== "number") {
        res.statusCode(404);
        res.end("404");
        return;
      }
      res.statusCode = 200;
      const data = db[+slices[2]];
      data.to = data.to.map((item) => ({
        name: item.name,
        surname: item.surname,
      }));
      res.end(JSON.stringify(data));
      return;
    }

    if (slices.length >= 3 && parsedUrl.path.includes("/api/getDocs")) {
      if (typeof +slices[2] !== "number") {
        res.statusCode(404);
        res.end("404");
        return;
      }
      res.statusCode = 200;
      const data = db[+slices[2]].doc;
      res.end(JSON.stringify(data));
      return;
    }

    res.statusCode = 404;
    res.end(
      JSON.stringify({
        code: 404,
      })
    );
    return;
  }

  if (parsedUrl.pathname === "/") {
    fs.readFile(__dirname + "/index.html", (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end("Error getting the index file");
      }
      res.statusCode = 200;
      res.setHeader("Content-type", "text/html");
      res.end(data);
    });
    return;
  }

  fs.readFile(pathname, function (err, data) {
    if (err) {
      res.statusCode = 404;
      res.end(`Error getting the file: ${err}.`);
    } else {
      res.setHeader("Content-type", map[ext] || "text/plain");
      res.end(data);
    }
  });
};

const initDb = (cb) => {
  fs.readFile(
    path.join(__dirname, `./db.json`),
    {
      encoding: "utf8",
    },
    (err, data) => {
      if (err) {
        console.log(err);
        console.error("Can't read db file");
        return;
      }
      const stack = [];
      let buf = "";
      for (ch of data) {
        if (ch === "{") {
          stack.unshift(ch);
        } else if (ch === "}") {
          buf += ch;
          stack.pop();
          if (stack.length === 0) {
            db.push(JSON.parse(buf));
            buf = "";
          }
          continue;
        }
        if (stack.length > 0) {
          buf += ch;
        }
      }
      cb();
    }
  );
};

const server = http.createServer(requestListener);
console.log("Initializing DB...");
initDb(() => {
  console.log("Done!");
  server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
  });
});
