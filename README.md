# RabbitMQ in Action

Notes on RabbitMQ-in-Action book

## Foreword

- Messaging enables software applications to connect and scale
- Messaging is asychronous
- Messaging enables "data in motion"
- Messaging is everywhere

There will be messages, and there will be rabbits, and all will be revealed. (Alexis Richardson)

## Preface

- Why messaging: separate system for spam filtering
- Why messaging: needed to consume same messages by different systems
- Why messaging: solves basic problems of distributing data, when trygin to scale software

## Chapter 1. Pulling RabbitMQ out of the hat (installation)

- History
- Installation
- Running:

### man rabbitmq-server

ENV:
- RABBITMQ_MNESIA_BASE - Mnesia DB dir (default: /var/lib/rabbitmq/mnesia)
- RABBITMQ_LOG_BASE - Log dir (default: /var/log/rabbitmq)
- RABBITMQ_NODENAME - specify to run more that 1 instance of RMQ on 1 host (default: rabit)
- RABBITMQ_NODE_IP_ADDRESS - interface to bind (default: all)
- RABBITMQ_NODE_PORT - port

OPTS:
- -detached - run in background

### man rabbitmqctl

OPTS:
- -n node
- -q - quite mode. Informational messages suppressed

COMMANDS: (huge amount, only list groups of commands)
- Application and Cluster Management
- Cluster Management
- User Management
- Access control
- Parameter management
- Policy management
- Server Status

### Mnesia

Database for keeping information about broker, queue metadata, virtual hosts

**TIP**: In production - create *rabbitmq* user and grant privileges to that user

### Start

mkdir -p rmq/mnesia rmq/log 
RABBITMQ_MNESIA_BASE=rmq/mnesia RABBITMQ_LOG_BASE=rmq/log rabbitmq-server

## Chapter 2, Understanding

Consumers, producers, brokers, exchanges, queues, bindings, vhosts, message durability, life cycle

- Routing: one-to-many (broadcast or selectively) or one-to-one
- It is not client/server (not request/response)

### Consumers, producers

Rabbit - is delivery service. App send/receive, server send/recieve, rabbitmq - is router between app and server.

When server/app connects to rabbitmq, it makes decision: **Am I producer or consumer?**

#### Producers

*Producers* publish messages to rmq (broker)

Message - has payload (data: json, mp4) and label. Label (exchange name (one-to-many) or topic (one-to-one)) describes payload, it doesn't specify sender and/or receiver.

RMQ in charge of receiving messages from producers and send it to interested consumers.

#### Consumers

*Consumers* attach to rmq and listen on queue. Consumer receives only payload (without label).

**TIP**: If we want to know producer - producer should include information about as part of payload.

#### Channels

Before consume/produce we need to connect. Connecting - TCP connection, then app create AMQP channel inside TCP connection. Every channels has unique ID.

Why AMQP channel, not just TCP: because setup/teardown TCP expensive for OS.

No limit on amount of AMQP channels.

#### Exchanges, Queues, Binding

- *Exchanges* - where producers publish messages 
- *Queues* - where messages are received by consumer 
- *Binding* - rules - how messages are routed from exchanges to queues

#### Queues

To receive message from queue:
- **persistent way**. subscribe via *basic.consume*. This place channel into receive mode. While subscribed get messages one by one. 
- **consume single message**. *basic.get* - consume and hang out until next basic.get. basic.get - subscribes, consumes, unsubscribes. 

**TIP**. For high-throughput - use persistent way.

*If message arrives at a queue with no subscribers - message waits in the queue.*

#### Distribution messages between multiple consumers

Round-robin fashion

#### Acknowledgment

Every message received by consumer is required to be acknowledged.

It may be done with auto_ack param on subscribe or do it explicitly with basic.ack.

*Acknowledgment doesn't notify producer. It just saying broker that message was consumed and broker can remove message from queue*

*If client received, disconnected, not acknowledged - message will be redelievered to next consumer. So messages won't be loosed*

*If client received message but haven't acknowledged it - broker won't deliver new messages until client ack previous message*

#### Rejecting

*basic.reject*. Useful in two cases:
- message is incorrect. we want to reject message from processing. need to pass *requeue = false*
- message is correct but some problem on consumer side. we want to send message to next consumer. *requeue = true*

*Why reject with requeue:false instead of ack? Because in future we can inspect dead leters*

#### Declaring queues

Producer and consumer can do *queue.declare*.

*Consumer can't declare new queue when subscribed to other. Required to unsubscribe (place channel in "transit" mode). May specify name for queue. If don't do this - random name will be used and return on queue.declare response*

**TIP** Anonymous queues useful for temporary queues. 

##### PARAMS:

- *exclusive* - private queues. Can be only consumed by declarator.
- auto-delete - automatically deleted when all unsubscribed

##### Queue exists

- if the same params - success
- if other params - fail
- check existense - queue.declare with *passive:true*. 

**WARN** Messages that get published but have no queue to be routed to - are discarded (black-holed) by broker.

##### Who should declare queues: Consumers or producers?

Both producers and consumers should declare queues.

##### Summary on queues

- messages wait in queues to be consumed
- good tool for load-balancing (round-robin)
- final endpoint for messages in RMQ
