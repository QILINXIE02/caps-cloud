const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

AWS.config.update({ region: 'us-west-2' });

const sns = new AWS.SNS();
const sqs = new AWS.SQS();

const pickupTopicArn = 'arn:aws:sns:your-region:your-account-id:pickup.fifo';
const vendorQueueUrl = 'https://sqs.us-west-2.amazonaws.com/ACCOUNTID########/vendor1';

function sendPickupRequest() {
  const order = {
    orderId: uuidv4(),
    customer: `Customer ${Math.floor(Math.random() * 100)}`,
    vendorUrl: vendorQueueUrl,
  };

  const params = {
    MessageBody: JSON.stringify(order),
    TopicArn: pickupTopicArn,
    MessageGroupId: 'pickupGroup',
    MessageDeduplicationId: uuidv4(),
  };

  sns.publish(params, (err, data) => {
    if (err) console.error(err, err.stack);
    else console.log(`Order sent: ${JSON.stringify(order)}`);
  });
}

function pollDeliveryNotifications() {
  const params = {
    QueueUrl: vendorQueueUrl,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20,
  };

  sqs.receiveMessage(params, (err, data) => {
    if (err) console.error(err, err.stack);
    else if (data.Messages) {
      data.Messages.forEach((message) => {
        console.log(`Delivery notification received: ${message.Body}`);
        const deleteParams = {
          QueueUrl: vendorQueueUrl,
          ReceiptHandle: message.ReceiptHandle,
        };
        sqs.deleteMessage(deleteParams, (err, data) => {
          if (err) console.error(err, err.stack);
          else console.log('Message deleted');
        });
      });
    }
    pollDeliveryNotifications();
  });
}

setInterval(sendPickupRequest, 5000); 
pollDeliveryNotifications();
    
