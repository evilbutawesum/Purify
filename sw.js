importScripts("/scram/scramjet.all.js");
importScripts("/scramjet.config.js");

if (typeof __scramjet$config === "undefined") {
    self.__scramjet$config = {
        prefix: '/scram/service/',
        codec: {
            encodeUrl: (url) => btoa(url),
            decodeUrl: (url) => atob(url)
        },
        config: '/scramjet.config.js',
        worker: '/sw.js'
    };
}

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker(__scramjet$config);

self.addEventListener("fetch", (event) => {
    if (scramjet.shouldRoute(event)) {
        event.respondWith(scramjet.handle(event));
    } else {
        event.respondWith(fetch(event.request));
    }
});
