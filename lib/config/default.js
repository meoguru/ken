'use strict';

var config = require('./');

exports.get = function (env, idx) {
    return {
        host: '0.0.0.0',
        port: 2601,

        log: {
            consoleLevel: (config.isLiveEnv(env) ? 'info' : 'debug'),
            fileLevel: 'access',
            filePrefix: 'log' + (env === config.envs.PROD ? '' : '-' + env)
        },

        cluster: {
            workers: (config.isLiveEnv(env) ? 'max' : 1),

            // Use worker-process rotation?
            rotateWorkers: true,
            // How long between full rotations
            rotationInterval: 2 * 60 * 60 * 1000,
            // How long to wait for in-flight requests before rotating
            rotationTimeout: 5 * 60 * 1000,

            // How long to wait for in-flight requests before killing
            gracefulShutdownTimeout: 30 * 1000,

            // How long between heartbeat calls from the worker to the master
            heartbeatInterval: 5 * 1000,
            // How old a heartbeat-timestamp can be before assuming a worker is hung,
            // and needs to be killed
            heartbeatTimeout: 20 * 1000,
        },

        mongo: {
            host: 'localhost',
            port: 27017,
            db: 'ken' + (env === config.envs.PROD ? '' : '_' + env),
            options: {
                server: {
                    poolSize: (config.isLiveEnv(env) ? 200 : 10)
                }
            }
        },

        redis: {
            host: 'localhost',
            port: 6379,
            db: idx,
            prefix: 'ken:'
        },

        elastic: {
            host: 'localhost',
            port: 9200,
            index: 'ken'
        },

        cookie: {
            secret: '81,suRTgfe!IR3`$FBXsMwA^_{6w~sb++N6V0"%Qy>8kgS^B]?BLO^`i@R-CDy0}' +
                    'I^!42]f3nNvhg3qRuk9gccj3p)%c9vx^l?zb?T?<=A`Ez;~yI:xx|,["@Vj";NSR',
            maxAge: 30 * 24 * 60 * 60 // one month in second
        },

        session: {
            key: 'ken.sid',
            secret: 'B#uD%_]ymH;+ct?L.Yq9*-rN1(fdMw.gVa.2D1GC=MYy4,$WgxKg3lkjZU;HOk!3' +
                    '&xd;wE5v,#^m<27wMa6K`2{.<v_GLPk[%;Zw[9.}k$yJfVl]L&y!vN[0wjOP8$GO',
            maxAge: 30 * 24 * 60 * 60, // one month in second
            redisPrefix: 'ken:sid:'
        },

        social: {
            facebook: {
                appId: 'Too bad, we cannot have a random application ID!',
                appSecret: 'And we cannot have a random application secret too.'
            }
        }
    };
};
