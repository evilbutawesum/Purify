self.__scramjet$config = {
    prefix: '/scram/service/',
    codec: {
        encodeUrl: (url) => btoa(url),
        decodeUrl: (url) => atob(url)
    },
    config: '/scramjet.config.js',
    worker: '/sw.js'
};
