# Description

This project aims to the development of an open source platform that
enables physical and online stores to accept payments using virtual coins easily,
reliably, transparently and free of charge. 
The goal of this platform is to allow, through a programmatically
accessible interface, the creation, lookup and manipulation of transactions in a
simple and approachable way, and to offer the final user (the customer) an
intuitive interface with which to pay with his wallets, regardless of whether they
are on his mobile device, computer or web services. The service provides
the customer and the store simple methods to obtain feedback about the status
of his transactions, and enables the continuous navigation flow in the
scenario of the store being an online one.

# Getting Started

How to start a BytePayr server:

Download or clone the [ByteWallet](https://github.com/sirasistant/ByteWallet) repository, and follow the README instructions to deploy it in you machine.
Once you have your socket-based wallet running, download or clone this repository in your machine.
Go to the folder containing this repository, and issue the command `npm install`. You should have a working version of Node.JS and NPM installed in your system.
When it finishes installing, you have to create a config.cnf file in the root of this repository. This config.cnf file must be a json-valid file with the following structure:

```
{
 	"username" : "PUT HERE THE USERNAME OF THE PLATFORM ADMINISTRATOR",
 	"password" : "PUT HERE THE PASSWORD OF THE PLATFORM ADMINISTRATOR",
 	"minimumConfirmations": PUT HERE THE NUMBER OF CONFIRMATIONS NEEDED TO VALIDATE A TRANSACTION,
 	"secret"   : "PUT HERE A RANDOM SECRET FOR THE COOKIE ENCRYPTION SYSTEM",
 	"connector":{
     	      "host": "ADDRESS OF THE WALLET, PREFIXED WITH HTTP://",
     	      "port": PORT USED BY THE WALLET,
     	      "user": "THE USERNAME FOR THE WALLET",
     	      "pass": "THE PASSWORD FOR THE WALLET"
     	}
 }
```

To start this server, issue the command `node app.js`

# Usage

## REST

This server exposes a REST API. In order to create a new transaction for a specific client, you have to perform a HTTP POST request with a json payload with this structure:

```
{
        "amount" : AMOUNT TO PAY IN SATOSHI,
        "description" : "A DESCRIPTION OF THE PRODUCT FOR THE PAYMENT FRONTEND. HTML IS VALID",
        "username" => "USERNAME OF THE PLATFORM ADMINISTRATOR",
        "password" => "PASSWORD OF THE PLATFORM ADMINISTRATOR"
 }
```
To the endpoint /api/transactions/create. This request will return an object in json format with a property called "_id". This property will contain the transaction id and is needed to check the status of the transaction.

To check the status of a specific transaction, perform a HTTP GET request to the endpoint /api/transactions/TRANSACTION_ID. This request will return an object in json format with the following structure:
```
{
  "_id": "IDENTIFIER OF THE TRANSACTION",
  "amount": AMOUNT TO RECEIVE IN SATOSHI,
  "address": "THE BITCOIN ADDRESS WHERE THE USER SHOULD SEND THE MONEY",
  "description": "THE DESCRIPTION SET ON CREATION",
  "paid": AMOUNT CONFIRMED,
  "unconfirmed": AMOUNT AWAITING CONFIRMATION,
  "state": "AWAITING_PAYMENT, PAID, EXPIRED",
  "createdAt": "TIMESTAMP"
}
```

If you want the user to be redirected to a payment frontend with all the details of the transaction, redirect his browser to the root hostname of the platform with the following query string: `?transaction=TRANSACTION_ID&backurl=BACK_URL&successurl=SUCCESS_URL` .

To perform administration tasks such as redeeming the money from the wallet, open in your browser de address of the platform followed by the `/admin` path. This path contains the administration tool protected by user and password.

To cancel a specific transaction, perform a HTTP POST request to the endpoint /api/transactions/TRANSACTION_ID/cancel with the following structure:
```
{
        "username" => "USERNAME OF THE PLATFORM ADMINISTRATOR",
        "password" => "PASSWORD OF THE PLATFORM ADMINISTRATOR"
 }
```
This request will change the state to EXPIRED.



To delete a specific transaction, perform a HTTP DELETE request to the endpoint /api/transactions/TRANSACTION_ID with the following structure: 
```
{
        "username" => "USERNAME OF THE PLATFORM ADMINISTRATOR",
        "password" => "PASSWORD OF THE PLATFORM ADMINISTRATOR"
 }
```
This request will remove the transaction from the database.

## Socket.IO

This platform also exposes a Socket.IO API. If you want to get updates on the transaction state, connect to the server and send an event with name `subscribe` with the following payload:

```
{
  transaction: "TRANSACTION_ID"
}
```

When your socket is subscribed to one or multiple transactions, you'll receive events with the name `transactionUpdate` whenever one of them gets updated. The payload of this event is a transaction object:

```
{
  "_id": "IDENTIFIER OF THE TRANSACTION",
  "amount": AMOUNT TO RECEIVE IN SATOSHI,
  "address": "THE BITCOIN ADDRESS WHERE THE USER SHOULD SEND THE MONEY",
  "description": "THE DESCRIPTION SET ON CREATION",
  "paid": AMOUNT CONFIRMED,
  "unconfirmed": AMOUNT AWAITING CONFIRMATION,
  "state": "AWAITING_PAYMENT, PAID, EXPIRED",
  "createdAt": "TIMESTAMP"
}
```

# License

The MIT License (MIT)
Copyright (c) 2016 Álvaro Rodríguez Villalba https://github.com/sirasistant

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
