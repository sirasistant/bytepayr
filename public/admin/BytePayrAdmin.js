var BytePayrAdmin = angular.module('BytePayrAdmin', ['ngRoute', 'ui.bootstrap', "angucomplete-alt", "ui.bootstrap.datetimepicker", "ja.qr", "ngSanitize"]);

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

BytePayrAdmin.config(function ($routeProvider, $locationProvider) {
    $routeProvider.when("/login", {
        controller: "loginController",
        templateUrl: "login.html"
    }).when("/balance", {
        controller: "balanceController",
        templateUrl: "balance.html"
    }).when("/transactions", {
        controller: "transactionsController",
        templateUrl: "transactions.html"
    }).otherwise({redirectTo: '/login'});
});

BytePayrAdmin.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.defaults.timeout = 5000;
}]);

BytePayrAdmin.run(['$rootScope', '$location', '$uibModal','$http', function ($rootScope, $location, $uibModal,$http) {
    $rootScope.loggedIn = false;

    $rootScope.isLoggedIn = function(){
        return $rootScope.loggedIn
    };

    $rootScope.setLoggedIn = function(value){
        $rootScope.loggedIn = value;
    };

    $http.get("/api/admin/login").success(function(data,status){
        $rootScope.loggedIn = data;
        if(data)
            $location.path("/transactions");
        else
            $location.path("/login");
    });
    
}]);

BytePayrAdmin.controller('sidebarController', ['$scope','$http','$location',function ($scope,$http,$location) {
    $scope.$on('$routeChangeSuccess', function (event, current, prev) {
        if(current.$$route)
            $scope.currentPath = current.$$route.originalPath;
    });

    $scope.logout = function(){
        $http.delete('/api/admin/login',{}).success(function(data,status){
            $scope.setLoggedIn(false);
            $location.path("/login");
        });
    }
}]);

BytePayrAdmin.controller('loginController', ['$scope', '$location', '$http', '$uibModal', function ($scope, $location, $http, $uibModal){

    $scope.login = function(){
        $http.post('/api/admin/login',{username:$scope.username,password:$scope.password}).success(function(data,status){
            $scope.setLoggedIn(true);
            $location.path("/transactions");
        }).error(function(data,status){
            alert(data);
        });
    }
}]);

BytePayrAdmin.controller('transactionsController', ['$scope', '$location', '$http', '$uibModal', function ($scope, $location, $http, $uibModal){
    $http.get("/api/admin/transactions").success(function(data,status){
        $scope.transactions = data;
    });
}]);

BytePayrAdmin.controller('balanceController', ['$scope', '$location', '$http', '$uibModal', function ($scope, $location, $http, $uibModal){
    $scope.formatBitcoin = function(satoshis){return satoshis/1e8;};
    
    var reloadBalance = function(){
        $http.get("/api/admin/balance").success(function(data,status){
            $scope.balance = {available:data.balance};
        });
    };

    reloadBalance();

    $scope.sendTransaction = function(){
        if($scope.sendMoneyForm.$valid){
            $http.post("/api/admin/transfer",{address:$scope.address,amount:$scope.amount}).success(function(data,status){
                alert("Money sent");
                reloadBalance();
            }).error(function(data,status){
                alert(data);
            });
        }else{
            alert("Invalid form");
        }
    }
}]);