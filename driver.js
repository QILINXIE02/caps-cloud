const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-west-2' });

const sqs = new AWS.SQS();

const packagesQueueUrl = 'https://sqs.us-west-2.amazonaws.com/ACCOUNTID########/packages.fifo';

function processNextPackage() {
  const params = {
    QueueUrl: packagesQueueUrl,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
  };

  sqs.receiveMessage(params, (err, data) => {
    if (err) console.error(err, err.stack);
    else if (data.Messages && data.Messages.length > 0) {
      const message = data.Messages[0];
      const order = JSON.parse(message.Body);
      console.log(`Processing order: ${order.orderId} for ${order.customer}`);

      const deleteParams = {
        QueueUrl: packagesQueueUrl,
        ReceiptHandle: message.ReceiptHandle,
      };
      sqs.deleteMessage(deleteParams, (err, data) => {
        if (err) console.error(err, err.stack);
        else console.log('Package message deleted');
      });

      setTimeout(() => {
        const deliveryParams = {
          MessageBody: `Order ${order.orderId} delivered to ${order.customer}`,
          QueueUrl: order.vendorUrl,
        };

        sqs.sendMessage(deliveryParams, (err, data) => {
          if (err) console.error(err, err.stack);
          else console.log(`Delivery notification sent for order ${order.orderId}`);
        });
      }, Math.random() * 5000); 
    }
    processNextPackage();
  });
}

processNextPackage();