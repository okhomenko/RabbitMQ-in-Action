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

#### Exchanges and bindings

This is how messages get to queues. We send to exchange, and exchange decides to which queue send message by *routing keys*.

Queue is bound to exchange by routing key.

When send message - we always send routing key (even blank key). If broker can't match binding pattern - message black-holed.

*Why not just send directly to queue? Because usually we want to do more than one action on the same message. And thus we want one message sent to one exchange - to be delievered to multiple queues*

#### How broker deliever to multiple exchanges? 

There are four types of exchanges: direct, fanout, topic, headers.

- *headers* type operates the same way as direct but bases on header in message instead of routing key. **It is very low performance**
- *direct* - if routing key matches - deliever to corresponding queue.
**(broker implements default direct exchange with empty string ('') name. When queue is declared  - it is automatically bound to that default exchange with routign key equal to name of queue)

**TIP** Often in simple application enough default exchange that works as one-to-one pattern without need to declare another exchange.

- *fanout* - multicast message to bound queues. Pattern: deliever to all attached queues. Use case: user send signup request. we want to send him welcome message, log this request and send approval request to administrator.
- *topic* - allows messages from different exchange arrives to one queue. You can bind queues using wildcards "warn.user", "*.user", "#"

### Vhosts (multiple tenants) and permissions

Virtual message broker (mini-RMQ server with own queues, exchanges, bindings, permissions). Obvious use case: different apps requires its own broker instance.

Broker comes with default vhost and guest|guest user.

In RMQ permissions are per-vhost

**TIP**. Recommends to identify common functionality groups in infrastructure (such as logging) and give each one its own vhost.

VHosts and permissions can't be managed by AMQP protocol only with *rabbitctl* tool

#### rabbitmqctl vhosts
- rabbitmqctl -n rabbit@localhost, rabbit - name of erlang app name
- add_vhost [name]
- list_vhosts
- delete_vhost [name]

### Durability, persistency

When we restart RMQ - all exchanges, queues, messages don't survive. All because *durable* param. It defaults to *false* when create exchanges, queues. When true - should be re-created after crash/reboot RMQ

Message need to be marked with flag delivery mode = 2, published to durable exchange and consumed by durable queue.

Persistent messages are written to the disk inside persistency log.
If message sent to durable exchange but arrived to non-durable queue - message won't survive reboot (saved to log => arrived queue (remove from log)).
When consumed from durable queue and acknowledged - message marks for garbage collection.

For persistent messages we pay with performance (10x and more).

#### Issue with clusters

Queues are evenly distributed across cluster (every queue only on one node). **Thus - if queue was durable and crashed: until it is restored - it is black-hole queue, because messages routed to the queue can't be delievered**

**TIP** Place RMQ on SSD to use persistent messages. 
**TIP** Analyze throughput and make decision on persistency. 
**TIP** Use persistent messages only for critical messages. 
**TIP** Reply-to (request-response) pattern. Producer may wait some amount of time. If haven't get response - republish message. 
**TIP** Cluster for non-persisten messages, and pairs of active/hot-standby non-clustered servers for persistent messages (with load balancers). It keeps us from persistency black-holed issue.

#### AMQP Transactions

To ensure that broker saved published message to persistent log. It has performance issue, reducing throughput by factor 2-10x

- channel in transaction mode: publish command and following commands (0+) and *commit* transaction. If publish success - execute other commands, fail - don't execute other commands.

#### Publisher confirms

- channel in confirm mode (can't be turned off without recreation): on publish every message get ID, when message delievered to queue - channel will issue publisher confirm to producer. confirms are asynchronous. uses callback mechanism. (*nack* message if wasn't delievered)

### Example

