var BytePayr = angular.module('BytePayr', ['ngRoute', 'ui.bootstrap', "angucomplete-alt", "ui.bootstrap.datetimepicker", "ja.qr", "ngSanitize"]);

function isEmpty(str) {
    return (!str || 0 === str.length);
}

Array.prototype.filterBy = function (attr, validation) {
    var findings = [];
    for (var i = 0; i < this.length; i++) {
        if (validation(this[i][attr]))
            findings.push(this[i]);
    }
    return findings;
};

Array.prototype.findBy = function (item, attr) {
    if (attr === undefined)
        return this.indexOf(item);
    for (var i = 0; i < this.length; i++) {
        if (this[i][attr] === item[attr])
            return i;
    }
    return -1;
};

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function copyToClipboard(text) {
    window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
}

Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

BytePayr.run(['$rootScope', '$location', '$uibModal', function ($rootScope, $location, $uibModal) {
    $rootScope.pollingEnabled = getParameterByName("polling") === 'true';

    if (!$rootScope.pollingEnabled) {
        $rootScope.socket = io();
    }
}]);

BytePayr.controller('transactionController', ['$scope', '$http', function ($scope, $http) {
    $scope.transaction = {
        address: ""
    };

    $scope.backUrl = getParameterByName("backurl");
    $scope.successUrl = getParameterByName("successurl");
    $scope.transactionId = getParameterByName('transaction');


    $scope.copyAddress = function () {
        copyToClipboard($scope.transaction.address);
    };

    $scope.finish = function () {
        window.location = $scope.successUrl;
    };

    var getStatusText = function (transaction) {
        return "Amount confirmed is " + transaction.paid / 1e8 + " bitcoin.\n" + (transaction.unconfirmed > 0 ? "Amount awaiting confirmations is " + transaction.unconfirmed / 1e8 + " bitcoins." : "");
    };

    var updateTransaction=function(transaction){
        if(transaction.state==="EXPIRED"){
            alert("Transaction is expired");
        }
        transaction.bitcoinAmount = transaction.amount / 1e8;
        console.log(transaction);
        $scope.transaction = transaction;
        $scope.progress = transaction.state == "PAID" ? 100 : transaction.paid > 0 ? 80 : transaction.unconfirmed > 0 ? 50 : 10;
        $scope.paymentStatus = transaction.state == "PAID" ? "Payment completed." : transaction.paid || transaction.unconfirmed > 0 ? getStatusText(transaction) : "Awaiting transaction...";
    };

    if (!$scope.pollingEnabled) {
        $scope.socket.on('transactionUpdate', function (transaction) {
            updateTransaction(transaction);
            $scope.$apply();
        });
        $scope.socket.on('connect',function(){
            $scope.socket.emit('subscribe', {transaction: $scope.transactionId});
        });
    } else {
        setInterval(function(){
            $http.get("/api/transactions/"+$scope.transactionId).success(function(data,status){
                updateTransaction(data);
            });
        },1000);
    }

}]);