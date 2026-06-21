// im gay
importScripts("/scram/scramjet.all.js");
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();
self.addEventListener("fetch", (event) => {
    event.respondWith(
        scramjet.shouldRoute(event) ? scramjet.handle(event) : fetch(event.request)
    );
});
