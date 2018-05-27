export interface WorkerPayload {
    id: number;
    fn?: Function | string;
    data: any[];
    response?: any;
}

export interface Options {
    workers: number;
}
