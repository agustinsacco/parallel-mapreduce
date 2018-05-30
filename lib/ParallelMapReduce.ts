import * as child from 'child_process';
import { ChildProcess } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import { WorkerPayload, Options } from './Entities';

export class ParallelMapReduce {

    private static instance: ParallelMapReduce = null;
    private static workerPath: string = path.resolve(`${__dirname}/Worker.js`);

    public static getInstance(): ParallelMapReduce {
        if (!ParallelMapReduce.instance) {
            ParallelMapReduce.instance = new ParallelMapReduce();
        }
        return ParallelMapReduce.instance;
    }

    /**
     * @param data any[]
     * @param mapFn Function
     * @param reduceFn Function
     * @param options Options
     */
    public async mapReduce(
        data: any[],
        mapFn: Function,
        reduceFn: Function,
        options?: Options): Promise<WorkerPayload[]> {

        // Validate data
        if (!data.length) {
            return Promise.reject(new Error('Data is empty'));
        }

        // Clone data
        const dataClone = data.slice();
        // Merge options
        options = Object.assign({
            workers: os.cpus().length
        }, options);

        // Run map
        let mapRsp: WorkerPayload[] = [];
        try {
            mapRsp = await ParallelMapReduce.getInstance().map(dataClone, mapFn, options);
        } catch (err) {
            return Promise.reject(err);
        }

        // Run reduce
        let reduceRsp: any = null;
        try {
            reduceRsp = await ParallelMapReduce.getInstance().reduce(mapRsp, reduceFn);
        } catch (err) {
            return Promise.reject(err);
        }

        return Promise.resolve(reduceRsp);
    }

    /**
     * Map evently splits the loop and schedules workers to complete
     * each chunk in parallel.
     *
     * @param options
     * @param data
     * @param fn
     */
    private map(data: any[], fn: Function, options: Options): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const promises: Promise<any>[] = [];
            const dataSplitIndex: number = Math.floor(data.length / options.workers);
            const fnString: string = fn.toString();

            for (let x = 1; x <= options.workers; x++) {
                // Splice data
                const spliceIndex: number = (x === options.workers ? data.length : dataSplitIndex);
                const splicedData: any[] = data.splice(0, spliceIndex);
                const wp = <WorkerPayload> {
                    id: x,
                    fn: fnString,
                    data: splicedData,
                };

                promises.push(this.spawnWorker(wp, fn));
            }

            Promise.all(promises)
                .then((rsp: WorkerPayload[]) => {
                    return resolve(rsp);
                })
                .catch((err: Error) => {
                    return reject(err);
                });
        });
    }

    /**
     * Runs the reduction function passed initially. Will run in 1 sub
     * process in order to not block the main thread.
     *
     * @param data
     * @param fn
     */
    private reduce(data: any[], fn: Function): Promise<any> {
        return new Promise((resolve, reject) => {

            const wp = <WorkerPayload> {
                id: 1,
                fn: fn.toString(),
                data: data,
            };

            return this.spawnWorker(wp, fn)
                .then((rsp: WorkerPayload) => {
                    return resolve(rsp);
                })
                .catch((err: Error) => {
                    return reject(err);
                });
        });
    }

    /**
     * Spawns worker process and runs function using data provided in parallel
     * @param payload
     * @param fn
     */
    private spawnWorker(payload: WorkerPayload, fn: Function): Promise<WorkerPayload> {
        return new Promise((resolve, reject) => {
            const subProcess: ChildProcess = child.fork(ParallelMapReduce.workerPath, [], {});
            // Send payload
            subProcess.send(payload);
            // Sub process repsonse
            subProcess.on('message', (pl: WorkerPayload) => {
                return resolve(pl);
            });

            subProcess.on('error', error => {
                return reject(error);
            });
        });
    }
}
