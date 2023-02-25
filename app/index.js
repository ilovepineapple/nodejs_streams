console.log("Starting");

const API_URL = "http://localhost:3000";

async function consumeAPI(signal) {
  const response = await fetch(API_URL, {
    signal,
  });
  // let counter = 0;

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON());
  // .pipeTo(
  //   new WritableStream({
  //     write(chunk) {
  //       ++counter;
  //       console.log(counter, "Chunk", chunk);
  //     },
  //   })
  // );

  return reader;
}

function appendToHTML(element) {
  return new WritableStream({
    write({ category, name, status, website }) {
      element.innerHTML += `
        <article class="card">
          <h2>${name}</h2>
          <small>${category}</small>
          <p>${status}</p>
          <a href="${website}">${website}</a>
        </article>
      `;
    },
  });
}

function parseNDJSON() {
  let ndjsonBuffer = "";
  return new TransformStream({
    transform(chunk, controller) {
      ndjsonBuffer += chunk;
      const items = ndjsonBuffer.split("\n");
      items
        .slice(0, -1)
        .forEach((item) => controller.enqueue(JSON.parse(item)));
      ndjsonBuffer = items[items.length - 1];
    },
    flush(controller) {
      if (!ndjsonBuffer) return;
      controller.enqueue(JSON.parse(ndjsonBuffer));
    },
  });
}

const [start, stop, cards] = ["start", "stop", "cards"].map((item) =>
  document.getElementById(item)
);

let abortController = new AbortController();

start.addEventListener("click", async () => {
  const readable = await consumeAPI(abortController.signal);
  readable.pipeTo(appendToHTML(cards));
});

stop.addEventListener("click", () => {
  abortController.abort();
  console.log("Aborting...");
  abortController = new AbortController();
});
