var amqp = require('amqp');

var connection = amqp.createConnection();

// Wait for connection to become established.
connection.on('ready', function () {
    console.log('ready');
  // Use the default 'amq.topic' exchange
  connection.queue('my-queue', function (q) {
    console.log('queue');
      // Catch all messages
      q.bind('#');

      // Receive messages
      q.subscribe(function (message) {
            console.log('message');

        // Print messages to stdout
        console.log(message);
      });
  });
});