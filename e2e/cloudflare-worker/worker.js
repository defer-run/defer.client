import helloWorld from "./helloWorld";

addEventListener("fetch", event => {
  event.respondWith(serverResponse(event));
});

async function serverResponse(event) {

  const resp =  await helloWorld();
    
    return new Response(`XXX ${resp.id}`);
}

