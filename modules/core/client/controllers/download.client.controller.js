﻿'use strict';

// set up the module
var coreModule = angular.module('core');

// create the controller
coreModule.controller('DownloadController', ['$scope', '$rootScope', '$compile', '$location', '$window', '$timeout', function ($scope, $rootScope, $compile, $location, $window, $timeout) {
    // determines if a page has already sent a request for load
    var pageRequested = false;

    // set jQuery
    $ = window.jQuery;

    // set the page title
    $scope.pageTitle = 'HatchV2';

    // set the enviornment
    $scope.env = window.env;

    // holds the error
    $scope.error = {
        'error': false,
        'title': '',
        'status': 404,
        'message': ''
    };

    // determines if the page is fully loaded
    $scope.pageFullyLoaded = false;

    // downloads app
    $scope.downloadApp = function (platform) {
        // based on the platform
        if(platform == 'apple') {
            window.alert('Click the provided link');
        }
        else if(platform == 'android') {
            window.alert('Sorry, this platform isn\'t available yet');
        }
    };

    // setup page
    setUpPage();

    // sets up the page
    function setUpPage() {
        // set up the title
        var titleDOM = document.getElementById('pageTitle');
        var title = '\'' + $scope.pageTitle + '\'';
        titleDOM.setAttribute('ng-bind-html', title);
        $compile(titleDOM)($scope);

        // set page fully loaded
        $scope.pageFullyLoaded = true;
    };
}]);