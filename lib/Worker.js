
process.on('message', (workerPayload) => {
    // Build callback function
    const fn = new Function('return ' + workerPayload.fn)();
    const response = fn(workerPayload.data);
    process.send(response);
    // Kill the process
    process.exit();
});
