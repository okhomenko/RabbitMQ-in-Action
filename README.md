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

TIP: In production - create *rabbitmq* user and grant privileges to that user

### Start

mkdir -p rmq/mnesia rmq/log 
RABBITMQ_MNESIA_BASE=rmq/mnesia RABBITMQ_LOG_BASE=rmq/log rabbitmq-server