import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { WritableStream, TransformStream } from "node:stream/web";
import { setTimeout } from "node:timers/promises";
import csvtojson from "csvtojson";

const PORT = 3000;
createServer(async (req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Mathods": "*",
  };

  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
  }

  let items = 0;
  req.once("close", (_) => console.log(`connection was closed!`, items));

  Readable.toWeb(createReadStream("./startup.csv"))
    .pipeThrough(Transform.toWeb(csvtojson()))
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          // console.log("***chunk", Buffer.from(chunk).toString());
          const data = JSON.parse(Buffer.from(chunk));
          const mappedData = {
            name: data.name,
            status: data.status,
            website: data.homepage_url,
            category: data.category_list,
          };
          // quebra de linha poque é um NDJSON
          controller.enqueue(JSON.stringify(mappedData).concat("\n"));
        },
      })
    )
    .pipeTo(
      new WritableStream({
        write: async function (chunk) {
          await setTimeout(1000);
          items++;
          res.write(chunk);
        },
        close() {
          res.end();
        },
      })
    );

  res.writeHead(200, headers);
  // res.end("ok");
})
  .listen(PORT)
  .on("listening", (_) => console.log(`server is runningn at ${PORT}`));
