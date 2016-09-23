/*
 * https://github.com/legalthings/signature-pad-angular
 * Copyright (c) 2015 ; Licensed MIT
 */

angular.module('signature', []);

angular.module('signature').directive('signaturePad', ['$window', '$timeout',
  function ($window, $timeout) {
    'use strict';

    var signaturePad, canvas, element, EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';
    return {
      restrict: 'EA',
      replace: true,
      template: '<div class="signature" ng-mouseout="onMouseout()" ng-style="{height: height + \'px\', width: width + \'px\'}"><canvas ng-mouseup="onMouseup()" ng-mousedown="onMousedown"></canvas></div>',
      scope: {
        accept: '=',
        clear: '=',
        dataurl: '=',
        height: '@',
        width: '@',
        notifyDrawing: '&onDrawing',
      },
      controller: [
        '$scope',
        function ($scope) {
          $scope.accept = function () {
            var signature = {};

            if (!$scope.signaturePad.isEmpty()) {
              signature.dataUrl = $scope.signaturePad.toDataURL();
              signature.isEmpty = false;
            } else {
              signature.dataUrl = EMPTY_IMAGE;
              signature.isEmpty = true;
            }

            return signature;
          };
          $scope.onMouseout = function() {
            $scope.onMouseup();
          }
          $scope.onMousedown = function()
          {
            notifyDrawing({ drawing: true });
          }
          $scope.onMouseup = function () {
            $scope.updateModel();

            // notify that drawing has ended
            $scope.notifyDrawing({ drawing: false });
          };

          $scope.updateModel = function () {
            /*
             defer handling mouseup event until $scope.signaturePad handles
             first the same event
             */
            $timeout(function(){})
              .then(function () {
                var result = $scope.accept();
                $scope.dataurl = result.isEmpty ? undefined : result.dataUrl;
              });
          };

          $scope.clear = function () {
            $scope.signaturePad.clear();
            $scope.dataurl = undefined;
          };

          $scope.$watch("dataurl", function (dataUrl) {
            if (dataUrl) {
              $scope.signaturePad.fromDataURL(dataUrl);
            }
          });
        }
      ],
      link: function (scope, element, attrs) {
        canvas = element.find('canvas')[0];
        canvas.width = element.width();
        canvas.height = element.height();
        scope.signaturePad = new SignaturePad(canvas);
        

        scope.onResize = function(width, height) {
          var canvas = element.find('canvas')[0],
          context = canvas.getContext('2d'),
          devicePixelRatio  = window.devicePixelRatio || 1,
          backingStoreRatio = context.webkitBackingStorePixelRatio ||
                                 context.mozBackingStorePixelRatio ||
                                 context.msBackingStorePixelRatio ||
                                 context.oBackingStorePixelRatio ||
                                 context.backingStorePixelRatio || 1,
          ratio = devicePixelRatio / backingStoreRatio;

          //if (devicePixelRatio !== backingStoreRatio)
          //{          
            var oldWidth, oldHeight;
            if(!!width && !!height)
            {
              oldWidth = width;
              oldHeight = height;
            }
            else
            {
              oldWidth = canvas.offsetWidth;
              oldHeight = canvas.offsetHeight;
            }

            canvas.width = oldWidth * ratio;
            canvas.height = oldHeight * ratio;

            canvas.style.width = oldWidth + 'px';
            canvas.style.height = oldHeight + 'px';

            context.scale(ratio, ratio);
          //}
          if (scope.dataurl) {
            scope.signaturePad.fromDataURL(scope.dataurl);
          }
        }

        function onTouchstart() {
          scope.$apply(function () {
            // notify that drawing has started
            scope.notifyDrawing({ drawing: true });
          });
        }

        function onTouchend() {
          scope.$apply(function () {
            // updateModel
            scope.updateModel();

            // notify that drawing has ended
            scope.notifyDrawing({ drawing: false });
          });
        }

        //Resize to fix UI Bootstrap Modal Show problem
        $timeout(function()
        {
          if(!!attrs.width && !!attrs.height)
          {
            canvas.width = attrs.width;
            canvas.height = attrs.height; 
          }
        }, 500).then(function()
        {
          scope.onResize();

          angular.element($window).bind('resize', function(event) {
              scope.onResize(element.width(), element.height());
          });

          element.on('touchstart', onTouchstart);

          element.on('touchend', onTouchend);
        });
      }
    };
  }
]);

// Backward compatibility
angular.module('ngSignaturePad', ['signature']);
