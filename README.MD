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

This server exposes a REST API. In order to create a new transaction for a specific client, you have to perform a HTTP POST request with a json payload with this structure:

```
{
        "amount" : AMOUNT TO PAY IN SATOSHI,
        "description" : "A DESCRIPTION OF THE PRODUCT FOR THE PAYMENT FRONTEND. HTML IS VALID",
        "username" => "USERNAME OF THE ADMINISTRATOR",
        "password" => "PASSWORD OF THE ADMINISTRATOR"
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

## License

The MIT License (MIT)
Copyright (c) 2016 Álvaro Rodríguez Villalba https://github.com/sirasistant

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
