# Parallel MapReduce

Map-Reduce function that allows you to parallelize a cpu intensive tasks by spawning
child workers. This function is most optimal when run on a multiprocessor with more than 1 available
core.

The example below shows basic usage

## installation
```
npm install parallel-mapreduce
```

## usage
```js


let mapReduce = require('parallel-mapreduce');

const data = [4,5,8,4,5,6,7,8,9,4,2,5,6,8,9,5,6,3,3,5,5,3,2,9,3,6,3,9];

const calculateSum = (tmp) => {
    let sum = 0;
    for(let x=0; x<tmp.length; x++) {
        sum += tmp[x];
    }
    return sum;
}

/**
 * Scenario 1: Calculate the sum of the 'data' array
 * synchronously on the master thread.
 */
const singularSum = calculateSum(data);
console.log('singularSum: ' + singularSum);

const options = {
    workers: 4
};

/**
 * Scenario 2: Parallelize the same calculation in 4 workers.
 * mapReduce will split the 'data' array into 4 chunks and run the map 
 * function on each chunk asynchronously. We call reduce (calculateSum)
 * on the result of map.
 * 
 * Parameters:
 * @param data any[]
 * @param mapFn Function
 * @param reduceFn Function
 * @param options Options
 */
mapReduce(data, calculateSum, calculateSum, options)
    .then((result) => {
        console.log('pluralSum: ' + result);
    })
    .catch((error) => {
        console.log('pluralSum error:', error);
    });
```

## run tests
```
npm test
```