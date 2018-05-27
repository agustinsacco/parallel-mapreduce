import * as os from 'os';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as child from 'child_process';
import * as chaiAsPromised from 'chai-as-promised';

import { SinonSandbox } from 'sinon';
import { ParallelMapReduce } from '../../lib/ParallelMapReduce';
import { WorkerPayload } from '../../lib/Entities';

chai.use(chaiAsPromised);
const expect = chai.expect;

// Data
const data = [4, 2, 6, 8, 5, 3, 2, 5, 3, 9, 5, 6, 7, 4, 3, 2];
// Worker callback function
const sum = (payload: any[]) => {
    let total = 0;
    for (let x = 0; x < payload.length; x++) {
        total += payload[x];
    }
    return total;
};

let sandbox: SinonSandbox;
const program = ParallelMapReduce.getInstance();

describe('ParallelMapReduce - Integration', () => {
    before(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

   

    it('mapReducer() - map & reduce called successfully', async () => {
        const result = await program.mapReduce(data, sum, sum);
        expect(result).to.equal(sum(data));
    });
});
