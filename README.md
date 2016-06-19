## Synopsis

Node.js and Redis sample chat application -  
You can start with the registration process and after registration you can login to application and update the profile picture.Once you enter into chat room, you can start chatting with other members/users in the chatroom. It uses Redis hash to store the data and pub/sub to implement the messaging system along with Node.js socket.io.

## Installation

Downlond the Node.js using below link for Windows, Mac and Linux users.

https://nodejs.org/en/download/

Download the Redis using the below link.

http://redis.io/download

Download the Composer using the below link (not mandatory).

https://getcomposer.org/download/

Now to install the packages, run the below command.

    npm install 

This will install all the dependencies required for the application.

## Tests
Open the command propmt / composer and navigate to the directory you have installed the Redis and run the below command to start the Redis server.

    redis-server
    
    redis-cli

Now again open the command prompt / composer and run the application using below command.

    node app.js
    
Now using the below command you can view all the keys created by Redis. Run the below command on redis-cli.

    keys *
    
To flush all the keys use below command.

    flushall
    
Note: This will delete all the keys created by Redis on server.

Open the browser and hit the below url.

http://localhost:3000

## Motivation

This application will help you to get a quick start with Node.js and Redis
