import Cached from './Cached';
import { performance } from 'perf_hooks';
import test, { ExecutionContext } from 'ava';

const AsyncFunction = (async () => {}).constructor;

class CacheTest {
    @Cached(500)
    syncMethod(n: number) {
        for (let i = 0; i < n; i++);
        return n + 1;
    }

    @Cached(1000)
    sampleMethod1({arg1, arg2, ...args}) {
        return {
            arg1, arg2, ...args
        }
    }

    @Cached(1000)
    sampleMethod2(arg, ...args) {
        return {
            arg, ...args
        }
    }

    @Cached(1000)
    sampleMethod3([arg1, arg2, arg3 = 5]) {
        return {
            arg1, arg2, arg3
        }
    }

    @Cached(1000)
    async sampleAsyncMethod(arg) {
        return arg;
    }

    @Cached(1000)
    async asyncMethod(n: number) {
        for (let i = 0; i < n; i++);
        return n + 1;
    }

    @Cached(1000)
    async someMethod(time) {
        await this.wait(time);
    }

    @Cached(1000)
    async someOtherMethod(time) {
        await this.wait(time);
    }

    wait(time) {
        return new Promise(resolve => setTimeout(resolve, 500));
    }
}

const cacheTest = new CacheTest();

const shouldNotExpire = async (t: ExecutionContext) => {
    await cacheTest.someMethod(500);
    await cacheTest.wait(500);
    const time = performance.now(); 
    await cacheTest.someMethod(500);    
    const totalTime = performance.now() - time;

    if (totalTime < 500) {
        return t.pass();
    }

    return t.fail();
}

const fasterReturns = (t: ExecutionContext, methodName, params) => {
    const trial = () => {
        const time = performance.now(); 
        cacheTest[methodName](params);
        return performance.now() - time;
    };

    const initialTime = trial(); 
    const trials = [trial(), trial(), trial(), trial()]; 

    trials.filter(time => initialTime <= time).forEach(_ => t.fail());
    return t.pass();
}

const fasterReturnsAsync = async (t: ExecutionContext, methodName, params) => {
    const trial = async () => {
        const time = performance.now(); 
        await cacheTest[methodName](params);
        return performance.now() - time;
    };

    const initialTime = await trial(); 
    const trials = [await trial(), await trial(), await trial(), await trial()]; 

    trials.filter(time => initialTime <= time).forEach(time => {
        console.log('time: ' + time + '; initialTime: ' + initialTime)
        t.fail()
    });
    
    t.pass();
}

const sameReturn = (t: ExecutionContext, methodName, params) => {
    const original = cacheTest[methodName](params);
    const cached = cacheTest[methodName](params);

    t.is(cached, original);
}

const sameReturnAsync = async (t: ExecutionContext, methodName, params) => {
    const original = await cacheTest[methodName](params);
    const cached = await cacheTest[methodName](params);

    t.is(cached, original);
}

test('sync function returns faster after caching test:1', fasterReturns, 'syncMethod', 10000000);
test('sync function returns faster after caching test:2', fasterReturns, 'syncMethod', 15000000);
test('sync function returns faster after caching test:3', fasterReturns, 'syncMethod', 20000000);
test('sync function returns faster after caching test:4', fasterReturns, 'syncMethod', 30000000);

test('async function returns faster after caching test:1', fasterReturnsAsync, 'asyncMethod', 10001000);
test('async function returns faster after caching test:2', fasterReturnsAsync, 'asyncMethod', 15001000);
test('async function returns faster after caching test:3', fasterReturnsAsync, 'asyncMethod', 20001000);
test('async function returns faster after caching test:4', fasterReturnsAsync, 'asyncMethod', 30001000);

test('cached function has same output as original sampleMethod1 test:1', sameReturn, 'sampleMethod1', {arg1: 1, arg2: 2, args: [1, 2, 3]});
test('cached function has same output as original sampleMethod1 test:2', sameReturn, 'sampleMethod1', {arg1: 'foo', arg2: true, args: [1, 2, 3]});
test('cached function has same output as original sampleMethod1 test:3', sameReturn, 'sampleMethod1', {arg1: -1, arg2: 2, args: [1, false, 3]});
test('cached function has same output as original sampleMethod1 test:4', sameReturn, 'sampleMethod1', {arg1: 1, arg2: undefined, args: [1, null, 3]});

test('cached function has same output as original sampleMethod2 test:1', sameReturn, 'sampleMethod2', [1, 2, 3]);
test('cached function has same output as original sampleMethod2 test:2', sameReturn, 'sampleMethod2', ['a', 'b', 'c']);
test('cached function has same output as original sampleMethod2 test:3', sameReturn, 'sampleMethod2', [{hello: 'world'}]);
test('cached function has same output as original sampleMethod2 test:4', sameReturn, 'sampleMethod2', [false]);
test('cached function has same output as original sampleMethod2 test:5', sameReturn, 'sampleMethod2', undefined);

test('cached function has same output as original sampleMethod3 test:1', sameReturn, 'sampleMethod3', [1, 2, 3]);
test('cached function has same output as original sampleMethod3 test:2', sameReturn, 'sampleMethod3', ['a', 'b', 'c']);
test('cached function has same output as original sampleMethod3 test:3', sameReturn, 'sampleMethod3', [{hello: 'world'}]);
test('cached function has same output as original sampleMethod3 test:4', sameReturn, 'sampleMethod3', [false]);
test('cached function has same output as original sampleMethod3 test:5', sameReturn, 'sampleMethod3', [undefined]);

test('cached function has same output as original sampleAsyncMethod test:1', sameReturnAsync, 'sampleAsyncMethod', [1, 2, 3]);
test('cached function has same output as original sampleAsyncMethod test:2', sameReturnAsync, 'sampleAsyncMethod', ['a', 'b', 'c']);
test('cached function has same output as original sampleAsyncMethod test:3', sameReturnAsync, 'sampleAsyncMethod', [{hello: 'world'}]);
test('cached function has same output as original sampleAsyncMethod test:4', sameReturnAsync, 'sampleAsyncMethod', [false]);
test('cached function has same output as original sampleAsyncMethod test:5', sameReturnAsync, 'sampleAsyncMethod', [undefined]);

test('cache wont expire', shouldNotExpire);
