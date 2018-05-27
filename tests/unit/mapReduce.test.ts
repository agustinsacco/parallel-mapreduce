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

describe('ParallelMapReduce - Unit', () => {
    before(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('getInstance() - retrieves an instance', () => {
        expect(ParallelMapReduce.getInstance()).to.be.instanceOf(ParallelMapReduce);
    });

    it('mapReducer() - throws validation error', async () => {
        const payload: any[] = [];
        expect(program.mapReduce(payload, sum, sum)).to.be.rejectedWith(Error, 'Data is empty');
    });

    it('mapReducer() - map & reduce called successfully', async () => {
        const mapSpy = sinon.spy((<any> program), 'map');
        const reduceSpy = sinon.spy((<any> program), 'reduce');

        const result = await program.mapReduce(data, sum, sum);
        expect(mapSpy.callCount).to.equal(1);
        expect(reduceSpy.callCount).to.equal(1);

        mapSpy.restore();
        reduceSpy.restore();
    });

    it('mapReducer() - stub os.cpu() default options', async () => {
        const forkStub = sandbox.spy(child, 'fork');
        const osCpuStub = sandbox.stub(os, 'cpus');
        // os.cpus() returns an array
        // Lets use 9 workers plus 1 worker for the reducer
        osCpuStub.returns([ 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        await program.mapReduce(data, sum, sum);

        expect(forkStub.callCount).to.equal(10);
    });

    it('mapReducer() - stub default options override', async () => {
        const forkStub = sandbox.spy(child, 'fork');
        const options = {
            workers: 12
        };
        await program.mapReduce(data, sum, sum, options);
        // 12 map workers + 1 reduce worker
        expect(forkStub.callCount).to.equal(13);
    });

    it('mapReducer() - map() throws error', async () => {
        const mapStub = sandbox.stub((<any> program), 'map');
        mapStub.throws(new Error('map() throws error'));
        expect(program.mapReduce(data, sum, sum)).to.be.rejectedWith(Error, 'map() throws error');
    });

    // it('mapReducer() - reduce() throws error', async () => {
    //     const reduceStub = sandbox.stub((<any> program), 'reduce');
    //     reduceStub.throws(new Error('reduce() throws error'));
    //     expect(program.mapReduce(data, sum, sum)).to.be.rejectedWith(Error, 'reduce() throws error');
    // });
});
