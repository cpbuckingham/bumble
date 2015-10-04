var app = angular.module('bumble', ['ui.router','angularModalService','ngCookies']);


app.config(function ($stateProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: './public/index.html',
      controller: 'MainController'
    })
    .state('userPref', {
      url: '/userpref/:id',
      templateUrl:'./public/partials/categories.html',
      contoller:'MainController'
    });
  });
